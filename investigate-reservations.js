// Investigation script for clanmmg@gmail.com reservation discrepancy
// Run this with: node investigate-reservations.js

const { createClient } = require('@supabase/supabase-js');

// Your Supabase config
const supabaseUrl = 'https://yorecwmfjzseldpldgjp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvcmVjd21manpzZWxkcGxkZ2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNDE5MDIsImV4cCI6MjA2ODgxNzkwMn0.UMpg5hktRx5jAgxkvAArDJnhMbIIVRdw7JOU3RoPW2Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function investigateReservations() {
  console.log('🔍 Investigating reservations for clanmmg@gmail.com...\n');
  
  try {
    // Get ALL reservations with this email (both guest and user)
    const { data: allReservations, error } = await supabase
      .from('reservations')
      .select('*')
      .or('email.eq.clanmmg@gmail.com,guest_email.eq.clanmmg@gmail.com,customer_email.eq.clanmmg@gmail.com')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching reservations:', error);
      return;
    }

    console.log(`📊 Total reservations found: ${allReservations.length}\n`);

    if (allReservations.length === 0) {
      console.log('No reservations found for this email.');
      return;
    }

    // Analyze each reservation
    allReservations.forEach((r, index) => {
      console.log(`--- Reservation ${index + 1} ---`);
      console.log(`ID: ${r.id}`);
      console.log(`Status: ${r.status}`);
      console.log(`Party Size: ${r.party_size}`);
      console.log(`Date/Time: ${r.datetime}`);
      console.log(`Created: ${r.created_at}`);
      
      // Check which type of reservation this is
      if (r.user_id) {
        console.log(`🔐 USER RESERVATION:`);
        console.log(`  - User ID: ${r.user_id}`);
        console.log(`  - Customer Name: ${r.customer_name || 'N/A'}`);
        console.log(`  - Customer Email: ${r.customer_email || 'N/A'}`);
        console.log(`  - Customer Phone: ${r.customer_phone || 'N/A'}`);
      } else {
        console.log(`👤 GUEST RESERVATION:`);
        console.log(`  - Guest Name: ${r.guest_name || 'N/A'}`);
        console.log(`  - Guest Email: ${r.guest_email || 'N/A'}`);
        console.log(`  - Guest Phone: ${r.guest_phone || 'N/A'}`);
      }
      
      // Check legacy fields
      if (r.name || r.email || r.phone) {
        console.log(`📝 LEGACY FIELDS:`);
        console.log(`  - Name: ${r.name || 'N/A'}`);
        console.log(`  - Email: ${r.email || 'N/A'}`);
        console.log(`  - Phone: ${r.phone || 'N/A'}`);
      }
      
      console.log('');
    });

    // Summary analysis
    const userReservations = allReservations.filter(r => r.user_id);
    const guestReservations = allReservations.filter(r => !r.user_id);
    const confirmedReservations = allReservations.filter(r => r.status === 'confirmed');
    const pendingReservations = allReservations.filter(r => r.status === 'pending');
    const cancelledReservations = allReservations.filter(r => r.status === 'cancelled');

    console.log('📈 SUMMARY:');
    console.log(`Total: ${allReservations.length}`);
    console.log(`  - User reservations: ${userReservations.length}`);
    console.log(`  - Guest reservations: ${guestReservations.length}`);
    console.log(`  - Confirmed: ${confirmedReservations.length}`);
    console.log(`  - Pending: ${pendingReservations.length}`);
    console.log(`  - Cancelled: ${cancelledReservations.length}`);

    console.log('\n🎯 POTENTIAL ISSUES:');
    
    // Check if admin view would filter out some reservations
    const adminVisible = allReservations.filter(r => r.status !== 'cancelled');
    console.log(`Admin dashboard shows: ${adminVisible.length} (excludes cancelled)`);
    
    // Check what customer view would show
    if (userReservations.length > 0) {
      const customerVisible = userReservations.filter(r => r.status !== 'cancelled');
      console.log(`Customer view shows: ${customerVisible.length} (user_id based)`);
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the investigation
investigateReservations()
  .then(() => {
    console.log('\n✅ Investigation complete!');
    process.exit(0);
  });
