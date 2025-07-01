// travelo/migrate-users.js
// Ye script existing users ko update karega jinke paas 'number' field nahi hai
// aur jo Google se sign-up nahi kiye hain.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // Apne User model ka sahi path dein

// Apni .env file load karein (jismein MONGO_URI hai)
dotenv.config({ path: './.env' }); // Assuming .env is in the travelo directory

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected for migration...');
    } catch (err) {
        console.error('MongoDB connection error for migration:', err.message);
        process.exit(1); // Agar DB connect na ho toh exit kar dein
    }
};

const migrateUsers = async () => {
    await connectDB();
    console.log('Starting user migration to add "number" field to old users...');
    try {
        // Un users ko dhundein jinmein 'number' field nahi hai AND 'googleId' bhi nahi hai
        // Ye woh users hain jo traditional tarike se register hue the 'number' field add hone se pehle
        const result = await User.updateMany(
            { number: { $exists: false }, googleId: { $exists: false } },
            { $set: { number: 'Not Provided' } }, // Ek default value set kar dein
            { runValidators: false } // IMPORTANT: Migration ke dauran Mongoose validators ko bypass karein
        );
        console.log(`Migration complete. Matched ${result.matchedCount} users, modified ${result.modifiedCount} users.`);
    } catch (error) {
        console.error('Error during user migration:', error);
    } finally {
        // Migration ke baad database connection band kar dein
        mongoose.disconnect();
        console.log('MongoDB disconnected after migration.');
    }
};

// Migration script ko execute karein
migrateUsers();