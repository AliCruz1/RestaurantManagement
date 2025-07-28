// Debug script to check user sessions and detailed reservation data
// Run this with: node debug-user-sessions.js

const { createClient } = require('@supabase/supabase-js');

// Your Supabase config
const supabaseUrl = 'https://yorecwmfjzseldpldgjp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvcmVjd21manpzZWxkcGxkZ2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNDE5MDIsImV4cCI6MjA2ODgxNzkwMn0.UMpg5hktRx5jAgxkvAArDJnhMbIIVRdw7JOU3RoPW2Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugUserSessions() {
  console.log('🔍 Debugging user sessions for clanmmg@gmail.com...\n');
  
  try {
    // 1. Check auth.users table for this email
    console.log('📧 Checking auth users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('Note: Cannot access auth.users directly with anon key (expected)');
    }
    
    // 2. Check profiles table if it exists
    console.log('👤 Checking profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'clanmmg@gmail.com');
    
    if (profilesError) {
      console.log('Note: profiles table might not exist or is not accessible');
    } else {
      console.log(`Found ${profiles.length} profile(s):`, profiles);
    }
    
    // 3. Get detailed reservation info for the specific user_id we found
    console.log('\n🎯 Detailed reservation analysis...');
    const userId = 'd9767733-4515-48e8-83c8-a9791d0ebd67'; // From previous investigation
    
    const { data: userReservations, error: userError } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (userError) {
      console.error('❌ Error fetching user reservations:', userError);
    } else {
      console.log(`Found ${userReservations.length} reservation(s) for user_id ${userId}:`);
      userReservations.forEach((r, index) => {
        console.log(`\n--- User Reservation ${index + 1} ---`);
        console.log(`ID: ${r.id}`);
        console.log(`Status: ${r.status}`);
        console.log(`Party Size: ${r.party_size}`);
        console.log(`Date/Time: ${r.datetime}`);
        console.log(`Created: ${r.created_at}`);
        console.log(`Updated: ${r.updated_at || 'N/A'}`);
        
        // Check all possible name/email fields
        const nameFields = [r.customer_name, r.guest_name, r.name].filter(Boolean);
        const emailFields = [r.customer_email, r.guest_email, r.email].filter(Boolean);
        
        console.log(`Names found: ${nameFields.join(', ') || 'None'}`);
        console.log(`Emails found: ${emailFields.join(', ') || 'None'}`);
      });
    }
    
    // 4. Check if there are any reservations with duplicate data or stale records
    console.log('\n🔄 Checking for potential data issues...');
    
    const { data: allUserReservations, error: allError } = await supabase
      .from('reservations')
      .select('*')
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false });
    
    if (!allError) {
      // Group by user_id to find potential duplicates
      const userGroups = {};
      allUserReservations.forEach(r => {
        if (!userGroups[r.user_id]) {
          userGroups[r.user_id] = [];
        }
        userGroups[r.user_id].push(r);
      });
      
      // Check if any user has suspiciously many reservations
      Object.entries(userGroups).forEach(([userId, reservations]) => {
        if (reservations.length > 3) {
          console.log(`⚠️  User ${userId} has ${reservations.length} reservations`);
          
          // Check if this user has the target email
          const hasTargetEmail = reservations.some(r => 
            r.customer_email === 'clanmmg@gmail.com' || 
            r.guest_email === 'clanmmg@gmail.com' || 
            r.email === 'clanmmg@gmail.com'
          );
          
          if (hasTargetEmail) {
            console.log(`🎯 This user has clanmmg@gmail.com email!`);
            console.log('All reservations for this user:');
            reservations.forEach((r, i) => {
              console.log(`  ${i+1}. ${r.id} - ${r.status} - Party:${r.party_size} - ${r.datetime}`);
            });
          }
        }
      });
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the debug
debugUserSessions()
  .then(() => {
    console.log('\n✅ Debug complete!');
    process.exit(0);
  });
