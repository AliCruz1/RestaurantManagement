// Generate Saved Metrics Data for NBA Reservation Dates (August 2025+)
// This script creates realistic restaurant metrics with variation

const fs = require('fs');

// Extract dates from NBA reservations (August 2025 onwards only)
const nbaReservations = [
  { date: '2025-08-04', confirmed: 2, pending: 0, covers: 6 }, // LeBron (4) + Tyler (2)
  { date: '2025-08-05', confirmed: 1, pending: 1, covers: 6 }, // Kristaps (6)
  { date: '2025-08-07', confirmed: 1, pending: 1, covers: 2 }, // Rudy (2)
  { date: '2025-08-13', confirmed: 1, pending: 0, covers: 8 }, // KD (8)
  { date: '2025-08-15', confirmed: 1, pending: 1, covers: 4 }, // Dirk (4)
  { date: '2025-08-16', confirmed: 0, pending: 1, covers: 0 }, // Embiid (4) - pending
  { date: '2025-08-21', confirmed: 2, pending: 0, covers: 24 }, // Curry (12) + Magic (12)
  { date: '2025-08-22', confirmed: 1, pending: 1, covers: 4 }, // Tatum (4)
  { date: '2025-08-23', confirmed: 1, pending: 0, covers: 8 }, // Jrue (8)
  { date: '2025-08-24', confirmed: 1, pending: 0, covers: 12 }, // Iverson (12)
  { date: '2025-08-26', confirmed: 1, pending: 1, covers: 12 }, // Trae (12)
  { date: '2025-08-28', confirmed: 2, pending: 0, covers: 18 }, // Lauri (12) + Jalen (6)
  { date: '2025-08-29', confirmed: 2, pending: 1, covers: 18 }, // Victor (10) + Jimmy (2), Bam pending
  { date: '2025-08-30', confirmed: 1, pending: 0, covers: 2 }, // Jimmy (2)
  { date: '2025-09-04', confirmed: 0, pending: 1, covers: 0 }, // Franz (2) - pending
  { date: '2025-09-06', confirmed: 2, pending: 0, covers: 14 }, // Fox (4) + Scottie (2) + OG (10)
  { date: '2025-09-07', confirmed: 1, pending: 0, covers: 2 }, // Alperen (2)
  { date: '2025-09-09', confirmed: 1, pending: 0, covers: 2 }, // Jokic (2)
  { date: '2025-09-12', confirmed: 1, pending: 0, covers: 4 }, // Luka (4)
  { date: '2025-09-13', confirmed: 0, pending: 1, covers: 0 }, // Paul George (12) - pending
  { date: '2025-09-14', confirmed: 1, pending: 0, covers: 4 }, // Paolo (4)
  { date: '2025-09-17', confirmed: 0, pending: 1, covers: 0 }, // Sabonis (4) - pending
  { date: '2025-09-21', confirmed: 1, pending: 0, covers: 8 }, // Mitchell (8)
  { date: '2025-09-22', confirmed: 0, pending: 1, covers: 0 }, // Edwards (8) - pending
  { date: '2025-09-23', confirmed: 1, pending: 0, covers: 4 }, // Shaq (4)
  { date: '2025-09-25', confirmed: 1, pending: 0, covers: 12 }, // Kobe (12)
  { date: '2025-09-26', confirmed: 1, pending: 1, covers: 10 }, // Duncan (10)
];

// Helper function to add realistic variation
function addVariation(baseValue, variationPercent = 0.2) {
  const variation = baseValue * variationPercent;
  return baseValue + (Math.random() - 0.5) * 2 * variation;
}

// Helper function to get day of week performance multiplier
function getDayMultiplier(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Weekend = higher performance, Tuesday/Wednesday = lower
  if (day === 5 || day === 6) return 1.15; // Friday/Saturday
  if (day === 0) return 1.1; // Sunday
  if (day === 2 || day === 3) return 0.9; // Tuesday/Wednesday
  return 1.0; // Monday/Thursday
}

// Generate realistic metrics for each date
function generateMetricsForDate(reservation) {
  const dayMultiplier = getDayMultiplier(reservation.date);
  const baseCovers = Math.max(reservation.covers, 15); // Minimum covers even if no confirmed reservations
  
  // Add walk-ins (20-40% of business typically)
  const totalCovers = Math.round(addVariation(baseCovers * 1.8, 0.3) * dayMultiplier);
  
  // Calculate revenue per person ($30-45 range with variation)
  const avgSpend = addVariation(37, 0.2) * dayMultiplier;
  const dailyRevenue = Math.round(totalCovers * avgSpend);
  
  // Industry standard percentages with realistic variation
  const foodCostPercent = Math.max(25, Math.min(35, addVariation(30, 0.15)));
  const laborCostPercent = Math.max(22, Math.min(32, addVariation(27, 0.15)));
  const wastePercent = Math.max(1.5, Math.min(6, addVariation(3.2, 0.3)));
  
  // Table turnover (2-3x typical, higher on busy days)
  const tableTurnover = Math.max(1.8, Math.min(3.5, addVariation(2.4, 0.2) * dayMultiplier));
  
  // Reservation rate (% of tables that were reserved)
  const baseReservationRate = (reservation.confirmed + reservation.pending) > 0 ? 65 : 35;
  const reservationRate = Math.max(30, Math.min(85, addVariation(baseReservationRate, 0.2)));

  return {
    date: reservation.date,
    daily_revenue: dailyRevenue,
    avg_order_value: Math.round(avgSpend * 100) / 100,
    food_cost_percent: Math.round(foodCostPercent * 10) / 10,
    labor_cost_percent: Math.round(laborCostPercent * 10) / 10,
    daily_covers: totalCovers,
    table_turnover: Math.round(tableTurnover * 10) / 10,
    reservation_rate: Math.round(reservationRate * 10) / 10,
    waste_percent: Math.round(wastePercent * 10) / 10
  };
}

// Generate SQL for all dates
let sql = `-- Saved Metrics Data for NBA Reservation Dates (August 2025+)
-- Realistic restaurant metrics with variation based on actual reservation data
-- Copy this entire block into Supabase SQL Editor

`;

nbaReservations.forEach(reservation => {
  const metrics = generateMetricsForDate(reservation);
  
  sql += `INSERT INTO daily_metrics (date, daily_revenue, avg_order_value, food_cost_percent, labor_cost_percent, daily_covers, table_turnover, reservation_rate, waste_percent, created_at, updated_at)
VALUES ('${metrics.date}', ${metrics.daily_revenue}, ${metrics.avg_order_value}, ${metrics.food_cost_percent}, ${metrics.labor_cost_percent}, ${metrics.daily_covers}, ${metrics.table_turnover}, ${metrics.reservation_rate}, ${metrics.waste_percent}, NOW(), NOW());

`;
});

sql += `-- End of Saved Metrics Data
-- Total: ${nbaReservations.length} days of realistic restaurant metrics
-- Covers range: 15-50+ customers per day
-- Revenue range: $500-2000+ per day
-- All percentages within industry standards with realistic variation
`;

// Write to file
fs.writeFileSync('NBA_SAVED_METRICS.sql', sql);
console.log('✅ Generated NBA_SAVED_METRICS.sql');
console.log(`📊 Created metrics for ${nbaReservations.length} dates`);
console.log('📅 Date range: August 2025 - September 2025');
console.log('💰 Revenue calculated from reservation covers + walk-ins');
console.log('📈 Added realistic variation and day-of-week patterns');
