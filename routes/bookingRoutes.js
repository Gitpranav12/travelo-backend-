const express = require('express');
const router = express.Router();
const { bookTicket } = require('../controllers/bookingController');

router.post('/book', bookTicket);

module.exports = router;
