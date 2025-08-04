-- Let's see what the minimum_quantity was BEFORE the waste prevention action
-- Check if there are any audit logs or if we can see the calculation

-- First, let's verify the math: current_quantity * 0.7
SELECT 
  name,
  current_quantity,
  minimum_quantity,
  FLOOR(current_quantity * 0.7) as calculated_new_minimum,
  GREATEST(1, FLOOR(current_quantity * 0.7)) as math_max_result,
  (minimum_quantity = GREATEST(1, FLOOR(current_quantity * 0.7))) as matches_calculation
FROM inventory_items 
WHERE id = '868c7a9f-95df-4d49-b29c-227c34cb48b4';
5