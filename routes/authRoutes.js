// routes/authRoutes.js
const express = require('express');
const {
    register,
    login,
    forgotPassword,
    resetPassword,
} = require('../controllers/authController');
const router = express.Router();

// Ye routes PUBLIC hain aur inhein authentication ki zaroorat nahi hai
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;