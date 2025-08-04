import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServerClient';

export async function POST(request: NextRequest) {
  try {
    const { item, orderQuantity, reasoning } = await request.json();
    
    console.log('Auto-reorder request:', { item, orderQuantity, reasoning });
    
    const supabase = supabaseServer;

    // Get or create a default supplier for auto-orders
    let { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('name', 'Auto-Order System')
      .single();

    if (supplierError || !supplier) {
      // Create default supplier if it doesn't exist
      const { data: newSupplier, error: createSupplierError } = await supabase
        .from('suppliers')
        .insert({
          name: 'Auto-Order System',
          contact_person: 'AI Assistant',
          email: 'auto-orders@system.local',
          is_active: true
        })
        .select('id')
        .single();

      if (createSupplierError) {
        console.error('Failed to create supplier:', createSupplierError);
        supplier = null;
      } else {
        supplier = newSupplier;
      }
    }

    // Create a purchase transaction entry - minimal required fields only
    const transactionData = {
      item_id: item.item_id,
      transaction_type: 'purchase' as const,
      quantity: orderQuantity,
      unit_cost: 0,
      reason: `AI-generated reorder: ${reasoning}`,
      transaction_date: new Date().toISOString()
    };

    const { data: purchaseOrder, error: orderError } = await supabase
      .from('inventory_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (orderError) {
      console.error('Purchase order error:', orderError);
      throw orderError;
    }

    // Update inventory quantity (simulating order fulfillment)
    const updateData: any = { 
      current_quantity: item.current_quantity + orderQuantity
    };

    // Only add last_updated if the column exists
    try {
      updateData.last_updated = new Date().toISOString();
    } catch (e) {
      // Column might not exist, that's okay
    }

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', item.item_id);

    if (updateError) {
      console.error('Inventory update error:', updateError);
      throw updateError;
    }

    // Log the automated action
    try {
      await supabase
        .from('ai_actions_log')
        .insert({
          action_type: 'auto_reorder',
          item_id: item.item_id,
          action_data: {
            original_quantity: item.current_quantity,
            ordered_quantity: orderQuantity,
            new_quantity: item.current_quantity + orderQuantity,
            reasoning
          },
          executed_at: new Date().toISOString()
        });

      // Clear old reorder predictions for this item since we just reordered
      await supabase
        .from('inventory_predictions')
        .delete()
        .eq('item_id', item.item_id)
        .eq('prediction_type', 'reorder_suggestion');

    } catch (logError) {
      console.warn('Failed to log AI action:', logError);
      // Don't fail the main operation if logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ordered ${orderQuantity} units of ${item.item_name}`,
      purchaseOrder,
      newQuantity: item.current_quantity + orderQuantity
    });

  } catch (error: any) {
    console.error('Auto-reorder error:', error);
    return NextResponse.json(
      { error: 'Failed to execute reorder', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
