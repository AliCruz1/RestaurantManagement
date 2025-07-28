// Quick debug script to check date filtering
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv() {
  try {
    const envPath = '.env.local';
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
    return env;
  } catch (error) {
    console.error('Could not load .env.local file:', error.message);
    return {};
  }
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debugDateFiltering() {
  console.log('🔍 Debug: Dashboard date filtering for hourly chart');
  
  // Get today's date like the dashboard does
  const today = new Date();
  const selectedDate = today.getFullYear() + '-' + 
         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
         String(today.getDate()).padStart(2, '0');
  
  console.log('📅 Selected date:', selectedDate);
  console.log('📅 Today object:', today.toString());
  
  // Get reservations like dashboard does
  const { data: reservations } = await supabase
    .from("reservations")
    .select('*')
    .not('status', 'eq', 'cancelled')
    .order('datetime', { ascending: true });
  
  console.log('📊 Total reservations:', reservations.length);
  
  // Test the exact filtering logic from dashboard
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  console.log('🎯 Selected date object:', selectedDateObj.toString());
  
  console.log('\n📋 Testing each reservation:');
  reservations.forEach((r, i) => {
    const resDate = new Date(r.datetime);
    const isMatch = resDate.toDateString() === selectedDateObj.toDateString();
    const type = r.user_id ? 'USER' : 'GUEST';
    const name = r.user_id ? r.name : r.guest_name;
    
    console.log(`${i+1}. [${type}] ${name}`);
    console.log(`   Reservation date: ${resDate.toString()}`);
    console.log(`   Reservation toDateString(): ${resDate.toDateString()}`);
    console.log(`   Selected toDateString(): ${selectedDateObj.toDateString()}`);
    console.log(`   Match: ${isMatch ? '✅ YES' : '❌ NO'}`);
    console.log('');
  });
  
  // Show filtered results
  const filteredReservations = reservations.filter(r => {
    const resDate = new Date(r.datetime);
    return resDate.toDateString() === selectedDateObj.toDateString();
  });
  
  console.log(`🎯 Filtered reservations for ${selectedDate}: ${filteredReservations.length}`);
  filteredReservations.forEach(r => {
    const type = r.user_id ? 'USER' : 'GUEST';
    const name = r.user_id ? r.name : r.guest_name;
    const hour = new Date(r.datetime).getHours();
    console.log(`  - [${type}] ${name} at ${hour}:00`);
  });
}

debugDateFiltering();
