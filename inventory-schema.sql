-- Inventory Management Database Schema
-- Run this SQL in your Supabase SQL editor

-- 1. Inventory Categories Table
CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1', -- hex color for UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  unit VARCHAR(50) NOT NULL, -- e.g., 'kg', 'lbs', 'pieces', 'liters'
  current_quantity DECIMAL(10,2) DEFAULT 0,
  minimum_quantity DECIMAL(10,2) DEFAULT 0, -- reorder level
  maximum_quantity DECIMAL(10,2), -- optional max stock level
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  expiration_days INTEGER, -- days until expiration (for perishables)
  storage_location VARCHAR(255),
  barcode VARCHAR(255),
  sku VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inventory Transactions Table (for tracking all movements)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment', 'waste', 'transfer')),
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  reason VARCHAR(255),
  reference_id VARCHAR(255), -- for linking to orders, recipes, etc.
  performed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AI Predictions Table (for Gemini AI insights)
CREATE TABLE IF NOT EXISTS inventory_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  prediction_type VARCHAR(50) NOT NULL, -- 'reorder_suggestion', 'demand_forecast', 'waste_alert'
  predicted_value DECIMAL(10,2),
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  prediction_data JSONB, -- store additional AI analysis data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE -- when this prediction becomes stale
);

-- 6. Insert Default Categories
INSERT INTO inventory_categories (name, description, color) VALUES
  ('Food Ingredients', 'Fresh ingredients and food items', '#10b981'),
  ('Beverages', 'Drinks, alcohol, and beverage supplies', '#3b82f6'),
  ('Cleaning Supplies', 'Cleaning products and sanitation items', '#f59e0b'),
  ('Kitchen Equipment', 'Cookware, utensils, and kitchen tools', '#8b5cf6'),
  ('Paper Products', 'Napkins, receipts, packaging materials', '#6b7280'),
  ('Office Supplies', 'Administrative and office materials', '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- 7. Create RLS Policies (Row Level Security)
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_predictions ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (you can adjust based on your auth setup)
CREATE POLICY "Admin can do everything on inventory_categories" ON inventory_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can do everything on suppliers" ON suppliers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can do everything on inventory_items" ON inventory_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can do everything on inventory_transactions" ON inventory_transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can do everything on inventory_predictions" ON inventory_predictions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 8. Create useful views
CREATE OR REPLACE VIEW inventory_overview AS
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
    
    -- Traditional overstocked check
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

-- 9. Create functions for common operations
CREATE OR REPLACE FUNCTION update_inventory_quantity(
  item_uuid UUID,
  quantity_change DECIMAL(10,2),
  transaction_type_param VARCHAR(20),
  reason_param VARCHAR(255) DEFAULT NULL,
  unit_cost_param DECIMAL(10,2) DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Insert transaction record
  INSERT INTO inventory_transactions (
    item_id, 
    transaction_type, 
    quantity, 
    unit_cost, 
    reason, 
    performed_by
  ) VALUES (
    item_uuid, 
    transaction_type_param, 
    quantity_change, 
    unit_cost_param, 
    reason_param, 
    auth.uid()
  );
  
  -- Update item quantity
  UPDATE inventory_items 
  SET 
    current_quantity = current_quantity + quantity_change,
    updated_at = NOW()
  WHERE id = item_uuid;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
