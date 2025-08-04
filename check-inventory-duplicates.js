const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local for Supabase credentials
const envContent = fs.readFileSync('.env.local', 'utf8');
const lines = envContent.split('\n');
let url = '';
let key = '';

lines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    url = line.split('=')[1].replace(/["'\r]/g, '');
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    key = line.split('=')[1].replace(/["'\r]/g, '');
  }
});

if (!url || !key) {
  console.log('❌ Could not find Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function findDuplicates() {
  console.log('🔍 FINDING DUPLICATE INVENTORY ITEMS');
  console.log('='.repeat(50));
  
  try {
    // Get all inventory items
    const { data: items, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) {
      console.log('❌ Error fetching items:', error.message);
      return;
    }
    
    console.log(`📦 Total items found: ${items.length}`);
    
    // Group by name to find duplicates
    const itemsByName = {};
    items.forEach(item => {
      if (!itemsByName[item.name]) {
        itemsByName[item.name] = [];
      }
      itemsByName[item.name].push(item);
    });
    
    // Find duplicates
    const duplicates = {};
    let totalDuplicates = 0;
    
    Object.keys(itemsByName).forEach(name => {
      if (itemsByName[name].length > 1) {
        duplicates[name] = itemsByName[name];
        totalDuplicates += itemsByName[name].length - 1; // -1 because we keep one
      }
    });
    
    console.log(`\n🔴 Found ${Object.keys(duplicates).length} items with duplicates`);
    console.log(`🗑️ Total duplicate items to remove: ${totalDuplicates}`);
    
    if (Object.keys(duplicates).length > 0) {
      console.log('\n📋 DUPLICATE ITEMS:');
      console.log('-'.repeat(60));
      
      Object.keys(duplicates).forEach(name => {
        const items = duplicates[name];
        console.log(`\n📦 ${name} (${items.length} copies):`);
        items.forEach((item, index) => {
          const created = new Date(item.created_at).toLocaleString();
          console.log(`  ${index + 1}. ID: ${item.id} | Created: ${created} | Qty: ${item.current_quantity}`);
        });
      });
      
      console.log('\n🎯 RECOMMENDED ACTION:');
      console.log('We should keep the FIRST (oldest) copy of each item and delete the rest.');
      console.log('This will preserve the original item with its transaction history.');
    } else {
      console.log('\n✅ No duplicates found! Your inventory is clean.');
    }
    
  } catch (error) {
    console.error('💥 Error during analysis:', error);
  }
}

findDuplicates();
