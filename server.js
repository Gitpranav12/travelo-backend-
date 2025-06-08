require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const contactRoutes = require('./routes/contactRoutes');
const cityRoutes = require('./routes/cityRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Connect to MongoDB
connectDB();

// ✅ CORS Middleware: Allow frontend URLs
// --- START OF UPDATED SECTION ---
app.use(cors({
  origin: [
    'http://localhost:3000', // For local development
    // 👇👇👇 REPLACE THIS WITH YOUR ACTUAL DEPLOYED FRONTEND URL 👇👇👇
    'https://travelobooking.netlify.app' // Example: 'https://my-travelo-app.netlify.app' or 'https://my-travelo-app.vercel.app'
  ],
  credentials: true
}));
// --- END OF UPDATED SECTION ---

// ✅ Parse JSON
app.use(express.json());

// ✅ Default route for Vercel/Render health check
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ API Routes
app.use('/api/users', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', contactRoutes);
app.use('/api/cities', cityRoutes);

// ✅ Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});