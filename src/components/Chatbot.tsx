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
    <div className="max-w-md mx-auto mt-8 border rounded p-4 bg-white">
      <h2 className="text-lg font-bold mb-2">AI Reservation Assistant</h2>
      <div className="h-48 overflow-y-auto border p-2 mb-2 bg-gray-50 rounded">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "text-right" : "text-left text-blue-700"}>
            <span className="block mb-1">{msg.content}</span>
          </div>
        ))}
        {loading && <div className="text-gray-400">AI is typing...</div>}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 border rounded px-2 py-1"
          placeholder="Ask about reservations..."
          disabled={loading}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={loading}>
          Send
        </button>
      </form>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
