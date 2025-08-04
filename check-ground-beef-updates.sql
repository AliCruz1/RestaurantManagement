-- Check the specific Ground Beef item that had waste prevention applied
SELECT id, name, minimum_quantity, current_quantity, maximum_quantity, updated_at, last_updated
FROM inventory_items 
WHERE id = '868c7a9f-95df-4d49-b29c-227c34cb48b4';

-- Also check if there were any recent updates to this item
SELECT id, name, minimum_quantity, current_quantity, updated_at
FROM inventory_items 
WHERE id = '868c7a9f-95df-4d49-b29c-227c34cb48b4'
AND updated_at > '2025-08-01 19:00:00';
