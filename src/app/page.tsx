"use client";
import Image from "next/image";
import { AuthProvider, useAuth } from "@/lib/authContext";
import AuthForm from "@/components/AuthForm";
import ReservationForm from "@/components/ReservationForm";
import Chatbot from "@/components/Chatbot";
import Link from "next/link";
function HomeContent() {
  const { profile, loading } = useAuth();
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <AuthForm />
        {!loading && profile?.role === "customer" && <ReservationForm />}
        {/* Only show Chatbot to non-admins */}
        {(!loading && profile?.role !== "admin") && <Chatbot />}
        {!loading && profile?.role === "admin" && (
          <div className="flex flex-col gap-2 mt-4">
            <Link href="/admin" className="text-blue-600 underline">Admin Dashboard</Link>
            <Link href="/admin/analytics" className="text-blue-600 underline">Analytics Dashboard</Link>
          </div>
        )}
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
