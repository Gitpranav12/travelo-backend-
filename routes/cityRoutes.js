const express = require("express");
const router = express.Router();
const City = require("../models/City");

// GET /api/cities?search=del
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const cities = await City.find({
      name: { $regex: search, $options: "i" }
    }).limit(10);
    res.json(cities);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
