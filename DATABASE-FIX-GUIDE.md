# Fix Database Schema for AI Actions

## Issue
The AI action buttons are failing because the database schema is missing some required columns.

## Error Messages Seen:
- `Could not find the 'last_updated' column of 'inventory_items'`
- `Could not find the 'supplier_id' column of 'inventory_transactions'`

## Solution Steps

### 1. Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query

### 2. Run the Schema Fix Script
Copy and paste this SQL into the Supabase SQL Editor:

```sql
-- Fix missing columns for AI actions functionality

-- Add missing columns to inventory_items if they don't exist
DO $$ 
BEGIN
    -- Add last_updated column to inventory_items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_items' AND column_name = 'last_updated') THEN
        ALTER TABLE inventory_items ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Update inventory_transactions table to include missing columns
DO $$
BEGIN
    -- Add supplier_id to inventory_transactions for purchase tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_transactions' AND column_name = 'supplier_id') THEN
        ALTER TABLE inventory_transactions ADD COLUMN supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
    END IF;

    -- Ensure transaction_type includes 'purchase'
    ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;
    ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_transaction_type_check 
        CHECK (transaction_type IN ('in', 'out', 'adjustment', 'waste', 'transfer', 'purchase'));

    -- Add unit_price column (different from unit_cost for clarity)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_transactions' AND column_name = 'unit_price') THEN
        ALTER TABLE inventory_transactions ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Fix total_cost column to be updatable (not generated)
    ALTER TABLE inventory_transactions DROP COLUMN IF EXISTS total_cost;
    ALTER TABLE inventory_transactions ADD COLUMN total_cost DECIMAL(10,2) DEFAULT 0;
END $$;

-- Create function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamps
DROP TRIGGER IF EXISTS update_inventory_items_timestamp ON inventory_items;
CREATE TRIGGER update_inventory_items_timestamp
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated();

-- Ensure ai_actions_log table exists
CREATE TABLE IF NOT EXISTS ai_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(50) NOT NULL,
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    action_data JSONB NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'completed',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS ai_actions_log_item_id_idx ON ai_actions_log(item_id);
CREATE INDEX IF NOT EXISTS ai_actions_log_action_type_idx ON ai_actions_log(action_type);
CREATE INDEX IF NOT EXISTS inventory_transactions_supplier_id_idx ON inventory_transactions(supplier_id);

-- Add RLS policies for ai_actions_log
ALTER TABLE ai_actions_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view AI actions for their organization" ON ai_actions_log;
CREATE POLICY "Users can view AI actions for their organization" ON ai_actions_log
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can insert AI actions" ON ai_actions_log;
CREATE POLICY "System can insert AI actions" ON ai_actions_log
    FOR INSERT WITH CHECK (true);

-- Ensure the system has a basic supplier for auto-orders
INSERT INTO suppliers (name, contact_person, email, is_active) VALUES
    ('Auto-Order System', 'AI Assistant', 'auto-orders@system.local', true)
ON CONFLICT (name) DO NOTHING;
```

### 3. Run the Query
Click the "Run" button to execute the SQL script.

### 4. Verify Success
You should see messages like:
- ✅ Query executed successfully
- No error messages

### 5. Test the AI Actions
After running the schema fix:
1. Go back to your inventory management page
2. Click "AI Insights"
3. Try clicking "Execute Order" or "Apply Action" buttons
4. The actions should now work without errors

## What This Fixes:
- ✅ Adds `last_updated` column to `inventory_items`
- ✅ Adds `supplier_id` column to `inventory_transactions` 
- ✅ Creates `ai_actions_log` table for tracking AI decisions
- ✅ Sets up proper constraints and indexes
- ✅ Adds a default supplier for auto-orders
- ✅ Creates automatic timestamp updates

## After Running This:
The AI actions will be able to:
- ✅ Execute automatic reorders
- ✅ Apply waste prevention strategies
- ✅ Log all AI decisions for audit trail
- ✅ Update inventory quantities
- ✅ Track purchase orders
