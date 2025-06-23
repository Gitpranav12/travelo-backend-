const express = require('express');
const router = express.Router();
const { bookTicket, getMyBookings } = require('../controllers/bookingController');
const protect = require('../middleware/authMiddleware'); // Assuming you have an auth middleware

// Add authentication middleware to the routes
router.post('/book', protect, bookTicket); // Protect the booking route
router.get('/mybookings', protect, getMyBookings); // New route to get user's bookings

module.exports = router;