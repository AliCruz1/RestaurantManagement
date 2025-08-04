#!/usr/bin/env node

// Direct SQL test to verify the cleanup approach
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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function directCleanupTest() {
  console.log('🧪 DIRECT CLEANUP TEST');
  console.log('=' .repeat(40));
  
  try {
    // Step 1: Check what reservations exist
    console.log('\n📊 Current reservations:');
    const { data: allReservations } = await supabase
      .from('reservations')
      .select('id, datetime, guest_name, name, status')
      .order('datetime');
    
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    
    const pastReservations = allReservations?.filter(r => new Date(r.datetime) < todayUTC) || [];
    const futureReservations = allReservations?.filter(r => new Date(r.datetime) >= todayUTC) || [];
    
    console.log(`Total: ${allReservations?.length || 0}`);
    console.log(`Past: ${pastReservations.length}`);
    console.log(`Current/Future: ${futureReservations.length}`);
    
    if (pastReservations.length === 0) {
      console.log('\n✅ No past reservations to clean up!');
      return;
    }
    
    // Step 2: Check email queue references
    console.log('\n📧 Checking email queue references...');
    const pastReservationIds = pastReservations.map(r => r.id);
    
    const { data: emailQueueEntries } = await supabase
      .from('email_queue')
      .select('id, reservation_id')
      .in('reservation_id', pastReservationIds);
    
    console.log(`Email queue entries for past reservations: ${emailQueueEntries?.length || 0}`);
    
    // Step 3: Clean up email queue first
    if (emailQueueEntries && emailQueueEntries.length > 0) {
      console.log('\n🧹 Cleaning up email queue entries...');
      const { error: emailError } = await supabase
        .from('email_queue')
        .delete()
        .in('reservation_id', pastReservationIds);
      
      if (emailError) {
        console.error('❌ Email cleanup failed:', emailError);
        return;
      }
      
      console.log(`✅ Deleted ${emailQueueEntries.length} email queue entries`);
    }
    
    // Step 4: Now clean up past reservations
    console.log('\n🧹 Cleaning up past reservations...');
    const todayISO = todayUTC.toISOString();
    
    const { data: deletedReservations, error } = await supabase
      .from('reservations')
      .delete()
      .lt('datetime', todayISO)
      .select('id, datetime, guest_name, name, status');
    
    if (error) {
      console.error('❌ Reservation cleanup failed:', error);
      return;
    }
    
    console.log(`✅ Successfully deleted ${deletedReservations?.length || 0} past reservations`);
    
    if (deletedReservations && deletedReservations.length > 0) {
      console.log('\nDeleted reservations:');
      deletedReservations.forEach((r, i) => {
        const name = r.name || r.guest_name || 'No Name';
        const date = new Date(r.datetime).toLocaleDateString();
        console.log(`${i + 1}. ${name} - ${date} (${r.status})`);
      });
    }
    
    // Step 5: Verify final state
    console.log('\n✨ Final verification:');
    const { data: finalReservations } = await supabase
      .from('reservations')
      .select('id, datetime')
      .order('datetime');
    
    const finalPast = finalReservations?.filter(r => new Date(r.datetime) < todayUTC) || [];
    
    console.log(`Total reservations remaining: ${finalReservations?.length || 0}`);
    console.log(`Past reservations remaining: ${finalPast.length}`);
    
    if (finalPast.length === 0) {
      console.log('🎉 SUCCESS: All past reservations cleaned up!');
    } else {
      console.log(`⚠️  ${finalPast.length} past reservations still remain`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

directCleanupTest();
