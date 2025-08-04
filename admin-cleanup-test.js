#!/usr/bin/env node

// Test cleanup with service role key (elevated privileges)
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    });
  }
  
  return env;
}

const env = loadEnv();
const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function adminCleanupTest() {
  console.log('🔑 ADMIN CLEANUP TEST (Service Role)');
  console.log('=' .repeat(45));
  
  try {
    // Step 1: Check current state
    const { data: allReservations } = await supabaseAdmin
      .from('reservations')
      .select('id, datetime, guest_name, name, status')
      .order('datetime');
    
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const todayISO = todayUTC.toISOString();
    
    const pastReservations = allReservations?.filter(r => new Date(r.datetime) < todayUTC) || [];
    
    console.log(`Total reservations: ${allReservations?.length || 0}`);
    console.log(`Past reservations: ${pastReservations.length}`);
    console.log(`Cutoff date: ${todayISO}`);
    
    if (pastReservations.length === 0) {
      console.log('\n✅ No past reservations to clean up!');
      return;
    }
    
    console.log('\nPast reservations to delete:');
    pastReservations.forEach((r, i) => {
      const name = r.name || r.guest_name || 'No Name';
      const date = new Date(r.datetime).toLocaleDateString();
      console.log(`${i + 1}. ${name} - ${date} (${r.status})`);
    });
    
    // Step 2: Clean up email queue first
    console.log('\n🧹 Step 1: Cleaning email queue...');
    const pastIds = pastReservations.map(r => r.id);
    
    const { data: emailDeleted, error: emailError } = await supabaseAdmin
      .from('email_queue')
      .delete()
      .in('reservation_id', pastIds)
      .select();
    
    if (emailError) {
      console.error('❌ Email cleanup error:', emailError);
    } else {
      console.log(`✅ Deleted ${emailDeleted?.length || 0} email queue entries`);
    }
    
    // Step 3: Clean up reservations
    console.log('\n🧹 Step 2: Cleaning reservations...');
    const { data: deletedReservations, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .delete()
      .lt('datetime', todayISO)
      .select('id, datetime, guest_name, name, status');
    
    if (reservationError) {
      console.error('❌ Reservation cleanup error:', reservationError);
      return;
    }
    
    console.log(`✅ Successfully deleted ${deletedReservations?.length || 0} past reservations`);
    
    // Step 4: Verify
    const { data: finalReservations } = await supabaseAdmin
      .from('reservations')
      .select('id, datetime')
      .order('datetime');
    
    const finalPast = finalReservations?.filter(r => new Date(r.datetime) < todayUTC) || [];
    
    console.log(`\n✨ Final state:`);
    console.log(`Total reservations: ${finalReservations?.length || 0}`);
    console.log(`Past reservations remaining: ${finalPast.length}`);
    
    if (finalPast.length === 0) {
      console.log('🎉 SUCCESS: All past reservations cleaned up!');
    } else {
      console.log(`⚠️  ${finalPast.length} past reservations still remain`);
    }
    
  } catch (error) {
    console.error('❌ Admin test failed:', error);
  }
}

adminCleanupTest();
