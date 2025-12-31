const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clearTestData() {
  try {
    console.log('🗑️  Clearing test bookings...');
    
    const result = await pool.query('DELETE FROM bookings');
    
    console.log(`✅ Deleted ${result.rowCount} test bookings`);
    console.log('✅ Database is clean and ready for production!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearTestData();