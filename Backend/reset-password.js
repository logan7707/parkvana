const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetPassword(email, newPassword) {
  try {
    // Check if user exists
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.error('❌ User not found with email:', email);
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log('✅ Found user:', user.first_name, user.last_name);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    console.log('✅ Password successfully reset for:', email);
    console.log('📧 Send this temporary password to the user:', newPassword);
    console.log('⚠️  Tell them to change it after logging in!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

// Get email and new password from command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: node reset-password.js <email> <new-password>');
  console.error('Example: node reset-password.js user@example.com TempPass123');
  process.exit(1);
}

resetPassword(email, newPassword);