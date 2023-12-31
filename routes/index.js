const express = require('express');
const router = express.Router();
const uuid = require('uuid'); 
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const passportConfig = require('../passport/passport-config');
const passport = passportConfig.passport;
const { ensureAuthenticated } = passportConfig

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
router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',   // Redirect on successful login
  failureRedirect: '/login',       // Redirect on failed login
  failureFlash: true                // Enable flash messages for failed login
}));

// Assuming you have a '/dashboard' route
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    // Access user data using req.user
    const user = req.user;

    // Query trips created by the user
    const queryCreated = 'SELECT trip_name, trip_date, trip_id FROM trips WHERE creator_id = $1';
    const resultCreated = await pool.query(queryCreated, [user.user_id]);

    // Query trips where the user is added
    const queryAdded = `
      SELECT t.trip_name, t.trip_date, t.trip_id
      FROM trips t
      JOIN users_trips ut ON t.trip_id = ut.trip_id
      WHERE ut.user_id = $1
    `;
    const resultAdded = await pool.query(queryAdded, [user.user_id]);

    // Combine the results using UNION
    const userTrips = resultCreated.rows.concat(resultAdded.rows);

    // Fetch trip invitations for the logged-in user
    const userId = user.user_id;
    const queryInvitations = ` SELECT ti.*, t.trip_name 
  FROM trip_invitations ti
  JOIN trips t ON ti.trip_id = t.trip_id
  WHERE ti.user_id = $1`;
    const resultInvitations = await pool.query(queryInvitations, [userId]);
    const invitationsData = resultInvitations.rows;

    // Render the dashboard page with user data, trips, and invitations
    res.render('dashboard', { user, userTrips, invitations: invitationsData });
  } catch (error) {
    console.error('Error fetching data for dashboard:', error);
    res.status(500).send('Internal Server Error');
  }
});

  module.exports = router;
