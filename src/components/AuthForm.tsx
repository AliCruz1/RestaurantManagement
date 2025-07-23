"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/authContext";

export default function AuthForm() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Check your email for a confirmation link.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div>Loading...</div>;
  if (user) return (
    <div>
      <p>Signed in as {user.email}</p>
      <button onClick={handleSignOut} className="px-4 py-2 bg-gray-800 text-white rounded">Sign out</button>
    </div>
  );

  return (
    <form onSubmit={handleAuth} className="space-y-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold">{isSignUp ? "Sign Up" : "Sign In"}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded"
      />
      {error && <div className="text-red-600">{error}</div>}
      {message && <div className="text-green-600">{message}</div>}
      <button type="submit" className="w-full px-4 py-2 bg-gray-800 text-white rounded">
        {isSignUp ? "Sign Up" : "Sign In"}
      </button>
      <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 underline">
        {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
      </button>
    </form>
  );
}
