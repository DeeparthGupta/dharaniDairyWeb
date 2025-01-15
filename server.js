require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());  // for parsing application/json
app.use(express.urlencoded({ extended: true }));  // for parsing application/x-www-form-urlencoded
app.use(express.static('public'));

// Request logger middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') {
        console.log('Request body:', req.body);
    }
    next();
});

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
    console.log('Connected to MySQL database');
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Form submission endpoint
app.post('/submit-form', (req, res) => {
    const { name, email, phone, message } = req.body;
    
    const query = 'INSERT INTO contact_form (name, email, phone, message) VALUES (?, ?, ?, ?)';
    db.query(query, [name, email, phone, message], (err, result) => {
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
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Server error', 
        message: err.message 
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});