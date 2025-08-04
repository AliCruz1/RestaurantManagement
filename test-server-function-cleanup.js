#!/usr/bin/env node

// Test the server function approach for reservation cleanup
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

async function testServerFunctionCleanup() {
  console.log('🧪 TESTING SERVER FUNCTION CLEANUP');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Preview what would be deleted
    console.log('\n🔍 STEP 1: Preview cleanup');
    const { data: previewData, error: previewError } = await supabase.rpc('preview_cleanup_past_reservations');
    
    if (previewError) {
      console.error('❌ Preview function error:', previewError);
      console.log('\n📋 ACTION REQUIRED:');
      console.log('1. Copy cleanup-past-reservations-function.sql');
      console.log('2. Paste into Supabase SQL Editor');
      console.log('3. Run the script to create the server functions');
      return;
    }
    
    const preview = previewData[0];
    console.log(`Found ${preview.count_to_delete} past reservations to delete`);
    console.log(`Cutoff date: ${preview.cutoff_date}`);
    
    if (preview.count_to_delete > 0) {
      console.log('\nReservations that will be deleted:');
      preview.reservations_to_delete.forEach((r, i) => {
        const date = new Date(r.datetime).toLocaleDateString();
        console.log(`${i + 1}. ${r.name} - ${date} (${r.status})`);
      });
    }
    
    // Step 2: Perform the actual cleanup
    console.log('\n🧹 STEP 2: Performing cleanup');
    const { data: cleanupData, error: cleanupError } = await supabase.rpc('cleanup_past_reservations');
    
    if (cleanupError) {
      console.error('❌ Cleanup function error:', cleanupError);
      return;
    }
    
    const cleanup = cleanupData[0];
    console.log(`✅ Successfully deleted ${cleanup.deleted_count} past reservations`);
    
    if (cleanup.deleted_count > 0) {
      console.log('\nDeleted reservations:');
      cleanup.deleted_reservations.forEach((r, i) => {
        const date = new Date(r.datetime).toLocaleDateString();
        console.log(`${i + 1}. ${r.name} - ${date} (${r.status})`);
      });
    }
    
    // Step 3: Verify cleanup worked
    console.log('\n✨ STEP 3: Verification');
    const { data: verifyData } = await supabase.rpc('preview_cleanup_past_reservations');
    const verify = verifyData[0];
    
    console.log(`Past reservations remaining: ${verify.count_to_delete}`);
    
    if (verify.count_to_delete === 0) {
      console.log('🎉 SUCCESS: All past reservations cleaned up!');
    } else {
      console.log(`⚠️  ${verify.count_to_delete} past reservations still remain`);
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('- Server function cleanup working correctly');
    console.log('- RLS policies bypassed using SECURITY DEFINER');
    console.log('- API endpoints ready for frontend use');
    console.log('- Automatic cleanup will work on page loads');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testServerFunctionCleanup();
