// Test to check chicken tender inventory and generate fresh insights
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkChickenInventory() {
  console.log('🔍 Checking chicken tender inventory...\n');

  // Get chicken tender details
  const { data: chickenData, error } = await supabase
    .from('inventory_items')
    .select('*')
    .ilike('name', '%chicken%tender%')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error fetching chicken data:', error);
    return;
  }

  if (!chickenData || chickenData.length === 0) {
    console.log('❌ No chicken tenders found in inventory');
    return;
  }

  console.log('🐔 Chicken Tender Details:');
  chickenData.forEach(item => {
    console.log(`   • ID: ${item.id}`);
    console.log(`   • Name: ${item.name}`);
    console.log(`   • Category: ${item.category_id}`);
    console.log(`   • Current Quantity: ${item.current_quantity} ${item.unit}`);
    console.log(`   • Minimum: ${item.minimum_quantity}`);
    console.log(`   • Maximum: ${item.maximum_quantity}`);
    console.log(`   • Cost per unit: $${item.cost_per_unit}`);
    console.log(`   • Last updated: ${item.updated_at}`);
    console.log('');
  });

  // Test the AI insights API
  console.log('🤖 Testing AI insights with current inventory...\n');
  
  const response = await fetch('http://localhost:3000/api/inventory-insights', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: 'admin-test-user' // We'll need to use a real admin user ID
    })
  });

  if (!response.ok) {
    console.error('❌ AI insights API error:', response.status, response.statusText);
    return;
  }

  const insights = await response.json();
  
  console.log('📊 AI Insights Results:');
  console.log(`   • Reorder Suggestions: ${insights.insights?.reorderSuggestions?.length || 0}`);
  console.log(`   • Waste Alerts: ${insights.insights?.wasteAlerts?.length || 0}`);
  
  if (insights.insights?.wasteAlerts?.length > 0) {
    console.log('\n🚨 Waste Alerts:');
    insights.insights.wasteAlerts.forEach(alert => {
      console.log(`   • ${alert.item_name}: ${alert.potential_waste_amount} units at risk`);
      console.log(`     Reason: ${alert.reasoning}`);
    });
  }
  
  if (insights.insights?.reorderSuggestions?.length > 0) {
    console.log('\n📦 Reorder Suggestions:');
    insights.insights.reorderSuggestions.forEach(suggestion => {
      console.log(`   • ${suggestion.item_name}: Order ${suggestion.suggested_order_quantity} units`);
      console.log(`     Current: ${suggestion.current_quantity}, Priority: ${suggestion.priority}`);
    });
  }
}

checkChickenInventory().catch(console.error);
