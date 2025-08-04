#!/usr/bin/env node

// Quick cleanup test with corrected date logic
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

async function quickCleanupTest() {
  console.log('🧹 QUICK RESERVATION CLEANUP TEST');
  console.log('=' .repeat(50));
  
  try {
    // Get current date in UTC (to match database datetime format)
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const todayISO = todayUTC.toISOString();
    
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Today UTC start: ${todayISO}`);
    
    // Count reservations before cleanup
    const { data: beforeCleanup } = await supabase
      .from('reservations')
      .select('id, datetime, guest_name, name, status');
    
    const pastBefore = beforeCleanup?.filter(r => new Date(r.datetime) < todayUTC) || [];
    console.log(`\nBefore cleanup: ${beforeCleanup?.length || 0} total, ${pastBefore.length} past`);
    
    // Perform cleanup
    console.log('\n🧹 Performing cleanup...');
    const { data: deletedReservations, error } = await supabase
      .from('reservations')
      .delete()
      .lt('datetime', todayISO)
      .select('id, datetime, guest_name, name, status');
    
    if (error) {
      console.error('❌ Cleanup failed:', error);
      return;
    }
    
    const deletedCount = deletedReservations?.length || 0;
    console.log(`✅ Deleted ${deletedCount} past reservations`);
    
    if (deletedCount > 0) {
      console.log('\nDeleted reservations:');
      deletedReservations.forEach((r, i) => {
        const name = r.name || r.guest_name || 'No Name';
        const date = new Date(r.datetime).toLocaleDateString();
        console.log(`${i + 1}. ${name} - ${date} (${r.status})`);
      });
    }
    
    // Count reservations after cleanup
    const { data: afterCleanup } = await supabase
      .from('reservations')
      .select('id, datetime, guest_name, name, status');
    
    const pastAfter = afterCleanup?.filter(r => new Date(r.datetime) < todayUTC) || [];
    console.log(`\nAfter cleanup: ${afterCleanup?.length || 0} total, ${pastAfter.length} past`);
    
    if (pastAfter.length === 0) {
      console.log('\n🎉 SUCCESS: All past reservations cleaned up!');
    } else {
      console.log(`\n⚠️  ${pastAfter.length} past reservations still remain`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

quickCleanupTest();
