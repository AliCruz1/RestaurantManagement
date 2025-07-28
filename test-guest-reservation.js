// Test script to verify guest reservations work after constraint fix
// Run this with: node test-guest-reservation.js

const { createClient } = require('@supabase/supabase-js');

// Your Supabase config
const supabaseUrl = 'https://yorecwmfjzseldpldgjp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvcmVjd21manpzZWxkcGxkZ2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNDE5MDIsImV4cCI6MjA2ODgxNzkwMn0.UMpg5hktRx5jAgxkvAArDJnhMbIIVRdw7JOU3RoPW2Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testGuestReservation() {
  console.log('Testing guest reservation after constraint fix...');
  
  // Test data - guest reservation with name + email (no phone)
  const testReservation = {
    party_size: 3,
    datetime: new Date('2025-07-29T19:00:00.000Z'), // Tomorrow 7 PM
    status: 'confirmed',
    created_at: new Date().toISOString(),
    user_id: null, // Guest reservation
    guest_name: 'Jane Smith',
    guest_email: 'jane.smith@email.com',
    guest_phone: null, // This should be allowed now
    customer_name: null,
    customer_email: null,
    customer_phone: null,
    reservation_token: Math.random().toString(36).substring(2, 15)
  };

  try {
    const { data, error } = await supabase
      .from('reservations')
      .insert([testReservation])
      .select();

    if (error) {
      console.error('❌ Guest reservation failed:', error);
      return false;
    }

    console.log('✅ Guest reservation successful!');
    console.log('Reservation data:', data[0]);
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

// Run the test
testGuestReservation()
  .then(success => {
    if (success) {
      console.log('\n🎉 Constraint fix successful! Guest reservations now work with just name + email.');
    } else {
      console.log('\n❌ Constraint fix not yet applied or there\'s still an issue.');
    }
    process.exit(success ? 0 : 1);
  });
