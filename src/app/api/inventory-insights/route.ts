import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateInventoryInsights } from '@/lib/geminiInventoryAgent';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Fetch inventory data - use direct table instead of view for real-time data
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory_items')
      .select(`
        *,
        suppliers(name)
      `)
      .eq('is_active', true);

    if (inventoryError) {
      throw new Error(`Inventory fetch error: ${inventoryError.message}`);
    }

    // Fetch transaction history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: transactionHistory, error: transactionError } = await supabase
      .from('inventory_transactions')
      .select(`
        *,
        inventory_items(name, category_id)
      `)
      .gte('transaction_date', thirtyDaysAgo.toISOString())
      .order('transaction_date', { ascending: false });

    if (transactionError) {
      throw new Error(`Transaction fetch error: ${transactionError.message}`);
    }

    // Fetch upcoming reservations (next 14 days)
    const fourteenDaysLater = new Date();
    fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);

    const { data: reservationData, error: reservationError } = await supabase
      .from('reservations')
      .select('datetime, party_size, status')
      .gte('datetime', new Date().toISOString())
      .lte('datetime', fourteenDaysLater.toISOString())
      .eq('status', 'confirmed');

    if (reservationError) {
      throw new Error(`Reservation fetch error: ${reservationError.message}`);
    }

    // Fetch recent AI actions to avoid re-suggesting items that were recently acted upon
    const recentActionsTime = new Date();
    recentActionsTime.setMinutes(recentActionsTime.getMinutes() - 10); // 10 minutes ago for testing

    const { data: recentActions, error: actionsError } = await supabase
      .from('ai_actions_log')
      .select('item_id, action_type')
      .gte('executed_at', recentActionsTime.toISOString());

    if (actionsError) {
      console.warn('Failed to fetch recent actions:', actionsError);
    }

    const recentWasteActions = new Set(
      recentActions?.filter(action => action.action_type === 'waste_prevention')
        .map(action => action.item_id) || []
    );

    const recentReorderActions = new Set(
      recentActions?.filter(action => action.action_type === 'auto_reorder')
        .map(action => action.item_id) || []
    );

    // Generate AI insights
    const insights = await generateInventoryInsights(
      inventoryData || [],
      transactionHistory || [],
      reservationData || [],
      { recentWasteActions, recentReorderActions }
    );

    // Advanced filtering to prevent conflicting recommendations
    const wasteItemIds = new Set(insights.wasteAlerts.map(alert => alert.item_id));
    
    // Filter out items with recent actions AND items that have waste alerts
    const filteredReorderSuggestions = insights.reorderSuggestions.filter(
      suggestion => {
        if (!suggestion.item_id) return false;
        if (!suggestion.item_name) return false;
        if (suggestion.suggested_order_quantity <= 0) return false; // Remove suggestions with 0 or negative quantities
        
        // Ensure estimated_days_until_stockout is valid, provide fallback if needed
        if (suggestion.estimated_days_until_stockout == null || 
            isNaN(suggestion.estimated_days_until_stockout) || 
            suggestion.estimated_days_until_stockout < 0) {
          // Fallback calculation based on current quantity and item type
          const currentQty = suggestion.current_quantity || 0;
          const itemName = suggestion.item_name.toLowerCase();
          
          if (itemName.includes('knife') || itemName.includes('chef')) {
            // Critical equipment - urgent if very low stock
            suggestion.estimated_days_until_stockout = currentQty <= 1 ? 1 : currentQty <= 2 ? 2 : 7;
          } else if (currentQty <= 2) {
            suggestion.estimated_days_until_stockout = 1;
          } else if (currentQty <= 5) {
            suggestion.estimated_days_until_stockout = 3;
          } else if (currentQty <= 10) {
            suggestion.estimated_days_until_stockout = 7;
          } else {
            suggestion.estimated_days_until_stockout = Math.floor(currentQty / 5); // Rough estimate
          }
          
          console.log(`⚠️  Fixed missing stockout estimate for ${suggestion.item_name}: ${suggestion.estimated_days_until_stockout} days`);
        }
        
        // Declare variables once at the top
        const itemName = suggestion.item_name.toLowerCase();
        const isCriticalEquipment = itemName.includes('knife') || itemName.includes('chef');
        
        // Allow critical equipment with extremely low stock (≤1) even if recently reordered
        // This ensures safety stock is maintained for essential kitchen equipment
        if (isCriticalEquipment && suggestion.current_quantity <= 1) {
          console.log(`✅ Allowing reorder for critical equipment ${suggestion.item_name} - extremely low stock (${suggestion.current_quantity} units) bypasses recent action filter`);
          // Skip the recent action check for critical equipment with ≤1 units
        } else if (recentReorderActions.has(suggestion.item_id)) {
          console.log(`🚫 Filtering out reorder suggestion for ${suggestion.item_name} - recent reorder action exists`);
          return false;
        }
        
        if (wasteItemIds.has(suggestion.item_id)) {
          console.log(`🚫 Filtering out reorder suggestion for ${suggestion.item_name} - has waste alert`);
          return false; // Don't reorder items with waste alerts
        }
        
        // Special validation for perishable items
        const isPerishable = itemName.includes('basil') || itemName.includes('tomato') || 
                           itemName.includes('lettuce') || itemName.includes('herb') ||
                           itemName.includes('chicken') || itemName.includes('beef') || 
                           itemName.includes('fish') || itemName.includes('dairy') ||
                           itemName.includes('milk') || itemName.includes('cheese') ||
                           itemName.includes('yogurt') || itemName.includes('produce') ||
                           itemName.includes('vegetable') || itemName.includes('fruit');
        
        if (isPerishable && suggestion.current_quantity > 50) {
          console.log(`🚫 Filtering out reorder suggestion for ${suggestion.item_name} - perishable with high stock (${suggestion.current_quantity})`);
          return false; // Don't reorder perishables with high current stock
        }
        
        // Validate reorder logic for equipment and long-lasting items
        const isEquipment = itemName.includes('knife') || itemName.includes('equipment') || 
                          itemName.includes('tool') || itemName.includes('cutting board');
        
        if (isEquipment && !isCriticalEquipment && suggestion.estimated_days_until_stockout > 60) {
          console.log(`🚫 Filtering out reorder suggestion for ${suggestion.item_name} - non-critical equipment with excessive supply (${suggestion.estimated_days_until_stockout} days)`);
          return false; // Don't reorder non-critical equipment that lasts more than 60 days
        }
        
        // For critical equipment with very low stock, always allow reorder regardless of estimated days
        if (isCriticalEquipment && suggestion.current_quantity <= 2) {
          console.log(`✅ Allowing reorder for critical equipment ${suggestion.item_name} - low stock (${suggestion.current_quantity} units)`);
          return true; // Always allow reorder for critical equipment with low stock
        }
        
        // Validate efficient reorder quantities (avoid tiny frequent orders)
        // Exception: Don't apply this rule to critical equipment
        if (!isCriticalEquipment && 
            suggestion.suggested_order_quantity === suggestion.current_quantity && 
            suggestion.estimated_days_until_stockout < 30) {
          console.log(`🚫 Filtering out inefficient reorder suggestion for ${suggestion.item_name} - ordering same quantity for short supply`);
          return false; // Avoid inefficient same-quantity reorders
        }
        
        return true;
      }
    );
    
    const filteredWasteAlerts = insights.wasteAlerts.filter(
      alert => {
        if (!alert.item_id) return false;
        if (recentWasteActions.has(alert.item_id)) return false;
        if (alert.potential_waste_amount <= 0) {
          console.log(`🚫 Filtering out waste alert for ${alert.item_name} - 0 units at risk`);
          return false; // Don't show waste alerts with 0 risk
        }
        return true;
      }
    );

    console.log(`📊 Filtering Results:`);
    console.log(`- Original reorder suggestions: ${insights.reorderSuggestions.length}`);
    console.log(`- Filtered reorder suggestions: ${filteredReorderSuggestions.length}`);
    console.log(`- Items with waste alerts: ${Array.from(wasteItemIds)}`);
    console.log(`- Recent reorder actions: ${Array.from(recentReorderActions)}`);

    // Store insights in the database for future reference
    // Store reorder suggestions
    if (filteredReorderSuggestions.length > 0) {
      const { error: reorderInsertError } = await supabase
        .from('inventory_predictions')
        .upsert(
          filteredReorderSuggestions.map(suggestion => ({
            item_id: suggestion.item_id,
            prediction_type: 'reorder_suggestion',
            predicted_value: suggestion.suggested_order_quantity,
            confidence_score: 0.8,
            prediction_data: suggestion,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          }))
        );

      if (reorderInsertError) {
        console.error('Error storing reorder predictions:', reorderInsertError);
      }
    }

    // Store waste alerts  
    if (filteredWasteAlerts.length > 0) {
      const { error: wasteInsertError } = await supabase
        .from('inventory_predictions')
        .upsert(
          filteredWasteAlerts.map(alert => ({
            item_id: alert.item_id,
            prediction_type: 'waste_alert',
            predicted_value: alert.potential_waste_amount,
            confidence_score: 0.8,
            prediction_data: alert,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          }))
        );

      if (wasteInsertError) {
        console.error('Error storing waste predictions:', wasteInsertError);
      }
    }

    return NextResponse.json({
      success: true,
      insights: {
        ...insights,
        reorderSuggestions: filteredReorderSuggestions,
        wasteAlerts: filteredWasteAlerts
      },
      generated_at: new Date().toISOString(),
      data_points: {
        inventory_items: inventoryData?.length || 0,
        transactions: transactionHistory?.length || 0,
        reservations: reservationData?.length || 0,
        recent_waste_actions: recentWasteActions.size,
        recent_reorder_actions: recentReorderActions.size
      }
    });

  } catch (error) {
    console.error('Inventory insights generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate inventory insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Fetch recent insights from the database
    const { data: recentInsights, error } = await supabase
      .from('inventory_predictions')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Insights fetch error: ${error.message}`);
    }

    // Group insights by type
    const groupedInsights = {
      reorderSuggestions: recentInsights?.filter(i => i.prediction_type === 'reorder_suggestion') || [],
      wasteAlerts: recentInsights?.filter(i => i.prediction_type === 'waste_alert') || [],
      costOptimization: recentInsights?.filter(i => i.prediction_type === 'cost_optimization') || [],
      demandForecast: recentInsights?.filter(i => i.prediction_type === 'demand_forecast') || []
    };

    return NextResponse.json({
      success: true,
      insights: groupedInsights,
      total_insights: recentInsights?.length || 0,
      last_updated: recentInsights?.[0]?.created_at || null
    });

  } catch (error) {
    console.error('Insights fetch error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch inventory insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
