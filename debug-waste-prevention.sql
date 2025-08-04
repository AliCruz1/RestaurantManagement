-- Check if Ground Beef was actually updated
SELECT name, minimum_quantity, current_quantity, updated_at, last_updated
FROM inventory_items 
WHERE id = '868c7a9f-95df-4d49-b29c-227c34cb48b4';

-- Check if old waste predictions were cleared
SELECT prediction_type, item_id, prediction_data, created_at, expires_at
FROM inventory_predictions 
WHERE item_id = '868c7a9f-95df-4d49-b29c-227c34cb48b4'
AND prediction_type = 'waste_alert'
ORDER BY created_at DESC;

-- Check recent AI actions for this item
SELECT action_type, action_data, executed_at
FROM ai_actions_log 
WHERE item_id = '868c7a9f-95df-4d49-b29c-227c34cb48b4'
AND action_type = 'waste_prevention'
ORDER BY executed_at DESC
LIMIT 3;
