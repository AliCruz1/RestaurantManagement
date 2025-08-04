// Simple NBA Reservations Generator - No external dependencies needed
// Just run this in your browser console or as a Node script

const nbaReservations = [
  // Current NBA Stars
  { name: "LeBron James", email: "theking@lakers.com", phone: "323-555-2023", position: "Forward" },
  { name: "Stephen Curry", email: "chef.curry@warriors.net", phone: "415-555-3030", position: "Guard" },
  { name: "Kevin Durant", email: "kd35@suns.basketball", phone: "602-555-3535", position: "Forward" },
  { name: "Giannis Antetokounmpo", email: "greek.freak@bucks.mil", phone: "414-555-3434", position: "Forward" },
  { name: "Luka Dončić", email: "luka.magic@mavs.dallas", phone: "214-555-7777", position: "Guard" },
  { name: "Jayson Tatum", email: "jt.deuce@celtics.com", phone: "617-555-0017", position: "Forward" },
  { name: "Joel Embiid", email: "the.process@sixers.phila", phone: "215-555-2121", position: "Center" },
  { name: "Nikola Jokić", email: "big.honey@nuggets.den", phone: "303-555-1515", position: "Center" },
  { name: "Jimmy Butler", email: "jimmy.buckets@heat.miami", phone: "305-555-2222", position: "Forward" },
  { name: "Kawhi Leonard", email: "klaw@clippers.la", phone: "213-555-0002", position: "Forward" },
  
  // Rising Stars
  { name: "Ja Morant", email: "ja12@grizzlies.mem", phone: "901-555-1212", position: "Guard" },
  { name: "Zion Williamson", email: "zion1@pelicans.nola", phone: "504-555-0001", position: "Forward" },
  { name: "Trae Young", email: "ice.trae@hawks.atl", phone: "404-555-1111", position: "Guard" },
  { name: "Devin Booker", email: "book1@suns.phx", phone: "602-555-0001", position: "Guard" },
  { name: "Donovan Mitchell", email: "spida45@cavs.cleveland", phone: "216-555-4545", position: "Guard" },
  { name: "De'Aaron Fox", email: "swipa@kings.sac", phone: "916-555-0005", position: "Guard" },
  { name: "Anthony Edwards", email: "ant1@wolves.minn", phone: "612-555-0001", position: "Guard" },
  { name: "Paolo Banchero", email: "paolo5@magic.orlando", phone: "407-555-0005", position: "Forward" },
  { name: "Scottie Barnes", email: "scottie4@raptors.toronto", phone: "416-555-0004", position: "Forward" },
  { name: "Franz Wagner", email: "franz22@magic.orlando", phone: "407-555-0022", position: "Forward" },
  
  // NBA Legends
  { name: "Michael Jordan", email: "his.airness@bulls.legend", phone: "312-555-2323", position: "Guard" },
  { name: "Kobe Bryant", email: "mamba.mentality@lakers.forever", phone: "323-555-2424", position: "Guard" },
  { name: "Magic Johnson", email: "magic32@showtime.lakers", phone: "323-555-3232", position: "Guard" },
  { name: "Larry Bird", email: "larry.legend@celtics.boston", phone: "617-555-3333", position: "Forward" },
  { name: "Shaquille O'Neal", email: "big.diesel@lakers.shaq", phone: "323-555-3434", position: "Center" },
  { name: "Tim Duncan", email: "big.fundamental@spurs.sa", phone: "210-555-2121", position: "Forward" },
  { name: "Hakeem Olajuwon", email: "the.dream@rockets.houston", phone: "713-555-3434", position: "Center" },
  { name: "Charles Barkley", email: "sir.charles@suns.phoenix", phone: "602-555-3434", position: "Forward" },
  { name: "Allen Iverson", email: "the.answer@sixers.phila", phone: "215-555-0003", position: "Guard" },
  { name: "Dirk Nowitzki", email: "dirk41@mavs.dallas", phone: "214-555-4141", position: "Forward" },
  
  // More Current Stars
  { name: "Damian Lillard", email: "dame.time@bucks.milwaukee", phone: "414-555-0000", position: "Guard" },
  { name: "Paul George", email: "pg13@clippers.la", phone: "213-555-1313", position: "Forward" },
  { name: "Russell Westbrook", email: "russ0@clippers.la", phone: "213-555-0000", position: "Guard" },
  { name: "Kyrie Irving", email: "uncle.drew@mavs.dallas", phone: "214-555-1111", position: "Guard" },
  { name: "Bradley Beal", email: "bb3@suns.phoenix", phone: "602-555-0003", position: "Guard" },
  { name: "Jrue Holiday", email: "jrue11@celtics.boston", phone: "617-555-1111", position: "Guard" },
  { name: "Kristaps Porziņģis", email: "unicorn@celtics.boston", phone: "617-555-0006", position: "Center" },
  { name: "Tyler Herro", email: "tyler14@heat.miami", phone: "305-555-1414", position: "Guard" },
  { name: "Bam Adebayo", email: "bam13@heat.miami", phone: "305-555-1313", position: "Center" },
  { name: "Shai Gilgeous-Alexander", email: "shai2@thunder.okc", phone: "405-555-0002", position: "Guard" },
  
  // International and Rising Stars
  { name: "Victor Wembanyama", email: "wemby1@spurs.sa", phone: "210-555-0001", position: "Center" },
  { name: "Alperen Şengün", email: "sengun28@rockets.houston", phone: "713-555-2828", position: "Center" },
  { name: "Lauri Markkanen", email: "lauri24@jazz.utah", phone: "801-555-2424", position: "Forward" },
  { name: "Domantas Sabonis", email: "sabonis10@kings.sac", phone: "916-555-1010", position: "Center" },
  { name: "Rudy Gobert", email: "rudy27@wolves.minn", phone: "612-555-2727", position: "Center" },
  { name: "Pascal Siakam", email: "spicy.p@pacers.indiana", phone: "317-555-4343", position: "Forward" },
  { name: "OG Anunoby", email: "og3@knicks.nyc", phone: "212-555-0003", position: "Forward" },
  { name: "Evan Mobley", email: "evan4@cavs.cleveland", phone: "216-555-0004", position: "Center" },
  { name: "Cade Cunningham", email: "cade2@pistons.detroit", phone: "313-555-0002", position: "Guard" },
  { name: "Jalen Green", email: "jalen4@rockets.houston", phone: "713-555-0004", position: "Guard" }
];

