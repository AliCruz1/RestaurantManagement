"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/authContext";

export default function ReservationForm() {
  const { user, loading } = useAuth();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  if (loading) return <div className="flex justify-center items-center text-gray-400">Loading...</div>;
  if (!user) return <div className="text-center text-gray-400 bg-[#23232a] rounded-xl p-6 max-w-sm mx-auto">Please sign in to make a reservation.</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    setError("");
    const datetime = new Date(`${date}T${time}`);
    if (isNaN(datetime.getTime())) {
      setError("Please enter a valid date and time.");
      return;
    }
    if (!name || !email || !phone) {
      setError("Please enter your name, email, and phone.");
      return;
    }
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
        name,
        email,
        phone,
        status: "pending",
      },
    ]);
    if (resError) setError(resError.message);
    else setStatus("Reservation requested! You'll receive a confirmation soon.");
  };

  return (
    <div className="bg-[#23232a]/90 backdrop-blur-sm rounded-xl p-8 max-w-sm mx-auto mt-8 shadow-2xl border border-gray-700/50">
      <h2 className="text-2xl font-bold text-white mb-6 text-center drop-shadow-lg">Book a Table</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full px-4 py-3 bg-[#18181b] text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 placeholder-gray-400"
          placeholder="Your Name"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-[#18181b] text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 placeholder-gray-400"
          placeholder="Your Email"
        />
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
          className="w-full px-4 py-3 bg-[#18181b] text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 placeholder-gray-400"
          placeholder="Your Phone"
        />
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-white">Select Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full px-4 py-3 bg-[#18181b] text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-white">Select Time</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            required
            min="09:00"
            max="22:30"
            className="w-full px-4 py-3 bg-[#18181b] text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 placeholder-gray-400"
            placeholder="Enter time (e.g., 7:30 PM)"
          />
          <p className="text-xs text-gray-400 mt-1">Restaurant hours: 9:00 AM - 10:30 PM</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-white">Number of Guests</label>
          <div className="relative">
            <select
              value={partySize}
              onChange={e => setPartySize(Number(e.target.value))}
              required
              className="w-full px-4 py-3 bg-[#18181b] text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 appearance-none font-[inherit] text-base"
            >
              {[...Array(20)].map((_, i) => (
                <option key={i + 1} value={i + 1} className="bg-[#18181b] text-white font-[inherit]">
                  {i + 1} {i + 1 === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Select how many people will be dining</p>
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}
        {status && <div className="text-green-400 text-sm">{status}</div>}
        <button type="submit" className="w-full px-4 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-semibold">
          Reserve Table
        </button>
      </form>
    </div>
  );
}
