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
  console.log('AdminPage profile:', profile, 'profileLoading:', profileLoading);

  useEffect(() => {
    if (!profileLoading && profile?.role === "admin") {
      supabase
        .from("reservations")
        .select("*")
        .order("datetime", { ascending: false })
        .then(({ data }) => {
          setReservations(data || []);
          setLoading(false);
        });
    }
  }, [profile, profileLoading]);

  if (profileLoading || loading) return <div>Loading reservations...</div>;
  if (!profile || profile.role !== "admin") return <div>Access denied.</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">All Reservations</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">User ID</th>
            <th className="p-2 border">Table</th>
            <th className="p-2 border">Date/Time</th>
            <th className="p-2 border">Party Size</th>
            <th className="p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(r => (
            <tr key={r.id}>
              <td className="p-2 border">{r.user_id}</td>
              <td className="p-2 border">{r.table_id}</td>
              <td className="p-2 border">{new Date(r.datetime).toLocaleString()}</td>
              <td className="p-2 border">{r.party_size}</td>
              <td className="p-2 border">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
