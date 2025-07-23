"use client";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/authContext";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AnalyticsPage() {
  const { profile, loading: profileLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [effectRan, setEffectRan] = useState(false);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const timestamp = new Date().toLocaleString();

  useEffect(() => {
    if (!profileLoading && profile?.role === "admin") {
      supabase.rpc('get_reservations_per_day')
        .then(({ data, error }) => {
          setData(data);
          setLoading(false);
          setRpcError(error ? JSON.stringify(error) : null);
        });
      setEffectRan(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, profileLoading, refreshCount]);

  // Always show debug info at the very top, outside all conditionals
  // Add a refresh button and timestamp
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div style={{fontSize:12,background:'#eee',padding:8,marginBottom:16}}>
        <strong>Debug info:</strong><br />
        <button style={{marginBottom:8}} onClick={() => setRefreshCount(c => c + 1)}>Force Refresh</button><br />
        Timestamp: {timestamp}<br />
        profileLoading: {String(profileLoading)}<br />
        profile: {JSON.stringify(profile, null, 2)}<br />
        data: {JSON.stringify(data, null, 2)}<br />
        loading: {String(loading)}<br />
        effectRan: {String(effectRan)}<br />
        rpcError: {rpcError}<br />
        refreshCount: {refreshCount}<br />
      </div>
      {profileLoading || loading ? (
        <div>Loading analytics...</div>
      ) : !profile || profile.role !== "admin" ? (
        <div>Access denied.</div>
      ) : !data || data.length === 0 ? (
        <div>No reservation data.</div>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
          <Bar data={{
            labels: data.map((d: any) => d.day),
            datasets: [
              {
                label: "Reservations per Day",
                data: data.map((d: any) => d.count),
                backgroundColor: "rgba(59, 130, 246, 0.5)",
              },
            ],
          }} />
        </>
      )}
    </div>
  );
}
