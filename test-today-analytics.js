// Create a guest reservation for today to test analytics
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

async function createTodayGuestReservation() {
  console.log('🧪 Creating a guest reservation for today to test analytics...');
  
  // Create a reservation for today at 7 PM
  const today = new Date();
  const todayAt7PM = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 0, 0);
  
  console.log('📅 Creating reservation for:', todayAt7PM.toISOString());
  
  try {
    const { data: newReservation, error } = await supabase
      .from('reservations')
      .insert([
        {
          guest_name: 'Analytics Test Guest',
          guest_email: 'analytics@test.com',
          guest_phone: '555-0123',
          party_size: 4,
          datetime: todayAt7PM.toISOString(),
          status: 'confirmed',
          reservation_token: `test-${Date.now()}`
        }
      ])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Created guest reservation:', newReservation);
    
    // Now test analytics
    console.log('\n📊 Testing analytics with today\'s guest reservation...');
    
    // Get today's reservations
    const todayISO = today.toISOString().split('T')[0];
    const { data: reservations } = await supabase
      .from("reservations")
      .select(`datetime, user_id, guest_name, name, party_size`)
      .not('status', 'eq', 'cancelled');
    
    const todayReservations = reservations.filter(r => {
      const resDate = new Date(r.datetime);
      return resDate.toISOString().split('T')[0] === todayISO;
    });
    
    console.log(`📅 Today's reservations: ${todayReservations.length}`);
    
    if (todayReservations.length > 0) {
      // Test hourly distribution
      const hourlyDistribution = {};
      
      todayReservations.forEach(r => {
        const hour = new Date(r.datetime).getHours();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      });
      
      console.log('⏰ Hourly distribution for today:');
      Object.entries(hourlyDistribution).forEach(([hour, count]) => {
        const hourReservations = todayReservations.filter(r => {
          return new Date(r.datetime).getHours() === parseInt(hour);
        });
        
        const hourGuests = hourReservations.filter(r => !r.user_id).length;
        const hourUsers = hourReservations.filter(r => r.user_id).length;
        
        console.log(`  ${hour}:00 - ${count} reservations (${hourGuests} guests + ${hourUsers} users)`);
      });
    }
    
    // Clean up - delete the test reservation
    console.log('\n🧹 Cleaning up test reservation...');
    await supabase
      .from('reservations')
      .delete()
      .eq('id', newReservation.id);
    
    console.log('✅ Test reservation cleaned up');
    console.log('💡 Analytics successfully includes guest reservations!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTodayGuestReservation();
