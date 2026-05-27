const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedAdmin() {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@lms.com' });

    if (existingAdmin) {
      // If admin exists but has no password (old data before JWT), set the password
      if (!existingAdmin.password_hash) {
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        existingAdmin.password_hash = hashedPassword;
        await existingAdmin.save();
        console.log('Default admin password set successfully.');
      } else {
        console.log('Default admin already exists.');
      }
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    await User.create({
      name: 'System Admin',
      email: 'admin@lms.com',
      password_hash: hashedPassword,
      role: 'admin',
      status: 'approved',
      dept_id: null,
      leave_balances: []
    });

    console.log('Default admin created successfully.');
    console.log('  Email:    admin@lms.com');
    console.log('  Password: Admin@123');
  } catch (err) {
    console.error('Error seeding admin:', err.message);
  }
}

module.exports = seedAdmin;
