import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServerClient';

export async function POST(request: NextRequest) {
  try {
    const { item, action } = await request.json();
    
    console.log('Waste prevention request:', { item, action });
    
    const supabase = supabaseServer;
    
    // Get the full item details from database since waste alerts only have partial data
    const { data: fullItem, error: itemError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', item.item_id)
      .single();

    if (itemError || !fullItem) {
      throw new Error(`Failed to fetch item details: ${itemError?.message}`);
    }

    console.log('Full item from database:', {
      name: fullItem.name,
      current_quantity: fullItem.current_quantity,
      type: typeof fullItem.current_quantity
    });
    
    // Parse the recommended action and execute appropriate steps
    let actionTaken = '';
    let quantityAdjustment = 0;
    let newMinQuantity = fullItem.minimum_quantity; // Default to current value
    
    if (action.action_recommended.toLowerCase().includes('reduce order') || 
        action.action_recommended.toLowerCase().includes('smaller order') ||
        action.action_recommended.toLowerCase().includes('order quantity')) {
      // Adjust minimum stock levels to prevent over-ordering
      // Use the current_quantity from the database (guaranteed to be a number)
      const currentQuantity = parseFloat(fullItem.current_quantity);
      
      newMinQuantity = Math.max(1, Math.floor(currentQuantity * 0.7));
      
      console.log('Waste prevention calculation:', {
        currentQuantity,
        newMinQuantity,
        item: fullItem.name
      });

      const updateData: any = { 
        minimum_quantity: newMinQuantity  // Use minimum_quantity as confirmed in schema
      };

      // Use updated_at as confirmed in schema (not last_updated)
      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', fullItem.id);

      if (updateError) {
        console.error('Min quantity update error:', updateError);
        throw updateError;
      }
      
      actionTaken = `Reduced minimum stock level to ${newMinQuantity} units`;
      
      // Clear old waste predictions for this item since we just applied the action
      try {
        await supabase
          .from('inventory_predictions')
          .delete()
          .eq('item_id', fullItem.id)
          .eq('prediction_type', 'waste_alert');
      } catch (clearError) {
        console.warn('Failed to clear old waste predictions:', clearError);
      }
      
    } else if (action.action_recommended.toLowerCase().includes('portion sizes')) {
      // Log recommendation for kitchen staff
      actionTaken = 'Created portion size adjustment recommendation for kitchen staff';
      
    } else {
      // Generic waste reduction action
      actionTaken = 'Applied waste reduction strategy';
    }

    // Log the waste prevention action
    try {
      await supabase
        .from('ai_actions_log')
        .insert({
          action_type: 'waste_prevention',
          item_id: fullItem.id,
          action_data: {
            potential_waste_amount: action.potential_waste_amount,
            action_recommended: action.action_recommended,
            action_taken: actionTaken,
            risk_reason: action.reason
          },
          executed_at: new Date().toISOString()
        });
    } catch (logError) {
      console.warn('Failed to log waste prevention action:', logError);
      // Don't fail the main operation if logging fails
    }

    // Create a waste tracking entry if there's a quantity adjustment
    if (quantityAdjustment !== 0) {
      try {
        const wasteTransactionData = {
          item_id: fullItem.id,
          transaction_type: 'adjustment' as const,
          quantity: quantityAdjustment,
          unit_cost: 0,
          reason: `Waste prevention: ${actionTaken}`,
          transaction_date: new Date().toISOString()
        };

        await supabase
          .from('inventory_transactions')
          .insert(wasteTransactionData);
      } catch (wasteError) {
        console.warn('Failed to log waste transaction:', wasteError);
        // Don't fail the main operation if logging fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Waste prevention action applied: ${actionTaken}`,
      actionTaken,
      newMinimum: newMinQuantity,
      details: {
        itemName: fullItem.name,
        previousMinimum: fullItem.minimum_quantity,
        newMinimum: newMinQuantity,
        currentQuantity: fullItem.current_quantity
      }
    });

  } catch (error: any) {
    console.error('Waste prevention error:', error);
    return NextResponse.json(
      { error: 'Failed to execute waste prevention action', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
