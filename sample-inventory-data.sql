-- Sample Inventory Data for Testing
-- Run this after you've run the main inventory schema

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address, notes) VALUES
  ('Fresh Farm Produce', 'John Smith', 'orders@freshfarm.com', '555-0101', '123 Farm Road, Country Town', 'Local organic produce supplier'),
  ('Metro Food Service', 'Sarah Johnson', 'supply@metrofood.com', '555-0102', '456 Industrial Blvd, Metro City', 'Bulk food and beverage supplier'),
  ('Kitchen Pro Equipment', 'Mike Wilson', 'sales@kitchenpro.com', '555-0103', '789 Equipment Ave, Business District', 'Restaurant equipment and supplies'),
  ('Clean Solutions Inc', 'Lisa Davis', 'orders@cleansolutions.com', '555-0104', '321 Service St, Clean City', 'Cleaning and sanitation supplies')
ON CONFLICT DO NOTHING;

-- Get supplier IDs for use in inventory items
WITH supplier_ids AS (
  SELECT 
    id,
    name,
    ROW_NUMBER() OVER (ORDER BY name) as rn
  FROM suppliers
  WHERE name IN ('Fresh Farm Produce', 'Metro Food Service', 'Kitchen Pro Equipment', 'Clean Solutions Inc')
),
category_ids AS (
  SELECT 
    id,
    name,
    ROW_NUMBER() OVER (ORDER BY name) as rn
  FROM inventory_categories
)

-- Insert sample inventory items
INSERT INTO inventory_items (
  name, description, category_id, supplier_id, unit, current_quantity, 
  minimum_quantity, maximum_quantity, cost_per_unit, expiration_days, 
  storage_location, sku
)
SELECT 
  item_data.name,
  item_data.description,
  cat.id,
  sup.id,
  item_data.unit,
  item_data.current_quantity,
  item_data.minimum_quantity,
  item_data.maximum_quantity,
  item_data.cost_per_unit,
  item_data.expiration_days,
  item_data.storage_location,
  item_data.sku
