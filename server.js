// server.js connection restrored
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
app.use(cors({
    origin: [
        'http://localhost:3000', // Local development ke liye
        process.env.CLIENT_URL // .env se client URL dynamically load karein
    ],
    credentials: true
}));

app.use(express.json());
app.get("/", (req, res) => {
    res.send("API is running...");
});
app.use('/api/auth', authRoutes); // <--- Yahan badlav kiya gaya hai count karte hain
app.use('/api/users', userRoutes); // Yahan koi badlav nahi
// Doosre routes
app.use('/api/bookings', bookingRoutes);
app.use('/api', contactRoutes); // 
app.use('/api/cities', cityRoutes);
app.use((err, req, res, next) => {
    console.error(err.stack); 

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Server Error';

    if (err.name === 'CastError') {
        statusCode = 404;
        message = `Resource not found with id of ${err.value}`;
    }


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