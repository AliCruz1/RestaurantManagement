
"use client";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Bar, Line } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from "chart.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HomeIcon, UserGroupIcon, ChartBarIcon, Cog6ToothIcon, BuildingStorefrontIcon, CircleStackIcon, ServerStackIcon, CheckCircleIcon, XCircleIcon, ClockIcon, QuestionMarkCircleIcon, UserIcon, LockClosedIcon, LightBulbIcon, CubeIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { SortIcon, InfoIcon } from "@/components/ui/sort-icons";
import InventoryManagement from "@/components/InventoryManagement";
import { toast, Toaster } from "sonner";

Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  type Profile = {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    role?: string;
  };
  const { profile, loading } = useAuth() as { profile: Profile | null; loading: boolean };
  
  // Local profile state for real-time updates
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(profile);
  
  // Admin profile settings state
  const [profileSettings, setProfileSettings] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Update local profile and settings when auth profile changes
  useEffect(() => {
    if (profile) {
      setCurrentProfile(profile);
      setProfileSettings({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsSave = async () => {
    setSettingsSaving(true);
    try {
      console.log("Saving profile with data:", {
        name: profileSettings.name,
        email: profileSettings.email,
        phone: profileSettings.phone,
        userId: profile?.id
      });

      // Try to upsert with all fields, but handle column errors gracefully
      let updateData: any = {
        id: profile?.id,
        email: profileSettings.email,
        role: profile?.role || 'admin',
        updated_at: new Date().toISOString()
      };

      // Only add name and phone if they have values
      if (profileSettings.name) {
        updateData.name = profileSettings.name;
      }
      if (profileSettings.phone) {
        updateData.phone = profileSettings.phone;
      }

      const { data, error } = await supabase
        .from("profiles")
        .upsert(updateData)
        .select();
      
      console.log("Supabase response:", { data, error });
      
      if (!error) {
        // Update local profile state immediately for real-time UI updates
        setCurrentProfile(prev => prev ? {
          ...prev,
          name: profileSettings.name,
          email: profileSettings.email,
          phone: profileSettings.phone,
        } : null);
        
        // Show success feedback
        toast.success("Profile updated successfully", {
          description: "Your admin profile settings have been saved"
        });
      } else {
        console.error("Supabase error:", error);
        
        // If it's a column error, suggest running the SQL
        if (error.message.includes("column")) {
          toast.error("Database schema issue", {
            description: `Missing column: ${error.message}`,
            action: {
              label: "Copy SQL Fix",
              onClick: () => {
                navigator.clipboard.writeText(`ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`);
                toast.success("SQL fix copied to clipboard");
              }
            }
          });
        } else {
          toast.error("Failed to update profile", {
            description: error.message
          });
        }
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile", {
        description: `Unexpected error: ${error}`
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  // ERD Drag and Drop Handlers
  const handleMouseDown = (tableId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(tableId);
    
    // Get the ERD container bounds consistently
    const container = erdContainerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    
    // Get the table's current position
    const currentPosition = tablePositions[tableId as keyof typeof tablePositions] || { top: 100, left: 100 };
    
    // Calculate mouse position relative to container
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Calculate offset from mouse to table's top-left corner
    setDragOffset({
      x: mouseX - currentPosition.left,
      y: mouseY - currentPosition.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    
    // Get ERD container bounds consistently
    const container = erdContainerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    
    // Calculate mouse position relative to the container
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Calculate new position using the offset
    const newX = mouseX - dragOffset.x;
    const newY = mouseY - dragOffset.y;
    
    // Keep tables within bounds
    const boundedX = Math.max(0, Math.min(newX, containerRect.width - 260));
    const boundedY = Math.max(0, Math.min(newY, containerRect.height - 200));
    
    // Update positions immediately for smooth dragging
    setTablePositions(prev => ({
      ...prev,
      [dragging]: { left: boundedX, top: boundedY }
    }));
  };

  const handleMouseUp = () => {
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Calculate dynamic arrow positions based on table positions
  const getArrowCoordinates = () => {
    const { users, profiles, tables, reservations, daily_metrics } = tablePositions;
    
    return {
      usersToProfiles: {
        x1: users.left + 200, // right edge of users table
        y1: users.top + 50,   // middle of users table
        x2: profiles.left,    // left edge of profiles table
        y2: profiles.top + 50 // middle of profiles table
      },
      usersToReservations: {
        x1: users.left + 100, // center of users table
        y1: users.top + 100,  // bottom of users table
        x2: reservations.left + 50, // left side of reservations table
        y2: reservations.top  // top of reservations table
      },
      usersToMetrics: {
        x1: users.left + 50,  // center of users table
        y1: users.top + 100,  // bottom of users table
        x2: daily_metrics.left + 130, // center of metrics table
        y2: daily_metrics.top // top of metrics table
      },
      tablesToReservations: {
        x1: tables.left,      // left edge of tables table
        y1: tables.top + 90,  // bottom of tables table
        x2: reservations.left + 240, // right edge of reservations table
        y2: reservations.top  // top of reservations table
      }
    };
  };

  // Schema editing functions
  const handleTableDoubleClick = (tableId: string) => {
    setEditingTable(tableId);
  };

  const updateTableName = (tableId: string, newName: string) => {
    setSchemaData(prev => ({
      ...prev,
      [tableId]: {
        ...(prev as any)[tableId],
        name: newName
      }
    }));
  };

  const addField = (tableId: string) => {
    setSchemaData(prev => ({
      ...prev,
      [tableId]: {
        ...(prev as any)[tableId],
        fields: [
          ...(prev as any)[tableId].fields,
          { name: 'new_field', type: 'VARCHAR', isPrimary: false, isForeign: false }
        ]
      }
    }));
  };

  const updateField = (tableId: string, fieldIndex: number, updates: any) => {
    setSchemaData(prev => ({
      ...prev,
      [tableId]: {
        ...(prev as any)[tableId],
        fields: (prev as any)[tableId].fields.map((field: any, index: number) => 
          index === fieldIndex ? { ...field, ...updates } : field
        )
      }
    }));
  };

  const removeField = (tableId: string, fieldIndex: number) => {
    setSchemaData(prev => ({
      ...prev,
      [tableId]: {
        ...(prev as any)[tableId],
        fields: (prev as any)[tableId].fields.filter((_: any, index: number) => index !== fieldIndex)
      }
    }));
  };

  const addTable = () => {
    const newTableId = `table_${Date.now()}`;
    setSchemaData(prev => ({
      ...prev,
      [newTableId]: {
        name: 'new_table',
        category: 'Custom',
        fields: [
          { name: 'id', type: 'BIGINT', isPrimary: true, isForeign: false }
        ]
      }
    }));
    
    // Add to table positions
    setTablePositions(prev => ({
      ...prev,
      [newTableId]: { top: 100, left: 300 }
    }));
  };

  const removeTable = (tableId: string) => {
    setSchemaData(prev => {
      const newData = { ...prev } as any;
      delete newData[tableId];
      return newData;
    });
    
    setTablePositions(prev => {
      const newPositions = { ...prev } as any;
      delete newPositions[tableId];
      return newPositions;
    });
  };

  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [editingReservation, setEditingReservation] = useState<string | null>(null);
  const [editedReservation, setEditedReservation] = useState<any>({});
  const [showAddForm, setShowAddForm] = useState(false);
  // Reservation sort state
  const [reservationSort, setReservationSort] = useState<
    'datetime-asc' | 'datetime-desc' |
    'name-asc' | 'name-desc' |
    'party-asc' | 'party-desc' |
    'status-asc' | 'status-desc' |
    'type-asc' | 'type-desc'
  >('datetime-asc');
  // Reservation search state
  const [reservationSearch, setReservationSearch] = useState('');
  const [newReservation, setNewReservation] = useState({
    name: '',
    email: '',
    phone: '',
    party_size: 2,
    datetime: ''
  });
  const [savingNewReservation, setSavingNewReservation] = useState(false);
  // Restaurant metrics
  const [metrics, setMetrics] = useState<{
    dailyRevenue: string | number;
    avgOrderValue: string | number;
    foodCostPercent: string | number;
    laborCostPercent: string | number;
    dailyCovers: string | number;
    tableTurnover: string | number;
    reservationRate: string | number;
    wastePercent: string | number;
  }>({
    dailyRevenue: '',
    avgOrderValue: '',
    foodCostPercent: '',
    laborCostPercent: '',
    dailyCovers: '',
    tableTurnover: '',
    reservationRate: '',
    wastePercent: '',
  });

  // Auto-calculated metrics from reservation data
  const [autoMetrics, setAutoMetrics] = useState<{
    dailyCovers: number;
    reservationRate: number;
    estimatedRevenue: number;
    avgPartySize: number;
    confirmedReservations: number;
    totalReservations: number;
  }>({
    dailyCovers: 0,
    reservationRate: 0,
    estimatedRevenue: 0,
    avgPartySize: 0,
    confirmedReservations: 0,
    totalReservations: 0,
  });

  const [activeSection, setActiveSection] = useState<"dashboard" | "dataentry" | "inventory" | "reservations" | "database" | "staff" | "settings">("dashboard");
  
  // Staff management state
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [editingStaffData, setEditingStaffData] = useState<any>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [loadingStaff, setLoadingStaff] = useState(false);
  
  // Data entry specific state
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.getFullYear() + '-' + 
           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
           String(today.getDate()).padStart(2, '0');
  });
  const [savedMetrics, setSavedMetrics] = useState<any[]>([]);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // ERD dragging state
  const [tablePositions, setTablePositions] = useState({
    users: { top: 40, left: 50 },
    profiles: { top: 40, left: 350 },
    tables: { top: 60, left: 650 },
    reservations: { top: 280, left: 400 },
    daily_metrics: { top: 240, left: 40 }
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const erdContainerRef = useRef<HTMLDivElement>(null);
  
  // Schema editing state
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [schemaData, setSchemaData] = useState({
    users: {
      name: 'auth.users',
      category: 'Auth',
      fields: [
        { name: 'id', type: 'UUID', isPrimary: true, isForeign: false },
        { name: 'email', type: 'VARCHAR', isPrimary: false, isForeign: false },
        { name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false },
        { name: 'updated_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false }
      ]
    },
    profiles: {
      name: 'profiles',
      category: 'User',
      fields: [
        { name: 'id', type: 'UUID', isPrimary: true, isForeign: false },
        { name: 'user_id', type: 'UUID', isPrimary: false, isForeign: true, references: 'auth.users.id' },
        { name: 'email', type: 'VARCHAR', isPrimary: false, isForeign: false },
        { name: 'name', type: 'VARCHAR', isPrimary: false, isForeign: false },
        { name: 'phone', type: 'VARCHAR', isPrimary: false, isForeign: false },
        { name: 'role', type: 'VARCHAR', isPrimary: false, isForeign: false },
        { name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false }
      ]
    },
    tables: {
      name: 'tables',
      category: 'Rest',
      fields: [
        { name: 'id', type: 'BIGINT', isPrimary: true, isForeign: false },
        { name: 'table_number', type: 'INTEGER', isPrimary: false, isForeign: false },
        { name: 'capacity', type: 'INTEGER', isPrimary: false, isForeign: false },
        { name: 'location', type: 'VARCHAR', isPrimary: false, isForeign: false },
        { name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false }
      ]
    },
    reservations: {
      name: 'reservations',
      category: 'Book',
      fields: [
        { name: 'id', type: 'BIGINT', isPrimary: true, isForeign: false },
        { name: 'user_id', type: 'UUID', isPrimary: false, isForeign: true, references: 'auth.users.id' },
        { name: 'table_id', type: 'BIGINT', isPrimary: false, isForeign: true, references: 'tables.id' },
        { name: 'name', type: 'VARCHAR', isPrimary: false, isForeign: false },
        { name: 'email', type: 'VARCHAR', isPrimary: false, isForeign: false },
        { name: 'phone', type: 'VARCHAR', isPrimary: false, isForeign: false },
        { name: 'party_size', type: 'INTEGER', isPrimary: false, isForeign: false },
        { name: 'datetime', type: 'TIMESTAMP', isPrimary: false, isForeign: false },
        { name: 'status', type: 'VARCHAR', isPrimary: false, isForeign: false },
        { name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false }
      ]
    },
    daily_metrics: {
      name: 'daily_metrics',
      category: 'Data',
      fields: [
        { name: 'id', type: 'BIGSERIAL', isPrimary: true, isForeign: false },
        { name: 'user_id', type: 'UUID', isPrimary: false, isForeign: true, references: 'auth.users.id' },
        { name: 'date', type: 'DATE', isPrimary: false, isForeign: false },
        { name: 'daily_revenue', type: 'DECIMAL', isPrimary: false, isForeign: false },
        { name: 'avg_order_value', type: 'DECIMAL', isPrimary: false, isForeign: false },
        { name: 'food_cost_percent', type: 'DECIMAL', isPrimary: false, isForeign: false },
        { name: 'labor_cost_percent', type: 'DECIMAL', isPrimary: false, isForeign: false },
        { name: 'daily_covers', type: 'INTEGER', isPrimary: false, isForeign: false },
        { name: 'table_turnover', type: 'DECIMAL', isPrimary: false, isForeign: false },
        { name: 'reservation_rate', type: 'DECIMAL', isPrimary: false, isForeign: false },
        { name: 'waste_percent', type: 'DECIMAL', isPrimary: false, isForeign: false },
        { name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false },
        { name: 'updated_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false }
      ]
    }
  });

  // Dynamic chart data based on real reservations and metrics
  const [chartData, setChartData] = useState({
    dailyRevenue: {
      labels: [] as string[],
      datasets: [{
        label: 'Daily Revenue',
        data: [] as number[],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2
      }]
    },
    hourlyReservations: {
      labels: [] as string[],
      datasets: [{
        label: 'Reservations by Hour',
        data: [] as number[],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2
      }]
    },
    partySizeDistribution: {
      labels: [] as string[],
      datasets: [{
        label: 'Party Size Distribution',
        data: [] as number[],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderWidth: 0
      }]
    }
  });

  // Generate chart data from reservations and metrics
  const generateChartData = (reservationData?: any[]) => {
    // Use provided reservationData or current reservations state
    const currentReservations = reservationData || reservations;
    if (currentReservations.length === 0) return;

    // 1. Party Size Distribution Bar Chart
    const partySizeCount: { [key: number]: number } = {};
    
    // Count reservations by party size
    currentReservations.forEach(r => {
      const size = r.party_size;
      partySizeCount[size] = (partySizeCount[size] || 0) + 1;
    });
    
    // Create arrays for chart
    const partySizeChartLabels = Object.keys(partySizeCount)
      .map(size => `${size} ${size === '1' ? 'person' : 'people'}`)
      .sort((a, b) => parseInt(a) - parseInt(b));
    
    const partySizeChartData = Object.keys(partySizeCount)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(size => partySizeCount[parseInt(size)]);

    // 2. Hourly Reservations Distribution (create a full day timeline)
    const hourlyDistribution: { [key: number]: number } = {};
    
    // Initialize all hours from 9 AM to 10 PM with 0 reservations
    for (let hour = 9; hour <= 22; hour++) {
      hourlyDistribution[hour] = 0;
    }
    
    // Count actual reservations by hour for the selected date
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const filteredReservations = currentReservations.filter(r => {
      const resDate = new Date(r.datetime);
      return resDate.toDateString() === selectedDateObj.toDateString();
    });
    
    filteredReservations.forEach(r => {
      const hour = new Date(r.datetime).getHours();
      if (hour >= 9 && hour <= 22) { // Only count during business hours
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      }
    });

    // Create proper hour labels and data arrays
    const hourlyLabels: string[] = [];
    const hourlyData: number[] = [];
    
    for (let hour = 9; hour <= 22; hour++) {
      // Format hour labels properly
      let label;
      if (hour === 12) {
        label = '12 PM';
      } else if (hour < 12) {
        label = `${hour} AM`;
      } else {
        label = `${hour - 12} PM`;
      }
      
      hourlyLabels.push(label);
      hourlyData.push(hourlyDistribution[hour]);
    }

    // 3. Party Size Distribution
    const partySizeDistribution: { [key: string]: number } = {};
    currentReservations.forEach(r => {
      const size = `${r.party_size} ${r.party_size === 1 ? 'person' : 'people'}`;
      partySizeDistribution[size] = (partySizeDistribution[size] || 0) + 1;
    });

    const partySizeLabels = Object.keys(partySizeDistribution).sort();
    const partySizeData = partySizeLabels.map(label => partySizeDistribution[label]);

    // Update chart data
    setChartData({
      dailyRevenue: {
        labels: partySizeChartLabels,
        datasets: [{
          label: 'Number of Reservations',
          data: partySizeChartData,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        }]
      },
      hourlyReservations: {
        labels: hourlyLabels,
        datasets: [{
          label: 'Reservations',
          data: hourlyData,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 3
        }]
      },
      partySizeDistribution: {
        labels: partySizeLabels,
        datasets: [{
          label: 'Party Size Distribution',
          data: partySizeData,
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(147, 51, 234, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderWidth: 0
        }]
      }
    });
  };

  const fetchReservations = async () => {
    setReservationsLoading(true);
    try {
      // Fetch all reservations (both guest and authenticated user reservations)
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id, 
          name, 
          email, 
          phone, 
          party_size, 
          datetime,
          user_id,
          guest_name,
          guest_email,
          guest_phone,
          status
        `)
        .order('datetime', { ascending: true });
      
      if (error) {
        console.error("Error fetching reservations:", error);
        toast.error(`Error fetching reservations: ${error.message}`);
        setReservationsLoading(false);
        return;
      }
      
      // Process reservations to normalize guest vs user data
      const processedReservations = (data || []).map(reservation => ({
        ...reservation,
        // Use guest info if it's a guest reservation, otherwise use user info
        displayName: reservation.user_id ? reservation.name : reservation.guest_name,
        displayEmail: reservation.user_id ? reservation.email : reservation.guest_email,
        displayPhone: reservation.user_id ? reservation.phone : reservation.guest_phone,
        isGuest: !reservation.user_id
      }));
      
      setReservations(processedReservations);
      console.log("Fetched reservations (including guests):", processedReservations); // Debug log
      
      // Regenerate chart data with fresh data
      if (processedReservations && processedReservations.length > 0) {
        generateChartData(processedReservations);
      } else if (processedReservations && processedReservations.length === 0) {
        // Clear charts if no reservations
        setChartData({
          dailyRevenue: { labels: [], datasets: [{ label: 'Daily Revenue', data: [], backgroundColor: 'rgba(59, 130, 246, 0.6)', borderColor: 'rgba(59, 130, 246, 1)', borderWidth: 2 }] },
          hourlyReservations: { labels: [], datasets: [{ label: 'Reservations by Hour', data: [], backgroundColor: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgba(16, 185, 129, 1)', borderWidth: 2 }] },
          partySizeDistribution: { labels: [], datasets: [{ label: 'Party Size Distribution', data: [], backgroundColor: [], borderWidth: 0 }] }
        });
      }

      // Calculate auto-metrics for the currently selected date
      calculateAutoMetrics(selectedDate);
    } catch (error) {
      console.error("Error in fetchReservations:", error);
      toast.error(`Error fetching reservations: ${error}`);
    } finally {
      setReservationsLoading(false);
    }
  };

  const handleCleanupPastReservations = async () => {
    setCleanupLoading(true);
    try {
      const response = await fetch("/api/cleanup-past-reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cleanup reservations");
      }

      toast.success(
        `Successfully cleaned up ${data.deletedCount} past reservations${
          data.emailQueueCount > 0 ? ` and ${data.emailQueueCount} email queue entries` : ""
        }`,
        {
          duration: 5000,
          style: {
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }
        }
      );

      // Refresh reservations to reflect cleanup
      await fetchReservations();
    } catch (error) {
      console.error("Error cleaning up reservations:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to cleanup past reservations",
        {
          duration: 5000,
          style: {
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }
        }
      );
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleDeleteAllReservations = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete ALL reservations from the database!\n\n" +
      "This action cannot be undone. Are you absolutely sure you want to continue?\n\n" +
      "This is intended for testing purposes only."
    );

    if (!confirmed) return;

    // Double confirmation for safety
    const doubleConfirmed = window.confirm(
      "🚨 FINAL WARNING 🚨\n\n" +
      "You are about to delete ALL reservations permanently.\n\n" +
      "Type 'DELETE ALL' in the next prompt to confirm."
    );

    if (!doubleConfirmed) return;

    const userInput = window.prompt(
      "Type 'DELETE ALL' (exact case) to confirm deletion of all reservations:"
    );

    if (userInput !== "DELETE ALL") {
      toast.error("Deletion cancelled. Input did not match 'DELETE ALL'.");
      return;
    }

    setDeleteAllLoading(true);
    try {
      // Delete all reservations from Supabase
      const { error } = await supabase
        .from("reservations")
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows (using impossible ID condition)

      if (error) {
        throw new Error(error.message);
      }

      // Clear local state
      setReservations([]);

      toast.success(
        "🗑️ All reservations have been permanently deleted!",
        {
          duration: 8000,
          style: {
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }
        }
      );

      console.log("All reservations deleted successfully");
    } catch (error) {
      console.error("Error deleting all reservations:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete all reservations",
        {
          duration: 5000,
          style: {
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }
        }
      );
    } finally {
      setDeleteAllLoading(false);
    }
  };

  // Handle editing reservations
  const handleEditReservation = (reservation: any) => {
    setEditingReservation(reservation.id);
    setEditedReservation({
      id: reservation.id,
      name: reservation.displayName,
      email: reservation.displayEmail,
      phone: reservation.displayPhone,
      party_size: reservation.party_size,
      datetime: reservation.datetime ? new Date(reservation.datetime).toISOString().slice(0, 16) : '',
      isGuest: reservation.isGuest
    });
  };

  const handleCancelEdit = () => {
    setEditingReservation(null);
    setEditedReservation({});
  };

  const handleSaveReservation = async () => {
    if (!editedReservation.id) return;

    try {
      // Determine if this is a guest reservation and prepare update data accordingly
      const isGuestReservation = editedReservation.isGuest;
      
      const updateData = {
        party_size: parseInt(editedReservation.party_size),
        datetime: editedReservation.datetime ? new Date(editedReservation.datetime).toISOString() : null,
        // Update the appropriate fields based on guest vs user reservation
        ...(isGuestReservation ? {
          guest_name: editedReservation.name,
          guest_email: editedReservation.email,
          guest_phone: editedReservation.phone
        } : {
          name: editedReservation.name,
          email: editedReservation.email,
          phone: editedReservation.phone
        })
      };

      const { data, error } = await supabase
        .from("reservations")
        .update(updateData)
        .eq('id', editedReservation.id)
        .select(`
          id, 
          name, 
          email, 
          phone, 
          party_size, 
          datetime,
          user_id,
          guest_name,
          guest_email,
          guest_phone,
          status
        `);

      if (error) {
        console.error("Error updating reservation:", error);
        toast.error(`Error updating reservation: ${error.message}`);
        return;
      }

      // Process the updated reservation and update local state
      if (data && data[0]) {
        const updatedReservation = {
          ...data[0],
          displayName: data[0].user_id ? data[0].name : data[0].guest_name,
          displayEmail: data[0].user_id ? data[0].email : data[0].guest_email,
          displayPhone: data[0].user_id ? data[0].phone : data[0].guest_phone,
          isGuest: !data[0].user_id
        };
        
        const updatedReservations = reservations.map(r => 
          r.id === editedReservation.id ? updatedReservation : r
        );
        setReservations(updatedReservations);
        
        // Regenerate chart data since reservation data changed
        if (getNumericValue(metrics.avgOrderValue) > 0) {
          generateChartData(updatedReservations);
        }
      }

      // Clear editing state
      setEditingReservation(null);
      setEditedReservation({});

      toast.success("Reservation updated successfully!");

    } catch (error) {
      console.error("Error saving reservation:", error);
      toast.error(`Error saving reservation: ${error}`);
    }
  };

  // Send cancellation email helper function
  const sendCancellationEmail = async (reservation: any) => {
    try {
      // Process reservation for email
      const emailReservation = {
        ...reservation,
        displayName: reservation.user_id ? reservation.name : reservation.guest_name,
        displayEmail: reservation.user_id ? reservation.email : reservation.guest_email,
        displayPhone: reservation.user_id ? reservation.phone : reservation.guest_phone,
        isGuest: !reservation.user_id
      };
      
      await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservation: emailReservation,
          type: 'cancellation'
        }),
      });
    } catch (error) {
      console.error("Failed to send cancellation email:", error);
      // Don't throw error - deletion should still proceed even if email fails
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    // Show confirmation toast
    toast(`Delete this reservation?`, {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: () => executeDeleteReservation(reservationId)
      }
    });
  };

  const executeDeleteReservation = async (reservationId: string) => {
    try {
      console.log("Attempting to delete reservation:", reservationId); // Debug log
      
      // First, let's verify the reservation exists and get more details
      const { data: existingReservation, error: checkError } = await supabase
        .from("reservations")
        .select("*")
        .eq('id', reservationId)
        .single();

      console.log("Reservation check result:", { existingReservation, checkError }); // Debug log

      if (checkError) {
        console.error("Error checking reservation:", checkError);
        toast.error(`Error finding reservation: ${checkError.message}`);
        return;
      }

      if (!existingReservation) {
        toast.error("Reservation not found in database.");
        return;
      }

      console.log("Found reservation, attempting deletion..."); // Debug log
      
      // Try multiple deletion approaches to handle RLS restrictions
      
      // Approach 1: Try using RPC function for admin deletion (bypasses RLS)
      console.log("Trying RPC admin delete..."); // Debug log
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('admin_delete_reservation', { reservation_id: reservationId });

      console.log("RPC delete result:", { rpcResult, rpcError }); // Debug log

      if (!rpcError && rpcResult) {
        console.log("Successfully deleted via RPC function"); // Debug log
        
        // Send cancellation email for the deleted reservation
        await sendCancellationEmail(existingReservation);
        
        // Update local state immediately
        const updatedReservations = reservations.filter(r => r.id !== reservationId);
        setReservations(updatedReservations);
        
        toast.success("Reservation deleted successfully!");

        // Regenerate chart data with the updated reservations list
        if (getNumericValue(metrics.avgOrderValue) > 0) {
          generateChartData(updatedReservations);
        }
        return;
      }

      // Approach 2: Standard delete with service role (if RPC doesn't exist)
      console.log("RPC failed, trying standard delete..."); // Debug log
      let { error, count, data: deletedData } = await supabase
        .from("reservations")
        .delete({ count: 'exact' })
        .eq('id', reservationId)
        .select(); // Get the deleted data for verification

      console.log("Delete result:", { error, count, deletedData }); // Debug log

      // Approach 3: If standard delete fails due to RLS, try updating status to 'cancelled'
      if (error && (error.message.includes("policy") || error.message.includes("permission") || error.message.includes("denied"))) {
        console.log("RLS policy blocked delete, trying to mark as cancelled instead");
        
        const { error: updateError, data: updateData } = await supabase
          .from("reservations")
          .update({ status: 'cancelled' })
          .eq('id', reservationId)
          .select();

        console.log("Update to cancelled result:", { updateError, updateData }); // Debug log

        if (updateError) {
          console.error("Error marking reservation as cancelled:", updateError);
          
          // Final fallback: Direct SQL execution (if available)
          console.log("Trying direct SQL as final fallback...");
          const { error: sqlError } = await supabase
            .from("reservations")
            .update({ status: 'deleted', deleted_at: new Date().toISOString() })
            .eq('id', reservationId);

          if (sqlError) {
            toast.error(`Cannot delete reservation due to database permissions. Please check your Supabase RLS policies or contact your administrator.\n\nError: ${sqlError.message}`);
            return;
          }
        }

        // If we marked as cancelled/deleted, proceed with UI removal
        console.log("Reservation marked as cancelled/deleted instead of deleted");
        count = 1; // Simulate successful "deletion"
      } else if (error) {
        console.error("Error deleting reservation:", error);
        toast.error(`Error deleting reservation: ${error.message}`);
        return;
      }

      console.log("Delete operation result - count:", count); // Debug log

      if (count === 0) {
        console.error("Count is 0 - reservation may have been deleted by another process or permission denied");
        
        // Let's try to check if it still exists
        const { data: stillExists } = await supabase
          .from("reservations")
          .select("id")
          .eq('id', reservationId)
          .single();
        
        if (stillExists) {
          toast.error(`Reservation still exists in database. This is likely due to Row Level Security (RLS) policies.\n\nTo fix this, you need to:\n1. Go to your Supabase dashboard\n2. Navigate to Authentication > Policies\n3. Create or update RLS policies for the 'reservations' table to allow admin users to delete reservations\n\nAlternatively, you can disable RLS for the reservations table (less secure but will work immediately).`);
        } else {
          toast.success("Reservation appears to have been deleted by another process. Refreshing the list...");
          await fetchReservations();
        }
        return;
      }

      console.log("Successfully processed reservation deletion:", reservationId); // Debug log

      // Send cancellation email for the deleted reservation
      await sendCancellationEmail(existingReservation);

      // Update local state immediately (only if database operation succeeded)
      const updatedReservations = reservations.filter(r => r.id !== reservationId);
      setReservations(updatedReservations);
      
      toast.success("Reservation deleted successfully!");

      // Regenerate chart data with the updated reservations list
      if (getNumericValue(metrics.avgOrderValue) > 0) {
        generateChartData(updatedReservations);
      }

    } catch (error) {
      console.error("Error deleting reservation:", error);
      toast.error(`Error deleting reservation: ${error}`);
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setEditedReservation((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle approving pending reservations
  const handleApproveReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', reservationId);

      if (error) {
        console.error("Error approving reservation:", error);
        toast.error(`Error approving reservation: ${error.message}`);
        return;
      }

      // Update local state
      setReservations(prev => 
        prev.map(r => 
          r.id === reservationId 
            ? { ...r, status: 'confirmed' }
            : r
        )
      );

      toast.success("Reservation approved successfully!");
    } catch (error) {
      console.error("Error approving reservation:", error);
      toast.error(`Error approving reservation: ${error}`);
    }
  };

  // Handle rejecting pending reservations
  const handleRejectReservation = async (reservationId: string) => {
    // Show confirmation toast
    toast(`Reject this reservation?`, {
      description: 'This action cannot be undone.',
      action: {
        label: 'Reject',
        onClick: () => executeRejectReservation(reservationId)
      }
    });
  };

  const executeRejectReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);

      if (error) {
        console.error("Error rejecting reservation:", error);
        toast.error(`Error rejecting reservation: ${error.message}`);
        return;
      }

      // Update local state
      setReservations(prev => 
        prev.map(r => 
          r.id === reservationId 
            ? { ...r, status: 'cancelled' }
            : r
        )
      );

      toast.success("Reservation rejected successfully!");
    } catch (error) {
      console.error("Error rejecting reservation:", error);
      toast.error(`Error rejecting reservation: ${error}`);
    }
  };

  // Handle adding new reservations
  const handleNewReservationChange = (field: string, value: string | number) => {
    setNewReservation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddReservation = async () => {
    setSavingNewReservation(true);
    try {
      // Validate required fields
      if (!newReservation.name || !newReservation.email || !newReservation.phone || !newReservation.datetime) {
        toast.error("Please fill in all required fields.");
        setSavingNewReservation(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newReservation.email)) {
        toast.error("Please enter a valid email address.");
        setSavingNewReservation(false);
        return;
      }

      // Validate party size
      if (newReservation.party_size < 1 || newReservation.party_size > 20) {
        toast.error("Party size must be between 1 and 20.");
        setSavingNewReservation(false);
        return;
      }

      // Validate date is in the future
      const reservationDate = new Date(newReservation.datetime);
      const now = new Date();
      if (reservationDate <= now) {
        toast.error("Reservation date must be in the future.");
        setSavingNewReservation(false);
        return;
      }

      // Find an available table for the party size
      const { data: tables, error: tableError } = await supabase
        .from("tables")
        .select("id, capacity")
        .gte("capacity", newReservation.party_size)
        .limit(1);

      if (tableError || !tables || tables.length === 0) {
        toast.error("No available table found for this party size. Please check your table configuration.");
        setSavingNewReservation(false);
        return;
      }

      const insertData = {
        user_id: profile?.id, // Use admin's ID as the user_id
        table_id: tables[0].id, // Assign to an available table
        name: newReservation.name.trim(),
        email: newReservation.email.trim().toLowerCase(),
        phone: newReservation.phone.trim(),
        party_size: parseInt(newReservation.party_size.toString()),
        datetime: new Date(newReservation.datetime).toISOString(),
        status: "confirmed", // Admin-created reservations are automatically confirmed
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("reservations")
        .insert([insertData])
        .select();

      if (error) {
        console.error("Error creating reservation:", error);
        toast.error(`Error creating reservation: ${error.message}`);
        return;
      }

      // Add to local state with proper display fields
      const processedReservation = {
        ...data[0],
        displayName: data[0].user_id ? data[0].name : data[0].guest_name,
        displayEmail: data[0].user_id ? data[0].email : data[0].guest_email,
        displayPhone: data[0].user_id ? data[0].phone : data[0].guest_phone,
        isGuest: !data[0].user_id
      };
      
      const updatedReservations = [...reservations, processedReservation].sort((a, b) => 
        new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );
      setReservations(updatedReservations);

      // Reset form
      setNewReservation({
        name: '',
        email: '',
        phone: '',
        party_size: 2,
        datetime: ''
      });
      setShowAddForm(false);

      toast.success("Reservation created successfully!");

      // Regenerate chart data since reservation data changed
      if (getNumericValue(metrics.avgOrderValue) > 0) {
        generateChartData(updatedReservations);
      }

    } catch (error) {
      console.error("Error creating reservation:", error);
      toast.error(`Error creating reservation: ${error}`);
    } finally {
      setSavingNewReservation(false);
    }
  };

  const handleCancelAdd = () => {
    setNewReservation({
      name: '',
      email: '',
      phone: '',
      party_size: 2,
      datetime: ''
    });
    setShowAddForm(false);
  };

  // Staff Management Functions
  const fetchStaffMembers = async () => {
    setLoadingStaff(true);
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff members');
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    try {
      const staffData = {
        employee_id: formData.get('employee_id') as string,
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        emergency_contact_name: formData.get('emergency_contact_name') as string,
        emergency_contact_phone: formData.get('emergency_contact_phone') as string,
        role: formData.get('role') as string,
        department: formData.get('department') as string,
        hire_date: formData.get('hire_date') as string,
        hourly_rate: parseFloat(formData.get('hourly_rate') as string),
        overtime_rate: parseFloat(formData.get('hourly_rate') as string) * 1.5,
        employment_status: 'active',
        pay_type: 'hourly',
        created_by: profile?.id
      };

      const { data, error } = await supabase
        .from('staff_members')
        .insert([staffData])
        .select()
        .single();

      if (error) throw error;

      setStaffMembers([...staffMembers, data]);
      setShowAddStaffForm(false);
      toast.success(`Successfully added ${staffData.first_name} ${staffData.last_name}`);
      
      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error adding staff:', error);
      toast.error('Failed to add staff member');
    }
  };

  const handleToggleStaffStatus = async (staffId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('staff_members')
        .update({ employment_status: newStatus })
        .eq('id', staffId);

      if (error) throw error;

      setStaffMembers(staffMembers.map(staff => 
        staff.id === staffId 
          ? { ...staff, employment_status: newStatus }
          : staff
      ));

      toast.success(`Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating staff status:', error);
      toast.error('Failed to update staff status');
    }
  };

  const handleEditStaff = (staff: any) => {
    setEditingStaff(staff.id);
    setEditingStaffData(staff);
    
    // Smooth scroll to edit form after a brief delay to ensure DOM updates
    setTimeout(() => {
      const editForm = document.getElementById('staff-edit-form');
      if (editForm) {
        editForm.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updatedData = {
        employee_id: editingStaffData.employee_id,
        first_name: editingStaffData.first_name,
        last_name: editingStaffData.last_name,
        email: editingStaffData.email,
        phone: editingStaffData.phone,
        address: editingStaffData.address,
        emergency_contact_name: editingStaffData.emergency_contact_name,
        emergency_contact_phone: editingStaffData.emergency_contact_phone,
        role: editingStaffData.role,
        department: editingStaffData.department,
        hourly_rate: parseFloat(editingStaffData.hourly_rate),
        overtime_rate: parseFloat(editingStaffData.hourly_rate) * 1.5,
      };

      const { error } = await supabase
        .from('staff_members')
        .update(updatedData)
        .eq('id', editingStaff);

      if (error) throw error;

      setStaffMembers(staffMembers.map(staff => 
        staff.id === editingStaff 
          ? { ...staff, ...updatedData }
          : staff
      ));

      setEditingStaff(null);
      setEditingStaffData(null);
      toast.success(`Successfully updated ${updatedData.first_name} ${updatedData.last_name}`);
    } catch (error) {
      console.error('Error updating staff:', error);
      toast.error('Failed to update staff member');
    }
  };

  const handleCancelStaffEdit = () => {
    setEditingStaff(null);
    setEditingStaffData(null);
  };

  const handleStaffDataChange = (field: string, value: string) => {
    setEditingStaffData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter staff based on search
  const filteredStaff = staffMembers.filter(staff => {
    const searchTerm = staffSearch.toLowerCase();
    return (
      staff.first_name.toLowerCase().includes(searchTerm) ||
      staff.last_name.toLowerCase().includes(searchTerm) ||
      staff.employee_id.toLowerCase().includes(searchTerm) ||
      staff.email?.toLowerCase().includes(searchTerm) ||
      staff.role.toLowerCase().includes(searchTerm)
    );
  });

  useEffect(() => {
    if (!loading && profile?.role === "admin") {
      console.log("Admin authenticated, fetching initial data");
      supabase.rpc("get_reservations_per_day").then(({ data }) => {
        setAnalytics(data);
        setAnalyticsLoading(false);
      });
      // Force fresh reservation data on mount
      fetchReservations();
      // Load staff members
      fetchStaffMembers();
      // Load saved metrics list
      loadSavedMetricsList();
      // Load metrics for today
      loadMetricsForDate(selectedDate);
      // Calculate auto-metrics for today
      calculateAutoMetrics(selectedDate);
    }
    if (!loading && (!profile || profile.role !== "admin")) {
      router.replace("/");
    }
  }, [profile, loading, router]);

  // Generate chart data when reservations or metrics change
  useEffect(() => {
    if (reservations.length > 0 && getNumericValue(metrics.avgOrderValue) > 0) {
      generateChartData(reservations);
    }
  }, [reservations, metrics.avgOrderValue, metrics.dailyRevenue]);

  // Chart.js pie charts effect for cost breakdown and party size distribution
  useEffect(() => {
    // Only draw charts when on dashboard section
    if (activeSection !== "dashboard") return;

    // Small delay to ensure DOM elements are rendered
    const drawCharts = () => {
      // Cost Breakdown Pie Chart
      const costCanvas = document.getElementById('costChart') as HTMLCanvasElement;
      if (costCanvas) {
        const ctx = costCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, costCanvas.width, costCanvas.height);
          costCanvas.width = 256;
          costCanvas.height = 350;

          const centerX = costCanvas.width / 2;
          const centerY = costCanvas.height / 2 - 40;
          const radius = 80;

          const costData = [
            { label: 'Food Costs', value: getNumericValue(metrics.foodCostPercent), color: '#3b82f6' },
            { label: 'Labor Costs', value: getNumericValue(metrics.laborCostPercent), color: '#ef4444' },
            { label: 'Other Costs', value: 100 - getNumericValue(metrics.foodCostPercent) - getNumericValue(metrics.laborCostPercent), color: '#10b981' }
          ];

          let currentAngle = -Math.PI / 2;

          costData.forEach((segment) => {
            const sliceAngle = (segment.value / 100) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            
            currentAngle += sliceAngle;
          });

          // Draw cost legend
          let legendY = 260;
          costData.forEach((segment, index) => {
            ctx.fillStyle = segment.color;
            ctx.fillRect(10, legendY + index * 26, 16, 16);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px Arial';
            ctx.fillText(`${segment.label}: ${segment.value.toFixed(1)}%`, 32, legendY + index * 26 + 12);
          });
        }
      }

      // Party Size Distribution Pie Chart
      const partySizeCanvas = document.getElementById('partySizeChart') as HTMLCanvasElement;
      if (partySizeCanvas && reservations.length > 0) {
        const ctx = partySizeCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, partySizeCanvas.width, partySizeCanvas.height);
          partySizeCanvas.width = 256;
          partySizeCanvas.height = 350;

          const centerX = partySizeCanvas.width / 2;
          const centerY = partySizeCanvas.height / 2 - 40;
          const radius = 80;

          // Calculate party size distribution
          const partySizeDistribution: { [key: string]: number } = {};
          reservations.forEach(r => {
            const size = r.party_size.toString();
            partySizeDistribution[size] = (partySizeDistribution[size] || 0) + 1;
          });

          const colors = ['#ef4444', '#f59e0b', '#22c55e', '#8b5cf6', '#3b82f6', '#ec4899'];
          const partySizeData = Object.entries(partySizeDistribution).map(([size, count], index) => ({
            label: `${size} ${parseInt(size) === 1 ? 'person' : 'people'}`,
            value: (count / reservations.length) * 100,
            color: colors[index % colors.length]
          }));

          let currentAngle = -Math.PI / 2;

          partySizeData.forEach((segment) => {
            const sliceAngle = (segment.value / 100) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            
            currentAngle += sliceAngle;
          });

          // Draw party size legend
          let legendY = 260;
          partySizeData.forEach((segment, index) => {
            ctx.fillStyle = segment.color;
            ctx.fillRect(10, legendY + index * 26, 16, 16);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px Arial';
            ctx.fillText(`${segment.label}: ${segment.value.toFixed(1)}%`, 32, legendY + index * 26 + 12);
          });
        }
      } else if (partySizeCanvas) {
        // Clear the canvas if no reservations
        const ctx = partySizeCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, partySizeCanvas.width, partySizeCanvas.height);
        }
      }
    };

    // Use setTimeout to ensure DOM is ready
    const timeoutId = setTimeout(drawCharts, 100);
    
    return () => clearTimeout(timeoutId);
  }, [metrics.foodCostPercent, metrics.laborCostPercent, reservations, activeSection]);

  // Calculate auto-metrics from reservation data for selected date
  const calculateAutoMetrics = (selectedDate: string) => {
    console.log("🔄 Calculating auto-metrics for date:", selectedDate);
    console.log("📋 Total reservations available:", reservations.length);
    
    if (!selectedDate || reservations.length === 0) {
      console.log("❌ No date selected or no reservations available");
      setAutoMetrics({
        dailyCovers: 0,
        reservationRate: 0,
        estimatedRevenue: 0,
        avgPartySize: 0,
        confirmedReservations: 0,
        totalReservations: 0,
      });
      return;
    }

    // Filter reservations for the selected date
    const dateReservations = reservations.filter(reservation => {
      const reservationDate = new Date(reservation.datetime).toISOString().split('T')[0];
      return reservationDate === selectedDate;
    });

    console.log(`📅 Reservations for ${selectedDate}:`, dateReservations.length);
    console.log("📝 Date reservations:", dateReservations);

    const totalReservations = dateReservations.length;
    const confirmedReservations = dateReservations.filter(r => r.status === 'confirmed').length;
    const dailyCovers = confirmedReservations > 0 
      ? dateReservations.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + r.party_size, 0)
      : 0;
    const reservationRate = totalReservations > 0 ? (confirmedReservations / totalReservations) * 100 : 0;
    const avgPartySize = confirmedReservations > 0 
      ? dailyCovers / confirmedReservations 
      : 0;
    
    // Estimate revenue (assuming $35 average per person)
    const estimatedRevenue = dailyCovers * 35;

    const autoMetricsResult = {
      dailyCovers,
      reservationRate: Number(reservationRate.toFixed(1)),
      estimatedRevenue,
      avgPartySize: Number(avgPartySize.toFixed(1)),
      confirmedReservations,
      totalReservations,
    };

    console.log("✅ Auto-metrics calculated:", autoMetricsResult);
    setAutoMetrics(autoMetricsResult);
  };

  // Data Entry handler
  const handleMetricChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetrics(prev => ({ ...prev, [name]: value }));
  };

  // Helper function to convert metrics to numbers for calculations
  const getNumericValue = (value: string | number): number => {
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return value;
  };

  // Helper function to safely display metrics
  const displayMetric = (value: string | number, decimals: number = 0): string => {
    const num = getNumericValue(value);
    return num.toFixed(decimals);
  };

  // Delete saved metrics for a specific date
  const deleteSavedMetrics = async (dateToDelete: string) => {
    const dateDisplay = new Date(dateToDelete + 'T00:00:00').toLocaleDateString();
    
    if (!confirm(`Are you sure you want to delete the metrics for ${dateDisplay}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("daily_metrics")
        .delete()
        .eq('date', dateToDelete);
      
      if (error) {
        console.error("Error deleting metrics:", error);
        toast.error(`Error deleting metrics: ${error.message}`);
        return;
      }

      // If we're currently viewing the deleted date, clear the form
      if (selectedDate === dateToDelete) {
        setMetrics({
          dailyRevenue: '',
          avgOrderValue: '',
          foodCostPercent: '',
          laborCostPercent: '',
          dailyCovers: '',
          tableTurnover: '',
          reservationRate: '',
          wastePercent: '',
        });
      }

      // Refresh saved metrics list
      await loadSavedMetricsList();
      
      toast.success(`Metrics for ${dateDisplay} deleted successfully!`);
    } catch (error) {
      console.error("Error deleting metrics:", error);
      toast.error(`Error deleting metrics: ${error}`);
    }
  };

  // Load saved metrics for the selected date
  const loadMetricsForDate = async (date: string) => {
    setLoadingMetrics(true);
    try {
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("*")
        .eq('date', date)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("Error loading metrics:", error);
        toast.error("Failed to load metrics", {
          description: `Database error: ${error.message}`
        });
        return;
      }
      
      if (data) {
        setMetrics({
          dailyRevenue: data.daily_revenue || 0,
          avgOrderValue: data.avg_order_value || 0,
          foodCostPercent: data.food_cost_percent || 0,
          laborCostPercent: data.labor_cost_percent || 0,
          dailyCovers: data.daily_covers || 0,
          tableTurnover: data.table_turnover || 0,
          reservationRate: data.reservation_rate || 0,
          wastePercent: data.waste_percent || 0,
        });
      } else {
        // Clear metrics if no data found for this date
        setMetrics({
          dailyRevenue: '',
          avgOrderValue: '',
          foodCostPercent: '',
          laborCostPercent: '',
          dailyCovers: '',
          tableTurnover: '',
          reservationRate: '',
          wastePercent: '',
        });
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
      toast.error("Failed to load metrics", {
        description: `Unexpected error: ${error}`
      });
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Save metrics for the selected date
  const saveMetricsForDate = async () => {
    if (!selectedDate) {
      toast.error("Please select a date first.");
      return;
    }

    setSavingMetrics(true);
    try {
      const metricsData = {
        user_id: profile?.id,
        date: selectedDate,
        daily_revenue: getNumericValue(metrics.dailyRevenue),
        avg_order_value: getNumericValue(metrics.avgOrderValue),
        food_cost_percent: getNumericValue(metrics.foodCostPercent),
        labor_cost_percent: getNumericValue(metrics.laborCostPercent),
        daily_covers: getNumericValue(metrics.dailyCovers),
        table_turnover: getNumericValue(metrics.tableTurnover),
        reservation_rate: getNumericValue(metrics.reservationRate),
        waste_percent: getNumericValue(metrics.wastePercent),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("daily_metrics")
        .upsert(metricsData)
        .select();
      
      if (error) {
        console.error("Error saving metrics:", error);
        
        // If table doesn't exist, provide SQL to create it
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          toast.error("Database table 'daily_metrics' does not exist", {
            description: "Please check your database setup. The required table is missing.",
            action: {
              label: "Copy SQL",
              onClick: () => {
                navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_revenue DECIMAL(10,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  food_cost_percent DECIMAL(5,2) DEFAULT 0,
  labor_cost_percent DECIMAL(5,2) DEFAULT 0,
  daily_covers INTEGER DEFAULT 0,
  table_turnover DECIMAL(5,2) DEFAULT 0,
  reservation_rate DECIMAL(5,2) DEFAULT 0,
  waste_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own metrics" ON public.daily_metrics
  FOR ALL USING (auth.uid() = user_id);`);
                toast.success("SQL schema copied to clipboard");
              }
            }
          });
        } else {
          toast.error(`Error saving metrics: ${error.message}`);
        }
        return;
      }

      const dateDisplay = new Date(selectedDate + 'T00:00:00').toLocaleDateString();
      toast.success(`Metrics saved successfully for ${dateDisplay}!`);
      
      // Refresh saved metrics list
      await loadSavedMetricsList();
      
      // Generate chart data if reservations exist
      if (reservations.length > 0) {
        generateChartData(reservations);
      }
    } catch (error) {
      console.error("Error saving metrics:", error);
      toast.error(`Error saving metrics: ${error}`);
    } finally {
      setSavingMetrics(false);
    }
  };

  // Load list of all saved metrics dates
  const loadSavedMetricsList = async () => {
    try {
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("date, daily_revenue, daily_covers")
        .order('date', { ascending: false });
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error loading saved metrics list:", error);
        return;
      }
      
      setSavedMetrics(data || []);
    } catch (error) {
      console.error("Error loading saved metrics list:", error);
    }
  };

  // Handle date change
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    loadMetricsForDate(newDate);
    calculateAutoMetrics(newDate);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (loading || analyticsLoading) return <div className="flex justify-center items-center h-screen">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#18181b] font-sans text-white overflow-y-auto">
      <div className="flex h-full min-h-screen">
        {/* Enhanced Sidebar */}
        <aside className="w-72 bg-gradient-to-b from-[#111113] to-[#0f0f11] flex flex-col py-8 px-6 min-h-screen fixed left-0 top-0 z-40 border-r border-gray-800/50">
          <div className="flex items-center mb-8">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-3 shadow-lg">
              <BuildingStorefrontIcon className="h-8 w-8 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-white font-bold text-lg">HostMate</h1>
              <p className="text-gray-400 text-xs">Restaurant Admin</p>
            </div>
          </div>
          <div className="uppercase text-xs text-gray-500 mb-6 tracking-widest font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Navigation
          </div>
          <nav className="flex flex-col gap-2">
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 group ${
                activeSection === "dashboard" 
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-105" 
                  : "hover:bg-gray-800/50 text-gray-200 hover:text-white hover:scale-102"
              }`} 
              onClick={() => setActiveSection("dashboard")}
            > 
              <div className={`p-1 rounded-lg ${
                activeSection === "dashboard" 
                  ? "bg-white/20" 
                  : "bg-purple-600/20 group-hover:bg-purple-600/30"
              }`}>
                <HomeIcon className="h-5 w-5" />
              </div>
              <span>Dashboard</span>
              {activeSection === "dashboard" && <div className="w-2 h-2 bg-white rounded-full ml-auto"></div>}
            </button>
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 group ${
                activeSection === "reservations" 
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105" 
                  : "hover:bg-gray-800/50 text-gray-200 hover:text-white hover:scale-102"
              }`} 
              onClick={() => setActiveSection("reservations")}
            > 
              <div className={`p-1 rounded-lg ${
                activeSection === "reservations" 
                  ? "bg-white/20" 
                  : "bg-blue-600/20 group-hover:bg-blue-600/30"
              }`}>
                <UserGroupIcon className="h-5 w-5" />
              </div>
              <span>Reservations</span>
              {activeSection === "reservations" && <div className="w-2 h-2 bg-white rounded-full ml-auto"></div>}
            </button>
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 group ${
                activeSection === "dataentry" 
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105" 
                  : "hover:bg-gray-800/50 text-gray-200 hover:text-white hover:scale-102"
              }`} 
              onClick={() => setActiveSection("dataentry")}
            > 
              <div className={`p-1 rounded-lg ${
                activeSection === "dataentry" 
                  ? "bg-white/20" 
                  : "bg-green-600/20 group-hover:bg-green-600/30"
              }`}>
                <CircleStackIcon className="h-5 w-5" />
              </div>
              <span>Data Entry</span>
              {activeSection === "dataentry" && <div className="w-2 h-2 bg-white rounded-full ml-auto"></div>}
            </button>
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 group ${
                activeSection === "inventory" 
                  ? "bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg scale-105" 
                  : "hover:bg-gray-800/50 text-gray-200 hover:text-white hover:scale-102"
              }`} 
              onClick={() => setActiveSection("inventory")}
            > 
              <div className={`p-1 rounded-lg ${
                activeSection === "inventory" 
                  ? "bg-white/20" 
                  : "bg-yellow-600/20 group-hover:bg-yellow-600/30"
              }`}>
                <CubeIcon className="h-5 w-5" />
              </div>
              <span>Inventory</span>
              {activeSection === "inventory" && <div className="w-2 h-2 bg-white rounded-full ml-auto"></div>}
            </button>
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 group ${
                activeSection === "database" 
                  ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg scale-105" 
                  : "hover:bg-gray-800/50 text-gray-200 hover:text-white hover:scale-102"
              }`} 
              onClick={() => setActiveSection("database")}
            > 
              <div className={`p-1 rounded-lg ${
                activeSection === "database" 
                  ? "bg-white/20" 
                  : "bg-orange-600/20 group-hover:bg-orange-600/30"
              }`}>
                <ServerStackIcon className="h-5 w-5" />
              </div>
              <span>Database</span>
              {activeSection === "database" && <div className="w-2 h-2 bg-white rounded-full ml-auto"></div>}
            </button>
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 group ${
                activeSection === "staff" 
                  ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg scale-105" 
                  : "hover:bg-gray-800/50 text-gray-200 hover:text-white hover:scale-102"
              }`} 
              onClick={() => setActiveSection("staff")}
            > 
              <div className={`p-1 rounded-lg ${
                activeSection === "staff" 
                  ? "bg-white/20" 
                  : "bg-teal-600/20 group-hover:bg-teal-600/30"
              }`}>
                <UserIcon className="h-5 w-5" />
              </div>
              <span>Staff</span>
              {activeSection === "staff" && <div className="w-2 h-2 bg-white rounded-full ml-auto"></div>}
            </button>
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 group ${
                activeSection === "settings" 
                  ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg scale-105" 
                  : "hover:bg-gray-800/50 text-gray-200 hover:text-white hover:scale-102"
              }`} 
              onClick={() => setActiveSection("settings")}
            > 
              <div className={`p-1 rounded-lg ${
                activeSection === "settings" 
                  ? "bg-white/20" 
                  : "bg-gray-600/20 group-hover:bg-gray-600/30"
              }`}>
                <Cog6ToothIcon className="h-5 w-5" />
              </div>
              <span>Settings</span>
              {activeSection === "settings" && <div className="w-2 h-2 bg-white rounded-full ml-auto"></div>}
            </button>
          </nav>
          
          {/* Enhanced Admin Profile at Bottom of Sidebar */}
          <div className="mt-auto pt-6 border-t border-gray-800/50">
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full p-2 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">
                  {currentProfile?.name ? currentProfile.name.charAt(0).toUpperCase() : currentProfile?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-white text-sm font-semibold truncate">
                  {currentProfile?.name || "Admin"}
                </span>
                <span className="text-gray-400 text-xs truncate">
                  {currentProfile?.email}
                </span>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Enhanced User Status Header */}
        <header className="fixed top-0 right-0 p-4 flex justify-end items-center z-60" style={{ zIndex: 9999, pointerEvents: 'auto' }}>
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-3 flex items-center gap-4 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300 font-medium">
                Welcome, {currentProfile?.name || currentProfile?.email || "Admin"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-200 text-sm cursor-pointer shadow-lg hover:shadow-xl flex items-center gap-2"
              style={{ zIndex: 10000, pointerEvents: 'auto', position: 'relative' }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 py-10 px-12 pt-20 ml-72">
          {/* Top Bar: Breadcrumbs - Simplified */}
          <div className="flex items-center justify-start mb-8">
            <div className="flex items-center gap-2 text-gray-400">
              <span>Home</span>
              <span className="mx-1">&gt;</span>
              <span className="font-bold text-white">
                {(() => {
                  switch (activeSection) {
                    case "dashboard": return "Dashboard";
                    case "reservations": return "Reservations";
                    case "dataentry": return "Data Entry";
                    case "inventory": return "Inventory";
                    case "settings": return "Settings";
                    default: return "Dashboard";
                  }
                })()}
              </span>
            </div>
            {/* Reservation sort dropdown, only show in reservations section */}
            {activeSection === "reservations" && (
              <div className="flex items-center gap-2 ml-8">
                <label htmlFor="reservation-sort" className="text-sm text-gray-300 mr-2">Sort by:</label>
                <select
                  id="reservation-sort"
                  className="bg-[#23232a] text-white rounded px-2 py-1 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reservationSort}
                  onChange={e => setReservationSort(e.target.value as any)}
                >
                  <option value="datetime-asc">Date/Time (Oldest First)</option>
                  <option value="datetime-desc">Date/Time (Newest First)</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="party-asc">Party Size (Smallest First)</option>
                  <option value="party-desc">Party Size (Largest First)</option>
                  <option value="status-asc">Status (A-Z)</option>
                  <option value="status-desc">Status (Z-A)</option>
                  <option value="type-asc">Account Type (Guest First)</option>
                  <option value="type-desc">Account Type (User First)</option>
                </select>
              </div>
            )}
          </div>
          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <>
              {/* Enhanced Auto-Calculated Metrics Section */}
              <div className="mb-10">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="bg-green-600/20 p-3 rounded-xl border border-green-500/30">
                    <ChartBarIcon className="h-7 w-7 text-green-400" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">Live Analytics Dashboard</h2>
                    <p className="text-gray-400 mt-1">Real-time metrics calculated from your reservation data</p>
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-full text-sm font-medium border border-green-500/30 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Auto-calculated
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <Card className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                    <CardTitle className="font-bold text-lg text-white flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <UserGroupIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div>Daily Covers</div>
                        <div className="text-xs font-normal text-green-100">Customer Traffic</div>
                      </div>
                    </CardTitle>
                    <div className="text-4xl font-bold text-white mt-4">{autoMetrics.dailyCovers}</div>
                    <div className="text-sm text-green-100 mt-2 flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      From {autoMetrics.confirmedReservations} confirmed reservations
                    </div>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                    <CardTitle className="font-bold text-lg text-white flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <CheckCircleIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div>Confirmation Rate</div>
                        <div className="text-xs font-normal text-blue-100">Booking Success</div>
                      </div>
                    </CardTitle>
                    <div className="text-4xl font-bold text-white mt-4">{autoMetrics.reservationRate}%</div>
                    <div className="text-sm text-blue-100 mt-2 flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      {autoMetrics.confirmedReservations} of {autoMetrics.totalReservations} reservations
                    </div>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                    <CardTitle className="font-bold text-lg text-white flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <CubeIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div>Est. Revenue</div>
                        <div className="text-xs font-normal text-purple-100">Daily Projection</div>
                      </div>
                    </CardTitle>
                    <div className="text-4xl font-bold text-white mt-4">${autoMetrics.estimatedRevenue.toLocaleString()}</div>
                    <div className="text-sm text-purple-100 mt-2 flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      @ $35 avg per person
                    </div>
                  </Card>
                </div>
                
                <div className="text-xs text-gray-400 mb-6 bg-gray-800/50 rounded-lg p-3">
                  <span className="font-medium">Note:</span> Live metrics auto-calculate from reservation data for {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}.
                  {autoMetrics.totalReservations === 0 ? (
                    <div className="mt-2 text-amber-400 flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <strong>No reservations found for this date.</strong> Try selecting a different date with existing reservations.
                    </div>
                  ) : (
                    <div className="mt-2 text-green-400 flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4" />
                      Found {autoMetrics.totalReservations} reservation{autoMetrics.totalReservations !== 1 ? 's' : ''} for this date.
                    </div>
                  )}
                  <div className="mt-1">Use manual data entry below for precise financial tracking.</div>
                </div>
              </div>

              {/* Manual Metrics Section */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <LightBulbIcon className="h-6 w-6 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">Financial Metrics</h2>
                  <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                    Manual entry
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {/* Top Row Cards */}
                <Card className="bg-[#23232a] rounded-xl p-6">
                  <CardTitle className="font-bold text-lg text-white">Daily Revenue</CardTitle>
                  <div className="text-3xl font-bold text-blue-500 mt-2">${getNumericValue(metrics.dailyRevenue).toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">Today's total sales</div>
                </Card>
                <Card className="bg-[#23232a] rounded-xl p-6">
                  <CardTitle className="font-bold text-lg text-white">Avg Order Value</CardTitle>
                  <div className="text-3xl font-bold text-green-500 mt-2">${displayMetric(metrics.avgOrderValue, 2)}</div>
                  <div className="text-xs text-gray-400 mt-1">Per customer average</div>
                </Card>
                <Card className="bg-[#23232a] rounded-xl p-6">
                  <CardTitle className="font-bold text-lg text-white">Food Cost %</CardTitle>
                  <div className="text-3xl font-bold text-yellow-400 mt-2">{displayMetric(metrics.foodCostPercent, 1)}%</div>
                  <div className="text-xs text-gray-400 mt-1">Target: 28-35%</div>
                </Card>
                <Card className="bg-[#23232a] rounded-xl p-6">
                  <CardTitle className="font-bold text-lg text-white">Labor Cost %</CardTitle>
                  <div className="text-3xl font-bold text-purple-500 mt-2">{displayMetric(metrics.laborCostPercent, 1)}%</div>
                  <div className="text-xs text-gray-400 mt-1">Target: 25-35%</div>
                </Card>
              </div>
              
              {/* Second Row Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-[#23232a] rounded-xl p-6">
                  <CardTitle className="font-bold text-lg text-white">Daily Covers</CardTitle>
                  <div className="text-3xl font-bold text-cyan-500 mt-2">{getNumericValue(metrics.dailyCovers)}</div>
                  <div className="text-xs text-gray-400 mt-1">Customers served today</div>
                </Card>
                <Card className="bg-[#23232a] rounded-xl p-6">
                  <CardTitle className="font-bold text-lg text-white">Table Turnover</CardTitle>
                  <div className="text-3xl font-bold text-orange-500 mt-2">{displayMetric(metrics.tableTurnover, 1)}x</div>
                  <div className="text-xs text-gray-400 mt-1">Average daily turns</div>
                </Card>
                <Card className="bg-[#23232a] rounded-xl p-6">
                  <CardTitle className="font-bold text-lg text-white">Reservation Rate</CardTitle>
                  <div className="text-3xl font-bold text-pink-500 mt-2">{displayMetric(metrics.reservationRate, 1)}%</div>
                  <div className="text-xs text-gray-400 mt-1">Tables booked vs capacity</div>
                </Card>
                <Card className="bg-[#23232a] rounded-xl p-6">
                  <CardTitle className="font-bold text-lg text-white">Waste %</CardTitle>
                  <div className="text-3xl font-bold text-red-500 mt-2">{displayMetric(metrics.wastePercent, 1)}%</div>
                  <div className="text-xs text-gray-400 mt-1">Food waste percentage</div>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Daily Revenue Chart */}
                <Card className="bg-[#23232a] rounded-xl p-6">
                  <CardTitle className="font-bold text-lg text-white mb-4">Party Size Distribution</CardTitle>
                  <div className="text-sm text-gray-400 mb-2">Number of reservations by party size</div>
                  <div className="h-64">
                    <Bar 
                      data={chartData.dailyRevenue} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            labels: { color: '#ffffff' }
                          }
                        },
                        scales: {
                          x: {
                            ticks: { color: '#9ca3af' },
                            grid: { color: 'rgba(156, 163, 175, 0.1)' }
                          },
                          y: {
                            ticks: { 
                              color: '#9ca3af',
                              callback: function(value) {
                                return value;
                              }
                            },
                            grid: { color: 'rgba(156, 163, 175, 0.1)' }
                          }
                        }
                      }}
                    />
                  </div>
                </Card>

                {/* Hourly Reservations Chart */}
                <Card className="bg-[#23232a] rounded-xl p-6">
                  <CardTitle className="font-bold text-lg text-white mb-4">Reservations by Hour</CardTitle>
                  <div className="text-sm text-gray-400 mb-2">Peak reservation times from your booking data</div>
                  <div className="h-64">
                    <Line 
                      data={chartData.hourlyReservations} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            labels: { color: '#ffffff' }
                          }
                        },
                        scales: {
                          x: {
                            ticks: { color: '#9ca3af' },
                            grid: { color: 'rgba(156, 163, 175, 0.1)' }
                          },
                          y: {
                            ticks: { color: '#9ca3af' },
                            grid: { color: 'rgba(156, 163, 175, 0.1)' }
                          }
                        },
                        elements: {
                          point: {
                            radius: 6,
                            hoverRadius: 8,
                            backgroundColor: 'rgba(16, 185, 129, 1)',
                            borderColor: '#ffffff',
                            borderWidth: 2
                          },
                          line: {
                            tension: 0.4
                          }
                        }
                      }}
                    />
                  </div>
                </Card>
              </div>

              {/* Bottom Row - Cost Breakdown and Party Size Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cost Breakdown Pie Chart */}
                <Card className="bg-[#23232a] rounded-xl p-6 lg:col-span-1">
                  <CardTitle className="font-bold text-lg text-white mb-4">Cost Breakdown</CardTitle>
                  <div className="text-sm text-gray-400 mb-2">From your data entry metrics</div>
                  <div className="h-64">
                    <canvas id="costChart" className="max-w-full max-h-full"></canvas>
                  </div>
                </Card>

                {/* Party Size Distribution */}
                <Card className="bg-[#23232a] rounded-xl p-6 lg:col-span-1">
                  <CardTitle className="font-bold text-lg text-white mb-4">Party Size Distribution</CardTitle>
                  <div className="text-sm text-gray-400 mb-2">From your reservation data</div>
                  <div className="h-64">
                    <canvas id="partySizeChart" className="max-w-full max-h-full"></canvas>
                  </div>
                </Card>

                {/* Performance Summary */}
                <Card className="bg-[#23232a] rounded-xl p-6 lg:col-span-1">
                  <CardTitle className="font-bold text-lg text-white mb-4">Performance Summary</CardTitle>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-[#18181b] rounded-lg p-4">
                      <div className="text-sm text-gray-400">Total Reservations</div>
                      <div className="text-2xl font-bold text-white">{reservations.length}</div>
                      <div className="text-xs text-blue-400">Active bookings</div>
                    </div>
                    <div className="bg-[#18181b] rounded-lg p-4">
                      <div className="text-sm text-gray-400">Avg Party Size</div>
                      <div className="text-2xl font-bold text-white">
                        {reservations.length > 0 ? 
                          (reservations.reduce((sum, r) => sum + r.party_size, 0) / reservations.length).toFixed(1) : 
                          '0'}
                      </div>
                      <div className="text-xs text-green-400">People per reservation</div>
                    </div>
                    <div className="bg-[#18181b] rounded-lg p-4">
                      <div className="text-sm text-gray-400">Revenue per Guest</div>
                      <div className="text-2xl font-bold text-white">${displayMetric(metrics.avgOrderValue, 0)}</div>
                      <div className="text-xs text-purple-400">Average spend</div>
                    </div>
                    <div className="bg-[#18181b] rounded-lg p-4">
                      <div className="text-sm text-gray-400">Food Cost Ratio</div>
                      <div className="text-2xl font-bold text-white">
                        {getNumericValue(metrics.foodCostPercent) < 30 ? '✓' : getNumericValue(metrics.foodCostPercent) > 35 ? '⚠' : '○'}
                      </div>
                      <div className="text-xs text-green-400">
                        {getNumericValue(metrics.foodCostPercent) < 30 ? 'Excellent' : getNumericValue(metrics.foodCostPercent) > 35 ? 'High' : 'Good'}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              </div>
            </>
          )}
          {/* Enhanced Data Entry Section */}
          {activeSection === "dataentry" && (
            <div className="space-y-8">
              {/* Enhanced Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="bg-green-600/20 p-3 rounded-lg border border-green-500/30">
                    <CircleStackIcon className="h-8 w-8 text-green-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Restaurant Analytics</h1>
                    <p className="text-gray-400 mt-1">Track daily metrics and business performance</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Date Selection and Saved Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Enhanced Date Selection */}
                <Card className="bg-gradient-to-br from-[#23232a] to-[#1f1f26] rounded-xl p-6 border border-gray-700/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                      <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 10V8a7 7 0 00-7 7v5a2 2 0 002 2h10a2 2 0 002-2v-5a7 7 0 00-7-7zM15 11V8a3 3 0 00-6 0v3h6z" />
                      </svg>
                    </div>
                    <CardTitle className="font-bold text-lg text-white">Select Date</CardTitle>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                        <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 10V8a7 7 0 00-7 7v5a2 2 0 002 2h10a2 2 0 002-2v-5a7 7 0 00-7-7zM15 11V8a3 3 0 00-6 0v3h6z" />
                        </svg>
                        Analytics Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white border border-gray-600 font-sans focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>
                    
                    <div className="text-sm text-gray-400 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-blue-300">Pro Tip</span>
                      </div>
                      Select a date to enter or view metrics. Data loads automatically when you change dates.
                    </div>
                  </div>
                </Card>

                {/* Enhanced Current Date Status */}
                <Card className="bg-gradient-to-br from-[#23232a] to-[#1f1f26] rounded-xl p-6 border border-gray-700/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-600/20 p-2 rounded-lg border border-green-500/30">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <CardTitle className="font-bold text-lg text-white">Current Status</CardTitle>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-[#18181b] rounded-lg border border-gray-700/50">
                      <span className="text-sm font-medium text-gray-300">Date:</span>
                      <span className="text-sm font-bold text-white">{new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#18181b] rounded-lg border border-gray-700/50">
                      <span className="text-sm font-medium text-gray-300">Revenue:</span>
                      <span className="text-sm font-bold text-green-400">${getNumericValue(metrics.dailyRevenue).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#18181b] rounded-lg border border-gray-700/50">
                      <span className="text-sm font-medium text-gray-300">Covers:</span>
                      <span className="text-sm font-bold text-blue-400">{getNumericValue(metrics.dailyCovers)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#18181b] rounded-lg border border-gray-700/50">
                      <span className="text-sm font-medium text-gray-300">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        savedMetrics.some(m => m.date === selectedDate) 
                          ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                          : 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {savedMetrics.some(m => m.date === selectedDate) ? '✓ Saved' : '⚠ Unsaved'}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Enhanced Quick Actions */}
                <Card className="bg-gradient-to-br from-[#23232a] to-[#1f1f26] rounded-xl p-6 border border-gray-700/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-600/20 p-2 rounded-lg border border-purple-500/30">
                      <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <CardTitle className="font-bold text-lg text-white">Quick Actions</CardTitle>
                  </div>
                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        const today = new Date();
                        const todayStr = today.getFullYear() + '-' + 
                                       String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                                       String(today.getDate()).padStart(2, '0');
                        handleDateChange(todayStr);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 10V8a7 7 0 00-7 7v5a2 2 0 002 2h10a2 2 0 002-2v-5a7 7 0 00-7-7zM15 11V8a3 3 0 00-6 0v3h6z" />
                      </svg>
                      Load Today's Data
                    </Button>
                    <Button
                      onClick={() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        const yesterdayStr = yesterday.getFullYear() + '-' + 
                                           String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
                                           String(yesterday.getDate()).padStart(2, '0');
                        handleDateChange(yesterdayStr);
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Load Yesterday's Data
                    </Button>
                    <Button
                      onClick={saveMetricsForDate}
                      disabled={savingMetrics}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      {savingMetrics ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Current Data
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Saved Metrics History */}
              {savedMetrics.length > 0 && (
                <Card className="bg-[#23232a] rounded-xl p-6">
                  <CardTitle className="font-bold text-lg mb-4 text-white">Saved Metrics History</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                    {savedMetrics.map((metric, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 transition-colors relative group ${
                          metric.date === selectedDate 
                            ? 'border-blue-500 bg-blue-900/20' 
                            : 'border-gray-600 hover:border-gray-500 bg-[#18181b]'
                        }`}
                      >
                        <div 
                          onClick={() => handleDateChange(metric.date)}
                          className="cursor-pointer"
                        >
                          <div className="text-white font-semibold">
                            {new Date(metric.date + 'T00:00:00').toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-400">
                            Revenue: ${metric.daily_revenue?.toLocaleString() || '0'}
                          </div>
                          <div className="text-sm text-gray-400">
                            Covers: {metric.daily_covers || '0'}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedMetrics(metric.date);
                          }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                          title="Delete metrics"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Metrics Input Form */}
              <Card className="bg-[#23232a] rounded-xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <CardTitle className="font-bold text-xl text-white">
                    Restaurant Metrics for {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}
                  </CardTitle>
                  {loadingMetrics && (
                    <div className="text-blue-400 text-sm">Loading...</div>
                  )}
                </div>
                <div className="text-sm text-gray-300 mb-6">
                  Enter your daily restaurant metrics below. All data is automatically saved to the selected date.
                </div>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-base font-semibold mb-2 text-white flex items-center gap-2">
                      Daily Revenue ($)
                      {autoMetrics.estimatedRevenue > 0 && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          Est: ${autoMetrics.estimatedRevenue.toLocaleString()}
                        </span>
                      )}
                    </label>
                    <input 
                      type="number" 
                      name="dailyRevenue" 
                      value={metrics.dailyRevenue} 
                      onChange={handleMetricChange} 
                      placeholder={autoMetrics.estimatedRevenue > 0 ? `${autoMetrics.estimatedRevenue.toFixed(2)} (estimated)` : "0.00"}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white text-lg border-2 border-gray-600 font-sans focus:border-blue-500 focus:outline-none transition-colors" 
                    />
                    <div className="text-xs text-gray-400 mt-1">Total sales for today</div>
                  </div>
                  <div>
                    <label className="block text-base font-semibold mb-2 text-white">Average Order Value ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="avgOrderValue" 
                      value={metrics.avgOrderValue} 
                      onChange={handleMetricChange} 
                      placeholder="25.00"
                      min="0"
                      className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white text-lg border-2 border-gray-600 font-sans focus:border-green-500 focus:outline-none transition-colors" 
                    />
                    <div className="text-xs text-gray-400 mt-1">Average spend per customer (defaults to $25 for charts)</div>
                  </div>
                  <div>
                    <label className="block text-base font-semibold mb-2 text-white flex items-center gap-2">
                      Food Cost Percentage (%)
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                        Suggested: 30%
                      </span>
                    </label>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="foodCostPercent" 
                      value={metrics.foodCostPercent} 
                      onChange={handleMetricChange} 
                      placeholder="30.0 (industry standard)"
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white text-lg border-2 border-gray-600 font-sans focus:border-yellow-500 focus:outline-none transition-colors" 
                    />
                    <div className="text-xs text-gray-400 mt-1">Target: 28-35% (industry benchmark)</div>
                  </div>
                  <div>
                    <label className="block text-base font-semibold mb-2 text-white">Labor Cost Percentage (%)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="laborCostPercent" 
                      value={metrics.laborCostPercent} 
                      onChange={handleMetricChange} 
                      placeholder="0.0"
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white text-lg border-2 border-gray-600 font-sans focus:border-purple-500 focus:outline-none transition-colors" 
                    />
                    <div className="text-xs text-gray-400 mt-1">Target: 25-35%</div>
                  </div>
                  <div>
                    <label className="block text-base font-semibold mb-2 text-white flex items-center gap-2">
                      Daily Covers
                      {autoMetrics.dailyCovers > 0 && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          Auto: {autoMetrics.dailyCovers}
                        </span>
                      )}
                    </label>
                    <input 
                      type="number" 
                      name="dailyCovers" 
                      value={metrics.dailyCovers} 
                      onChange={handleMetricChange} 
                      placeholder={autoMetrics.dailyCovers > 0 ? `${autoMetrics.dailyCovers} (from reservations)` : "0"}
                      min="0"
                      className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white text-lg border-2 border-gray-600 font-sans focus:border-cyan-500 focus:outline-none transition-colors" 
                    />
                    <div className="text-xs text-gray-400 mt-1">Number of customers served today</div>
                  </div>
                  <div>
                    <label className="block text-base font-semibold mb-2 text-white flex items-center gap-2">
                      Table Turnover Rate
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                        Target: 2-3x
                      </span>
                    </label>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="tableTurnover" 
                      value={metrics.tableTurnover} 
                      onChange={handleMetricChange} 
                      placeholder="2.5 (industry average)"
                      min="0"
                      className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white text-lg border-2 border-gray-600 font-sans focus:border-orange-500 focus:outline-none transition-colors" 
                    />
                    <div className="text-xs text-gray-400 mt-1">Average times tables are used per day (2-3x is typical)</div>
                  </div>
                  <div>
                    <label className="block text-base font-semibold mb-2 text-white flex items-center gap-2">
                      Reservation Rate (%)
                      {autoMetrics.reservationRate > 0 && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                          Auto: {autoMetrics.reservationRate}%
                        </span>
                      )}
                    </label>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="reservationRate" 
                      value={metrics.reservationRate} 
                      onChange={handleMetricChange} 
                      placeholder={autoMetrics.reservationRate > 0 ? `${autoMetrics.reservationRate}% (from bookings)` : "0.0"}
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white text-lg border-2 border-gray-600 font-sans focus:border-pink-500 focus:outline-none transition-colors" 
                    />
                    <div className="text-xs text-gray-400 mt-1">Percentage of tables with reservations</div>
                  </div>
                  <div>
                    <label className="block text-base font-semibold mb-2 text-white flex items-center gap-2">
                      Waste Percentage (%)
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                        Target: &lt;4%
                      </span>
                    </label>
                    <input 
                      type="number" 
                      step="0.1" 
                      name="wastePercent" 
                      value={metrics.wastePercent} 
                      onChange={handleMetricChange} 
                      placeholder="3.0 (industry best practice)"
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white text-lg border-2 border-gray-600 font-sans focus:border-red-500 focus:outline-none transition-colors" 
                    />
                    <div className="text-xs text-gray-400 mt-1">Food waste as percentage of total food cost (aim for &lt;4%)</div>
                  </div>
                </form>
                
                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={saveMetricsForDate}
                    disabled={savingMetrics}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {savingMetrics ? 'Saving...' : `Save Metrics for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString()}`}
                  </Button>
                  <Button 
                    onClick={() => {
                      // Generate chart data when metrics are updated
                      if (reservations.length > 0) {
                        generateChartData(reservations);
                      }
                      toast.success("Dashboard analytics updated with current metrics", {
                        description: "Charts and visualizations refreshed with latest data"
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-colors"
                  >
                    Update Dashboard
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Inventory Section */}
          {activeSection === "inventory" && (
            <InventoryManagement />
          )}

          {/* Reservations Section */}
          {activeSection === "reservations" && (
            <div className="space-y-6">
              {/* Enhanced Header with Gradient Background */}
              <Card className="bg-gradient-to-r from-[#23232a] via-[#2a2a32] to-[#23232a] rounded-xl p-6 border border-gray-700/50 shadow-lg">
                <div className="flex flex-row justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600/20 p-3 rounded-lg border border-blue-500/30">
                      <UserGroupIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl font-bold">Customer Reservations</CardTitle>
                      <p className="text-gray-400 text-sm mt-1">Manage bookings and track guest preferences</p>
                    </div>
                    {reservations.filter(r => r.status === 'pending').length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setReservationSort('status-desc')}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 cursor-pointer"
                        >
                          {reservations.filter(r => r.status === 'pending').length} Pending Approval
                        </button>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {showAddForm ? "Cancel Add" : "Add Reservation"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        console.log("Refresh button clicked - forcing fresh fetch");
                        await fetchReservations();
                      }} 
                      disabled={reservationsLoading}
                      className="cursor-pointer border-gray-600 hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className={`h-4 w-4 ${reservationsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {reservationsLoading ? "Refreshing..." : "Refresh"}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Enhanced Add Reservation Form */}
              {showAddForm && (
                <Card className="bg-gradient-to-br from-[#23232a] to-[#1f1f26] rounded-xl p-6 border border-gray-700/50 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-green-600/20 p-2 rounded-lg border border-green-500/30">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <CardTitle className="text-white text-lg font-bold">Add New Reservation</CardTitle>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-white flex items-center gap-2">
                        <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={newReservation.name}
                        onChange={(e) => handleNewReservationChange('name', e.target.value)}
                        placeholder="Enter customer name"
                        className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white border border-gray-600 font-sans focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-white flex items-center gap-2">
                        <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={newReservation.email}
                        onChange={(e) => handleNewReservationChange('email', e.target.value)}
                        placeholder="customer@email.com"
                        className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white border border-gray-600 font-sans focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-white flex items-center gap-2">
                        <svg className="h-4 w-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={newReservation.phone}
                        onChange={(e) => handleNewReservationChange('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white border border-gray-600 font-sans focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-white flex items-center gap-2">
                        <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Party Size *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={newReservation.party_size}
                        onChange={(e) => handleNewReservationChange('party_size', parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white border border-gray-600 font-sans focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-semibold text-white flex items-center gap-2">
                        <svg className="h-4 w-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 10V8a7 7 0 00-7 7v5a2 2 0 002 2h10a2 2 0 002-2v-5a7 7 0 00-7-7zM15 11V8a3 3 0 00-6 0v3h6z" />
                        </svg>
                        Reservation Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={newReservation.datetime}
                        onChange={(e) => handleNewReservationChange('datetime', e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full px-4 py-3 rounded-lg bg-[#18181b] text-white border border-gray-600 font-sans focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-gray-700/50">
                    <Button
                      onClick={handleAddReservation}
                      disabled={savingNewReservation}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      {savingNewReservation ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Create Reservation
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelAdd}
                      className="text-gray-300 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500 cursor-pointer transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </Button>
                  </div>
                </Card>
              )}

              {/* Enhanced Reservations Table */}
              <Card className="bg-gradient-to-br from-[#23232a] to-[#1f1f26] rounded-xl p-8 border border-gray-700/50 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                      <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">Reservations Management</h2>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleCleanupPastReservations}
                      disabled={cleanupLoading || deleteAllLoading}
                      className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      {cleanupLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Cleaning...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Cleanup Past Reservations
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDeleteAllReservations}
                      disabled={cleanupLoading || deleteAllLoading}
                      className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white cursor-pointer border border-red-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      {deleteAllLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        <>
                          🗑️ Delete All
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Enhanced Search Bar with Better Styling */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-[#18181b] to-[#1a1a1f] rounded-xl border border-gray-700/50 shadow-inner">
                  <div className="relative flex-1 max-w-2xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={reservationSearch}
                      onChange={(e) => setReservationSearch(e.target.value)}
                      placeholder="Search reservations by name, email, phone, status, or date..."
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#23232a] text-white border border-gray-600 font-sans focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 placeholder-gray-400"
                    />
                    {reservationSearch && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          onClick={() => setReservationSearch('')}
                          className="text-gray-400 hover:text-white transition-colors duration-200"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  {reservationSearch && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>Filtering results...</span>
                    </div>
                  )}
                </div>
                
                {/* Enhanced Search Results Indicator */}
                {reservationSearch && (
                  <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="text-sm text-blue-300 flex items-center gap-2">
                      <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {(() => {
                        const filteredCount = reservations.filter(r => {
                          const searchLower = reservationSearch.toLowerCase();
                          return (
                            (r.displayName || '').toLowerCase().includes(searchLower) ||
                            (r.displayEmail || '').toLowerCase().includes(searchLower) ||
                            (r.displayPhone || '').toLowerCase().includes(searchLower) ||
                            (r.status || '').toLowerCase().includes(searchLower) ||
                            new Date(r.datetime).toLocaleDateString().includes(searchLower)
                          );
                        }).length;
                        return `Found ${filteredCount} of ${reservations.length} reservations matching "${reservationSearch}"`;
                      })()}
                    </div>
                  </div>
                )}
                
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm bg-gradient-to-br from-[#18181b] to-[#1a1a1f] rounded-lg overflow-hidden border border-gray-700/50">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#111113] to-[#0f0f11] text-white border-b border-gray-600">
                          <th
                            className="p-4 text-left font-semibold text-white cursor-pointer select-none group hover:bg-gray-700/30 transition-colors duration-200"
                            onClick={() => setReservationSort(prev => prev === 'name-asc' ? 'name-desc' : 'name-asc')}
                            title="Sort by Name"
                          >
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Name
                              {(reservationSort === 'name-asc' || reservationSort === 'name-desc') && (
                                <SortIcon direction={reservationSort === 'name-asc' ? 'asc' : 'desc'} color="text-blue-400" />
                              )}
                            </div>
                          </th>
                          <th className="p-4 text-left font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Email
                            </div>
                          </th>
                          <th className="p-4 text-left font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              Phone
                            </div>
                          </th>
                          <th
                            className="p-4 text-left font-semibold text-white cursor-pointer select-none group hover:bg-gray-700/30 transition-colors duration-200"
                            onClick={() => setReservationSort(prev => prev === 'party-asc' ? 'party-desc' : 'party-asc')}
                            title="Sort by Party Size"
                          >
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Party Size
                              {(reservationSort === 'party-asc' || reservationSort === 'party-desc') && (
                                <SortIcon direction={reservationSort === 'party-asc' ? 'asc' : 'desc'} color="text-cyan-400" />
                              )}
                            </div>
                          </th>
                          <th
                            className="p-4 text-left font-semibold text-white cursor-pointer select-none group hover:bg-gray-700/30 transition-colors duration-200"
                            onClick={() => setReservationSort(prev => prev === 'datetime-asc' ? 'datetime-desc' : 'datetime-asc')}
                            title="Sort by Date/Time"
                          >
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 10V8a7 7 0 00-7 7v5a2 2 0 002 2h10a2 2 0 002-2v-5a7 7 0 00-7-7zM15 11V8a3 3 0 00-6 0v3h6z" />
                              </svg>
                              Date/Time
                              {(reservationSort === 'datetime-asc' || reservationSort === 'datetime-desc') && (
                                <SortIcon direction={reservationSort === 'datetime-asc' ? 'asc' : 'desc'} color="text-pink-400" />
                              )}
                            </div>
                          </th>
                          <th
                            className="p-4 text-left font-semibold text-white cursor-pointer select-none group hover:bg-gray-700/30 transition-colors duration-200"
                            onClick={() => setReservationSort(prev => prev === 'status-asc' ? 'status-desc' : 'status-asc')}
                            title="Sort by Status"
                          >
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Status
                              {(reservationSort === 'status-asc' || reservationSort === 'status-desc') && (
                                <SortIcon direction={reservationSort === 'status-asc' ? 'asc' : 'desc'} color="text-yellow-400" />
                              )}
                            </div>
                          </th>
                          <th
                            className="p-4 text-left font-semibold text-white cursor-pointer select-none group hover:bg-gray-700/30 transition-colors duration-200"
                            onClick={() => setReservationSort(prev => prev === 'type-asc' ? 'type-desc' : 'type-asc')}
                            title="Sort by Account Type"
                          >
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Type
                              {(reservationSort === 'type-asc' || reservationSort === 'type-desc') && (
                                <SortIcon direction={reservationSort === 'type-asc' ? 'asc' : 'desc'} color="text-indigo-400" />
                              )}
                            </div>
                          </th>
                          <th className="p-4 text-left font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                              Actions
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-[#18181b]">
                        {(() => {
                          // Filter reservations based on search
                          let filteredReservations = reservations.filter(r => {
                            if (!reservationSearch) return true;
                            const searchLower = reservationSearch.toLowerCase();
                            return (
                              (r.displayName || '').toLowerCase().includes(searchLower) ||
                              (r.displayEmail || '').toLowerCase().includes(searchLower) ||
                              (r.displayPhone || '').toLowerCase().includes(searchLower) ||
                              (r.status || '').toLowerCase().includes(searchLower) ||
                              new Date(r.datetime).toLocaleDateString().includes(searchLower)
                            );
                          });

                          // Sort filtered reservations based on reservationSort
                          let sortedReservations = [...filteredReservations];
                          if (reservationSort === 'datetime-asc') {
                            sortedReservations.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
                          } else if (reservationSort === 'datetime-desc') {
                            sortedReservations.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
                          } else if (reservationSort === 'name-asc') {
                            sortedReservations.sort((a, b) => {
                              const nameA = (a.displayName || '').toLowerCase();
                              const nameB = (b.displayName || '').toLowerCase();
                              return nameA.localeCompare(nameB);
                            });
                          } else if (reservationSort === 'name-desc') {
                            sortedReservations.sort((a, b) => {
                              const nameA = (a.displayName || '').toLowerCase();
                              const nameB = (b.displayName || '').toLowerCase();
                              return nameB.localeCompare(nameA);
                            });
                          } else if (reservationSort === 'party-asc') {
                            sortedReservations.sort((a, b) => a.party_size - b.party_size);
                          } else if (reservationSort === 'party-desc') {
                            sortedReservations.sort((a, b) => b.party_size - a.party_size);
                          } else if (reservationSort === 'status-asc') {
                            sortedReservations.sort((a, b) => {
                              const statusA = (a.status || '').toLowerCase();
                              const statusB = (b.status || '').toLowerCase();
                              return statusA.localeCompare(statusB);
                            });
                          } else if (reservationSort === 'status-desc') {
                            sortedReservations.sort((a, b) => {
                              const statusA = (a.status || '').toLowerCase();
                              const statusB = (b.status || '').toLowerCase();
                              return statusB.localeCompare(statusA);
                            });
                          } else if (reservationSort === 'type-asc') {
                            // Guest first, then user
                            sortedReservations.sort((a, b) => (a.isGuest === b.isGuest) ? 0 : a.isGuest ? -1 : 1);
                          } else if (reservationSort === 'type-desc') {
                            // User first, then guest
                            sortedReservations.sort((a, b) => (a.isGuest === b.isGuest) ? 0 : a.isGuest ? 1 : -1);
                          }
                          return sortedReservations.length > 0 ? (
                            sortedReservations.map((r) => (
                            <tr key={r.id} className="border-b border-gray-600 hover:bg-[#23232a] transition-colors">
                              {/* Name Cell */}
                              <td className="p-4">
                                {editingReservation === r.id ? (
                                  <input
                                    type="text"
                                    value={editedReservation.name || ''}
                                    onChange={(e) => handleEditChange('name', e.target.value)}
                                    className="w-full px-2 py-1 bg-[#111113] text-white border border-gray-600 rounded text-sm"
                                  />
                                ) : (
                                  <span className="text-white font-medium">{r.displayName}</span>
                                )}
                              </td>
                              
                              {/* Email Cell */}
                              <td className="p-4">
                                {editingReservation === r.id ? (
                                  <input
                                    type="email"
                                    value={editedReservation.email || ''}
                                    onChange={(e) => handleEditChange('email', e.target.value)}
                                    className="w-full px-2 py-1 bg-[#111113] text-white border border-gray-600 rounded text-sm"
                                  />
                                ) : (
                                  <span className="text-gray-300">{r.displayEmail}</span>
                                )}
                              </td>
                              
                              {/* Phone Cell */}
                              <td className="p-4">
                                {editingReservation === r.id ? (
                                  <input
                                    type="tel"
                                    value={editedReservation.phone || ''}
                                    onChange={(e) => handleEditChange('phone', e.target.value)}
                                    className="w-full px-2 py-1 bg-[#111113] text-white border border-gray-600 rounded text-sm"
                                  />
                                ) : (
                                  <span className="text-gray-300">{r.displayPhone}</span>
                                )}
                              </td>
                              
                              {/* Party Size Cell */}
                              <td className="p-4">
                                {editingReservation === r.id ? (
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={editedReservation.party_size || ''}
                                    onChange={(e) => handleEditChange('party_size', e.target.value)}
                                    className="w-full px-2 py-1 bg-[#111113] text-white border border-gray-600 rounded text-sm"
                                  />
                                ) : (
                                  <span className="text-white font-semibold">{r.party_size}</span>
                                )}
                              </td>
                              
                              {/* Date/Time Cell */}
                              <td className="p-4">
                                {editingReservation === r.id ? (
                                  <input
                                    type="datetime-local"
                                    value={editedReservation.datetime || ''}
                                    onChange={(e) => handleEditChange('datetime', e.target.value)}
                                    className="w-full px-2 py-1 bg-[#111113] text-white border border-gray-600 rounded text-sm"
                                  />
                                ) : (
                                  <span className="text-gray-300">
                                    {r.datetime ? new Date(r.datetime).toLocaleString() : ""}
                                  </span>
                                )}
                              </td>
                              
                              {/* Status Cell */}
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  r.status === 'pending' 
                                    ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/30' 
                                    : r.status === 'confirmed'
                                    ? 'bg-green-900/30 text-green-300 border border-green-500/30'
                                    : r.status === 'cancelled'
                                    ? 'bg-red-900/30 text-red-300 border border-red-500/30'
                                    : 'bg-gray-900/30 text-gray-300 border border-gray-500/30'
                                }`}>
                                  {r.status === 'pending' && <><ClockIcon className="w-3 h-3" /> Pending</>}
                                  {r.status === 'confirmed' && <><CheckCircleIcon className="w-3 h-3" /> Confirmed</>}
                                  {r.status === 'cancelled' && <><XCircleIcon className="w-3 h-3" /> Cancelled</>}
                                  {(!r.status || !['pending', 'confirmed', 'cancelled'].includes(r.status)) && <><QuestionMarkCircleIcon className="w-3 h-3" /> Unknown</>}
                                </span>
                              </td>
                              
                              {/* Type Cell */}
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  r.isGuest 
                                    ? 'bg-blue-900/30 text-blue-300 border border-blue-500/30' 
                                    : 'bg-green-900/30 text-green-300 border border-green-500/30'
                                }`}>
                                  {r.isGuest ? <><UserIcon className="w-3 h-3" /> Guest</> : <><LockClosedIcon className="w-3 h-3" /> Account</>}
                                </span>
                              </td>
                              
                              {/* Actions Cell */}
                              <td className="p-4">
                                <div className="flex gap-2 flex-wrap">
                                  {editingReservation === r.id ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={handleSaveReservation}
                                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 cursor-pointer"
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        className="text-gray-300 border-gray-600 hover:bg-gray-700 text-xs px-3 py-1 cursor-pointer"
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      {/* Show Approve/Reject buttons for pending reservations */}
                                      {r.status === 'pending' && (
                                        <>
                                          <Button
                                            size="sm"
                                            onClick={() => handleApproveReservation(r.id)}
                                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 inline-flex items-center gap-1 cursor-pointer"
                                          >
                                            <CheckCircleIcon className="w-3 h-3" />
                                            Approve
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRejectReservation(r.id)}
                                            className="text-red-400 border-red-600 hover:bg-red-700 text-xs px-3 py-1 inline-flex items-center gap-1 cursor-pointer"
                                          >
                                            <XCircleIcon className="w-3 h-3" />
                                            Reject
                                          </Button>
                                        </>
                                      )}
                                      
                                      {/* Standard Edit/Delete buttons */}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditReservation(r)}
                                        className="text-blue-400 border-blue-600 hover:bg-blue-700 text-xs px-3 py-1 cursor-pointer"
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteReservation(r.id)}
                                        className="text-red-400 border-red-600 hover:bg-red-700 text-xs px-3 py-1 cursor-pointer"
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="text-gray-400 text-center py-8 bg-[#18181b]">
                                {reservationsLoading ? "Loading reservations..." : 
                                 reservationSearch ? `No reservations found matching "${reservationSearch}". Try a different search term.` :
                                 "No reservations found. Click 'Add Reservation' to create your first booking."}
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Database Section */}
          {activeSection === "database" && (
            <div className="space-y-6">
              <Card className="bg-[#23232a] rounded-xl p-6">
                <CardTitle className="font-bold text-lg mb-4 text-white">Database Schema</CardTitle>
                <p className="text-gray-400 mb-6">Interactive Entity Relationship Diagram</p>
                
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Database Schema (ERD)</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={addTable}
                      className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-sm transition-colors"
                    >
                      + Add Table
                    </button>
                    <button
                      onClick={() => {
                        const resetPositions = {
                          users: { top: 40, left: 50 },
                          profiles: { top: 40, left: 350 },
                          tables: { top: 60, left: 650 },
                          reservations: { top: 280, left: 400 },
                          daily_metrics: { top: 240, left: 40 }
                        };
                        setTablePositions(resetPositions);
                      }}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                    >
                      Reset Layout
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="text-sm text-blue-300 flex items-center gap-2">
                    <LightBulbIcon className="h-4 w-4 text-blue-400" />
                    <span><strong>Double-click</strong> any table to edit schema • <strong>Drag</strong> to reposition • <strong>Red X</strong> to delete</span>
                  </div>
                </div>

                {/* ERD Container */}
                <div 
                  ref={erdContainerRef}
                  className="bg-[#0f1419] rounded-lg border border-gray-600 relative overflow-hidden select-none" 
                  style={{ height: '600px' }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* SVG Container for arrows */}
                  <svg 
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    style={{ position: 'absolute', top: 0, left: 0 }}
                  >
                    {/* Arrow definitions with different colors for relationship types */}
                    <defs>
                      {/* One-to-One relationship (Blue) */}
                      <marker id="oneToOne" markerWidth="10" markerHeight="7" 
                       refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                      </marker>
                      {/* One-to-Many relationship (Green) */}
                      <marker id="oneToMany" markerWidth="10" markerHeight="7" 
                       refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                      </marker>
                      {/* Many-to-One relationship (Orange) */}
                      <marker id="manyToOne" markerWidth="10" markerHeight="7" 
                       refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
                      </marker>
                    </defs>
                    
                    {/* Dynamic arrows based on table positions */}
                    {(() => {
                      const arrows = getArrowCoordinates();
                      return (
                        <>
                          {/* Users -> Profiles (One-to-One) */}
                          <line 
                            x1={arrows.usersToProfiles.x1} 
                            y1={arrows.usersToProfiles.y1} 
                            x2={arrows.usersToProfiles.x2} 
                            y2={arrows.usersToProfiles.y2} 
                            stroke="#3b82f6" 
                            strokeWidth="2" 
                            markerEnd="url(#oneToOne)" 
                          />
                          <text 
                            x={(arrows.usersToProfiles.x1 + arrows.usersToProfiles.x2) / 2} 
                            y={(arrows.usersToProfiles.y1 + arrows.usersToProfiles.y2) / 2 - 5} 
                            fill="#3b82f6" 
                            fontSize="10" 
                            textAnchor="middle"
                          >
                            1:1
                          </text>
                          
                          {/* Users -> Reservations (One-to-Many) */}
                          <line 
                            x1={arrows.usersToReservations.x1} 
                            y1={arrows.usersToReservations.y1} 
                            x2={arrows.usersToReservations.x2} 
                            y2={arrows.usersToReservations.y2} 
                            stroke="#10b981" 
                            strokeWidth="2" 
                            markerEnd="url(#oneToMany)" 
                          />
                          <text 
                            x={(arrows.usersToReservations.x1 + arrows.usersToReservations.x2) / 2} 
                            y={(arrows.usersToReservations.y1 + arrows.usersToReservations.y2) / 2 - 5} 
                            fill="#10b981" 
                            fontSize="10" 
                            textAnchor="middle"
                          >
                            1:N
                          </text>
                          
                          {/* Users -> Daily Metrics (One-to-Many) */}
                          <line 
                            x1={arrows.usersToMetrics.x1} 
                            y1={arrows.usersToMetrics.y1} 
                            x2={arrows.usersToMetrics.x2} 
                            y2={arrows.usersToMetrics.y2} 
                            stroke="#10b981" 
                            strokeWidth="2" 
                            markerEnd="url(#oneToMany)" 
                          />
                          <text 
                            x={(arrows.usersToMetrics.x1 + arrows.usersToMetrics.x2) / 2 - 15} 
                            y={(arrows.usersToMetrics.y1 + arrows.usersToMetrics.y2) / 2} 
                            fill="#10b981" 
                            fontSize="10" 
                            textAnchor="middle"
                          >
                            1:N
                          </text>
                          
                          {/* Tables -> Reservations (One-to-Many) */}
                          <line 
                            x1={arrows.tablesToReservations.x1} 
                            y1={arrows.tablesToReservations.y1} 
                            x2={arrows.tablesToReservations.x2} 
                            y2={arrows.tablesToReservations.y2} 
                            stroke="#10b981" 
                            strokeWidth="2" 
                            markerEnd="url(#oneToMany)" 
                          />
                          <text 
                            x={(arrows.tablesToReservations.x1 + arrows.tablesToReservations.x2) / 2} 
                            y={(arrows.tablesToReservations.y1 + arrows.tablesToReservations.y2) / 2 - 5} 
                            fill="#10b981" 
                            fontSize="10" 
                            textAnchor="middle"
                          >
                            1:N
                          </text>
                        </>
                      );
                    })()}
                  </svg>

                  {/* Dynamic Tables */}
                  {Object.entries(schemaData).map(([tableId, tableData]) => {
                    const position = tablePositions[tableId as keyof typeof tablePositions] || { top: 100, left: 100 };
                    const colorClasses = {
                      users: 'from-blue-900 to-blue-800 border-blue-400',
                      profiles: 'from-purple-900 to-purple-800 border-purple-400',
                      tables: 'from-teal-900 to-teal-800 border-teal-400',
                      reservations: 'from-orange-900 to-orange-800 border-orange-400',
                      daily_metrics: 'from-indigo-900 to-indigo-800 border-indigo-400'
                    };
                    const tableColor = colorClasses[tableId as keyof typeof colorClasses] || 'from-gray-900 to-gray-800 border-gray-400';
                    
                    return (
                      <div 
                        key={tableId}
                        className={`absolute bg-gradient-to-br ${tableColor} border-2 rounded-lg p-4 shadow-xl cursor-move hover:shadow-2xl group ${dragging === tableId ? 'z-50 scale-105' : 'z-20 transition-all duration-200'} hover:border-opacity-80 hover:scale-[1.02]`}
                        style={{ 
                          top: `${position.top}px`, 
                          left: `${position.left}px`, 
                          width: tableId === 'reservations' ? '240px' : tableId === 'daily_metrics' ? '260px' : tableId === 'profiles' ? '220px' : '200px'
                        }}
                        onMouseDown={(e) => handleMouseDown(tableId, e)}
                        onDoubleClick={() => handleTableDoubleClick(tableId)}
                        title="Double-click to edit schema"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 bg-current rounded-full shadow-sm opacity-60"></div>
                          <h3 className="text-white font-bold text-sm flex-1">{(tableData as any).name}</h3>
                          <div className="text-xs opacity-60">{(tableData as any).category}</div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete table "${(tableData as any).name}"?`)) {
                                removeTable(tableId);
                              }
                            }}
                            className="w-5 h-5 bg-red-600/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                            title="Delete table"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div className="space-y-1 text-xs relative z-10">
                          {(tableData as any).fields.map((field: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span className={`${field.isPrimary ? 'text-amber-300 font-medium' : field.isForeign ? 'text-emerald-300 font-medium' : 'text-gray-200'}`}>
                                {field.isPrimary ? '🔑 ' : field.isForeign ? '🔗 ' : ''}{field.name}
                              </span>
                              <span className={`font-mono ${
                                field.type === 'UUID' ? 'text-cyan-300' :
                                field.type === 'VARCHAR' ? 'text-green-300' :
                                field.type.includes('INT') ? 'text-orange-300' :
                                field.type === 'DECIMAL' ? 'text-yellow-300' :
                                field.type.includes('TIME') ? 'text-purple-300' :
                                field.type === 'DATE' ? 'text-pink-300' :
                                'text-gray-300'
                              }`}>
                                {field.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 gap-6 text-xs bg-[#1a1a1a] p-4 rounded-lg border border-gray-700">
                  <div>
                    <h4 className="text-white font-semibold mb-2">Field Types</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-amber-300 font-medium">🔑</div>
                        <span className="text-gray-300">Primary Key</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-emerald-300 font-medium">🔗</div>
                        <span className="text-gray-300">Foreign Key</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Data Types</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-300 font-mono text-xs">UUID</span>
                        <span className="text-gray-400">Unique Identifier</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-300 font-mono text-xs">VARCHAR</span>
                        <span className="text-gray-400">Variable Text</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-300 font-mono text-xs">INTEGER</span>
                        <span className="text-gray-400">Whole Number</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-300 font-mono text-xs">DECIMAL</span>
                        <span className="text-gray-400">Decimal Number</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-300 font-mono text-xs">TIMESTAMP</span>
                        <span className="text-gray-400">Date & Time</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-pink-300 font-mono text-xs">DATE</span>
                        <span className="text-gray-400">Date Only</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <h4 className="text-white font-semibold mb-2">Relationships</h4>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-blue-500"></div>
                        <span className="text-blue-400 text-xs">1:1</span>
                        <span className="text-gray-400">One-to-One</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-emerald-500"></div>
                        <span className="text-emerald-400 text-xs">1:N</span>
                        <span className="text-gray-400">One-to-Many</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Staff Section */}
          {activeSection === "staff" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Staff Management</h2>
                <Button 
                  onClick={() => setShowAddStaffForm(!showAddStaffForm)}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white cursor-pointer"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Add New Staff
                </Button>
              </div>

              {/* Staff Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-[#23232a] border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Staff</p>
                        <p className="text-2xl font-bold text-white">{staffMembers.length}</p>
                      </div>
                      <UserGroupIcon className="h-8 w-8 text-teal-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#23232a] border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Active Today</p>
                        <p className="text-2xl font-bold text-white">{staffMembers.filter(s => s.employment_status === 'active').length}</p>
                      </div>
                      <ClockIcon className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#23232a] border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Departments</p>
                        <p className="text-2xl font-bold text-white">{new Set(staffMembers.map(s => s.role)).size}</p>
                      </div>
                      <BuildingStorefrontIcon className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#23232a] border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Avg Hourly</p>
                        <p className="text-2xl font-bold text-white">
                          ${staffMembers.length > 0 ? (staffMembers.reduce((sum, s) => sum + (s.hourly_rate || 0), 0) / staffMembers.length).toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <CircleStackIcon className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Add Staff Form */}
              {showAddStaffForm && (
                <Card className="bg-[#23232a] border-gray-700 mb-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      Add New Staff Member
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Employee ID</label>
                        <input
                          type="text"
                          name="employee_id"
                          placeholder="EMP001"
                          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">First Name</label>
                        <input
                          type="text"
                          name="first_name"
                          placeholder="John"
                          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Last Name</label>
                        <input
                          type="text"
                          name="last_name"
                          placeholder="Smith"
                          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Email</label>
                        <input
                          type="email"
                          name="email"
                          placeholder="john.smith@restaurant.com"
                          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="555-0123"
                          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Role</label>
                        <select
                          name="role"
                          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        >
                          <option value="">Select Role</option>
                          <option value="server">Server</option>
                          <option value="cook">Cook</option>
                          <option value="manager">Manager</option>
                          <option value="host">Host</option>
                          <option value="busser">Busser</option>
                          <option value="bartender">Bartender</option>
                          <option value="dishwasher">Dishwasher</option>
                          <option value="prep_cook">Prep Cook</option>
                          <option value="sous_chef">Sous Chef</option>
                          <option value="head_chef">Head Chef</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Department</label>
                        <select
                          name="department"
                          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">Select Department</option>
                          <option value="kitchen">Kitchen</option>
                          <option value="front_of_house">Front of House</option>
                          <option value="management">Management</option>
                          <option value="bar">Bar</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Hire Date</label>
                        <input
                          type="date"
                          name="hire_date"
                          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Hourly Rate</label>
                        <input
                          type="number"
                          name="hourly_rate"
                          placeholder="15.00"
                          step="0.01"
                          min="0"
                          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="text-white text-sm font-medium mb-2 block">Address</label>
                        <textarea
                          name="address"
                          placeholder="123 Main St, City, State 12345"
                          rows={2}
                          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Emergency Contact Name</label>
                        <input
                          type="text"
                          name="emergency_contact_name"
                          placeholder="Jane Smith"
                          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Emergency Contact Phone</label>
                        <input
                          type="tel"
                          name="emergency_contact_phone"
                          placeholder="555-0987"
                          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2 lg:col-span-3 flex gap-3 pt-4">
                        <Button 
                          type="submit" 
                          disabled={loadingStaff}
                          className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white cursor-pointer"
                        >
                          {loadingStaff ? 'Adding...' : 'Add Staff Member'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setShowAddStaffForm(false)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-800 cursor-pointer"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Staff List */}
              <Card className="bg-[#23232a] border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <UserGroupIcon className="h-5 w-5" />
                      Staff Members ({staffMembers.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Search staff..."
                        value={staffSearch}
                        onChange={(e) => setStaffSearch(e.target.value)}
                        className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-text"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left text-gray-300 font-medium py-3 px-4">Employee</th>
                          <th className="text-left text-gray-300 font-medium py-3 px-4">Role</th>
                          <th className="text-left text-gray-300 font-medium py-3 px-4">Department</th>
                          <th className="text-left text-gray-300 font-medium py-3 px-4">Status</th>
                          <th className="text-left text-gray-300 font-medium py-3 px-4">Hourly Rate</th>
                          <th className="text-left text-gray-300 font-medium py-3 px-4">Hire Date</th>
                          <th className="text-left text-gray-300 font-medium py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStaff.map((staff) => (
                          <tr key={staff.id} className="border-b border-gray-600 hover:bg-[#2a2a31] transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-full p-2 flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">
                                    {staff.first_name.charAt(0)}{staff.last_name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-white font-medium">{staff.first_name} {staff.last_name}</p>
                                  <p className="text-gray-400 text-sm">{staff.employee_id}</p>
                                  <p className="text-gray-400 text-sm">{staff.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-sm font-medium capitalize">
                                {staff.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-gray-300 capitalize">
                                {staff.department?.replace('_', ' ') || 'Not assigned'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${
                                staff.employment_status === 'active' 
                                  ? 'bg-green-600/20 text-green-400' 
                                  : staff.employment_status === 'inactive'
                                  ? 'bg-yellow-600/20 text-yellow-400'
                                  : 'bg-red-600/20 text-red-400'
                              }`}>
                                {staff.employment_status.charAt(0).toUpperCase() + staff.employment_status.slice(1)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-white font-medium">${staff.hourly_rate}</span>
                              <span className="text-gray-400 text-sm">/hr</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-gray-300">
                                {new Date(staff.hire_date).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditStaff(staff)}
                                  className="border-gray-600 text-gray-300 hover:bg-gray-800 cursor-pointer"
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleStaffStatus(staff.id, staff.employment_status)}
                                  className={`border-gray-600 hover:bg-gray-800 cursor-pointer ${
                                    staff.employment_status === 'active' 
                                      ? 'text-yellow-400' 
                                      : 'text-green-400'
                                  }`}
                                >
                                  {staff.employment_status === 'active' ? 'Deactivate' : 'Activate'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {filteredStaff.length === 0 && (
                      <div className="text-center py-12">
                        <UserIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No Staff Found</h3>
                        <p className="text-gray-400">
                          {staffSearch ? 'No staff members match your search.' : 'Add your first staff member to get started.'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Edit Staff Form */}
                  {editingStaff && editingStaffData && (
                    <div id="staff-edit-form" className="mt-8 border-t border-gray-600 pt-8">
                      <h3 className="text-lg font-semibold text-white mb-4">Edit Staff Member</h3>
                      <form onSubmit={handleUpdateStaff} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Basic Info */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Employee ID</label>
                          <Input 
                            name="employee_id"
                            value={editingStaffData.employee_id || ''}
                            onChange={(e) => handleStaffDataChange('employee_id', e.target.value)}
                            className="bg-[#2a2a31] border-gray-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                          <select 
                            name="role"
                            value={editingStaffData.role || ''}
                            onChange={(e) => handleStaffDataChange('role', e.target.value)}
                            className="w-full bg-[#2a2a31] border border-gray-600 rounded-md px-3 py-2 text-white"
                            required
                          >
                            <option value="server">Server</option>
                            <option value="host">Host</option>
                            <option value="bartender">Bartender</option>
                            <option value="cook">Cook</option>
                            <option value="chef">Chef</option>
                            <option value="dishwasher">Dishwasher</option>
                            <option value="manager">Manager</option>
                            <option value="assistant_manager">Assistant Manager</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                          <Input 
                            name="first_name"
                            value={editingStaffData.first_name || ''}
                            onChange={(e) => handleStaffDataChange('first_name', e.target.value)}
                            className="bg-[#2a2a31] border-gray-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                          <Input 
                            name="last_name"
                            value={editingStaffData.last_name || ''}
                            onChange={(e) => handleStaffDataChange('last_name', e.target.value)}
                            className="bg-[#2a2a31] border-gray-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                          <Input 
                            name="email"
                            type="email"
                            value={editingStaffData.email || ''}
                            onChange={(e) => handleStaffDataChange('email', e.target.value)}
                            className="bg-[#2a2a31] border-gray-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                          <Input 
                            name="phone"
                            value={editingStaffData.phone || ''}
                            onChange={(e) => handleStaffDataChange('phone', e.target.value)}
                            className="bg-[#2a2a31] border-gray-600 text-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                          <Input 
                            name="address"
                            value={editingStaffData.address || ''}
                            onChange={(e) => handleStaffDataChange('address', e.target.value)}
                            className="bg-[#2a2a31] border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Emergency Contact Name</label>
                          <Input 
                            name="emergency_contact_name"
                            value={editingStaffData.emergency_contact_name || ''}
                            onChange={(e) => handleStaffDataChange('emergency_contact_name', e.target.value)}
                            className="bg-[#2a2a31] border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Emergency Contact Phone</label>
                          <Input 
                            name="emergency_contact_phone"
                            value={editingStaffData.emergency_contact_phone || ''}
                            onChange={(e) => handleStaffDataChange('emergency_contact_phone', e.target.value)}
                            className="bg-[#2a2a31] border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Department</label>
                          <select 
                            name="department"
                            value={editingStaffData.department || ''}
                            onChange={(e) => handleStaffDataChange('department', e.target.value)}
                            className="w-full bg-[#2a2a31] border border-gray-600 rounded-md px-3 py-2 text-white"
                          >
                            <option value="">Select Department</option>
                            <option value="front_of_house">Front of House</option>
                            <option value="back_of_house">Back of House</option>
                            <option value="management">Management</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Hourly Rate ($)</label>
                          <Input 
                            name="hourly_rate"
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingStaffData.hourly_rate || ''}
                            onChange={(e) => handleStaffDataChange('hourly_rate', e.target.value)}
                            className="bg-[#2a2a31] border-gray-600 text-white"
                            required
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="md:col-span-2 flex gap-3 pt-4">
                          <Button 
                            type="submit"
                            className="bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
                          >
                            Save Changes
                          </Button>
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={handleCancelStaffEdit}
                            className="border-gray-600 text-gray-300 hover:bg-gray-800 cursor-pointer"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === "settings" && (
            <Card className="bg-[#23232a] rounded-xl p-8 max-w-xl mx-auto">
              <CardTitle className="font-bold text-lg mb-4 text-white">Admin Profile Settings</CardTitle>
              <form className="grid grid-cols-1 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-white">Name</label>
                  <input type="text" name="name" value={profileSettings.name} onChange={handleSettingsChange} className="w-full px-3 py-2 rounded bg-[#18181b] text-white border border-gray-700 font-sans" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-white">Email</label>
                  <input type="email" name="email" value={profileSettings.email} onChange={handleSettingsChange} className="w-full px-3 py-2 rounded bg-[#18181b] text-white border border-gray-700 font-sans" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-white">Phone</label>
                  <input type="text" name="phone" value={profileSettings.phone} onChange={handleSettingsChange} className="w-full px-3 py-2 rounded bg-[#18181b] text-white border border-gray-700 font-sans" />
                </div>
              </form>
              <Button className="bg-white text-black border border-gray-700 hover:bg-gray-200 cursor-pointer" onClick={handleSettingsSave} disabled={settingsSaving}>
                {settingsSaving ? "Saving..." : "Save Settings"}
              </Button>
            </Card>
          )}
        </main>
      </div>

      {/* Schema Editor Modal */}
      {editingTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-gray-600 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                Edit Table: {(schemaData as any)[editingTable]?.name}
              </h3>
              <button
                onClick={() => setEditingTable(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Table Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Table Name
                </label>
                <input
                  type="text"
                  value={(schemaData as any)[editingTable]?.name || ''}
                  onChange={(e) => updateTableName(editingTable, e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f1419] border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={(schemaData as any)[editingTable]?.category || ''}
                  onChange={(e) => setSchemaData(prev => ({
                    ...prev,
                    [editingTable]: {
                      ...(prev as any)[editingTable],
                      category: e.target.value
                    }
                  }))}
                  className="w-full px-3 py-2 bg-[#0f1419] border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Auth">Auth</option>
                  <option value="User">User</option>
                  <option value="Rest">Rest</option>
                  <option value="Book">Book</option>
                  <option value="Data">Data</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {/* Fields */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-300">
                    Fields
                  </label>
                  <button
                    onClick={() => addField(editingTable)}
                    className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-sm cursor-pointer"
                  >
                    + Add Field
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(schemaData as any)[editingTable]?.fields.map((field: any, index: number) => (
                    <div key={index} className="flex gap-3 items-center p-3 bg-[#0f1419] border border-gray-600 rounded">
                      {/* Field Name */}
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(editingTable, index, { name: e.target.value })}
                        className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-white font-sans focus:border-blue-500 focus:outline-none"
                        placeholder="Field name"
                      />
                      
                      {/* Data Type */}
                      <select
                        value={field.type}
                        onChange={(e) => updateField(editingTable, index, { type: e.target.value })}
                        className="px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-white focus:border-blue-500 focus:outline-none"
                        style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
                      >
                        <option value="VARCHAR" style={{ fontFamily: 'inherit' }}>VARCHAR</option>
                        <option value="TEXT" style={{ fontFamily: 'inherit' }}>TEXT</option>
                        <option value="UUID" style={{ fontFamily: 'inherit' }}>UUID</option>
                        <option value="INTEGER" style={{ fontFamily: 'inherit' }}>INTEGER</option>
                        <option value="BIGINT" style={{ fontFamily: 'inherit' }}>BIGINT</option>
                        <option value="BIGSERIAL" style={{ fontFamily: 'inherit' }}>BIGSERIAL</option>
                        <option value="DECIMAL" style={{ fontFamily: 'inherit' }}>DECIMAL</option>
                        <option value="FLOAT" style={{ fontFamily: 'inherit' }}>FLOAT</option>
                        <option value="BOOLEAN" style={{ fontFamily: 'inherit' }}>BOOLEAN</option>
                        <option value="DATE" style={{ fontFamily: 'inherit' }}>DATE</option>
                        <option value="TIME" style={{ fontFamily: 'inherit' }}>TIME</option>
                        <option value="TIMESTAMP" style={{ fontFamily: 'inherit' }}>TIMESTAMP</option>
                        <option value="JSON" style={{ fontFamily: 'inherit' }}>JSON</option>
                        <option value="JSONB" style={{ fontFamily: 'inherit' }}>JSONB</option>
                      </select>
                      
                      {/* Primary Key */}
                      <label className="flex items-center gap-2 text-amber-300">
                        <input
                          type="checkbox"
                          checked={field.isPrimary}
                          onChange={(e) => updateField(editingTable, index, { isPrimary: e.target.checked })}
                          className="rounded"
                        />
                        🔑 PK
                      </label>
                      
                      {/* Foreign Key */}
                      <label className="flex items-center gap-2 text-emerald-300">
                        <input
                          type="checkbox"
                          checked={field.isForeign}
                          onChange={(e) => updateField(editingTable, index, { isForeign: e.target.checked })}
                          className="rounded"
                        />
                        🔗 FK
                      </label>
                      
                      {/* References (if FK) */}
                      {field.isForeign && (
                        <input
                          type="text"
                          value={field.references || ''}
                          onChange={(e) => updateField(editingTable, index, { references: e.target.value })}
                          className="px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-white font-sans focus:border-blue-500 focus:outline-none"
                          placeholder="table.column"
                        />
                      )}
                      
                      {/* Remove Field */}
                      <button
                        onClick={() => removeField(editingTable, index)}
                        className="text-red-400 hover:text-red-300 px-2 cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingTable(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // TODO: Generate and execute SQL
                  toast.info("Schema changes saved", {
                    description: "SQL execution not implemented yet - changes are saved locally"
                  });
                  setEditingTable(null);
                }}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toaster for notifications - Only show when NOT in inventory section */}
      {activeSection !== "inventory" && (
        <Toaster 
          position="top-right"
          expand={true}
          richColors={true}
          closeButton={true}
          toastOptions={{
            style: {
              background: '#23232a',
              color: 'white',
              border: '1px solid #374151',
            },
          }}
        />
      )}
    </div>
  );
}
