// travelo/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library'); // Import for Google Auth

class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// JWT token send karne ke liye helper function
const sendToken = (user, statusCode, res, message = 'Login successful') => {
    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(statusCode).json({
        success: true,
        message, // Added message for clarity
        token,
        // ⭐ IMPORTANT FIX: Include profilePicture in user details ⭐
        user: { id: user._id, name: user.name, email: user.email, profilePicture: user.profilePicture },
    });
};

exports.register = async (req, res, next) => {
    const { name, email, number, password } = req.body;

    // Frontend validation should ideally ensure all fields are present
    if (!name || !email || !number || !password) {
        return next(new CustomError('Please fill all fields', 400));
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return next(new CustomError('User already exists', 400));
        }
        // User.create will trigger pre-save hook for password hashing
        user = await User.create({ name, email, number, password });

        sendToken(user, 201, res, 'Registration successful');
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new CustomError('Please provide email and password', 400));
    }
    try {
        // ⭐ IMPORTANT FIX: Explicitly select the password field for comparison ⭐
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return next(new CustomError('Invalid credentials', 400));
        }

        // comparePassword handles users without a password (Google-only)
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(new CustomError('Invalid credentials', 400));
        }

        // If login successful, send token. Mongoose automatically handles not sending `select:false` fields.
        sendToken(user, 200, res);
    } catch (err) {
        next(err);
    }
};

exports.forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            // User not found, but send success to prevent email enumeration
            return res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link will be sent.' });
        }

        const resetToken = user.getResetPasswordToken();
        // ⭐ IMPORTANT FIX: Use validateBeforeSave: false here ⭐
        await user.save({ validateBeforeSave: false }); // This is to save the token and expiry without validating other fields

        const resetUrl = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;

        const message = `🔑🔐 You are receiving this email because you (or someone else) has requested the reset of a password. Please click on this link to reset your password: \n\n ${resetUrl}\n\nThis link is valid for 15 minutes.`;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset Request',
                html: message,
            });

            res.status(200).json({ success: true, message: 'Password reset email sent!' });
        } catch (err) {
            console.error('Email send failed:', err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            // ⭐ IMPORTANT FIX: Use validateBeforeSave: false here too if email sending fails ⭐
            await user.save({ validateBeforeSave: false });
            return next(new CustomError('Email could not be sent', 500));
        }
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        }).select('+password'); // Select password to allow hashing if it wasn't there

        if (!user) {
            return next(new CustomError('Invalid or expired reset token', 400));
        }

        if (req.body.password !== req.body.confirmPassword) {
            return next(new CustomError('Passwords do not match', 400));
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save(); // pre('save') hook will hash the new password. This save *should* pass validation for a password reset.

        res.status(200).json({ success: true, message: 'Password updated successfully!' });
    } catch (error) {
        next(error);
    }
};

// --- Google Login Function ---

// Initialize Google OAuth2 Client using the environment variable
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// Ensure GOOGLE_CLIENT_ID is actually available at this point
if (!GOOGLE_CLIENT_ID) {
    console.error("ERROR: GOOGLE_CLIENT_ID is not defined in backend environment variables.");
    // Optionally, you might want to throw an error or handle this more gracefully
}
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res, next) => {
    const { token } = req.body; // The ID token from the frontend

    if (!token) {
        return next(new CustomError('Google ID token is missing.', 400));
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID, // Ensure the audience matches your client ID
        });

        const payload = ticket.getPayload();
        const googleId = payload['sub']; // Unique Google user ID
        const email = payload['email'];
        const name = payload['name'];
        const picture = payload['picture']; // User's profile picture URL

        let user = await User.findOne({ googleId: googleId });

        if (!user && email) {
            // If no user with Google ID, try to find by email to link existing accounts
            user = await User.findOne({ email: email });
            if (user) {
                // User exists with this email, link Google ID and update picture
                user.googleId = googleId;
                user.profilePicture = picture;
                // ⭐ IMPORTANT FIX: Use validateBeforeSave: false for existing users being linked ⭐
                await user.save({ validateBeforeSave: false }); // Don't re-validate password/number on update
            }
        }

        if (!user) {
            // No existing user found, create a new one
            // The User model's 'required' functions for password/number will handle their optionality
            user = new User({
                googleId: googleId,
                email: email,
                name: name,
                profilePicture: picture,
            });
            await user.save(); // This save will respect the conditional 'required' logic in User.js
        }

        // Generate JWT for your application's session
        sendToken(user, 200, res, 'Google login successful');

    } catch (error) {
        console.error('Error in Google Login:', error);
        // Provide a more specific error if possible, e.g., if GOOGLE_CLIENT_ID is undefined
        if (!GOOGLE_CLIENT_ID) {
            return next(new CustomError('Backend Google Client ID is not configured.', 500));
        }
        return next(new CustomError('Google authentication failed. Please try again.', 401));
    }
};