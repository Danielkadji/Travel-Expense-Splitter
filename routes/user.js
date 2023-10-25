const express = require('express');
const router = express.Router();

router.get('/profile', (req, res) => {
  // Handle GET request for the /user/profile path
  res.send('User profile page');
});

router.get('/dashboard', (req, res) => {
    // Handle GET request for the /user/profile path
    res.send(' user dashbaord page');
});

router.get('/newtrip', (req, res) => {
    // Handle GET request for the /user/profile path
    res.render('newtrip');
  });
  
router.get('/trip', (req, res) => {
    // Handle GET request for the /user/profile path
    res.render('trip');
});

module.exports = router;
