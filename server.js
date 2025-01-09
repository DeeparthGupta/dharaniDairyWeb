require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

// Create an express app
const app = express();
const port = process.env.PORT;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the public directory

// MySQL connection
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD, // Replace with your MySQL password
  database: process.env.MYSQL_DATABASE  // Replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL database.');
});

// API to handle form submissions
app.post('/submit-form', (req, res) => {
  const { name, email, phone, message } = req.body;

  const query = 'INSERT INTO contact_form (name, email, phone, message) VALUES (?, ?, ?)';
  db.query(query, [name, email, phone, message], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).send('Database error');
    }
    res.send('Form data submitted successfully!');
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
