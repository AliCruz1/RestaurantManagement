-- AI ACTIONS DATABASE FIX
-- COPY ONLY THE CODE BELOW AND PASTE INTO SUPABASE SQL EDITOR

-- Add missing columns to inventory_items if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_items' AND column_name = 'last_updated') THEN
        ALTER TABLE inventory_items ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Update inventory_transactions table to include missing columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_transactions' AND column_name = 'supplier_id') THEN
        ALTER TABLE inventory_transactions ADD COLUMN supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
    END IF;

    ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;
    ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_transaction_type_check 
        CHECK (transaction_type IN ('in', 'out', 'adjustment', 'waste', 'transfer', 'purchase'));

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_transactions' AND column_name = 'unit_price') THEN
        ALTER TABLE inventory_transactions ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0;
    END IF;

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
-- First check if supplier already exists, then insert if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Auto-Order System') THEN
        INSERT INTO suppliers (name, contact_person, email, is_active) VALUES
            ('Auto-Order System', 'AI Assistant', 'auto-orders@system.local', true);
    END IF;
END $$;
