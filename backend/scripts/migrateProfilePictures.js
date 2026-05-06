const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

/**
 * Migration script to add originalPicture field to existing users
 * This sets the originalPicture to the current picture for all users who don't have it
 */

async function migrateProfilePictures() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all users who don't have originalPicture set
    const usersWithoutOriginalPicture = await User.find({
      originalPicture: { $in: [null, undefined] }
    });

    console.log(`Found ${usersWithoutOriginalPicture.length} users without originalPicture field`);

    let updated = 0;

    // Update each user
    for (const user of usersWithoutOriginalPicture) {
      user.originalPicture = user.picture;
      await user.save();
      updated++;
      console.log(`Updated user: ${user.email}`);
    }

    console.log(`\n🎉 Migration completed! Updated ${updated} users.`);
    console.log('All users now have originalPicture field set to their current profile picture.');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrateProfilePictures();
