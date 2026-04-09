/**
 * Run this once to create the default admin account:
 *   node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB...');

  const existing = await User.findOne({ email: 'admin@adsms.com' });
  if (existing) {
    console.log('✅ Admin already exists:', existing.email);
    process.exit(0);
  }

  const admin = await User.create({
    name: 'System Admin',
    email: 'admin@adsms.com',
    password: 'admin123',
    role: 'admin',
    isActive: true,
  });

  console.log('🎉 Admin created successfully!');
  console.log('   Email   :', admin.email);
  console.log('   Password: admin123');
  console.log('   Role    :', admin.role);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
