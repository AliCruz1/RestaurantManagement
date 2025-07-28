"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";

// Define the shape of a reservation
interface Reservation {
  id: string;
  datetime: string;
  party_size: number;
  status: string;
  // Add other relevant fields from your 'reservations' table
  customer_name: string;
  customer_email: string;
}

export default function MyReservationsPage() {
  const { profile, loading: profileLoading, session } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // If the profile is done loading and there's no user, redirect to login
    if (!profileLoading && !session) {
      router.push('/login');
      return;
    }

    // Fetch reservations if the user is logged in
    if (session?.user?.id) {
      const fetchReservations = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("reservations")
          .select("*")
          .eq("user_id", session.user.id) // Filter by the logged-in user's ID
          .order("datetime", { ascending: false });

        if (error) {
          console.error("Error fetching reservations:", error);
          setReservations([]);
        } else {
          setReservations(data || []);
        }
        setLoading(false);
      };

      fetchReservations();
    }
  }, [profile, profileLoading, session, router]);

  // Show a loading state while we check for a user or fetch data
  if (profileLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#1a1a21]">
        <div className="text-white">Loading your reservations...</div>
      </div>
    );
  }

  // If there's no user session, they shouldn't see this page
  if (!session) {
    return null; // Or a message telling them to log in
  }

  return (
    <div className="min-h-screen bg-[#1a1a21] text-white">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">My Reservations</h1>
        
        {reservations.length > 0 ? (
          <div className="space-y-6">
            {reservations.map((r) => (
              <div key={r.id} className="bg-[#23232a] rounded-xl p-6 border border-gray-700/50 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-2xl font-bold text-purple-400">
                      Party of {r.party_size}
                    </p>
                    <p className="text-gray-400">
                      {new Date(r.datetime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-gray-400">
                      {new Date(r.datetime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div 
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      r.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                      r.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-700/50 pt-4 text-gray-300">
                  <p>Reservation ID: {r.id}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-[#23232a] rounded-xl p-12 border border-gray-700/50">
            <p className="text-xl">You don't have any reservations yet.</p>
            <a href="/#reservation-form" className="mt-4 inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Make a Reservation
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
