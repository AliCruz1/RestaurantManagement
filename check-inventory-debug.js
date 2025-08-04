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

async function debugInventory() {
  console.log('🔍 INVENTORY DEBUG REPORT');
  console.log('='.repeat(50));
  
  try {
    // 1. Check if inventory tables exist
    console.log('\n📊 1. CHECKING TABLE EXISTENCE:');
    
    // Check inventory_items table
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('count(*)')
      .limit(1);
      
    if (itemsError) {
      console.log('❌ inventory_items table error:', itemsError.message);
    } else {
      console.log('✅ inventory_items table exists');
    }
    
    // Check inventory_overview view
    const { data: overview, error: overviewError } = await supabase
      .from('inventory_overview')
      .select('count(*)')
      .limit(1);
      
    if (overviewError) {
      console.log('❌ inventory_overview view error:', overviewError.message);
    } else {
      console.log('✅ inventory_overview view exists');
    }
    
    // Check inventory_categories table
    const { data: categories, error: catError } = await supabase
      .from('inventory_categories')
      .select('count(*)')
      .limit(1);
      
    if (catError) {
      console.log('❌ inventory_categories table error:', catError.message);
    } else {
      console.log('✅ inventory_categories table exists');
    }
    
    // 2. Check actual data counts
    console.log('\n📈 2. DATA COUNTS:');
    
    const { data: itemsData, error: itemsDataError } = await supabase
      .from('inventory_items')
      .select('*');
      
    if (itemsDataError) {
      console.log('❌ Error fetching inventory_items:', itemsDataError.message);
    } else {
      console.log(`📦 inventory_items: ${itemsData?.length || 0} items`);
      
      if (itemsData && itemsData.length > 0) {
        console.log('\n🔍 Sample inventory items:');
        itemsData.slice(0, 5).forEach((item, i) => {
          console.log(`${i + 1}. ${item.name} - Qty: ${item.current_quantity} ${item.unit} (Min: ${item.minimum_quantity})`);
        });
      }
    }
    
    // 3. Check the overview view specifically
    console.log('\n📊 3. CHECKING OVERVIEW VIEW:');
    
    const { data: overviewData, error: overviewDataError } = await supabase
      .from('inventory_overview')
      .select('*');
      
    if (overviewDataError) {
      console.log('❌ Error fetching inventory_overview:', overviewDataError.message);
    } else {
      console.log(`📊 inventory_overview: ${overviewData?.length || 0} items`);
      
      if (overviewData && overviewData.length > 0) {
        console.log('\n🔍 Sample overview data:');
        overviewData.slice(0, 5).forEach((item, i) => {
          console.log(`${i + 1}. ${item.name} - Status: ${item.stock_status} - Value: $${item.total_value}`);
        });
      }
    }
    
    // 4. Check categories
    console.log('\n📁 4. CATEGORIES:');
    
    const { data: categoriesData, error: categoriesDataError } = await supabase
      .from('inventory_categories')
      .select('*');
      
    if (categoriesDataError) {
      console.log('❌ Error fetching categories:', categoriesDataError.message);
    } else {
      console.log(`📂 inventory_categories: ${categoriesData?.length || 0} categories`);
      
      if (categoriesData && categoriesData.length > 0) {
        console.log('\n🏷️ Available categories:');
        categoriesData.forEach((cat, i) => {
          console.log(`${i + 1}. ${cat.name} (${cat.color})`);
        });
      }
    }
    
    // 5. Check if the reset script worked
    console.log('\n🔄 5. CHECKING RESET SCRIPT RESULTS:');
    
    const { data: lowStockItems, error: lowStockError } = await supabase
      .from('inventory_items')
      .select('name, current_quantity, minimum_quantity')
      .lte('current_quantity', supabase.sql`minimum_quantity`);
      
    if (lowStockError) {
      console.log('❌ Error checking low stock:', lowStockError.message);
    } else {
      console.log(`🔴 Low stock items: ${lowStockItems?.length || 0}`);
      
      if (lowStockItems && lowStockItems.length > 0) {
        console.log('\n⚠️ Items with critically low stock:');
        lowStockItems.forEach((item, i) => {
          console.log(`${i + 1}. ${item.name}: ${item.current_quantity}/${item.minimum_quantity}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Error during debug:', error);
  }
}

debugInventory();
