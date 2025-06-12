// routes/userRoutes.js
const express = require('express');
const {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const auth = require('../middleware/authMiddleware'); // auth middleware ko import karein

const router = express.Router();

// NOTE: router.use(auth); wali line ko yahan se REMOVE kar diya gaya hai.
// Ab 'auth' middleware sirf un routes par apply hoga jinko protection chahiye.

// Har route par 'auth' middleware ko apply karein jisko protection chahiye
router.get('/', auth, getAllUsers);
router.get('/:id', auth, getUserById);
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, deleteUser);

module.exports = router;