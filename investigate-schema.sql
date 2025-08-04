-- Check ALL columns in inventory_items table (including schema)
SELECT table_schema, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'inventory_items';

-- Check ALL columns in inventory_transactions table (including schema)
SELECT table_schema, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'inventory_transactions';

-- Direct query to see actual data structure
SELECT * FROM inventory_items LIMIT 1;

-- Direct query to see actual data structure  
SELECT * FROM inventory_transactions LIMIT 1;
