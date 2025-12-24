const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:tuStEdzKusnozIeJNUSKmHtbxQNtfoEm@nozomi.proxy.rlwy.net:41610/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixUsers() {
  try {
    console.log('🔄 Adding phone_number column to users table...');

    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
    `);
    
    console.log('✅ Users table fixed!');

    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Users table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✅ Fix completed successfully!');
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Fix failed:', error);
    await pool.end();
    process.exit(1);
  }
}

fixUsers();