const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:tuStEdzKusnozIeJNUSKmHtbxQNtfoEm@nozomi.proxy.rlwy.net:41610/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixParkingSpaces() {
  try {
    console.log('🔄 Adding features column to parking_spaces table...');

    await pool.query(`
      ALTER TABLE parking_spaces 
      ADD COLUMN IF NOT EXISTS features TEXT[];
    `);
    
    console.log('✅ parking_spaces table fixed!');

    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parking_spaces'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 parking_spaces table columns:');
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

fixParkingSpaces();