// Test script to create a pending reservation for testing approval functionality
// Run this with: node create-pending-reservation.js

const { createClient } = require('@supabase/supabase-js');

// Your Supabase config
const supabaseUrl = 'https://yorecwmfjzseldpldgjp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvcmVjd21manpzZWxkcGxkZ2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNDE5MDIsImV4cCI6MjA2ODgxNzkwMn0.UMpg5hktRx5jAgxkvAArDJnhMbIIVRdw7JOU3RoPW2Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createPendingReservation() {
  console.log('Creating a pending reservation for testing...');
  
  // Test data - pending reservation for a party of 6
  const pendingReservation = {
    party_size: 6,
    datetime: new Date('2025-07-30T20:00:00.000Z'), // Tomorrow 8 PM
    status: 'pending', // This will need admin approval
    created_at: new Date().toISOString(),
    user_id: null, // Guest reservation
    guest_name: 'Sarah Williams',
    guest_email: 'sarah.williams@email.com',
    guest_phone: null,
    customer_name: null,
    customer_email: null,
    customer_phone: null,
    special_requests: 'Large party celebration - birthday dinner',
    reservation_token: Math.random().toString(36).substring(2, 15)
  };

  try {
    const { data, error } = await supabase
      .from('reservations')
      .insert([pendingReservation])
      .select();

    if (error) {
      console.error('❌ Failed to create pending reservation:', error);
      return false;
    }

    console.log('✅ Pending reservation created successfully!');
    console.log('Reservation details:', {
      id: data[0].id,
      guest_name: data[0].guest_name,
      party_size: data[0].party_size,
      datetime: data[0].datetime,
      status: data[0].status,
      special_requests: data[0].special_requests
    });
    console.log('\n🎯 You can now test the approval functionality in the admin dashboard!');
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

// Run the test
createPendingReservation()
  .then(success => {
    process.exit(success ? 0 : 1);
  });
