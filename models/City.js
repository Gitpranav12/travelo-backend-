const mongoose = require("mongoose");

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
});

// ✅ Add this line for faster search queries
citySchema.index({ name: 1 });

module.exports = mongoose.model("City", citySchema);
