"use client";
import { useState } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((msgs) => [...msgs, { role: "assistant", content: data.reply }]);
      } else {
        setError("No reply from AI.");
      }
    } catch (err) {
      setError("Error contacting AI.");
    }
    setInput("");
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-[#23232a] rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 text-white text-center">AI Reservation Assistant</h2>
      <div className="h-48 overflow-y-auto bg-[#18181b] border border-gray-700 rounded-lg p-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <div className={`inline-block px-3 py-2 rounded-lg max-w-[80%] ${
              msg.role === "user" 
                ? "bg-purple-900 text-purple-100" 
                : "bg-gray-700 text-gray-100"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-400 text-center">AI is typing...</div>}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 bg-[#18181b] text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 placeholder-gray-400"
          placeholder="Ask about reservations..."
          disabled={loading}
        />
        <button 
          type="submit" 
          className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50" 
          disabled={loading}
        >
          Send
        </button>
      </form>
      {error && <div className="text-red-400 mt-2 text-sm">{error}</div>}
    </div>
  );
}
