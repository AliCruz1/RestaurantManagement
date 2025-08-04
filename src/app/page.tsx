"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthProvider, useAuth } from "@/lib/authContext";
import AuthForm from "@/components/AuthForm";
import ReservationForm from "@/components/ReservationForm";
import ReservationAgent from "@/components/ReservationAgent";
import GuestReservationLinkingNotification from "@/components/GuestReservationLinkingNotification";
import AdminDashboard from "@/app/admin/dashboard/page";

// Define the shape of a reservation
interface UserReservation {
  id: string;
  datetime: string;
  party_size: number;
  status: string;
  customer_name: string;
}

function HomeContent() {
  const { profile, loading, session } = useAuth();
  const [userReservations, setUserReservations] = useState<UserReservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);

  // Effect to fetch reservations when a user is logged in
  useEffect(() => {
    if (session?.user?.id) {
      const fetchUserReservations = async () => {
        setReservationsLoading(true);
        const { data, error } = await supabase
          .from("reservations")
          .select("id, datetime, party_size, status, customer_name, customer_email, email")
          .eq("user_id", session.user.id)
          .or(`customer_email.eq.${session.user.email},email.eq.${session.user.email}`)
          .order("datetime", { ascending: true });

        if (error) {
          console.error("Error fetching user reservations:", error);
        } else {
          setUserReservations(data as UserReservation[]);
        }
        setReservationsLoading(false);
      };

      fetchUserReservations();
    } else {
      // Clear reservations if user logs out
      setUserReservations([]);
    }
  }, [session]);

  if (!loading && profile?.role === "admin") {
    return <AdminDashboard />;
  }

  return (
    <div className="font-sans bg-[#18181b] text-white min-h-screen flex flex-col">
      {/* User Status Header */}
      {session && (
        <header className="fixed top-0 left-0 right-0 p-4 flex justify-end items-center z-60" style={{ zIndex: 9999, pointerEvents: 'auto' }}>
          <div className="bg-black/30 backdrop-blur-lg rounded-xl p-2 flex items-center gap-4">
            <span className="text-sm text-gray-300 pl-2">Welcome, {profile?.name || session.user.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm cursor-pointer"
              style={{ zIndex: 10000, pointerEvents: 'auto', position: 'relative' }}
            >
              Sign Out
            </button>
          </div>
        </header>
      )}

      <div className="flex-grow flex flex-col items-center p-8 sm:p-20 relative">
        <div className="w-full max-w-7xl mx-auto flex-grow flex flex-col items-center justify-center gap-8">
          <GuestReservationLinkingNotification />
          
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
            style={{ backgroundImage: 'url(/images/HostMateBG.jpg)' }}
          ></div>
          
          <div className="w-full absolute inset-0 overflow-y-auto flex flex-col items-center justify-start p-8 pt-20 pb-20 gap-8 sm:p-20 sm:pt-32" style={{ scrollbarGutter: 'stable' }}>
            <main className="flex flex-col gap-8 items-center relative z-10 w-full max-w-4xl">
              
              <div className="text-center mb-4">
                <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">Welcome to HostMate</h1>
                <p className="text-xl text-gray-300 drop-shadow-md mb-2">Experience Fine Dining at Its Best</p>
                <p className="text-gray-400 drop-shadow-md">Reserve your table instantly - no account required!</p>
              </div>

              {/* Show reservations if logged in */}
              {session && userReservations.length > 0 && (
                <div className="w-full max-w-2xl bg-black/30 backdrop-blur-lg rounded-xl border border-gray-700/50 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">My Upcoming Reservations</h2>
                  <div className="space-y-4">
                    {userReservations.map(r => (
                      <div key={r.id} className="bg-black/30 backdrop-blur-lg rounded-xl border border-gray-700/50 p-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-purple-400">Party of {r.party_size}</p>
                          <p className="text-sm text-gray-300">
                            {new Date(r.datetime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            {' at '}
                            {new Date(r.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          r.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {r.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <ReservationForm />

              {/* Hide sign-in form if user is already logged in */}
              {!session && (
                <div className="text-center">
                  <details className="group">
                    <summary className="cursor-pointer text-purple-400 hover:text-purple-300 transition-colors list-none">
                      <span className="text-sm">Already have an account? Sign in to see your reservations ▼</span>
                    </summary>
                    <div className="mt-4 group-open:animate-fadeIn">
                      <AuthForm />
                    </div>
                  </details>
                </div>
              )}

              
              
              <div className="text-center mt-8 p-6 bg-black/30 backdrop-blur-lg rounded-xl border border-gray-700/50 max-w-2xl">
                <h3 className="text-lg font-semibold text-white mb-3">About Our Restaurant</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                  <div>
                    <p className="font-medium text-white">Hours</p>
                    <p>Mon-Sun: 9:00 AM - 10:30 PM</p>
                  </div>
                  <div>
                    <p className="font-medium text-white">Location</p>
                    <p>Downtown District</p>
                  </div>
                  <div>
                    <p className="font-medium text-white">Cuisine</p>
                    <p>Modern American</p>
                  </div>
                </div>
              </div>

            </main>
          </div>
        </div>
      </div>
      
      {/* AI Reservation Agent */}
      <ReservationAgent />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
