const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:tuStEdzKusnozIeJNUSKmHtbxQNtfoEm@nozomi.proxy.rlwy.net:41610/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixUserType() {
  try {
    console.log('🔄 Fixing user_type column...');

    // Make user_type nullable OR set a default
    await pool.query(`
      ALTER TABLE users 
      ALTER COLUMN user_type DROP NOT NULL;
    `);
    
    console.log('✅ user_type column is now nullable!');

    // Set default value for existing NULL rows
    await pool.query(`
      UPDATE users 
      SET user_type = 'renter' 
      WHERE user_type IS NULL;
    `);

    console.log('✅ Updated existing NULL user_type values!');

    console.log('\n✅ Fix completed successfully!');
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Fix failed:', error);
    await pool.end();
    process.exit(1);
  }
}

fixUserType();