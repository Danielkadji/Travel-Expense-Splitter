const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { pool } = require('./db'); // Adjust the path as needed
const passportConfig = require('./passport/passport-config'); // Adjust the path as needed
const indexRoute = require('./routes/index');
const userRoute = require('./routes/user');
const crypto = require('crypto');


// Generate a random session secret (32 characters)
const sessionSecret = crypto.randomBytes(32).toString('hex');

const app = express();
const port = process.env.PORT || 3000;

// Middleware and configurations
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());




// Define routes
app.use('/', indexRoute);
app.use('/user', userRoute);


app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



