// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Already present
const crypto = require('crypto'); // Node.js ka built-in module, isko import karna hai

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [ // Email validation ke liye regex add kiya hai
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-1]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please enter a valid email address',
        ],
    },
    number: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'Password must be at least 6 characters'], // Minimum password length
        select: false, // Jab user data fetch karte hain, password by default return nahi hoga
    },
    // Password reset functionality ke liye naye fields
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, {
    timestamps: true // 'createdAt' aur 'updatedAt' fields automatically add ho jayenge
});

// Password ko save karne se pehle hash karein (ab hashing authController mein nahi hogi)
userSchema.pre('save', async function(next) {
    // Sirf tab hash karein jab password change hua ho ya naya ban raha ho
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Entered password ko hashed password se compare karne ke liye method
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Password reset token generate karne ke liye method
userSchema.methods.getResetPasswordToken = function() {
    // Ek random 20-byte hexadecimal string generate karein
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Token ko hash karein aur 'resetPasswordToken' field mein save karein
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Token ki expiration time set karein (jaise 15 minutes)
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    return resetToken; // Unhashed token return karein jo email mein bheja jayega
};

module.exports = mongoose.model('User', userSchema);