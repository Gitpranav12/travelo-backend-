// routes/authRoutes.js
const express = require('express');
const {
    register,
    login,
    forgotPassword,
    resetPassword,
    googleLogin // Import the new function
} = require('../controllers/authController');
const router = express.Router();

// Ye routes PUBLIC hain aur inhein authentication ki zaroorat nahi hai
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// New Google Login Route
router.post('/google-login', googleLogin); // <-- ADD THIS LINE

module.exports = router;