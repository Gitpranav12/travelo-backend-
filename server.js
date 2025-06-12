// server.js
require('dotenv').config(); // .env files se environment variables load karein
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Routes ko import karein
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const contactRoutes = require('./routes/contactRoutes');
const cityRoutes = require('./routes/cityRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ MongoDB se connect karein
connectDB();

// ✅ CORS Middleware: Frontend URLs ko allow karein
app.use(cors({
    origin: [
        'http://localhost:3000', // Local development ke liye
        process.env.CLIENT_URL // .env se client URL dynamically load karein
    ],
    credentials: true
}));

// ✅ JSON request bodies ko parse karein
app.use(express.json());

// ✅ Default route for health check
app.get("/", (req, res) => {
    res.send("API is running...");
});

// ✅ API Routes setup
// Public Authentication routes (register, login, forgot password, reset password)
// Ab auth routes ke liye '/api/auth' prefix use karenge
app.use('/api/auth', authRoutes); // <--- Yahan badlav kiya gaya hai

// Protected User routes (middleware userRoutes.js ke andar apply kiya gaya hai)
// User routes ab '/api/users' se access honge
app.use('/api/users', userRoutes); // Yahan koi badlav nahi

// Doosre routes
app.use('/api/bookings', bookingRoutes);
app.use('/api', contactRoutes); // Agar contactRoutes mein root paths ('/') hain to ye conflict kar sakta hai
app.use('/api/cities', cityRoutes);

// ✅ Centralized Error Handler (ADD THIS section agar pehle add nahi kiya tha)
// Ye middleware saare routes ke baad hona chahiye
app.use((err, req, res, next) => {
    console.error(err.stack); // Debugging ke liye error stack ko log karein

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Server Error';

    // Mongoose CastError (jaise galat ObjectId) ko handle karein
    if (err.name === 'CastError') {
        statusCode = 404;
        message = `Resource not found with id of ${err.value}`;
    }

    // Mongoose duplicate key error (jaise duplicate email) ko handle karein
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        statusCode = 400;
        message = `A user with that ${field} already exists`; // User-friendly message
    }

    // Mongoose validation errors ko handle karein
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        statusCode = 400;
        message = errors.join(', ');
    }

    res.status(statusCode).json({
        success: false,
        message: message,
    });
});


// ✅ Server ko start karein
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// ✅ Unhandled promise rejections ko handle karein (robustness ke liye)
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Server ko close karein aur process exit karein
    server.close(() => process.exit(1));
});