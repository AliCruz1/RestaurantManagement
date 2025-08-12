"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckIcon, XMarkIcon, PencilIcon } from "@heroicons/react/24/outline";

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
  _sources?: { [field: string]: 'user' | 'inferred' };
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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
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

  // Helpers for inferred chip confirm / override
  const startEditingField = (field: string) => {
    // If already editing this field, ignore
    if (editingField === field) return;
    const currentVal: any = (reservationData as any)[field];
    setEditingField(field);
    setEditingValue(currentVal != null ? String(currentVal) : "");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditingValue("");
  };

  const saveEditedField = () => {
    if (!editingField) return;
    const field = editingField;
    const raw = editingValue.trim();
    let parsed: any = raw;
    if (field === 'partySize') {
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num > 0 && num < 100) parsed = num; else return; // invalid ignore
    }
    // Minimal time normalization HH:MM for time field if user omits minutes
    if (field === 'time') {
      if (/^\d{1,2}$/.test(raw)) parsed = raw.padStart(2,'0') + ':00';
      else if (/^\d{1,2}:\d{2}$/.test(raw)) parsed = raw;
    }
    // Date basic normalization mm/dd or yyyy-mm-dd passes through; rely on server on next submit
    setReservationData(prev => ({
      ...prev,
      [field]: parsed,
      _sources: { ...(prev._sources || {}), [field]: 'user' }
    }));
    cancelEditing();
  };

  const renderChip = (field: keyof ReservationData, label: string, formatter?: (v: any)=>string) => {
    const value = (reservationData as any)[field];
    if (!value) return null;
    const source = reservationData._sources?.[field];
    const isEditing = editingField === field;
    const baseColor = source === 'inferred' ? 'bg-blue-600' : 'bg-green-600';
    const className = `${baseColor} text-white px-2 py-1 rounded text-xs flex items-center gap-1`;
    if (isEditing) {
      return (
        <span key={String(field)} className={`${className} border border-yellow-400`}>
          <Input
            className="h-6 w-24 bg-black/30 border-white/20 text-xs px-1 py-0"
            value={editingValue}
            onChange={e => setEditingValue(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key==='Enter'){ e.preventDefault(); saveEditedField(); } if (e.key==='Escape'){ e.preventDefault(); cancelEditing(); } }}
          />
          <Button type="button" variant="ghost" size="sm" className="h-6 px-1" onClick={saveEditedField} title="Save">
            <CheckIcon className="w-3.5 h-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-1" onClick={cancelEditing} title="Cancel">
            <XMarkIcon className="w-3.5 h-3.5" />
          </Button>
        </span>
      );
    }
    const display = formatter ? formatter(value) : value;
    const title = source === 'inferred'
      ? 'Inferred value – click to confirm or edit'
      : 'Click to edit';
    return (
      <button
        key={String(field)}
        type="button"
        onClick={() => startEditingField(String(field))}
        className={`${className} cursor-pointer hover:brightness-110`}
        title={title}
      >
        {label}: {display}
        {source === 'inferred' ? (
          <span className="text-[10px] opacity-80">(inferred)</span>
        ) : (
          <span className="text-[10px] opacity-60">✎</span>
        )}
      </button>
    );
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
            {renderChip('partySize','Party', v => `of ${v}`)}
            {renderChip('date','Date')}
            {renderChip('time','Time')}
            {renderChip('customerName','Name')}
            {renderChip('email','Email')}
            {renderChip('phone','Phone')}
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
    <Input
      ref={inputRef}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Type your message..."
      disabled={loading}
      className="flex-1 h-9 bg-gray-800 border-gray-600 focus-visible:ring-purple-500"
    />
    <Button type="submit" disabled={loading || !input.trim()} size="icon" className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    </Button>
  </div>
</form>
    </div>
  );
}
