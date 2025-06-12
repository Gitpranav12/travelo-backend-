// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // User model ko import karein

module.exports = async (req, res, next) => { // 'async' keyword add kiya hai
    // 'Authorization' header se token extract karein (format: "Bearer token")
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1].trim();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // User object ko request mein attach karein
        // Password ko fetch na karein for security
        req.user = await User.findById(decoded.id).select('-password');
        // Agar user nahi mila, matlab token invalid hai ya user delete ho gaya hai
        if (!req.user) {
            return res.status(401).json({ message: 'User not found, token invalid' });
        }

        next(); // Sab theek hai, next middleware/controller ko pass karein
    } catch (err) {
        console.error('JWT verification error:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};