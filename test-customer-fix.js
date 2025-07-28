// Test the fixed customer query
// Run this with: node test-customer-fix.js

const { createClient } = require('@supabase/supabase-js');

// Your Supabase config
const supabaseUrl = 'https://yorecwmfjzseldpldgjp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvcmVjd21manpzZWxkcGxkZ2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNDE5MDIsImV4cCI6MjA2ODgxNzkwMn0.UMpg5hktRx5jAgxkvAArDJnhMbIIVRdw7JOU3RoPW2Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCustomerFix() {
  console.log('🧪 Testing customer view fix for clanmmg@gmail.com...\n');
  
  const userId = 'd9767733-4515-48e8-83c8-a9791d0ebd67';
  const userEmail = 'clanmmg@gmail.com';
  
  try {
    console.log('📊 OLD QUERY (what customer was seeing):');
    const { data: oldData, error: oldError } = await supabase
      .from("reservations")
      .select("id, datetime, party_size, status, customer_name, email")
      .eq("user_id", userId)
      .order("datetime", { ascending: true });

    if (oldError) {
      console.error('❌ Old query error:', oldError);
    } else {
      console.log(`Found ${oldData.length} reservations (all for this user_id):`);
      oldData.forEach((r, i) => {
        console.log(`  ${i+1}. Party:${r.party_size} - Email:${r.email || 'N/A'} - Status:${r.status}`);
      });
    }

    console.log('\n📊 NEW QUERY (what customer will now see):');
    const { data: newData, error: newError } = await supabase
      .from("reservations")
      .select("id, datetime, party_size, status, customer_name, customer_email, email")
      .eq("user_id", userId)
      .or(`customer_email.eq.${userEmail},email.eq.${userEmail}`)
      .order("datetime", { ascending: true });

    if (newError) {
      console.error('❌ New query error:', newError);
    } else {
      console.log(`Found ${newData.length} reservations (filtered by email):`);
      newData.forEach((r, i) => {
        const email = r.customer_email || r.email || 'N/A';
        console.log(`  ${i+1}. Party:${r.party_size} - Email:${email} - Status:${r.status}`);
      });
    }

    console.log('\n🎯 RESULT:');
    console.log(`Before fix: Customer saw ${oldData?.length || 0} reservations`);
    console.log(`After fix: Customer sees ${newData?.length || 0} reservations`);
    console.log(`Admin sees: 1 reservation (for clanmmg@gmail.com)`);
    
    if (newData?.length === 1) {
      console.log('✅ SUCCESS! Customer and admin now see the same count.');
    } else {
      console.log('⚠️  Still a discrepancy. Further investigation needed.');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the test
testCustomerFix()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  });
