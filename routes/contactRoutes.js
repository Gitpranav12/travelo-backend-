const express = require('express');
const router = express.Router();
const { submitContact } = require('../controllers/contactController');

router.post('/contact', submitContact);

module.exports = router;
