// Test script to verify analytics include guest reservations
const { createClient } = require('@supabase/supabase-js');

// Read environment from .env file manually
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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnalytics() {
  console.log('🧪 Testing Analytics with Guest Reservations');
  console.log('=' .repeat(50));
  
  try {
    // 1. Test direct reservation fetch (like the updated analytics page)
    console.log('📊 Testing direct reservation fetch for analytics...');
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select(`
        id, 
        datetime,
        status,
        user_id,
        guest_name,
        name,
        party_size
      `)
      .not('status', 'eq', 'cancelled')
      .order('datetime', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Found ${reservations.length} total reservations`);
    
    // Separate guest vs user reservations
    const guestReservations = reservations.filter(r => !r.user_id);
    const userReservations = reservations.filter(r => r.user_id);
    
    console.log(`👥 Guest reservations: ${guestReservations.length}`);
    console.log(`👤 User reservations: ${userReservations.length}`);
    
    // 2. Group reservations by day (analytics logic)
    console.log('\n📈 Grouping reservations by day for analytics...');
    const reservationsByDay = {};
    
    reservations.forEach(reservation => {
      const date = new Date(reservation.datetime);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      reservationsByDay[dayKey] = (reservationsByDay[dayKey] || 0) + 1;
    });
    
    // Convert to array format for chart
    const chartData = Object.entries(reservationsByDay)
      .map(([day, count]) => ({
        day: new Date(day).toLocaleDateString(),
        count,
        rawDay: day
      }))
      .sort((a, b) => new Date(a.rawDay).getTime() - new Date(b.rawDay).getTime());
    
    console.log('📊 Daily reservation counts:');
    chartData.forEach(({ day, count, rawDay }) => {
      // Show breakdown for each day
      const dayReservations = reservations.filter(r => {
        const resDate = new Date(r.datetime);
        return resDate.toISOString().split('T')[0] === rawDay;
      });
      
      const dayGuests = dayReservations.filter(r => !r.user_id).length;
      const dayUsers = dayReservations.filter(r => r.user_id).length;
      
      console.log(`  ${day}: ${count} total (${dayGuests} guests + ${dayUsers} users)`);
    });
    
    // 3. Test today's hourly distribution
    console.log('\n⏰ Testing hourly distribution for today...');
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = reservations.filter(r => {
      const resDate = new Date(r.datetime);
      return resDate.toISOString().split('T')[0] === today;
    });
    
    console.log(`📅 Today (${today}): ${todayReservations.length} reservations`);
    
    if (todayReservations.length > 0) {
      const hourlyDistribution = {};
      
      // Initialize business hours
      for (let hour = 9; hour <= 22; hour++) {
        hourlyDistribution[hour] = 0;
      }
      
      // Count reservations by hour
      todayReservations.forEach(r => {
        const hour = new Date(r.datetime).getHours();
        if (hour >= 9 && hour <= 22) {
          hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
        }
      });
      
      console.log('⏰ Hourly breakdown for today:');
      Object.entries(hourlyDistribution).forEach(([hour, count]) => {
        if (count > 0) {
          const hourReservations = todayReservations.filter(r => {
            return new Date(r.datetime).getHours() === parseInt(hour);
          });
          
          const hourGuests = hourReservations.filter(r => !r.user_id).length;
          const hourUsers = hourReservations.filter(r => r.user_id).length;
          
          const timeLabel = `${hour}:00`;
          console.log(`  ${timeLabel}: ${count} reservations (${hourGuests} guests + ${hourUsers} users)`);
        }
      });
    } else {
      console.log('ℹ️  No reservations for today to analyze hourly');
    }
    
    // 4. Show some sample reservations
    console.log('\n📝 Sample reservations:');
    const sampleReservations = reservations.slice(0, 5);
    sampleReservations.forEach((r, index) => {
      const type = r.user_id ? 'USER' : 'GUEST';
      const name = r.user_id ? r.name : r.guest_name;
      const date = new Date(r.datetime).toLocaleString();
      console.log(`  ${index + 1}. [${type}] ${name} - ${date} (${r.party_size} people)`);
    });
    
    console.log('\n✅ Analytics test completed successfully!');
    console.log('💡 Both guest and user reservations should now appear in analytics');
    
  } catch (error) {
    console.error('❌ Error testing analytics:', error);
  }
}

testAnalytics();
