-- Reset inventory quantities to create realistic stock level scenarios
-- This keeps all your current items but adjusts quantities for testing
-- Run this in your Supabase SQL editor

-- Update inventory quantities to create a realistic mix of stock levels
UPDATE inventory_items SET 
  current_quantity = CASE 
    -- CRITICALLY LOW STOCK (below minimum)
    WHEN name = 'Chef Knives' THEN 2  -- minimum is probably 5, so this is critical
    WHEN name = 'Chicken Breast' THEN 8  -- if minimum is 15, this is very low
    WHEN name = 'Ground Beef 80/20' THEN 5  -- likely below minimum
    WHEN name = 'Fresh Basil' THEN 3  -- perishable and low
    
    -- MEDIUM STOCK (between minimum and optimal)
    WHEN name = 'Organic Tomatoes' THEN 25  -- decent but not excessive
    WHEN name = 'Paper Towels' THEN 12  -- moderate supply
    WHEN name = 'Napkins' THEN 150  -- reasonable restaurant stock
    WHEN name = 'Cleaning Spray' THEN 8  -- medium supply
    
    -- WELL STOCKED (at or above optimal levels)
    WHEN name ILIKE '%cheese%' THEN 45  -- good cheese stock
    WHEN name ILIKE '%olive oil%' THEN 18  -- well stocked
    WHEN name ILIKE '%flour%' THEN 80  -- plenty for baking
    WHEN name ILIKE '%rice%' THEN 60  -- bulk item, well stocked
    WHEN name ILIKE '%pasta%' THEN 55  -- good pasta inventory
    
    -- DEFAULT: Set reasonable quantities for any other items
    ELSE CASE 
      WHEN unit = 'lbs' THEN FLOOR(minimum_quantity * 1.5)  -- 50% above minimum
      WHEN unit = 'pieces' OR unit = 'units' THEN FLOOR(minimum_quantity * 2)  -- double minimum
      WHEN unit = 'gallons' THEN FLOOR(minimum_quantity * 1.8)  -- 80% above minimum
      WHEN unit = 'packages' THEN FLOOR(minimum_quantity * 1.6)  -- 60% above minimum
      ELSE FLOOR(minimum_quantity * 1.5)  -- default 50% above minimum
    END
  END,
  updated_at = NOW()
WHERE is_active = true;

-- Add some realistic transaction history to make the data more interesting
-- Recent usage transactions (last 7 days)
INSERT INTO inventory_transactions (item_id, transaction_type, quantity, reason, performed_by)
SELECT 
  id,
  'out',  -- 'out' represents consumption/usage
  CASE 
    WHEN name = 'Chicken Breast' THEN -12  -- heavy usage
    WHEN name = 'Ground Beef 80/20' THEN -8  -- moderate usage
    WHEN name = 'Fresh Basil' THEN -5  -- used for dishes
    WHEN name = 'Organic Tomatoes' THEN -10  -- regular usage
    WHEN name = 'Chef Knives' THEN -1  -- one lost/damaged
    WHEN name = 'Paper Towels' THEN -6  -- regular cleaning
    WHEN name = 'Napkins' THEN -50  -- customer usage
    ELSE FLOOR(current_quantity * -0.1)  -- 10% usage for others
  END,
  CASE 
    WHEN name = 'Chicken Breast' THEN 'High dinner service demand'
    WHEN name = 'Ground Beef 80/20' THEN 'Burger special promotions'
    WHEN name = 'Fresh Basil' THEN 'Pasta and pizza preparations'
    WHEN name = 'Organic Tomatoes' THEN 'Salads and sauce preparations'
    WHEN name = 'Chef Knives' THEN 'Equipment loss - needs replacement'
    WHEN name = 'Paper Towels' THEN 'Kitchen cleaning and prep'
    WHEN name = 'Napkins' THEN 'Customer service during busy weekend'
    ELSE 'Regular kitchen operations'
  END,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)  -- Use first admin as performer
FROM inventory_items 
WHERE is_active = true;

-- Update transaction dates to be recent (last 1-3 days)
UPDATE inventory_transactions 
SET transaction_date = NOW() - (RANDOM() * INTERVAL '3 days')
WHERE transaction_date > NOW() - INTERVAL '1 hour';  -- Only update very recent ones

-- Verify the results
SELECT 
  name,
  current_quantity,
  minimum_quantity,
  maximum_quantity,
  unit,
  stock_status,
  CASE 
    WHEN current_quantity <= minimum_quantity THEN '🔴 CRITICAL'
    WHEN current_quantity <= minimum_quantity * 1.5 THEN '🟡 LOW'
    WHEN current_quantity >= COALESCE(maximum_quantity, minimum_quantity * 3) THEN '🟢 EXCELLENT'
    ELSE '🔵 GOOD'
  END as visual_status,
  ROUND((current_quantity::decimal / NULLIF(minimum_quantity, 0)) * 100, 1) as stock_percentage
FROM inventory_overview 
ORDER BY 
  CASE stock_status 
    WHEN 'low' THEN 1 
    WHEN 'normal' THEN 2 
    WHEN 'recently_reordered' THEN 3
    WHEN 'overstocked' THEN 4 
  END,
  current_quantity::decimal / NULLIF(minimum_quantity, 0);

-- Show summary of stock levels
SELECT 
  stock_status,
  COUNT(*) as item_count,
  ROUND(AVG(current_quantity), 1) as avg_quantity,
  STRING_AGG(name, ', ' ORDER BY name) as items
FROM inventory_overview 
GROUP BY stock_status
ORDER BY 
  CASE stock_status 
    WHEN 'low' THEN 1 
    WHEN 'normal' THEN 2 
    WHEN 'recently_reordered' THEN 3
    WHEN 'overstocked' THEN 4 
  END;
