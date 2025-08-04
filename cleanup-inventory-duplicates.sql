-- INVENTORY DUPLICATE CLEANUP SCRIPT
-- This script will safely remove duplicate inventory items
-- It keeps the OLDEST (first created) copy of each item and removes the rest

-- STEP 1: Show current duplicates before cleanup
SELECT 
  'BEFORE CLEANUP - Duplicate Analysis' as status,
  name,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ' ORDER BY created_at) as all_ids,
  MIN(created_at) as oldest_created,
  MAX(created_at) as newest_created
FROM inventory_items 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, name;

-- STEP 2: Show total counts before cleanup
SELECT 
  'BEFORE CLEANUP - Total Counts' as status,
  COUNT(*) as total_items,
  COUNT(DISTINCT name) as unique_items,
  COUNT(*) - COUNT(DISTINCT name) as duplicates_to_remove
FROM inventory_items;

-- STEP 3: Delete duplicate inventory items (keep the oldest one)
-- This uses a CTE to identify which items to delete
WITH duplicates_to_delete AS (
  SELECT 
    id,
    name,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as row_num
  FROM inventory_items
),
items_to_delete AS (
  SELECT id, name, created_at
  FROM duplicates_to_delete 
  WHERE row_num > 1  -- Keep row_num = 1 (the oldest), delete the rest
)
DELETE FROM inventory_items 
WHERE id IN (SELECT id FROM items_to_delete);

-- STEP 4: Show results after cleanup
SELECT 
  'AFTER CLEANUP - Total Counts' as status,
  COUNT(*) as total_items,
  COUNT(DISTINCT name) as unique_items,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT name) THEN 'NO DUPLICATES ✅'
    ELSE 'STILL HAS DUPLICATES ❌'
  END as cleanup_status
FROM inventory_items;

-- STEP 5: Show any remaining duplicates (should be none)
SELECT 
  'AFTER CLEANUP - Remaining Duplicates' as status,
  name,
  COUNT(*) as duplicate_count
FROM inventory_items 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, name;

-- STEP 6: Show final inventory summary
SELECT 
  'FINAL INVENTORY SUMMARY' as status,
  name,
  current_quantity,
  unit,
  stock_status,
  CASE 
    WHEN current_quantity <= minimum_quantity THEN '🔴 CRITICAL'
    WHEN current_quantity <= minimum_quantity * 1.5 THEN '🟡 LOW'
    WHEN current_quantity >= COALESCE(maximum_quantity, minimum_quantity * 3) THEN '🟢 EXCELLENT'
    ELSE '🔵 GOOD'
  END as visual_status
FROM inventory_overview
ORDER BY 
  CASE stock_status 
    WHEN 'low' THEN 1 
    WHEN 'normal' THEN 2 
    WHEN 'recently_reordered' THEN 3
    WHEN 'overstocked' THEN 4 
  END,
  name;
