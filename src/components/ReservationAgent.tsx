"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/authContext";

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface ReservationData {
  partySize?: number;
  date?: string;
  time?: string;
  customerName?: string;
  email?: string;
  phone?: string;
}

export default function ReservationAgent() {
  const { session, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      content: "Welcome to HostMate! May I have your full name for the reservation?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [reservationData, setReservationData] = useState<ReservationData>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input when chat is opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch('/api/reservation-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages,
          reservationData,
          userProfile: session ? {
            id: session.user.id,
            email: session.user.email,
            name: profile?.name
          } : null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from agent');
      }

      const data = await response.json();
      
      const agentMessage: Message = {
        role: 'agent',
        content: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
      
      // Update reservation data if provided
      if (data.reservationData) {
        setReservationData(prev => ({ ...prev, ...data.reservationData }));
      }

      // Handle reservation completion
      if (data.action === 'COMPLETE_RESERVATION') {
        // The agent will handle the reservation creation
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'agent',
            content: "🎉 Your reservation has been confirmed! You'll receive a confirmation email shortly.",
            timestamp: new Date()
          }]);
        }, 1000);
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'agent',
        content: "I apologize, but I'm experiencing some technical difficulties. Please try again or contact us directly.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
      // Focus the input field after the conversation is complete
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50"
        aria-label="Open reservation assistant"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4 rounded-t-xl flex justify-between items-center">
        <h3 className="font-semibold">Reservation Assistant</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Reservation Progress */}
      {Object.keys(reservationData).length > 0 && (
        <div className="p-3 bg-gray-800 border-b border-gray-700">
          <div className="text-xs text-gray-400 mb-2">Reservation Progress:</div>
          <div className="flex flex-wrap gap-2">
            {reservationData.partySize && (
              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                Party of {reservationData.partySize}
              </span>
            )}
            {reservationData.date && (
              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                {reservationData.date}
              </span>
            )}
            {reservationData.time && (
              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                {reservationData.time}
              </span>
            )}
            {reservationData.customerName && (
              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                {reservationData.customerName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-400">Agent is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
