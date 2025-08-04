-- Improved Stock Status Logic
-- This considers AI recommendations and recent reorder actions

CREATE OR REPLACE VIEW inventory_overview AS
SELECT 
  i.*,
  c.name as category_name,
  c.color as category_color,
  s.name as supplier_name,
  
  -- Improved stock status logic
  CASE 
    -- Low stock check (unchanged)
    WHEN i.current_quantity <= i.minimum_quantity THEN 'low'
    
    -- Smart overstocked check
    WHEN i.maximum_quantity IS NOT NULL 
         AND i.current_quantity > (i.maximum_quantity * 1.2) -- 20% buffer
         AND NOT EXISTS (
           -- Check if there was a recent AI reorder in the last 7 days
           SELECT 1 FROM ai_actions_log a 
           WHERE a.item_id = i.id 
             AND a.action_type = 'auto_reorder'
             AND a.executed_at > NOW() - INTERVAL '7 days'
         ) 
    THEN 'overstocked'
    
    -- Normal for everything else
    ELSE 'normal'
  END as stock_status,
  
  (i.current_quantity * i.cost_per_unit) as total_value
FROM inventory_items i
LEFT JOIN inventory_categories c ON i.category_id = c.id
LEFT JOIN suppliers s ON i.supplier_id = s.id
WHERE i.is_active = true;

-- Alternative: Add a "recently_reordered" status
CREATE OR REPLACE VIEW inventory_overview_v2 AS
SELECT 
  i.*,
  c.name as category_name,
  c.color as category_color,
  s.name as supplier_name,
  
  CASE 
    WHEN i.current_quantity <= i.minimum_quantity THEN 'low'
    
    -- Check for recent AI reorder
    WHEN EXISTS (
      SELECT 1 FROM ai_actions_log a 
      WHERE a.item_id = i.id 
        AND a.action_type = 'auto_reorder'
        AND a.executed_at > NOW() - INTERVAL '3 days'
    ) THEN 'recently_reordered'
    
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
