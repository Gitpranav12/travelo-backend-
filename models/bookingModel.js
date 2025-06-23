const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  guests: { type: Number, required: true },
  arrival: { type: Date, required: true },
  leaving: { type: Date, required: true },
  user: { // <--- ADD THIS FIELD
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refers to the 'User' model
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Booking", bookingSchema);