// Test RPC function
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

async function testRPC() {
  console.log('🧪 Testing get_reservations_per_day RPC function...');
  
  try {
    const { data, error } = await supabase.rpc('get_reservations_per_day');
    
    if (error) {
      console.log('❌ RPC function error:', error.message);
      console.log('💡 You need to run the analytics-functions.sql in your Supabase dashboard');
    } else {
      console.log('✅ RPC function works!');
      console.log('📊 Data:', data);
    }
  } catch (err) {
    console.log('❌ Error calling RPC:', err.message);
  }
}

testRPC();
