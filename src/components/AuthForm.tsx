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
      else setMessage("Check your email for a confirmation link. If you've made reservations before with this email, they'll be automatically linked to your new account!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="flex justify-center items-center text-gray-400">Loading...</div>;
  if (user) return (
    <div className="bg-black/30 backdrop-blur-lg rounded-xl p-8 pt-10 text-center max-w-sm mx-auto shadow-2xl border border-gray-700/50 mt-12">
      <p className="text-white text-lg mb-8 drop-shadow-md break-words">Signed in as <br/><span className="font-semibold text-xl">{user.email}</span></p>
      <button onClick={handleSignOut} className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-semibold shadow-lg cursor-pointer">
        Sign out
      </button>
    </div>
  );

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-xl p-8 max-w-sm mx-auto shadow-2xl border border-gray-700/50">
      <h2 className="text-2xl font-bold text-white mb-6 text-center drop-shadow-lg">{isSignUp ? "Sign Up" : "Sign In"}</h2>
      <form onSubmit={handleAuth} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-[#18181b] text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 placeholder-gray-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 bg-[#18181b] text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 placeholder-gray-400"
        />
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {message && <div className="text-green-400 text-sm">{message}</div>}
        <button type="submit" className="w-full px-4 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-semibold">
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>
        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-purple-400 hover:text-purple-300 transition-colors underline">
          {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
        </button>
      </form>
    </div>
  );
}
