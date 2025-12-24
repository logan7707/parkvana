const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:tuStEdzKusnozIeJNUSKmHtbxQNtfoEm@nozomi.proxy.rlwy.net:41610/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixAllParkingColumns() {
  try {
    console.log('🔄 Fixing ALL parking_spaces columns...');

    // Make columns nullable one by one (skip if they don't exist)
    const columnsToFix = ['title', 'city', 'state', 'zip_code'];
    
    for (const column of columnsToFix) {
      try {
        await pool.query(`
          ALTER TABLE parking_spaces 
          ALTER COLUMN ${column} DROP NOT NULL;
        `);
        console.log(`✅ ${column} is now nullable`);
      } catch (error) {
        if (error.code === '42703') {
          console.log(`⚠️  ${column} doesn't exist - skipping`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✅ All parking_spaces columns fixed!');

    // Verify
    const result = await pool.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'parking_spaces'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 parking_spaces columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: nullable=${row.is_nullable}`);
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

fixAllParkingColumns();