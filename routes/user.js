const express = require('express');
const router = express.Router();
const uuid = require('uuid'); 
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const passportConfig = require('../passport/passport-config');
const passport = passportConfig.passport;
const { ensureAuthenticated } = passportConfig


router.post('/logout', (req, res) => {
  req.logout(); // Passport's method to log out the user
  res.json({ success: true, message: 'Logged out successfully' });
  // Alternatively, you can redirect to the login page:
  // res.redirect('/login');
});

router.get('/create-trip', ensureAuthenticated, (req, res) => {
  res.render('createtrip');
});

// Handle the form submission to create a new trip
router.post('/create-trip', ensureAuthenticated, async (req, res) => {
  try {
    const { tripName, tripDate } = req.body;
    const userId = req.user.user_id;
    // Insert the new trip into the trips table
    const tripId = uuid.v4();
    const query = 'INSERT INTO trips (trip_id, trip_name, trip_date, creator_id) VALUES ($1, $2, $3, $4)';
    await pool.query(query, [tripId, tripName, tripDate, userId]);

    res.redirect('/dashboard'); // Redirect to the dashboard after creating the trip
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/trip', (req, res) => {
    // Handle GET request for the /user/profile path
    res.render('trip');
});

router.get('/trip-details/:trip_Id', ensureAuthenticated, async (req, res) => {
  try {
    const tripId = req.params.trip_Id;
    const currentUserId = req.user.user_id; // Assuming req.user contains the current user's info

    // Fetch expenses for the trip
    const expensesQuery = 'SELECT username, description, amount FROM expenses WHERE trip_id = $1';
    const expensesResult = await pool.query(expensesQuery, [tripId]);
    const expensesData = expensesResult.rows;

    // Fetch all users associated with the trip
    const usersQuery = `
      SELECT username, user_id FROM users 
      WHERE user_id IN (
        SELECT user_id FROM users_trips WHERE trip_id = $1
        UNION
        SELECT creator_id FROM trips WHERE trip_id = $1
      )
    `;
    const usersResult = await pool.query(usersQuery, [tripId]);
    const usersData = usersResult.rows;

    // Check if current user is the trip's creator
    const tripCreatorQuery = 'SELECT creator_id FROM trips WHERE trip_id = $1';
    const tripCreatorResult = await pool.query(tripCreatorQuery, [tripId]);
    const isCreator = tripCreatorResult.rows.length > 0 && tripCreatorResult.rows[0].creator_id === currentUserId;

    // Render your EJS file with the fetched data and isCreator flag
    res.render('BillSplitterApp', {
      username: req.user.username,
      expenses: expensesData,
      users: usersData,
      tripId: tripId,
      user: req.user,
      isCreator: isCreator // Pass the isCreator flag to the EJS file
    });
  } catch (error) {
    console.error('Error fetching trip details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/api/add-expense', async (req, res) => {
  try {
      const { username, description, amount, tripId } = req.body;
      const expenseDate = new Date(); // Use the current date or get it from the request

      // SQL query to insert a new expense with the date
      const insertQuery = 'INSERT INTO expenses (username, description, amount, trip_id, expense_date) VALUES ($1, $2, $3, $4, $5)';
      await pool.query(insertQuery, [username, description, amount, tripId, expenseDate]);

      res.json({ message: 'Expense added successfully' });
      
  } catch (error) {
      console.error('Error adding expense:', error);
      res.status(500).send('Internal Server Error');
  }
});

router.get('/api/get-expenses', async (req, res) => {
  try {
      const tripId = req.query.tripId;

      // SQL query to get expenses for a specific trip
      const query = 'SELECT username, description, amount FROM expenses WHERE trip_id = $1';
      const result = await pool.query(query, [tripId]);

      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Send the invitation
router.post('/api/send-invitation', async (req, res) => {
  try {
    const invitedUsername = req.query.username;
    const tripId = req.query.tripId;

    // First, check if the invited user exists in the database
    const checkUserQuery = 'SELECT user_id FROM users WHERE username = $1';
    const checkUserResult = await pool.query(checkUserQuery, [invitedUsername]);

    if (checkUserResult.rows.length === 0) {
      // User does not exist, return an error response
      return res.json({ success: false, error: 'User does not exist' });
    }

    const invitedUserId = checkUserResult.rows[0].user_id;

    // Next, check if the user is already part of the trip
    const checkExistingInvitationQuery = 'SELECT * FROM trip_invitations WHERE trip_id = $1 AND user_id = $2';
    const checkExistingInvitationResult = await pool.query(checkExistingInvitationQuery, [tripId, invitedUserId]);

    if (checkExistingInvitationResult.rows.length > 0) {
      // Invitation already sent, return an error response
      return res.json({ success: false, error: 'Invitation already sent' });
    }

    // Insert the invitation into the trip_invitations table
    const insertInvitationQuery = 'INSERT INTO trip_invitations (trip_id, user_id) VALUES ($1, $2)';
    await pool.query(insertInvitationQuery, [tripId, invitedUserId]);

    // Return a success response
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Add these routes to your server code

// Route to handle invitation acceptance/rejection
router.post('/api/handle-invitation/:tripId', ensureAuthenticated, async (req, res) => {
  const userId = req.user.user_id;
  const tripId = req.params.tripId;
  const { action } = req.body; // Assuming action is sent in the body

  try {
    if (action === 'accept') {
      // Add user to the users_trips table
      const insertQuery = 'INSERT INTO users_trips (user_id, trip_id) VALUES ($1, $2)';
      await pool.query(insertQuery, [userId, tripId]);
    }
    
    // Delete the invitation regardless of accept or reject
    const deleteQuery = 'DELETE FROM trip_invitations WHERE user_id = $1 AND trip_id = $2';
    await pool.query(deleteQuery, [userId, tripId]);

    // Send a JSON response instead of redirecting
    res.json({ success: true, message: 'Invitation handled successfully' });
  } catch (error) {
    console.error('Error handling trip invitation:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.post('/api/update-expense/:expenseId', async (req, res) => {
  try {
    const { expenseId, amount, description } = req.body;
    const updateQuery = 'UPDATE expenses SET amount = $1 and description = $2 WHERE expense_id = $2';
    await pool.query(updateQuery, [amount, description, expenseId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ success: false });
  }
});

router.post('/api/kick-user', ensureAuthenticated, async (req, res) => {
  const { tripId, user_id, username } = req.query;
 
  try {
      // Remove the user from the trip
      const deleteUserTripQuery = 'DELETE FROM users_trips WHERE trip_id = $1 AND user_id = $2';
      await pool.query(deleteUserTripQuery, [tripId, user_id]);

      // Remove user's expenses
      const deleteExpensesQuery = 'DELETE FROM expenses WHERE trip_id = $1 AND username = $2';
      await pool.query(deleteExpensesQuery, [tripId, username]);

      res.json({ success: true });
  } catch (error) {
      console.error('Error:', error);
      res.json({ success: false, error: 'Internal Server Error' });
  }
});




module.exports = router;
