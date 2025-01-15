require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const validator = require('validator');
const winston = require('winston');

//Configure winston for logging
const logger = winston.createLogger({
  level:process.env.NODE_ENV === ('production'||'prod') ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.json()
  ),
  transports:[
    // Log all errors to file
    new winston.transports.File({
      filename: 'error.log',
      level:'error',
      maxsize: process.env.LOGGER_MAX_SIZE,
      maxFiles: 5
    }),
    // Log important event to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      // Warning and errors only in prod
      level: process.env.NODE_ENV === ('production'||'prod')? 'warn' : 'info'
    })
  ]
});

const app = express();
const port = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());  // for parsing application/json
app.use(express.urlencoded({ extended: true }));  // for parsing application/x-www-form-urlencoded
app.use(express.static('public'));

// Only log errors and significaant events
app.use((req, res, nest) => {
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

// Database connection
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    logger.info('DB Connected')
});

/* // Test endpoint
app.get('/test', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
}); */

const validateFormInput = (req, res, next) => {
  try{
    const {name, email, phone, message} = req.body;

    // Check if name exists
    if(!name){
      return res.status.json({
        error: 'Name is required'
      });
    }

    // Check if either email or phone number is entered
    if(!email && !phone){
      return res.status(400).json({
        error: 'Either email or phone number is required'
      });

      // Validate email if exists
      if(email){
        if(!validator.isEmail(email)){
          return res.status(400).json({
            error: 'Invalid email address'
          });
        }
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
    
    try{
      const query = 'INSERT INTO contact_form (name, email, phone, message) VALUES (?, ?, ?, ?)';
      const [result] = await db.promise().query(query, [
        name,
        email || null,
        phone || null,
        message || ''
      ]);

      logger.info('Form Submitted', {id: result.insertId});
      res.json({
        message: 'Form submited successfully',
        id: result.insertId,
        hasEmail: !!email,
        hasPhone: !!phone
      });

      res.json({
        message: 'Form submitted successfully',
        id: result.insertId
      });

    }
    catch (err){
      logger.error('Form submission failed', {
        error: err.message,
        hasEmail: !!email,
        hasPhone: !!phone,
        email: email || '',
        phone: phone || ''
      });
      res.status(500).json({
        error: 'Could not save your submission due to an error.'
      });
    }
    
    /* db.query(query, [name, email, phone, message], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        res.json({ 
            message: 'Form submitted successfully!',
            id: result.insertId 
        });
    }); */
});

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

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Server shutting down');
  db.end();
  process.exit(0);
});