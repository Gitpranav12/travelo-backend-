// travelo/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-1]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please enter a valid email address',
        ],
    },
    number: {
        type: String,
        // ⭐ IMPORTANT FIX: Required only if googleId is NOT present ⭐
        required: function() {
            // 'this' refers to the document being validated.
            // If the document has a googleId, then 'number' is not required.
            // Otherwise (for traditional users), it is required.
            return !this.googleId;
        },
    },
    password: {
        type: String,
        // ⭐ IMPORTANT FIX: Required only if googleId is NOT present ⭐
        required: function() {
            // Same logic as for 'number'
            return !this.googleId;
        },
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Password will not be returned by default queries
    },
    googleId: { // New field for Google's unique user ID
        type: String,
        unique: true,
        sparse: true, // Allows null values, so users without GoogleId won't conflict
        select: false // Don't return this by default with user data
    },
    profilePicture: { // Optional: to store the Google profile picture URL
        type: String,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, {
    timestamps: true
});

// Password ko save karne se pehle hash karein
userSchema.pre('save', async function(next) {
    // Sirf tab hash karein jab password field modify hua ho AND password exist karta ho
    // Google logins mein password nahi hota
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Entered password ko hashed password se compare karne ke liye method
userSchema.methods.comparePassword = async function(enteredPassword) {
    // ⭐ IMPORTANT FIX: If no password is set (e.g., Google login), comparison fails ⭐
    if (!this.password) {
        return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
};

// Password reset token generate karne ke liye method
userSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    return resetToken; // Return the unhashed token for the email link
};

module.exports = mongoose.model('User', userSchema);