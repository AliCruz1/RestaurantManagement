// Add tons of NBA player reservations for testing
// Run this with: node add-nba-reservations.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your URL
const supabaseKey = 'your-service-role-key'; // Replace with your service role key

const supabase = createClient(supabaseUrl, supabaseKey);

// NBA Players with creative email formats
const nbaPlayers = [
  // Current Stars
  { name: "LeBron James", email: "theking@lakers.com", phone: "323-555-2023" },
  { name: "Stephen Curry", email: "chef.curry@warriors.net", phone: "415-555-3030" },
  { name: "Kevin Durant", email: "kd35@suns.basketball", phone: "602-555-3535" },
  { name: "Giannis Antetokounmpo", email: "greek.freak@bucks.mil", phone: "414-555-3434" },
  { name: "Luka Dončić", email: "luka.magic@mavs.dallas", phone: "214-555-7777" },
  { name: "Jayson Tatum", email: "jt.deuce@celtics.com", phone: "617-555-0017" },
  { name: "Joel Embiid", email: "the.process@sixers.phila", phone: "215-555-2121" },
  { name: "Nikola Jokić", email: "big.honey@nuggets.den", phone: "303-555-1515" },
  { name: "Jimmy Butler", email: "jimmy.buckets@heat.miami", phone: "305-555-2222" },
  { name: "Kawhi Leonard", email: "klaw@clippers.la", phone: "213-555-0002" },
  
  // Rising Stars
  { name: "Ja Morant", email: "ja12@grizzlies.mem", phone: "901-555-1212" },
  { name: "Zion Williamson", email: "zion1@pelicans.nola", phone: "504-555-0001" },
  { name: "Trae Young", email: "ice.trae@hawks.atl", phone: "404-555-1111" },
  { name: "Devin Booker", email: "book1@suns.phx", phone: "602-555-0001" },
  { name: "Donovan Mitchell", email: "spida45@cavs.cleveland", phone: "216-555-4545" },
  { name: "De'Aaron Fox", email: "swipa@kings.sac", phone: "916-555-0005" },
  { name: "Anthony Edwards", email: "ant1@wolves.minn", phone: "612-555-0001" },
  { name: "Paolo Banchero", email: "paolo5@magic.orlando", phone: "407-555-0005" },
  { name: "Scottie Barnes", email: "scottie4@raptors.toronto", phone: "416-555-0004" },
  { name: "Franz Wagner", email: "franz22@magic.orlando", phone: "407-555-0022" },
  
  // Legends (for variety)
  { name: "Michael Jordan", email: "his.airness@bulls.legend", phone: "312-555-2323" },
  { name: "Kobe Bryant", email: "mamba.mentality@lakers.forever", phone: "323-555-2424" },
  { name: "Magic Johnson", email: "magic32@showtime.lakers", phone: "323-555-3232" },
  { name: "Larry Bird", email: "larry.legend@celtics.boston", phone: "617-555-3333" },
  { name: "Shaquille O'Neal", email: "big.diesel@lakers.shaq", phone: "323-555-3434" },
  { name: "Tim Duncan", email: "big.fundamental@spurs.sa", phone: "210-555-2121" },
  { name: "Hakeem Olajuwon", email: "the.dream@rockets.houston", phone: "713-555-3434" },
  { name: "Charles Barkley", email: "sir.charles@suns.phoenix", phone: "602-555-3434" },
  { name: "Allen Iverson", email: "the.answer@sixers.phila", phone: "215-555-0003" },
  { name: "Dirk Nowitzki", email: "dirk41@mavs.dallas", phone: "214-555-4141" },
  
  // More Current Players
  { name: "Damian Lillard", email: "dame.time@bucks.milwaukee", phone: "414-555-0000" },
  { name: "Paul George", email: "pg13@clippers.la", phone: "213-555-1313" },
  { name: "Russell Westbrook", email: "russ0@clippers.la", phone: "213-555-0000" },
  { name: "Kyrie Irving", email: "uncle.drew@mavs.dallas", phone: "214-555-1111" },
  { name: "Bradley Beal", email: "bb3@suns.phoenix", phone: "602-555-0003" },
  { name: "Jrue Holiday", email: "jrue11@celtics.boston", phone: "617-555-1111" },
  { name: "Kristaps Porziņģis", email: "unicorn@celtics.boston", phone: "617-555-0006" },
  { name: "Tyler Herro", email: "tyler14@heat.miami", phone: "305-555-1414" },
  { name: "Bam Adebayo", email: "bam13@heat.miami", phone: "305-555-1313" },
  { name: "Shai Gilgeous-Alexander", email: "shai2@thunder.okc", phone: "405-555-0002" },
  
  // International Stars
  { name: "Victor Wembanyama", email: "wemby1@spurs.sa", phone: "210-555-0001" },
  { name: "Alperen Şengün", email: "sengun28@rockets.houston", phone: "713-555-2828" },
  { name: "Lauri Markkanen", email: "lauri24@jazz.utah", phone: "801-555-2424" },
  { name: "Domantas Sabonis", email: "sabonis10@kings.sac", phone: "916-555-1010" },
  { name: "Rudy Gobert", email: "rudy27@wolves.minn", phone: "612-555-2727" },
  { name: "Pascal Siakam", email: "spicy.p@pacers.indiana", phone: "317-555-4343" },
  { name: "OG Anunoby", email: "og3@knicks.nyc", phone: "212-555-0003" },
  { name: "Evan Mobley", email: "evan4@cavs.cleveland", phone: "216-555-0004" },
  { name: "Cade Cunningham", email: "cade2@pistons.detroit", phone: "313-555-0002" },
  { name: "Jalen Green", email: "jalen4@rockets.houston", phone: "713-555-0004" }
];

