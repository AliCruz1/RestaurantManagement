-- Check inventory_items table structure and sample data
SELECT * FROM inventory_items LIMIT 3;

-- Check specific columns we need
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'inventory_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;
