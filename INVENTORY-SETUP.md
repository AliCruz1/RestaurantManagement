# Inventory System Setup Guide

## Step 1: Set up the Database

1. **Go to your Supabase dashboard** (https://app.supabase.com)
2. **Navigate to the SQL Editor**
3. **Run the inventory schema**:
   - Copy and paste the contents of `inventory-schema.sql`
   - Click "Run" to execute the SQL

4. **Add sample data** (optional):
   - Copy and paste the contents of `sample-inventory-data.sql`
   - Click "Run" to execute the SQL

## Step 2: Get your Service Role Key

1. **Go to Settings > API** in your Supabase dashboard
2. **Copy your Service Role Key** (this is different from the anon key)
3. **Add it to your `.env.local` file**:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Step 3: Test the System

1. **Restart your Next.js development server**:
   ```bash
   npm run dev
   ```

2. **Login as an admin user**
3. **Navigate to the Admin Dashboard > Inventory**
4. **Test the features**:
   - ✅ Add new inventory items
   - ✅ View item details
   - ✅ Edit existing items
   - ✅ Generate AI insights with Gemini

## Features Available

### ✅ **Working Features**
- **Add Item**: Complete form with all fields
- **Edit Item**: Update existing inventory items
- **View Item**: Detailed view with stock levels
- **AI Insights**: Generate intelligent recommendations using Gemini
- **Search & Filter**: Find items by name or category
- **Real-time Stats**: Total items, low stock alerts, total value
- **Stock Status**: Visual indicators for low/normal/overstocked items

### 🚀 **AI Agent Features**
- **Reorder Suggestions**: When and how much to order
- **Waste Alerts**: Items at risk of expiring or being wasted
- **Cost Optimization**: Money-saving recommendations
- **Demand Forecasting**: Predict future usage based on reservations

## Troubleshooting

1. **"Cannot find module" errors**: Run `npm install`
2. **Database errors**: Make sure you've run the SQL schema
3. **Permission errors**: Verify your admin role in the profiles table
4. **AI insights not working**: Check your Gemini API key in `.env.local`

## Next Steps

The inventory system is now fully functional! You can:
- Add real inventory items for your restaurant
- Set up proper minimum/maximum stock levels
- Use AI insights to optimize your inventory management
- Track all inventory movements and costs
