// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail'); // Already present
const crypto = require('crypto'); // Node.js ka built-in module, isko import karna hai

// Custom Error Class (better error handling ke liye)
class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// JWT token send karne ke liye helper function
const sendToken = (user, statusCode, res) => {
    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(statusCode).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email },
    });
};

exports.register = async (req, res, next) => {
    const { name, email, number, password } = req.body;

    if (!name || !email || !number || !password) {
        return next(new CustomError('Please fill all fields', 400));
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return next(new CustomError('User already exists', 400));
        }

        // Password hashing ab User model ke pre('save') hook mein handle ho rahi hai
        user = await User.create({ name, email, number, password });

        sendToken(user, 201, res); // Successful registration ke baad token send karein
    } catch (err) {
        next(err); // Error ko global error handler ko pass karein
    }
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new CustomError('Please provide email and password', 400));
    }
    try {
        // Password field ko explicitily fetch karein comparison ke liye
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return next(new CustomError('Invalid credentials', 400));
        }

        // User model ke comparePassword method ka use karein
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(new CustomError('Invalid credentials', 400));
        }

        sendToken(user, 200, res); // Successful login ke baad token send karein
    } catch (err) {
        next(err); // Error ko global error handler ko pass karein
    }
};

// @desc    Forgot Password functionality
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            // User nahi milne par bhi 200 OK send karein takki email enumeration na ho (security)
            return res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link will be sent.' });
        }

        // User model mein defined reset token method ka use karein
        const resetToken = user.getResetPasswordToken();

        // Naye token aur expiry ke saath user ko save karein
        await user.save({ validateBeforeSave: false });

        // Frontend ke liye reset URL banayein
        const resetUrl = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click on this link to reset your password: \n\n ${resetUrl}\n\nThis link is valid for 15 minutes.`;

        try {
            // sendEmail function ko call karein
            await sendEmail(user.email, 'Password Reset Request', message);

            res.status(200).json({ success: true, message: 'Password reset email sent!' });
        } catch (err) {
            console.error('Email send failed:', err);
            // Email send fail hone par token clear kar dein
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return next(new CustomError('Email could not be sent', 500));
        }
    } catch (error) {
        next(error); // Koi aur error hone par global error handler ko pass karein
    }
};

// @desc    Reset Password functionality
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
    // URL se mile token ko hash karein
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    try {
        // Hashed token aur non-expired time ke basis par user ko find karein
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }, // $gt matlab "greater than"
        }).select('+password'); // Password ko select karein naye password ko hash karne ke liye

        if (!user) {
            return next(new CustomError('Invalid or expired reset token', 400));
        }

        // Check karein ki naya password aur confirm password match karte hain ya nahi
        if (req.body.password !== req.body.confirmPassword) {
            return next(new CustomError('Passwords do not match', 400));
        }

        // Naya password set karein (ye pre('save') hook se hash ho jayega)
        user.password = req.body.password;
        // Successful reset ke baad token fields ko clear karein
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save(); // Updated user ko save karein

        res.status(200).json({ success: true, message: 'Password updated successfully!' });
    } catch (error) {
        next(error); // Koi aur error hone par global error handler ko pass karein
    }
};