const statuses = ['confirmed', 'pending', 'cancelled', 'completed', 'no-show'];

function getRandomDate() {
  const today = new Date();
  const randomDays = Math.floor(Math.random() * 90) - 30; // -30 to +60 days from today
  const date = new Date(today);
  date.setDate(date.getDate() + randomDays);
  
  // Random time between 5 PM and 10 PM
  const hour = 17 + Math.floor(Math.random() * 5);
  const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function getRandomPartySize() {
  const sizes = [2, 2, 2, 4, 4, 4, 6, 6, 8, 10, 12]; // Weighted towards smaller groups
  return sizes[Math.floor(Math.random() * sizes.length)];
}

// Generate SQL INSERT statements
function generateReservationSQL() {
  const insertStatements = [];
  
  // Create 3-5 reservations per player
  nbaReservations.forEach(player => {
    const numReservations = 3 + Math.floor(Math.random() * 3); // 3-5 reservations
    
    for (let i = 0; i < numReservations; i++) {
      const isGuest = Math.random() > 0.6; // 40% guest reservations
      const partySize = getRandomPartySize();
      const datetime = getRandomDate();
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      if (isGuest) {
        // Guest reservation
        insertStatements.push(
          `INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status) 
           VALUES ('${player.name}', '${player.email}', '${player.phone}', ${partySize}, '${datetime}', '${status}');`
        );
      } else {
        // Regular reservation (we'll use NULL for user_id since we don't have real users)
        insertStatements.push(
          `INSERT INTO reservations (name, email, phone, party_size, datetime, status) 
           VALUES ('${player.name}', '${player.email}', '${player.phone}', ${partySize}, '${datetime}', '${status}');`
        );
      }
    }
  });
  
  return insertStatements;
}

// Generate the SQL
const sqlStatements = generateReservationSQL();

console.log('🏀 NBA RESERVATIONS SQL GENERATOR 🏀');
console.log('=====================================');
console.log(`Generated ${sqlStatements.length} reservation INSERT statements`);
console.log('');
console.log('Copy and paste the following SQL into your Supabase SQL Editor:');
console.log('');
console.log('-- NBA Player Reservations - Copy this entire block');
console.log('-- Generated on:', new Date().toISOString());
console.log('');

sqlStatements.forEach((sql, index) => {
  console.log(sql);
  if ((index + 1) % 10 === 0) {
    console.log(''); // Add blank line every 10 statements for readability
  }
});

console.log('');
console.log('-- End of NBA Reservations');
console.log(`-- Total: ${sqlStatements.length} reservations`);
console.log('-- Mix of past/future dates, various party sizes, all statuses');
console.log('-- Both guest and authenticated user reservations');

// Also create a summary
const summary = {
  totalReservations: sqlStatements.length,
  playersIncluded: nbaReservations.length,
  averageReservationsPerPlayer: Math.round(sqlStatements.length / nbaReservations.length * 10) / 10,
  statusTypes: statuses,
  dateRange: '30 days ago to 60 days in future',
  partySize: '2-12 people (weighted towards smaller groups)',
  reservationTypes: 'Mix of guest (40%) and user (60%) reservations'
};

console.log('');
console.log('📊 SUMMARY:');
console.log(JSON.stringify(summary, null, 2));
