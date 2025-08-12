"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// Ensure this page is rendered dynamically to avoid static prerender issues
export const dynamic = "force-dynamic";

function ReservationLookupInner() {
  const [email, setEmail] = useState("");
  const [reservationToken, setReservationToken] = useState("");
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  
  const searchParams = useSearchParams();
  
  // Auto-fill token from URL if provided (from email link)
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const emailFromUrl = searchParams.get('email');
    if (tokenFromUrl) {
      setReservationToken(tokenFromUrl);
      if (emailFromUrl) {
        setEmail(emailFromUrl);
        // Auto-lookup if both email and token are in URL
        handleLookup(emailFromUrl, tokenFromUrl);
      }
    }
  }, [searchParams]);

  const handleLookup = async (emailParam?: string, tokenParam?: string) => {
    const lookupEmail = emailParam || email;
    const lookupToken = tokenParam || reservationToken;
    
    if (!lookupEmail || !lookupToken) {
      setError("Please enter both email and reservation ID.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id, 
          name, 
          email, 
          phone, 
          party_size, 
          datetime,
          status,
          user_id,
          guest_name,
          guest_email,
          guest_phone,
          reservation_token
        `)
        .eq('reservation_token', lookupToken)
        .or(`email.eq.${lookupEmail},guest_email.eq.${lookupEmail}`)
        .single();

      if (error || !data) {
        setError("Reservation not found. Please check your email and reservation ID.");
        setReservation(null);
      } else {
        // Process reservation data
        const processedReservation = {
          ...data,
          displayName: data.user_id ? data.name : data.guest_name,
          displayEmail: data.user_id ? data.email : data.guest_email,
          displayPhone: data.user_id ? data.phone : data.guest_phone,
          isGuest: !data.user_id
        };
        setReservation(processedReservation);
        setError("");
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setError("An error occurred while looking up your reservation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!reservation || !confirm("Are you sure you want to cancel this reservation?")) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: 'cancelled' })
        .eq('id', reservation.id)
        .eq('reservation_token', reservation.reservation_token);

      if (error) {
        setError("Failed to cancel reservation. Please try again.");
      } else {
        setMessage("Your reservation has been cancelled successfully.");
        setReservation({ ...reservation, status: 'cancelled' });
      }
    } catch (err) {
      console.error("Cancel error:", err);
      setError("An error occurred while cancelling your reservation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#18181b] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Manage Your Reservation</h1>
        
        {!reservation ? (
          <div className="bg-[#23232a]/90 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700/50">
            <h2 className="text-xl font-semibold mb-6">Look Up Your Reservation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 bg-[#18181b] text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reservation ID</label>
                <input
                  type="text"
                  value={reservationToken}
                  onChange={(e) => setReservationToken(e.target.value)}
                  placeholder="Enter your reservation ID from email"
                  className="w-full px-4 py-3 bg-[#18181b] text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 placeholder-gray-400"
                />
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button
                onClick={() => handleLookup()}
                disabled={loading}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
              >
                {loading ? "Looking up..." : "Find My Reservation"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#23232a]/90 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700/50">
            <h2 className="text-xl font-semibold mb-6">Your Reservation Details</h2>
            
            {reservation.status === 'cancelled' && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-300 font-medium">This reservation has been cancelled.</p>
              </div>
            )}
            
            {message && (
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-6">
                <p className="text-green-300">{message}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Name</h3>
                <p className="text-white font-medium">{reservation.displayName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Email</h3>
                <p className="text-gray-300">{reservation.displayEmail}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Phone</h3>
                <p className="text-gray-300">{reservation.displayPhone}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Party Size</h3>
                <p className="text-white font-medium">{reservation.party_size} {reservation.party_size === 1 ? 'Guest' : 'Guests'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Date & Time</h3>
                <p className="text-white font-medium">
                  {new Date(reservation.datetime).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Status</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  reservation.status === 'confirmed' ? 'bg-green-900/30 text-green-300 border border-green-500/30' :
                  reservation.status === 'cancelled' ? 'bg-red-900/30 text-red-300 border border-red-500/30' :
                  'bg-yellow-900/30 text-yellow-300 border border-yellow-500/30'
                }`}>
                  {reservation.status === 'confirmed' ? '✓ Confirmed' :
                   reservation.status === 'cancelled' ? '✗ Cancelled' :
                   '⏳ Pending'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-4">
              {reservation.status !== 'cancelled' && (
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
                >
                  {loading ? "Cancelling..." : "Cancel Reservation"}
                </button>
              )}
              <button
                onClick={() => {
                  setReservation(null);
                  setEmail("");
                  setReservationToken("");
                  setError("");
                  setMessage("");
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-semibold"
              >
                Look Up Another Reservation
              </button>
            </div>
            
            {error && <div className="text-red-400 text-sm mt-4">{error}</div>}
          </div>
        )}
        
        <div className="text-center mt-8">
          <Link href="/" className="text-purple-400 hover:text-purple-300 underline">
            ← Back to Restaurant Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ReservationLookup() {
  // Wrap client-side searchParams usage in Suspense to satisfy Next.js requirement
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#18181b] text-white p-8">Loading…</div>}>
      <ReservationLookupInner />
    </Suspense>
  );
}
