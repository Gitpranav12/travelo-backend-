const Booking = require('../models/bookingModel');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.bookTicket = async (req, res) => {
  try {
    const userId = req.user.id;
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
      user: user._id,
    });
    await booking.save();

    // PDF Ticket Generation with styling
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const fileName = `ticket-${booking._id}.pdf`;
    const filePath = path.join(__dirname, `../tickets/${fileName}`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fillColor("#1e90ff").fontSize(24).text(" Travelo Booking Ticket", { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(50, 90).lineTo(550, 90).stroke();

    doc.moveDown(1.5);
    doc.fontSize(14).fillColor('#000').text("Booking Information", { underline: true });

    doc.moveDown(0.5).font("Helvetica-Bold").text("Booking ID: ", { continued: true }).font("Helvetica").text(`${booking._id}`);
    doc.font("Helvetica-Bold").text("Name: ", { continued: true }).font("Helvetica").text(user.name);
    doc.font("Helvetica-Bold").text("Email: ", { continued: true }).font("Helvetica").text(user.email);
    doc.font("Helvetica-Bold").text("From: ", { continued: true }).font("Helvetica").text(from);
    doc.font("Helvetica-Bold").text("To: ", { continued: true }).font("Helvetica").text(to);
    doc.font("Helvetica-Bold").text("Guests: ", { continued: true }).font("Helvetica").text(guests.toString());
    doc.font("Helvetica-Bold").text("Arrival Date: ", { continued: true }).font("Helvetica").text(new Date(arrival).toLocaleDateString());
    doc.font("Helvetica-Bold").text("Leaving Date: ", { continued: true }).font("Helvetica").text(new Date(leaving).toLocaleDateString());
    doc.font("Helvetica-Bold").text("Status: ", { continued: true }).fillColor("green").text("Confirmed");

    doc.moveDown(2);
    doc.fillColor("#1e90ff").fontSize(16).text("✅ Thank you for booking with Travelo!", { align: "center" });
    doc.fontSize(12).fillColor("#000").text("आपकी यात्रा के लिए धन्यवाद!", { align: "center" });
    doc.text("📧 support@travelo.com", { align: "center" });

    doc.end();

    stream.on("finish", async () => {
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
        <p>Your ticket PDF is attached to this email. 🎫</p>
        <p>Happy travels! ✈️</p>
        <p>Regards,<br />Travelo Team</p>
      `;

      await sendEmail({
        to: user.email,
        subject: '🎉 Booking Confirmed! Ticket Attached 🎫',
        html: htmlMessage,
        attachments: [
          {
            filename: fileName,
            path: filePath,
          },
        ],
      });

      fs.unlinkSync(filePath); // Delete file after sending
      res.status(201).json({ message: 'Booking confirmed and ticket sent to your email!' });
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error while booking' });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching bookings' });
  }
};