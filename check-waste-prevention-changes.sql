-- Check what the waste prevention action actually changed for Ground Beef
-- First, let's find the Ground Beef item
SELECT id, name, minimum_quantity, current_quantity, updated_at 
FROM inventory_items 
WHERE name LIKE '%Ground Beef%' OR name LIKE '%ground beef%';

-- Check the AI actions log to see what was recorded
SELECT action_type, action_data, executed_at, item_id
FROM ai_actions_log 
WHERE action_type = 'waste_prevention'
ORDER BY executed_at DESC
LIMIT 5;

-- Check recent inventory transactions that might be related
SELECT item_id, transaction_type, quantity, reason, transaction_date
FROM inventory_transactions 
WHERE reason LIKE '%waste%' OR reason LIKE '%Waste%'
ORDER BY transaction_date DESC
LIMIT 5;