FROM (
  VALUES 
    -- Food Ingredients
    ('Organic Tomatoes', 'Fresh organic tomatoes for salads and cooking', 'Food Ingredients', 'Fresh Farm Produce', 'lbs', 45.5, 20.0, 100.0, 3.50, 7, 'Walk-in Cooler A', 'FF-TOM-001'),
    ('Ground Beef 80/20', 'Fresh ground beef for burgers and dishes', 'Food Ingredients', 'Metro Food Service', 'lbs', 25.0, 15.0, 60.0, 8.99, 3, 'Walk-in Freezer', 'MF-BEEF-002'),
    ('Chicken Breast', 'Boneless skinless chicken breast', 'Food Ingredients', 'Metro Food Service', 'lbs', 18.0, 12.0, 50.0, 12.50, 4, 'Walk-in Freezer', 'MF-CHIK-003'),
    ('Fresh Basil', 'Organic fresh basil leaves', 'Food Ingredients', 'Fresh Farm Produce', 'bunches', 8, 5, 20, 2.25, 5, 'Herb Cooler', 'FF-BASIL-004'),
    ('Olive Oil Extra Virgin', 'Premium extra virgin olive oil', 'Food Ingredients', 'Metro Food Service', 'bottles', 12, 6, 24, 18.99, 730, 'Dry Storage A', 'MF-OIL-005'),
    
    -- Beverages
    ('Coffee Beans', 'Premium Arabica coffee beans', 'Beverages', 'Metro Food Service', 'lbs', 15.5, 8.0, 40.0, 15.75, 180, 'Dry Storage B', 'MF-COFFEE-006'),
    ('Coca Cola Syrup', 'Fountain drink syrup concentrate', 'Beverages', 'Metro Food Service', 'boxes', 4, 2, 12, 85.00, 365, 'Beverage Storage', 'MF-COLA-007'),
    ('Orange Juice', 'Fresh squeezed orange juice', 'Beverages', 'Fresh Farm Produce', 'gallons', 6.5, 4.0, 15.0, 8.50, 7, 'Beverage Cooler', 'FF-OJ-008'),
    
    -- Cleaning Supplies
    ('Disinfectant Spray', 'Multi-surface disinfectant spray', 'Cleaning Supplies', 'Clean Solutions Inc', 'bottles', 24, 12, 48, 4.99, 1095, 'Cleaning Closet', 'CS-DISF-009'),
    ('Paper Towels', 'Heavy duty paper towels', 'Cleaning Supplies', 'Clean Solutions Inc', 'rolls', 36, 20, 72, 1.85, NULL, 'Cleaning Closet', 'CS-TOWEL-010'),
    ('Dish Soap', 'Commercial grade dish soap', 'Cleaning Supplies', 'Clean Solutions Inc', 'gallons', 8, 4, 16, 12.50, 365, 'Cleaning Closet', 'CS-SOAP-011'),
    
    -- Kitchen Equipment
    ('Chef Knives', 'Professional chef knives set', 'Kitchen Equipment', 'Kitchen Pro Equipment', 'sets', 3, 2, 6, 189.99, NULL, 'Equipment Storage', 'KP-KNIFE-012'),
    ('Cutting Boards', 'NSF approved cutting boards', 'Kitchen Equipment', 'Kitchen Pro Equipment', 'pieces', 12, 8, 20, 24.99, NULL, 'Equipment Storage', 'KP-BOARD-013'),
    ('Aluminum Foil', 'Heavy duty aluminum foil rolls', 'Kitchen Equipment', 'Kitchen Pro Equipment', 'rolls', 6, 3, 12, 8.75, NULL, 'Equipment Storage', 'KP-FOIL-014'),
    
    -- Paper Products
    ('Napkins', 'High quality dinner napkins', 'Paper Products', 'Metro Food Service', 'packages', 45, 25, 100, 3.25, NULL, 'Paper Storage', 'MF-NAP-015'),
    ('Receipt Paper', 'Thermal receipt paper rolls', 'Paper Products', 'Kitchen Pro Equipment', 'rolls', 18, 10, 36, 2.50, NULL, 'Office Area', 'KP-RCPT-016'),
    ('To-Go Containers', 'Eco-friendly takeout containers', 'Paper Products', 'Metro Food Service', 'cases', 8, 5, 20, 22.50, NULL, 'Paper Storage', 'MF-CONT-017'),
    
    -- Office Supplies
    ('Printer Paper', 'Standard 8.5x11 printer paper', 'Office Supplies', 'Kitchen Pro Equipment', 'reams', 12, 6, 24, 4.99, NULL, 'Office Area', 'KP-PAPER-018'),
    ('Pens', 'Blue ink ballpoint pens', 'Office Supplies', 'Kitchen Pro Equipment', 'boxes', 4, 2, 8, 12.99, NULL, 'Office Area', 'KP-PEN-019'),
    ('Sticky Notes', 'Yellow sticky note pads', 'Office Supplies', 'Kitchen Pro Equipment', 'packs', 6, 3, 12, 8.50, NULL, 'Office Area', 'KP-NOTES-020')
) AS item_data(name, description, category_name, supplier_name, unit, current_quantity, minimum_quantity, maximum_quantity, cost_per_unit, expiration_days, storage_location, sku)
JOIN category_ids cat ON cat.name = item_data.category_name
JOIN supplier_ids sup ON sup.name = item_data.supplier_name;

-- Insert some sample transactions to show activity
WITH item_ids AS (
  SELECT id, name FROM inventory_items LIMIT 10
)
INSERT INTO inventory_transactions (
  item_id, transaction_type, quantity, unit_cost, reason, reference_id, performed_by, transaction_date
)
SELECT 
  i.id,
  transaction_data.type,
  transaction_data.quantity,
  transaction_data.unit_cost,
  transaction_data.reason,
  transaction_data.reference_id,
  (SELECT id FROM auth.users LIMIT 1), -- Use first available user, or set to a specific admin user ID
  NOW() - (transaction_data.days_ago || ' days')::INTERVAL
FROM item_ids i
CROSS JOIN (
  VALUES 
    ('in', 50.0, 3.50, 'Weekly delivery', 'PO-2024-001', 1),
    ('out', -15.0, 3.50, 'Used for daily service', 'USAGE-001', 2),
    ('out', -8.0, 3.50, 'Used for daily service', 'USAGE-002', 3),
    ('in', 25.0, 3.50, 'Emergency restock', 'PO-2024-002', 5),
    ('out', -12.0, 3.50, 'Used for catering order', 'CATERING-001', 7)
) AS transaction_data(type, quantity, unit_cost, reason, reference_id, days_ago)
LIMIT 25; -- Limit to prevent too many transactions

-- Update the updated_at timestamp
UPDATE inventory_items SET updated_at = NOW() WHERE id IN (
  SELECT id FROM inventory_items LIMIT 10
);
