const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI environment variable is not set');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ MongoDB connected');
    console.log('📦 DB Name:', conn.connection.name); 

    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;