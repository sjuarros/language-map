/**
 * Test if invitations database is set up correctly
 */

import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:54332/postgres',
});

async function testInvitations() {
  const client = await pool.connect();
  try {
    console.log('🔍 Testing invitations database setup...\n');

    // Test 1: Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('invitations', 'invitation_city_grants')
      ORDER BY table_name;
    `);

    if (tables.rows.length === 2) {
      console.log('✅ Tables created: invitations, invitation_city_grants');
    } else {
      console.log('❌ Missing tables:', tables.rows);
    }

    // Test 2: Check function
    const func = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name = 'accept_invitation';
    `);

    if (func.rows.length > 0) {
      console.log('✅ Function created: accept_invitation');
    } else {
      console.log('❌ Function missing');
    }

    // Test 3: Check policies
    const policies = await client.query(`
      SELECT tablename, COUNT(*) 
      FROM pg_policies 
      WHERE tablename IN ('invitations', 'invitation_city_grants')
      GROUP BY tablename;
    `);

    console.log('✅ RLS Policies:');
    policies.rows.forEach(row => {
      console.log(`  - ${row.tablename}: ${row.count} policies`);
    });

    // Test 4: Try select (RLS test)
    try {
      await client.query('SELECT * FROM invitations LIMIT 1');
      console.log('✅ Invitations table accessible');
    } catch (err: any) {
      console.log('❌ RLS Error:', err.message);
    }

    console.log('\n🎉 Test complete!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testInvitations();
