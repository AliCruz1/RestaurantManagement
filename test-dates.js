// Quick test to check date handling
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env.local');
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

async function testDates() {
  console.log('📅 Testing date handling...');
  
  // Get today's date in different formats
  const now = new Date();
  const todayLocal = now.toISOString().split('T')[0];
  const todayLocaleString = now.toLocaleDateString();
  
  console.log('Current time:', now.toISOString());
  console.log('Today (ISO):', todayLocal);
  console.log('Today (locale):', todayLocaleString);
  console.log('Timezone offset:', now.getTimezoneOffset());
  
  // Get reservations for today
  const { data: reservations } = await supabase
    .from("reservations")
    .select(`datetime, user_id, guest_name, name`)
    .not('status', 'eq', 'cancelled');
  
  console.log('\n📋 All reservation dates:');
  reservations.forEach((r, i) => {
    const resDate = new Date(r.datetime);
    const resDateISO = resDate.toISOString().split('T')[0];
    const type = r.user_id ? 'USER' : 'GUEST';
    const name = r.user_id ? r.name : r.guest_name;
    
    console.log(`  ${i+1}. [${type}] ${name}: ${resDate.toISOString()} (${resDateISO})`);
    
    if (resDateISO === todayLocal) {
      console.log(`    ⭐ This is TODAY!`);
    }
  });
  
  // Test the filtering logic
  const todayReservations = reservations.filter(r => {
    const resDate = new Date(r.datetime);
    return resDate.toISOString().split('T')[0] === todayLocal;
  });
  
  console.log(`\n🎯 Reservations for today (${todayLocal}): ${todayReservations.length}`);
  todayReservations.forEach(r => {
    const type = r.user_id ? 'USER' : 'GUEST';
    const name = r.user_id ? r.name : r.guest_name;
    console.log(`  - [${type}] ${name}: ${new Date(r.datetime).toLocaleString()}`);
  });
}

testDates();
