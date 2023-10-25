const express = require('express');
const router = express.Router();
const uuid = require('uuid'); 
const bcrypt = require('bcrypt');
const { pool } = require('../db');

router.get('/', (req, res) => {

    res.render('home');
});

router.get('/base', (req, res) => {
  // Send the 'index.html' file from the 'public' directory as the response
  res.sendFile('index.html', { root: 'public' });
});

router.get('/login', (req, res) => {
    // Send the 'index.html' file as the response
    const errorMessage = '';
    res.render('login', { errorMessage });
});

router.get('/signup', (req, res) => {
  const errorMessage = '';
    // Send the 'index.html' file as the response
    res.render('signu', { errorMessage })
});





// If user submits new registration
router.post('/signup', (req, res) => {
  const { Username, Password, Email } = req.body;
  const userId = uuid.v4();

  // Check if the username is already in use
pool.query('SELECT * FROM users WHERE username = $1', [Username], (err, usernameResult) => {
  if (err) {
      console.error('Error checking username availability:', err);
      return res.status(500).send('Internal Server Error');
  }

  if (usernameResult.rows.length > 0) {
      // Username is already in use, inform the user
      const errorMessage = 'Username is already in use. Please choose a different username.';
      return res.render('signu', { errorMessage });
  }

  // Username is available, now check for the email
  pool.query('SELECT * FROM users WHERE email = $1', [Email], (err, emailResult) => {
      if (err) {
          console.error('Error checking email availability:', err);
          return res.status(500).send('Internal Server Error');
      }

      if (emailResult.rows.length > 0) {
          // Email is already in use, inform the user
          const errorMessage = 'Email is already in use. Please use a different email address.';
          return res.render('signu', { errorMessage });
      }

      // Both username and email are available, proceed with registration
      bcrypt.hash(Password, 10, (err, hash) => {
          if (err) {
              console.error('Error hashing password:', err);
              return res.status(500).send('Internal Server Error');
          }

          // Insert the user data into the database
          pool.query(
              'INSERT INTO users (user_id, username, password_hash, email) VALUES ($1, $2, $3, $4)',
              [userId, Username, hash, Email],
              (err, result) => {
                  if (err) {
                      console.error('Error inserting user data:', err);
                      return res.status(500).send('Internal Server Error');
                  }

                  // Registration is successful
                  res.send('User registered successfully');
              }
          );
      });
  });
});
});

//user logs in
router.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    // You can now use the username and password to validate the login
    // You can query your database to check if the username and password match a user in your system.
  
    // For example, you can use the `pool.query` method to check the user's credentials in the database.
  
    pool.query('SELECT * FROM users WHERE username = $1', [username], (err, result) => {
      if (err) {
        console.error('Error checking user:', err);
        return res.status(500).send('Internal Server Error');
      }
  
      if (result.rows.length === 0) {
        // Username not found, handle accordingly (e.g., show an error message).
        return res.render('login', { errorMessage: 'Username not found' });
      }
  
      // Compare the hashed password stored in the database with the provided password
      const user = result.rows[0];
  
      bcrypt.compare(password, user.password_hash, (err, passwordMatch) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.status(500).send('Internal Server Error');
        }
  
        if (passwordMatch) {
          // Passwords match, user is authenticated, you can set a session or send a success response.
          
          res.sendFile('index.html', { root: 'public' });
        } else {
          // Passwords don't match, handle accordingly (e.g., show an error message).
          return res.render('login', { errorMessage: 'Incorrect password' });
        }
      });
    });
  });  
  
  module.exports = router;
