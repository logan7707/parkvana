const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addRateColumns() {
  try {
    console.log('Adding daily_rate, weekly_rate, monthly_rate columns to parking_spaces table...');
    
    await pool.query(`
      ALTER TABLE parking_spaces 
      ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS weekly_rate DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS monthly_rate DECIMAL(10, 2)
    `);
    
    console.log('✅ Columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    process.exit(1);
  }
}

addRateColumns();