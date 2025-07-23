
"use client";
import "@/app/globals.css";

import { AuthProvider } from "@/lib/authContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile && profile.role !== "admin") {
      router.replace("/");
    }
  }, [profile, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!profile || profile.role !== "admin") return null;

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
