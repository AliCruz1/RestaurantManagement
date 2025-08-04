-- Fix chicken tenders quantity logic
-- This script will fix the illogical maximum/minimum quantities

-- First, let's see the current state of chicken tenders
SELECT 
    name,
    current_quantity,
    minimum_quantity,
    maximum_quantity,
    unit
FROM inventory_items 
WHERE name ILIKE '%chicken%tender%';

-- Fix the maximum quantity for chicken tenders to be logical
-- If current is 300 and minimum is 1, maximum should be at least 350-400
UPDATE inventory_items 
SET 
    maximum_quantity = GREATEST(
        current_quantity * 1.2,  -- 20% above current (360 for 300)
        minimum_quantity * 5     -- At least 5x minimum
    ),
    updated_at = NOW()
WHERE name ILIKE '%chicken%tender%'
  AND (maximum_quantity IS NULL OR maximum_quantity < current_quantity);

-- Also fix any other items where maximum < current
UPDATE inventory_items 
SET 
    maximum_quantity = current_quantity * 1.5,  -- 50% buffer above current
    updated_at = NOW()
WHERE maximum_quantity IS NOT NULL 
  AND maximum_quantity < current_quantity;

-- Check the results
SELECT 
    name,
    current_quantity,
    minimum_quantity,
    maximum_quantity,
    unit,
    CASE 
        WHEN maximum_quantity IS NULL THEN 'No Max Set'
        WHEN maximum_quantity < current_quantity THEN '❌ Logic Error'
        WHEN minimum_quantity > maximum_quantity THEN '❌ Min > Max'
        ELSE '✅ Valid'
    END as status
FROM inventory_items 
WHERE is_active = true
ORDER BY name;
