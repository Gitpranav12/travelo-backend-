// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Gmail service use karein
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            // Gmail ke liye SSL/TLS settings
            secure: true, // SSL/TLS use karein
            port: 465,    // Secure SMTP port 465
        });

        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender ka email address
            to,
            subject,
            text,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Email send failed:', error);
        // Error ko re-throw karein takki controller ise handle kar sake
        throw new Error('Email send failed');
    }
};

module.exports = sendEmail;