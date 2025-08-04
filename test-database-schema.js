import { supabaseServer } from '@/lib/supabaseServerClient';

// Simple test to check database schema and connectivity
async function testDatabaseSchema() {
  console.log('Testing database schema...');
  
  try {
    // Test inventory_items table structure
    const { data: items, error: itemsError } = await supabaseServer
      .from('inventory_items')
      .select('id, name, current_quantity, min_quantity')
      .limit(1);
    
    if (itemsError) {
      console.error('inventory_items error:', itemsError);
    } else {
      console.log('✅ inventory_items table accessible');
    }

    // Test inventory_transactions table structure
    const { data: transactions, error: transError } = await supabaseServer
      .from('inventory_transactions')
      .select('id, item_id, transaction_type, quantity')
      .limit(1);
    
    if (transError) {
      console.error('inventory_transactions error:', transError);
    } else {
      console.log('✅ inventory_transactions table accessible');
    }

    // Test ai_actions_log table
    const { data: actions, error: actionsError } = await supabaseServer
      .from('ai_actions_log')
      .select('id, action_type, item_id')
      .limit(1);
    
    if (actionsError) {
      console.error('ai_actions_log error:', actionsError);
    } else {
      console.log('✅ ai_actions_log table accessible');
    }

    // Test suppliers table
    const { data: suppliers, error: suppliersError } = await supabaseServer
      .from('suppliers')
      .select('id, name')
      .limit(1);
    
    if (suppliersError) {
      console.error('suppliers error:', suppliersError);
    } else {
      console.log('✅ suppliers table accessible');
    }

  } catch (error) {
    console.error('Database test failed:', error);
  }
}

// Test auto-reorder functionality
async function testAutoReorder() {
  console.log('Testing auto-reorder...');
  
  try {
    const testItem = {
      item_id: '8b1c134c-7b1f-4f69-8b1f-b6a62fb7edab', // Fresh Basil ID from sample data
      item_name: 'Fresh Basil',
      current_quantity: 8
    };

    const response = await fetch('/api/auto-reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        item: testItem,
        orderQuantity: 5,
        reasoning: 'Test auto-reorder functionality'
      }),
    });

    const result = await response.json();
    console.log('Auto-reorder test result:', result);

  } catch (error) {
    console.error('Auto-reorder test failed:', error);
  }
}

// Run tests
if (typeof window === 'undefined') {
  // Only run on server side
  testDatabaseSchema();
}

export { testDatabaseSchema, testAutoReorder };
