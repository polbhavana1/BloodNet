const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloodnet');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@bloodnet.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'BloodNet Administrator',
      email: 'admin@bloodnet.com',
      password: 'admin123456', // In production, use a strong password
      role: 'admin',
      phone: '+1234567890',
      location: {
        address: 'BloodNet Headquarters',
        city: 'Admin City',
        state: 'Admin State',
        coordinates: {
          latitude: 0,
          longitude: 0
        }
      },
      verified: true,
      status: 'active',
      bloodGroup: 'O+',
      isAvailable: false,
      hospitalName: 'BloodNet Central',
      licenseNumber: 'ADMIN-001'
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@bloodnet.com');
    console.log('Password: admin123456');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdminUser();
