/**
 * Migration Script: Add Verification Fields to Existing Users
 * Run this once to update all existing users with verification fields
 * 
 * Usage: node backend/scripts/migrateUserVerification.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const migrateUsers = async () => {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users without verification fields
    const usersToUpdate = await User.find({
      $or: [
        { isVerified: { $exists: false } },
        { verificationStatus: { $exists: false } },
        { citizenshipPhoto: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${usersToUpdate.length} users to update\n`);

    if (usersToUpdate.length === 0) {
      console.log('✅ All users already have verification fields!');
      process.exit(0);
    }

    // Update each user
    let updateCount = 0;
    for (const user of usersToUpdate) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            citizenshipPhoto: null,
            isVerified: false,
            verificationStatus: 'NOT_SUBMITTED'
          }
        }
      );
      updateCount++;
      console.log(`✅ Updated user: ${user.name} (${user.email})`);
    }

    console.log(`\n🎉 Migration completed! Updated ${updateCount} users.\n`);
    
    // Show example of how to manually verify a user
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 To manually verify a user from MongoDB:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Option 1: Using MongoDB Compass or Studio 3T');
    console.log('  1. Find the user by email or _id');
    console.log('  2. Edit the document and set:');
    console.log('     isVerified: true');
    console.log('     verificationStatus: "APPROVED"');
    console.log('     verificationDate: new Date()\n');
    console.log('Option 2: Using mongosh');
    console.log('  db.users.updateOne(');
    console.log('    { email: "hadiman619@gmail.com" },');
    console.log('    { $set: {');
    console.log('      isVerified: true,');
    console.log('      verificationStatus: "APPROVED",');
    console.log('      verificationDate: new Date()');
    console.log('    }}');
    console.log('  )');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrateUsers();
