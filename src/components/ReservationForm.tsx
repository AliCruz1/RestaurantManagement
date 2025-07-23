"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/authContext";

export default function ReservationForm() {
  const { user, loading } = useAuth();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  if (loading) return <div>Loading...</div>;
  if (!user) return <div className="text-center">Please sign in to make a reservation.</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    setError("");
    // Combine date and time into a single ISO string
    const datetime = new Date(`${date}T${time}`);
    if (isNaN(datetime.getTime())) {
      setError("Please enter a valid date and time.");
      return;
    }
    // For demo: assign first available table (real logic would check availability)
    const { data: tables, error: tableError } = await supabase
      .from("tables")
      .select("id, capacity")
      .gte("capacity", partySize)
      .limit(1);
    if (tableError || !tables || tables.length === 0) {
      setError("No available table for this party size.");
      return;
    }
    const tableId = tables[0].id;
    const { error: resError } = await supabase.from("reservations").insert([
      {
        user_id: user.id,
        table_id: tableId,
        datetime: datetime.toISOString(),
        party_size: partySize,
        status: "pending",
      },
    ]);
    if (resError) setError(resError.message);
    else setStatus("Reservation requested! You'll receive a confirmation soon.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto mt-8">
      <h2 className="text-xl font-bold">Book a Table</h2>
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="time"
        value={time}
        onChange={e => setTime(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="number"
        min={1}
        max={20}
        value={partySize}
        onChange={e => setPartySize(Number(e.target.value))}
        required
        className="w-full px-3 py-2 border rounded"
        placeholder="Party Size"
      />
      {error && <div className="text-red-600">{error}</div>}
      {status && <div className="text-green-600">{status}</div>}
      <button type="submit" className="w-full px-4 py-2 bg-gray-800 text-white rounded">
        Reserve
      </button>
    </form>
  );
}
