-- Database Schema Verification
-- Check if our columns exist

-- Check inventory_items columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inventory_items' 
AND column_name IN ('last_updated', 'min_quantity', 'minimum_quantity', 'current_quantity');

-- Check inventory_transactions columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inventory_transactions' 
AND column_name IN ('supplier_id', 'unit_price', 'total_cost');

-- Check ai_actions_log table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'ai_actions_log';

-- Check suppliers table
SELECT COUNT(*) as supplier_count 
FROM suppliers 
WHERE name = 'Auto-Order System';
