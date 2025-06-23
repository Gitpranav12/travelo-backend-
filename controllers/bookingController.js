const Booking = require('../models/bookingModel');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Existing bookTicket function (slightly modified to use req.user.id)
exports.bookTicket = async (req, res) => {
  try {
    // We expect req.user to be populated by authentication middleware
    const userId = req.user.id; // Get userId from authenticated user

    const { from, to, guests, arrival, leaving } = req.body;

    if (!from || !to || !guests || !arrival || !leaving) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (isNaN(new Date(arrival)) || isNaN(new Date(leaving))) {
      return res.status(400).json({ message: 'Invalid arrival or leaving date' });
    }
    if (new Date(arrival) > new Date(leaving)) {
      return res.status(400).json({ message: 'Arrival date cannot be after leaving date' });
    }
    if (guests < 1) {
      return res.status(400).json({ message: 'Guests must be at least 1' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please log in again.' });
    }

    const booking = new Booking({
      from,
      to,
      guests,
      arrival: new Date(arrival),
      leaving: new Date(leaving),
      user: user._id, // Assign the booking to the authenticated user
    });
    await booking.save();

    const htmlMessage = `
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
    `;

    await sendEmail({
      to: user.email,
      subject: '🎉 Booking Confirmed! Your trip awaits! 🎉',
      html: htmlMessage,
    });

    res.status(201).json({ message: 'Your Tickets Successfully Booked and Confirmation Sent to Email!' });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error while booking' });
  }
};

// NEW FUNCTION: Get bookings for the authenticated user
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from authenticated user

    // Find all bookings where the 'user' field matches the authenticated userId
    const bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 }); // Sort by creation date descending

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching bookings' });
  }
};