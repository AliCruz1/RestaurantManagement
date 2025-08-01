"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/authContext";
import { LightBulbIcon } from "@heroicons/react/24/outline";

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

  // Pre-fill fields for authenticated users
  useEffect(() => {
    if (user && user.email) {
      setEmail(user.email);
    }
  }, [user]);

  if (loading) return <div className="flex justify-center items-center text-gray-400">Loading...</div>;

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
    
    // Create reservation object for both guest and authenticated users
    const reservationData = {
      table_id: tableId,
      datetime: datetime.toISOString(),
      party_size: partySize,
      status: "pending",
      // For authenticated users: use user_id and keep existing name/email/phone fields
      // For guests: use guest_* fields and set user_id to null
      ...(user ? {
        user_id: user.id,
        name,
        email,
        phone,
      } : {
        user_id: null,
        guest_name: name,
        guest_email: email,
        guest_phone: phone,
      })
    };
    
    const { data: insertedData, error: resError } = await supabase
      .from("reservations")
      .insert([reservationData])
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
      `);
    
    if (resError) {
      setError(resError.message);
    } else if (insertedData && insertedData[0]) {
      const createdReservation = insertedData[0];
      
      // Process reservation for email
      const emailReservation = {
        ...createdReservation,
        displayName: createdReservation.user_id ? createdReservation.name : createdReservation.guest_name,
        displayEmail: createdReservation.user_id ? createdReservation.email : createdReservation.guest_email,
        displayPhone: createdReservation.user_id ? createdReservation.phone : createdReservation.guest_phone,
        isGuest: !createdReservation.user_id
      };
      
      // Send confirmation email
      try {
        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reservation: emailReservation,
            type: 'confirmation'
          }),
        });
        
        if (emailResponse.ok) {
          setStatus(`Reservation created successfully! Check your email (${emailReservation.displayEmail}) for confirmation details and reservation ID: ${createdReservation.reservation_token.slice(-8)}`);
        } else {
          setStatus("Reservation created successfully! However, we couldn't send the confirmation email. Please save this reservation ID: " + createdReservation.reservation_token.slice(-8));
        }
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        setStatus("Reservation created successfully! However, we couldn't send the confirmation email. Please save this reservation ID: " + createdReservation.reservation_token.slice(-8));
      }
      
      // Clear form after successful submission
      setDate("");
      setTime("");
      setPartySize(1);
      setName("");
      if (!user) setEmail(""); // Only clear email for guests
      setPhone("");
    }
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
      
      {!user && (
        <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <p className="text-sm text-purple-200 text-center flex items-center justify-center gap-2">
            <LightBulbIcon className="h-12 w-12 text-purple-400" />
            <span><strong>Tip:</strong> Sign in to manage your reservations easily and save time on future bookings!</span>
          </p>
        </div>
      )}
    </div>
  );
}
