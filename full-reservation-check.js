// Comprehensive reservation check
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

async function comprehensiveCheck() {
  console.log('🔍 COMPREHENSIVE RESERVATION CHECK');
  console.log('=' .repeat(60));
  
  try {
    // Get ALL reservations with ALL columns
    const { data: allReservations, error } = await supabase
      .from("reservations")
      .select('*')
      .order('datetime', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    console.log(`📊 TOTAL RESERVATIONS IN DATABASE: ${allReservations.length}`);
    console.log('=' .repeat(60));
    
    // Categorize reservations
    const guestReservations = allReservations.filter(r => !r.user_id);
    const userReservations = allReservations.filter(r => r.user_id);
    const cancelledReservations = allReservations.filter(r => r.status === 'cancelled');
    const activeReservations = allReservations.filter(r => r.status !== 'cancelled');
    
    console.log(`👥 Guest reservations: ${guestReservations.length}`);
    console.log(`👤 User reservations: ${userReservations.length}`);
    console.log(`❌ Cancelled reservations: ${cancelledReservations.length}`);
    console.log(`✅ Active reservations: ${activeReservations.length}`);
    
    // Today's analysis
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    console.log(`\n📅 Today is: ${todayISO} (${today.toLocaleDateString()})`);
    
    // Check different date interpretations
    const todayReservationsUTC = allReservations.filter(r => {
      const resDate = new Date(r.datetime);
      return resDate.toISOString().split('T')[0] === todayISO;
    });
    
    const todayReservationsLocal = allReservations.filter(r => {
      const resDate = new Date(r.datetime);
      const localDate = new Date(resDate.getTime() - (resDate.getTimezoneOffset() * 60000));
      return localDate.toISOString().split('T')[0] === todayISO;
    });
    
    console.log(`🌍 Today's reservations (UTC): ${todayReservationsUTC.length}`);
    console.log(`📍 Today's reservations (Local): ${todayReservationsLocal.length}`);
    
    // Show ALL reservations with details
    console.log('\n📋 ALL RESERVATIONS (showing key fields):');
    console.log('-' .repeat(80));
    
    allReservations.forEach((r, index) => {
      const resDate = new Date(r.datetime);
      const type = r.user_id ? 'USER' : 'GUEST';
      const name = r.user_id ? (r.name || 'No Name') : (r.guest_name || 'No Guest Name');
      const email = r.user_id ? (r.email || 'No Email') : (r.guest_email || 'No Guest Email');
      const status = r.status || 'No Status';
      const dateLocal = resDate.toLocaleDateString();
      const timeLocal = resDate.toLocaleTimeString();
      const dateISO = resDate.toISOString().split('T')[0];
      
      console.log(`${index + 1}. [${type}] ${name} (${email})`);
      console.log(`   📅 ${dateLocal} ${timeLocal} (ISO: ${dateISO})`);
      console.log(`   🏷️  Status: ${status} | Party: ${r.party_size || 0} | ID: ${r.id}`);
      
      if (dateISO === todayISO) {
        console.log(`   ⭐ THIS IS TODAY!`);
      }
      
      console.log('');
    });
    
    // Show guest reservations specifically
    console.log('\n👥 GUEST RESERVATIONS ONLY:');
    console.log('-' .repeat(40));
    
    guestReservations.forEach((r, index) => {
      const resDate = new Date(r.datetime);
      const dateISO = resDate.toISOString().split('T')[0];
      
      console.log(`${index + 1}. ${r.guest_name || 'No Name'} (${r.guest_email || 'No Email'})`);
      console.log(`   📅 ${resDate.toLocaleDateString()} ${resDate.toLocaleTimeString()}`);
      console.log(`   🏷️  Status: ${r.status} | Party: ${r.party_size}`);
      
      if (dateISO === todayISO) {
        console.log(`   ⭐ TODAY!`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

comprehensiveCheck();
