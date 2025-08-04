import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Use service role for elevated permissions to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting cleanup using admin client...');

    // Get current date in UTC (to match database datetime format)
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const todayISO = todayUTC.toISOString();

    // Step 1: Clean up email queue entries first to avoid foreign key constraints
    const { data: pastReservations } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .lt('datetime', todayISO);

    const pastIds = pastReservations?.map(r => r.id) || [];

    if (pastIds.length > 0) {
      await supabaseAdmin
        .from('email_queue')
        .delete()
        .in('reservation_id', pastIds);
    }

    // Step 2: Delete past reservations
    const { data: deletedReservations, error } = await supabaseAdmin
      .from('reservations')
      .delete()
      .lt('datetime', todayISO)
      .select('id, datetime, guest_name, name, status, party_size');

    if (error) {
      console.error('❌ Error deleting past reservations:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    const deletedCount = deletedReservations?.length || 0;

    console.log(`✅ Successfully deleted ${deletedCount} past reservations`);
    
    if (deletedCount > 0) {
      console.log('Deleted reservations:', deletedReservations.map(r => ({
        id: r.id,
        name: r.name || r.guest_name,
        datetime: r.datetime,
        status: r.status
      })));
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      deletedReservations: deletedReservations || [],
      message: `Successfully cleaned up ${deletedCount} past reservations`
    });

  } catch (error: any) {
    console.error('❌ Unexpected error during cleanup:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Previewing cleanup using admin client...');

    // Get current date in UTC (to match database datetime format)
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const todayISO = todayUTC.toISOString();

    // Count how many past reservations exist (without deleting)
    const { data: pastReservations, error } = await supabaseAdmin
      .from('reservations')
      .select('id, datetime, guest_name, name, status, party_size')
      .lt('datetime', todayISO);

    if (error) {
      console.error('❌ Error counting past reservations:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    const pastCount = pastReservations?.length || 0;

    return NextResponse.json({
      success: true,
      pastReservationsCount: pastCount,
      pastReservations: pastReservations || [],
      message: `Found ${pastCount} past reservations ready for cleanup`,
      cutoffDate: todayISO,
      currentTime: now.toISOString()
    });

  } catch (error: any) {
    console.error('❌ Unexpected error during preview:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
