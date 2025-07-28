#!/usr/bin/env node

// Check all reservations including today's guest reservations
const checkReservations = async () => {
  console.log('📊 Checking all reservations for analytics...\n');

  const SUPABASE_URL = 'https://yorecwmfjzseldpldgjp.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvcmVjd21manpzZWxkcGxkZ2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNDE5MDIsImV4cCI6MjA2ODgxNzkwMn0.UMpg5hktRx5jAgxkvAArDJnhMbIIVRdw7JOU3RoPW2Y';
  
  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('🗓️ Today\'s date:', today);

    // Fetch all reservations
    const response = await fetch(`${SUPABASE_URL}/rest/v1/reservations?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const reservations = await response.json();
      console.log(`📈 Total reservations found: ${reservations.length}\n`);
      
      // Group by type
      const guestReservations = reservations.filter(r => !r.user_id && r.guest_name);
      const userReservations = reservations.filter(r => r.user_id);
      const todayReservations = reservations.filter(r => r.created_at.startsWith(today));
      
      console.log('📊 Reservation Breakdown:');
      console.log(`👤 User reservations: ${userReservations.length}`);
      console.log(`👥 Guest reservations: ${guestReservations.length}`);
      console.log(`📅 Today's reservations: ${todayReservations.length}\n`);
      
      if (todayReservations.length > 0) {
        console.log('🎯 Today\'s Reservations:');
        todayReservations.forEach((r, i) => {
          const type = r.user_id ? 'USER' : 'GUEST';
          const name = r.user_id ? r.name : r.guest_name;
          const email = r.user_id ? r.email : r.guest_email;
          const hour = new Date(r.datetime).getHours();
          
          console.log(`${i + 1}. [${type}] ${name} (${email}) - ${hour}:00 - ${r.status}`);
        });
      } else {
        console.log('📅 No reservations found for today');
      }
      
      if (guestReservations.length > 0) {
        console.log('\n👥 Recent Guest Reservations:');
        guestReservations.slice(0, 5).forEach((r, i) => {
          const date = new Date(r.datetime).toLocaleDateString();
          const hour = new Date(r.datetime).getHours();
          console.log(`${i + 1}. ${r.guest_name} - ${date} ${hour}:00 - ${r.status}`);
        });
      }

    } else {
      const error = await response.text();
      console.log('❌ Error fetching reservations:', error);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

checkReservations();
