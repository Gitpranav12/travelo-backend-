const Booking = require('../models/bookingModel');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Nodemailer transporter setup using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address from .env
    pass: process.env.EMAIL_PASS, // App password from .env
  },
});

// Optional: verify transporter setup once on server start
transporter.verify((error, success) => {
  if (error) {
    console.error('Nodemailer transporter verification failed:', error);
  } else {
    console.log('Nodemailer transporter is ready');
  }
});

exports.bookTicket = async (req, res) => {
  try {
    const { from, to, guests, arrival, leaving, userId } = req.body;

    if (!from || !to || !guests || !arrival || !leaving || !userId) {
      return res.status(400).json({ message: 'All fields including userId are required' });
    }

    // Optional: Validate date formats and guests count
    if (isNaN(new Date(arrival)) || isNaN(new Date(leaving))) {
      return res.status(400).json({ message: 'Invalid arrival or leaving date' });
    }
    if (new Date(arrival) > new Date(leaving)) {
      return res.status(400).json({ message: 'Arrival date cannot be after leaving date' });
    }
    if (guests < 1) {
      return res.status(400).json({ message: 'Guests must be at least 1' });
    }

    // Get user's email and name first to avoid orphan booking in case user not found
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create booking with user reference (assuming Booking schema has user field)
    const booking = new Booking({
      from,
      to,
      guests,
      arrival: new Date(arrival),
      leaving: new Date(leaving),
      user: user._id,
    });
    await booking.save();

    // Send Email Notification with friendly HTML format
    const mailOptions = {
      from: `"Travel Booking" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '🎉 Booking Confirmed! Your trip awaits! 🎉',
      html: `
        <h2>🎉 Congratulations, ${user.name}! Your booking is confirmed! 🎉</h2>
        <p>Thank you for booking your trip with us! We're super excited to have you onboard.</p>
        <p><strong>Booking Details:</strong></p>
        <ul>
          <li><strong>From:</strong> ${from}</li>
          <li><strong>To:</strong> ${to}</li>
          <li><strong>Guests:</strong> ${guests}</li>
          <li><strong>Arrival:</strong> ${new Date(arrival).toLocaleDateString()}</li>
          <li><strong>Leaving:</strong> ${new Date(leaving).toLocaleDateString()}</li>
        </ul>
        <p>We hope you have an amazing journey! If you have any questions, feel free to contact us anytime.</p>
        <p>Happy travels! ✈️🌟</p>
        <p>Best wishes,<br />Your Travelo Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Your Tickets Successfully Booked and Confirmation Sent to Email!' });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error while booking' });
  }
};