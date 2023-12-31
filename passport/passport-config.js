const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { pool } = require('../db');

const USER_NOT_FOUND_MESSAGE = 'User not found';
const INVALID_PASSWORD_MESSAGE = 'Invalid password';

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

      if (!result.rows.length) {
        return done(null, false, { message: USER_NOT_FOUND_MESSAGE });
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: INVALID_PASSWORD_MESSAGE });
      }
    } catch (err) {
      console.error('Error during authentication:', err);
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);

    if (!result.rows.length) {
      return done(null, false, { message: USER_NOT_FOUND_MESSAGE });
    }

    const user = result.rows[0];
    done(null, user);
  } catch (err) {
    console.error('Error during user deserialization:', err);
    done(err);
  }
});

// Authentication middleware to ensure the user is logged in
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  req.flash('error', 'Please log in to access this page');
  res.redirect('/login');
}

module.exports = { passport, ensureAuthenticated };
