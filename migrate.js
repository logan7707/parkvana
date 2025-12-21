const { Pool } = require('pg');

// Railway database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:tuStEdzKusnozIeJNUSKmHtbxQNtfoEm@nozomi.proxy.rlwy.net:41610/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...');

    // Add payment fields to bookings table
    await pool.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS owner_payout DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS veteran_donation DECIMAL(10, 2) DEFAULT 1.00,
      ADD COLUMN IF NOT EXISTS payout_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS payout_date TIMESTAMP;
    `);
    console.log('✅ Bookings table updated');

    // Add Stripe fields to users table
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;
    `);
    console.log('✅ Users table updated');

    // Verify changes
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Bookings table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✅ Migration completed successfully!');
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();