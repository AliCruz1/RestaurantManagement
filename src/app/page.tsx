"use client";
import Image from "next/image";
import { AuthProvider, useAuth } from "@/lib/authContext";
import AuthForm from "@/components/AuthForm";
import ReservationForm from "@/components/ReservationForm";
import Chatbot from "@/components/Chatbot";
import AdminDashboard from "@/app/admin/dashboard/page";
function HomeContent() {
  const { profile, loading } = useAuth();
  if (!loading && profile?.role === "admin") {
    return <AdminDashboard />;
  }
  return (
    <div className="font-sans bg-[#18181b] text-white min-h-screen flex flex-col items-center justify-center p-8 pb-20 gap-16 sm:p-20 relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: 'url(/images/HostMateBG.jpg)' }}
      ></div>
      
      {/* Content overlay */}
      <main className="flex flex-col gap-[32px] items-center sm:items-start relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">HostMate</h1>
          <p className="text-gray-300 drop-shadow-md">Restaurant Management & Reservation System</p>
        </div>
        <AuthForm />
        {!loading && profile?.role === "customer" && <ReservationForm />}
        {/* Only show Chatbot to customers after they're signed in */}
        {(!loading && profile?.role === "customer") && <Chatbot />}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
