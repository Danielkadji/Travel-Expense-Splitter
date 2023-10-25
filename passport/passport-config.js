// passport-config.js

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { pool } = require('../db'); // Import your PostgreSQL database connection

// Set up the LocalStrategy for authentication
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      // Query the database to find a user with the provided username
      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await pool.query(query, [username]);
      
      // If no user is found, indicate authentication failure
      if (result.rows.length === 0) {
        return done(null, false, { message: 'User not found' });
      }

      // Get the user's information from the database
      const user = result.rows[0];

      // Compare the provided password with the hashed password stored in the database
      bcrypt.hash(password, 10, function(err, hash) {
        if (err) {
          console.error('Error hashing the password:', err);
        } 
        else if (bcrypt.compare(hash, user.password_hash)) {
            // If the passwords match, the user is authenticated
            return done(null, user);
          } else {
            // If the passwords don't match, indicate authentication failure
            return done(null, false, { message: 'Invalid password' });
          }
      });

    } catch (err) {
      // Handle any errors that occur during the authentication process
      return done(err);
    }
  }
));

// Serialize the user to the session (store user's ID)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize the user from the session (retrieve user by ID)
passport.deserializeUser(async (id, done) => {
  try {
    // Query the database to retrieve user information by ID
    const query = 'SELECT * FROM users WHERE user_id = $1';
    const result = await pool.query(query, [id]);

    // If no user is found, indicate authentication failure
    if (result.rows.length === 0) {
      return done(null, false, { message: 'User not found' });
    }

    // Get the user's information from the database
    const user = result.rows[0];

    // Return the user, indicating successful deserialization
    done(null, user);
  } catch (err) {
    // Handle any errors that occur during deserialization
    done(err);
  }
});

// Export the configured passport for use in other parts of your application
module.exports = passport;

