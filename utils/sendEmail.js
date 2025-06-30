const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `Travel Booking <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments || [], // 🆕 allows PDF attachments
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to} with subject: ${options.subject}`);
  } catch (error) {
    console.error('Email send failed:', error);
    throw new Error('Email send failed: ' + error.message);
  }
};

module.exports = sendEmail;
