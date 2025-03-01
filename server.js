require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const validator = require('validator');
const winston = require('winston');
const { config } = require('dotenv');

const app = express();
const port = parseInt(process.env.PORT) || 8080;

// Get connection pool settings from environment variables
const DB_MAX_CONNECTIONS = parseInt(process.env.DB_MAX_CONNECTIONS) || 10;
const DB_IDLE_TIMEOUT = parseInt(process.env.DB_IDLE_TIMEOUT) || 60000;
const DB_CONNECTION_TIMEOUT = parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000;


const poolConfig = {
	socketPath: `/cloudsql/${process.env.MYSQL_HOST}`,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: DB_MAX_CONNECTIONS,
    queueLimit: 0
};

function createPool(){
	return mysql.createPool(poolConfig);
}

function getPool(){
	if(!pool){
		pool = createPool();
		logger.info('Creating a new connection pool');
	}
	return pool;
}

let pool = createPool();

//Configure winston for logging
const logger = winston.createLogger({
  level:process.env.NODE_ENV === ('production'||'prod') ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.json()
  )
});

// Logging in dev
if(process.env.NODE_ENV !== ('production' || 'prod')){
	logger.add(new winston.transports.Console({
		format: winston.format.combine(
			winston.format.colorize(),
			winston.format.simple()
		)
	}));

	logger.add(new winston.transports.File({
		filename: 'error.log',
		level: 'error',
		maxsize: process.env.LOGGER_MAX_SIZE || 5242880,
		maxFiles: 5
	}));

	logger.add(new winston.transports.File({
		filename: 'combined.log',
		maxsize: process.env.LOGGER_MAX_SIZE || 5242880,
		maxFiles: 5
	}));	
}

// Logging in prod
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.Console({
        level: 'info',
        stderrLevels: ['error', 'warn'],
        format: winston.format.combine(
            winston.format.errors({ stack: true }),
            winston.format.timestamp(),
            winston.format.json()
        )
    }));
}

pool.getConnection((err, connection) => {
    if (err) {
        logger.error('Database connection failed:', {
            error: err.message,
            stack: err.stack,
			state: err.state,
            config: {
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USER,
                database: process.env.MYSQL_DATABASE
            }
        });
        return;
    }
    logger.info('Database pool connected');
    
    // Test query to verify connection
    connection.query('SHOW TABLES', (err, results) => {
        connection.release(); // Always release the connection
        
        if (err) {
            logger.error('Failed to query tables:', {
                error: err.message,
                stack: err.stack
            });
            return;
        }
        logger.info('Available tables:', results);
    });
});

// Middleware
app.use(cors({
	origin: '*',
	methods: ['GET','POST'],
	allowedHeaders: ['Content-Type']
}));
app.use(express.json());  // for parsing application/json
app.use(express.urlencoded({ extended: true }));  // for parsing application/x-www-form-urlencoded
app.use(express.static('public'));

// Only log errors and significaant events
app.use((req, res, next) => {
  // Log only POST reqs and errors
  if(req.method === 'POST' ||res.statusCode >= 400){
    logger.info('Request',{
      method: req.method,
      url: req.url,
      status: res.statusCode
    });
  }
  next();
})

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Server error', {
		error: err.message,
		url: req.url
    });

    res.status(500).json({
		error: process.env.NODE_ENV === ('production'||'prod')
			? 'An unexpected error has occured'
			: err.message
    });
});

app.get('/config', (req, res) => {
	const protocol = req.headers['x-forwarded-proto'] || 'http';
	const host = req.headers.host;

	res.json({
		backendURL: `${protocol}://${host}/submit-form`
	});
});

const validateFormInput = (req, res, next) => {
  try{
    const {name, email, phone, message} = req.body;

    // Check if name exists
    if(!name){
      return res.status(400).json({
        error: 'Name is required'
      });
    }

    // Check if either email or phone number is entered
    if(!email && !phone){
      return res.status(400).json({
        error: 'Either email or phone number is required'
      });
    }
      // Validate email if exists
    if(email){
		if(!validator.isEmail(email)){
			return res.status(400).json({
				error: 'Invalid email address'
			});
		}
    }
    

    // Validate phone if given
    if(phone){
		const cleanPhone = validator.trim(phone.replace(/\s+/g, ''));
			if(!validator.isMobilePhone(cleanPhone, ['en-IN'])){
				return res.status(400).json({
					error: 'Invalid phone number'
				});
			}
		req.body.phone = cleanPhone;
    }

    // Sanitize inputs
    req.body.name = validator.trim(validator.escape(name));
    if (email) {
        req.body.email = validator.normalizeEmail(email) || email.toLowerCase();
    }
    if (message) {
        req.body.message = validator.trim(validator.escape(message));
    } else {
        req.body.message = ''; // Set empty string if no message
    }

    next();
  }

  catch(err){
    logger.error('Validation error', {error: err.message});
    res.status(400).json({
      error: 'Invalid form data'
    });
  }
};

// Form submission endpoint with validation
app.post('/submit-form', validateFormInput, async (req, res) => {
    const { name, email, phone, message } = req.body;
	const errorId = Date.now().toString(36);
    
    try{
		logger.info(`Form submission attempt [${errorId}]:`, {
            formData: { name, email, phone, hasMessage: !!message }
        });

		// Test DB connection before making query
		const connection = await getPool().promise().getConnection();
		try{
			const query = 'INSERT INTO contact_form (name, email, phone, message) VALUES (?, ?, ?, ?)';
			const [result]  = await connection.execute(query, [
				name,
				email || null,
				phone || null,
				message ||''
			]);

			logger.info(`Form submission successful [${errorId}]`, { id: result.insertId });
			res.json({
				message: 'Form submitted successfully',
				id: result.insertId
			});
		}

		catch (sqlError){
			logger.error(`Database error [${errorId}]:`,{
				error: sqlError.message,
                code: sqlError.code,
				state: sqlError.state,
                stack: sqlError.stack,
				query: {
					sqlError: sqlError.sql,
					parameters: [name, email, phone, message]
				}
			});
			throw sqlError;
		}

		finally{
			connection.release();
		}
    }

    catch (err) {
        const errorMessage = process.env.NODE_ENV === 'development' 
            ? `Database error [${errorId}]: ${err.message}`
            : 'Could not save your submission. Please try again.';

		logger.error(`Form submission failed [${errorId}]:`, {
			error: err.message,
			code: err.code,
			stack: err.stack
		});

        res.status(500).json({
            error: errorMessage,
            errorId: errorId
        });
    }
});

// Start Server
app.listen(port, '0.0.0.0', () => {
    logger.info('Server started', {
        port: port,
        env: process.env.NODE_ENV,
        platform: 'Cloud Run'
    });
});

// Graceful shutdown with pool
process.on('SIGTERM', async () => {
    logger.info('SIGTERM Recieved - waiting 30 seconds before shutting down...');
	setTimeout(async () =>{
		try {
			await pool.end();
			logger.info('Database pool closed');
			pool = null;
		} catch (err) {
			logger.error('Error closing pool:', err);
		}
		process.exit(0);
	}, 30000);
});