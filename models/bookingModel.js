const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  guests: { type: Number, required: true },
  arrival: { type: Date, required: true },
  leaving: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Booking", bookingSchema);
// This code defines a Mongoose schema for a booking model in a travel application.
// The schema includes fields for the destination, number of guests, arrival and leaving dates, and a timestamp for when the booking was created.
