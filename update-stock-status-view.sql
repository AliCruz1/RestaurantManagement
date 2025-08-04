-- Update inventory_overview view to include 'recently_reordered' status
-- Run this in your Supabase SQL editor

-- First, drop the existing view to avoid column conflicts
DROP VIEW IF EXISTS inventory_overview;

-- Now create the updated view with the new status logic
CREATE VIEW inventory_overview AS
SELECT 
  i.*,
  c.name as category_name,
  c.color as category_color,
  s.name as supplier_name,
  CASE 
    -- Low stock check
    WHEN i.current_quantity <= i.minimum_quantity THEN 'low'
    
    -- Check for recent AI reorder (within 3 days)
    WHEN EXISTS (
      SELECT 1 FROM ai_actions_log a 
      WHERE a.item_id = i.id 
        AND a.action_type = 'auto_reorder'
        AND a.executed_at > NOW() - INTERVAL '3 days'
    ) THEN 'recently_reordered'
    
    -- Traditional overstocked check (only triggers if not recently reordered)
    WHEN i.maximum_quantity IS NOT NULL 
         AND i.current_quantity >= i.maximum_quantity 
    THEN 'overstocked'
    
    ELSE 'normal'
  END as stock_status,
  (i.current_quantity * i.cost_per_unit) as total_value
FROM inventory_items i
LEFT JOIN inventory_categories c ON i.category_id = c.id
LEFT JOIN suppliers s ON i.supplier_id = s.id
WHERE i.is_active = true;

-- Verify the update worked
SELECT 
  name,
  current_quantity,
  minimum_quantity,
  maximum_quantity,
  stock_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM ai_actions_log a 
      WHERE a.item_id = inventory_overview.id 
        AND a.action_type = 'auto_reorder'
        AND a.executed_at > NOW() - INTERVAL '3 days'
    ) THEN 'Has recent AI reorder'
    ELSE 'No recent AI reorder'
  END as ai_reorder_status
FROM inventory_overview 
ORDER BY stock_status, name;
