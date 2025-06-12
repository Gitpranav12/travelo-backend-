const nodemailer = require('nodemailer');

const sendEmail = async (options) => { // Function now accepts an 'options' object
    try {
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail', // Use EMAIL_SERVICE from .env, fallback to 'gmail'
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            // 'secure' and 'port' are often handled automatically when 'service' is specified.
            // Keeping them commented out for cleaner code unless specific issues arise.
            // secure: true, // SSL/TLS use karein
            // port: 465,    // Secure SMTP port 465
        });

        const mailOptions = {
            // ⭐ THIS IS THE KEY CHANGE ⭐
            // Sets the sender name to "Travel Booking" along with the email address
            from: `Travel Booking <${process.env.EMAIL_USER}>`,
            // ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐
            to: options.to,          // Recipient's email from the options object
            subject: options.subject, // Email subject from the options object
            html: options.html,      // HTML content for the email from the options object (preferred for rich emails)
            // If you specifically need plain text, you can use: text: options.text,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.to} with subject: ${options.subject}`);
    } catch (error) {
        console.error('Email send failed:', error);
        // Error ko re-throw karein takki controller ise handle kar sake
        throw new Error('Email send failed: ' + error.message); // Include original error message
    }
};

module.exports = sendEmail;