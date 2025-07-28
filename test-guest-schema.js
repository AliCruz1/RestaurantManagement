#!/usr/bin/env node

// Quick test to verify database schema
const testDatabaseSchema = async () => {
  console.log('🔍 Testing database schema for guest reservations...\n');

  const SUPABASE_URL = 'https://yorecwmfjzseldpldgjp.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvcmVjd21manpzZWxkcGxkZ2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNDE5MDIsImV4cCI6MjA2ODgxNzkwMn0.UMpg5hktRx5jAgxkvAArDJnhMbIIVRdw7JOU3RoPW2Y';
  
  try {
    // Test if we can create a guest reservation
    const testReservation = {
      guest_name: 'Test Guest Schema',
      guest_email: 'schematest@example.com',
      guest_phone: '555-TEST',
      party_size: 2,
      datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      status: 'confirmed'
    };

    console.log('Testing guest reservation creation...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/reservations`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testReservation)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Guest reservation schema is working!');
      console.log('📊 Created reservation:', result[0]);
      console.log('🔑 Reservation token:', result[0]?.reservation_token);
      
      // Clean up test reservation
      if (result[0]?.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/reservations?id=eq.${result[0].id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          }
        });
        console.log('🧹 Test reservation cleaned up');
      }
    } else {
      const error = await response.text();
      console.log('❌ Guest reservation schema is NOT working');
      console.log('🚨 Error:', error);
      console.log('\n📋 Action Required:');
      console.log('1. Copy COMPLETE-DATABASE-SETUP.sql');
      console.log('2. Paste into Supabase SQL Editor');
      console.log('3. Run the script to add guest reservation columns');
    }

  } catch (error) {
    console.log('❌ Error testing database schema:', error.message);
  }
};

testDatabaseSchema();