// Statuses to choose from
const statuses = ['confirmed', 'pending', 'cancelled', 'completed', 'no-show'];

// Function to generate random dates (past, present, future)
function getRandomDate() {
  const today = new Date();
  const pastDays = Math.floor(Math.random() * 30); // Up to 30 days ago
  const futureDays = Math.floor(Math.random() * 60); // Up to 60 days in future
  
  const date = new Date(today);
  
  // Randomly choose past or future
  if (Math.random() > 0.3) {
    // 70% future reservations
    date.setDate(date.getDate() + futureDays);
  } else {
    // 30% past reservations (for cleanup testing)
    date.setDate(date.getDate() - pastDays);
  }
  
  // Random time between 5 PM and 10 PM
  const hour = 17 + Math.floor(Math.random() * 5);
  const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

// Function to get random party size (weighted towards smaller groups)
function getRandomPartySize() {
  const rand = Math.random();
  if (rand < 0.4) return 2; // 40% chance
  if (rand < 0.7) return 4; // 30% chance
  if (rand < 0.85) return 6; // 15% chance
  if (rand < 0.95) return 8; // 10% chance
  return 2 + Math.floor(Math.random() * 8); // 5% chance for 2-10
}

async function addNBAReservations() {
  console.log('🏀 Starting to add NBA player reservations...');
  
  const reservationsToAdd = [];
  
  // Create multiple reservations per player (some players book multiple times)
  for (let i = 0; i < 150; i++) { // 150 total reservations
    const randomPlayer = nbaPlayers[Math.floor(Math.random() * nbaPlayers.length)];
    const partySize = getRandomPartySize();
    const datetime = getRandomDate();
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Randomly choose between authenticated user reservation or guest reservation
    const isGuestReservation = Math.random() > 0.6; // 40% guest reservations
    
    if (isGuestReservation) {
      // Guest reservation
      reservationsToAdd.push({
        guest_name: randomPlayer.name,
        guest_email: randomPlayer.email,
        guest_phone: randomPlayer.phone,
        party_size: partySize,
        datetime: datetime,
        status: status,
        user_id: null,
        name: null,
        email: null,
        phone: null
      });
    } else {
      // Authenticated user reservation (we'll use null for user_id since we don't have real user IDs)
      reservationsToAdd.push({
        name: randomPlayer.name,
        email: randomPlayer.email,
        phone: randomPlayer.phone,
        party_size: partySize,
        datetime: datetime,
        status: status,
        user_id: null, // You can set this to a real user ID if you have one
        guest_name: null,
        guest_email: null,
        guest_phone: null
      });
    }
  }
  
  console.log(`📝 Prepared ${reservationsToAdd.length} reservations`);
  
  // Insert in batches to avoid overwhelming the database
  const batchSize = 20;
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < reservationsToAdd.length; i += batchSize) {
    const batch = reservationsToAdd.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
        errorCount += batch.length;
      } else {
        console.log(`✅ Successfully inserted batch ${Math.floor(i/batchSize) + 1} (${batch.length} reservations)`);
        successCount += batch.length;
      }
    } catch (err) {
      console.error(`❌ Unexpected error in batch ${Math.floor(i/batchSize) + 1}:`, err);
      errorCount += batch.length;
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🏆 RESULTS:');
  console.log(`✅ Successfully added: ${successCount} reservations`);
  console.log(`❌ Failed to add: ${errorCount} reservations`);
  console.log('\n🎯 Breakdown:');
  console.log('- Mix of past and future dates');
  console.log('- Various party sizes (2-10 people)');
  console.log('- All NBA player names with themed emails');
  console.log('- Different statuses: confirmed, pending, cancelled, completed, no-show');
  console.log('- Mix of guest and authenticated user reservations');
  console.log('\n🧹 You can now test the cleanup functionality!');
}

// Run the script
addNBAReservations().catch(console.error);
