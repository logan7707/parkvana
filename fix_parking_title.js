const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:tuStEdzKusnozIeJNUSKmHtbxQNtfoEm@nozomi.proxy.rlwy.net:41610/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixParkingTitle() {
  try {
    console.log('🔄 Fixing title column in parking_spaces...');

    await pool.query(`
      ALTER TABLE parking_spaces 
      ALTER COLUMN title DROP NOT NULL;
    `);
    
    console.log('✅ title column is now nullable!');

    console.log('\n✅ Fix completed successfully!');
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Fix failed:', error);
    await pool.end();
    process.exit(1);
  }
}

fixParkingTitle();