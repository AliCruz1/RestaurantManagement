-- Check ALL columns in inventory_items table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'inventory_items'
ORDER BY ordinal_position;

-- Check ALL columns in inventory_transactions table  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'inventory_transactions'
ORDER BY ordinal_position;

-- Check if tables exist at all
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('inventory_items', 'inventory_transactions', 'ai_actions_log')
ORDER BY table_name;
