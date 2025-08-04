import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { searchTerm } = await req.json();

    // Search for items matching the search term
    const { data: items, error } = await supabase
      .from('inventory_items')
      .select('*')
      .ilike('name', `%${searchTerm}%`);

    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }

    // Get total count of all inventory items for context
    const { count: totalItems, error: countError } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (countError) {
      console.warn('Could not get total count:', countError);
    }

    return NextResponse.json({
      success: true,
      searchTerm,
      found: items && items.length > 0,
      items: items || [],
      itemCount: items?.length || 0,
      totalInventoryItems: totalItems || 0,
      message: items && items.length > 0 
        ? `Found ${items.length} item(s) matching "${searchTerm}"`
        : `No items found matching "${searchTerm}" - successfully deleted!`
    });

  } catch (error) {
    console.error('Verification error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to verify deletion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
