// Verification script to check if chicken tenders was deleted from Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDeletion() {
  console.log('🔍 Checking Supabase database for chicken tenders...\n');

  try {
    // Search for any chicken tender items (active and inactive)
    const { data: allChickenItems, error } = await supabase
      .from('inventory_items')
      .select('*')
      .ilike('name', '%chicken%tender%');

    if (error) {
      console.error('❌ Error querying database:', error);
      return;
    }

    console.log('📊 Search Results:');
    if (!allChickenItems || allChickenItems.length === 0) {
      console.log('✅ SUCCESS: No chicken tender items found in database');
      console.log('   The item was successfully deleted from Supabase.\n');
    } else {
      console.log(`⚠️  Found ${allChickenItems.length} chicken tender item(s):`);
      allChickenItems.forEach((item, index) => {
        console.log(`\n   Item ${index + 1}:`);
        console.log(`   • ID: ${item.id}`);
        console.log(`   • Name: ${item.name}`);
        console.log(`   • Active: ${item.is_active}`);
        console.log(`   • Quantity: ${item.current_quantity} ${item.unit}`);
        console.log(`   • Last Updated: ${item.updated_at}`);
      });
    }

    // Also check for any related transaction history (should be preserved)
    const { data: transactions, error: transError } = await supabase
      .from('inventory_transactions')
      .select(`
        *,
        inventory_items(name)
      `)
      .eq('inventory_items.name', 'Chicken tenders')
      .order('transaction_date', { ascending: false })
      .limit(5);

    if (transError) {
      console.warn('⚠️  Could not check transaction history:', transError.message);
    } else {
      console.log('\n📜 Recent Transaction History:');
      if (!transactions || transactions.length === 0) {
        console.log('   No recent transactions found for chicken tenders.');
      } else {
        console.log(`   Found ${transactions.length} recent transaction(s):`);
        transactions.forEach((trans, index) => {
          console.log(`   ${index + 1}. ${trans.transaction_type} - ${trans.quantity} units on ${trans.transaction_date}`);
        });
        console.log('   ✅ Transaction history preserved (as expected)');
      }
    }

    // Check AI actions log
    const { data: aiActions, error: aiError } = await supabase
      .from('ai_actions_log')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(3);

    if (!aiError && aiActions && aiActions.length > 0) {
      console.log('\n🤖 Recent AI Actions:');
      aiActions.forEach((action, index) => {
        console.log(`   ${index + 1}. ${action.action_type} on ${action.executed_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyDeletion().catch(console.error);
