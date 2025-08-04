"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/authContext";

interface Reservation {
  id: string;
  user_id: string;
  table_id: string;
  datetime: string;
  party_size: number;
  status: string;
}

export default function AdminPage() {
  const { profile, loading: profileLoading } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  console.log('AdminPage profile:', profile, 'profileLoading:', profileLoading);

  // Manual cleanup function for admin
  const manualCleanup = async () => {
    setCleanupLoading(true);
    try {
      const response = await fetch('/api/cleanup-past-reservations', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Manual cleanup: ${result.deletedCount} past reservations deleted`);
        alert(`Cleanup complete! Deleted ${result.deletedCount} past reservations.`);
        
        // Refresh the reservations list
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const todayISO = todayUTC.toISOString();

        const { data } = await supabase
          .from("reservations")
          .select("*")
          .gte("datetime", todayISO)
          .order("datetime", { ascending: true });

        setReservations(data || []);
      }
    } catch (error) {
      console.error('Error during manual cleanup:', error);
      alert('Error during cleanup. Check console for details.');
    } finally {
      setCleanupLoading(false);
    }
  };

  useEffect(() => {
    if (!profileLoading && profile?.role === "admin") {
      const fetchReservations = async () => {
        // First, automatically cleanup past reservations from database
        try {
          const cleanupResponse = await fetch('/api/cleanup-past-reservations', { method: 'POST' });
          const cleanupResult = await cleanupResponse.json();
          if (cleanupResult.success && cleanupResult.deletedCount > 0) {
            console.log(`🧹 Admin view: Cleaned up ${cleanupResult.deletedCount} past reservations`);
          }
        } catch (error) {
          console.log('Cleanup skipped:', error);
        }

        // Get current date to filter out past reservations (UTC to match database)
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const todayISO = todayUTC.toISOString();

        const { data } = await supabase
          .from("reservations")
          .select("*")
          .gte("datetime", todayISO) // Only get current and future reservations
          .order("datetime", { ascending: true }); // Show upcoming first

        setReservations(data || []);
        setLoading(false);
      };

      fetchReservations();
    }
  }, [profile, profileLoading]);

  if (profileLoading || loading) return <div>Loading reservations...</div>;
  if (!profile || profile.role !== "admin") return <div>Access denied.</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Current & Upcoming Reservations</h1>
        <button
          onClick={manualCleanup}
          disabled={cleanupLoading}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 text-sm"
        >
          {cleanupLoading ? '🧹 Cleaning...' : '🧹 Cleanup Past Reservations'}
        </button>
      </div>
      
      {reservations.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No current or upcoming reservations.</p>
          <p className="text-sm text-gray-500 mt-2">Past reservations are automatically cleaned up.</p>
        </div>
      ) : (
        <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border text-left">User ID</th>
              <th className="p-3 border text-left">Table</th>
              <th className="p-3 border text-left">Date/Time</th>
              <th className="p-3 border text-left">Party Size</th>
              <th className="p-3 border text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-3 border">{r.user_id}</td>
                <td className="p-3 border">{r.table_id}</td>
                <td className="p-3 border">{new Date(r.datetime).toLocaleString()}</td>
                <td className="p-3 border">{r.party_size}</td>
                <td className="p-3 border">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    r.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
