-- Create AI Actions Log table for tracking automated AI decisions
CREATE TABLE IF NOT EXISTS ai_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(50) NOT NULL, -- 'auto_reorder', 'waste_prevention', 'cost_optimization'
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    action_data JSONB NOT NULL, -- Store the action details and parameters
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'failed', 'pending'
    error_message TEXT, -- Store any error details if action failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS ai_actions_log_item_id_idx ON ai_actions_log(item_id);
CREATE INDEX IF NOT EXISTS ai_actions_log_action_type_idx ON ai_actions_log(action_type);
CREATE INDEX IF NOT EXISTS ai_actions_log_executed_at_idx ON ai_actions_log(executed_at);

-- Add RLS policies
ALTER TABLE ai_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI actions for their organization" ON ai_actions_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inventory_items ii
            WHERE ii.id = ai_actions_log.item_id
            AND ii.organization_id = auth.uid()
        )
    );

CREATE POLICY "System can insert AI actions" ON ai_actions_log
    FOR INSERT WITH CHECK (true);

-- Sample data to show AI action tracking
INSERT INTO ai_actions_log (action_type, item_id, action_data) VALUES
(
    'auto_reorder',
    (SELECT id FROM inventory_items WHERE name = 'Fresh Basil' LIMIT 1),
    '{
        "original_quantity": 8,
        "ordered_quantity": 17,
        "new_quantity": 25,
        "reasoning": "Current quantity is below minimum threshold. Based on usage patterns, ordering 17 units will prevent stockout.",
        "urgency": "medium",
        "estimated_days_until_stockout": 3
    }'
),
(
    'waste_prevention',
    (SELECT id FROM inventory_items WHERE name = 'Ground Beef 80/20' LIMIT 1),
    '{
        "potential_waste_amount": 10,
        "action_taken": "Reduced minimum stock level to 15 units",
        "risk_reason": "High initial stock level and short expiration date increase risk of spoilage",
        "action_recommended": "Reduce order quantity or adjust portion sizes"
    }'
);
