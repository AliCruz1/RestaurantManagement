"use client";

console.log('🌟 InventoryManagement.tsx file loaded!');

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/authContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InventoryInsightsDialog } from "@/components/InventoryInsightsDialog";
import { toast, Toaster } from "sonner";
import { ShieldCheck, TrendingUp, XCircle, CheckCircle } from "lucide-react";
import { CpuChipIcon } from "@heroicons/react/24/outline";

import { InventoryNotifications } from "@/lib/notifications";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Package, 
  Plus, 
  Edit, 
  Trash, 
  AlertTriangle,
  BarChart,
  Eye,
  Settings,
  Brain,
  Loader2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  current_quantity: number;
  minimum_quantity: number;
  maximum_quantity?: number;
  cost_per_unit: number;
  unit: string;
  category_name?: string;
  category_color?: string;
  supplier_name?: string;
  stock_status: 'low' | 'normal' | 'overstocked' | 'recently_reordered';
  total_value: number;
  storage_location?: string;
  expiration_days?: number;
}

interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
}

interface InventoryStats {
  total_items: number;
  low_stock_items: number;
  total_value: number;
  categories_count: number;
}

export default function InventoryManagement() {
  const { session } = useAuth();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total_items: 0,
    low_stock_items: 0,
    total_value: 0,
    categories_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Simple notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'info',
    title: '',
    message: ''
  });
  
  // Simple notification system that WILL work
  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    console.log(`🔔 ${type.toUpperCase()} NOTIFICATION:`, title, '-', message);
    
    // Show visual notification on page
    setNotification({
      show: true,
      type,
      title,
      message
    });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
    
    // Also try the original toast as backup
    if (type === 'success') {
      toast.success(title, { description: message });
    } else if (type === 'error') {
      toast.error(title, { description: message });
    } else {
      toast(title, { description: message });
    }
  };

  // Custom toast function for inventory notifications
  const inventoryToast = {
    success: (message: string, options?: any) => {
      console.log('🔥 inventoryToast.success called:', message, options);
      showNotification('success', message, options?.description || '');
      return toast.success(message, options);
    },
    loading: (content: any, options?: any) => {
      console.log('🔥 inventoryToast.loading called:', content, options);
      return toast.loading(content, options);
    },
    dismiss: (id?: string) => {
      console.log('🔥 inventoryToast.dismiss called:', id);
      return toast.dismiss(id);
    },
    error: (message: string, options?: any) => {
      console.log('🔥 inventoryToast.error called:', message, options);
      showNotification('error', message, options?.description || '');
      return toast.error(message, options);
    }
  };
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStockWarningDialog, setShowStockWarningDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [showInsightsDialog, setShowInsightsDialog] = useState(false);
  
  // Notification queue to persist toasts across renders
  const [pendingNotification, setPendingNotification] = useState<{
    type: 'success' | 'error';
    title: string;
    description: string;
    icon: React.ReactNode;
  } | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    unit: "",
    current_quantity: "",
    minimum_quantity: "",
    maximum_quantity: "",
    cost_per_unit: "",
    storage_location: "",
    expiration_days: ""
  });

  // Fetch inventory data
  const fetchInventoryData = async (showRefreshNotification = false) => {
    setLoading(true);
    try {
      // Fetch items using the view
      const { data: itemsData, error: itemsError } = await supabase
        .from('inventory_overview')
        .select('*')
        .order('name', { ascending: true });

      if (itemsError) throw itemsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name', { ascending: true });

      if (categoriesError) throw categoriesError;

      setItems(itemsData || []);
      setCategories(categoriesData || []);

      // Calculate stats
      const totalItems = itemsData?.length || 0;
      const lowStockItems = itemsData?.filter(item => item.stock_status === 'low').length || 0;
      const totalValue = itemsData?.reduce((sum, item) => sum + (item.total_value || 0), 0) || 0;
      const categoriesCount = categoriesData?.length || 0;

      setStats({
        total_items: totalItems,
        low_stock_items: lowStockItems,
        total_value: totalValue,
        categories_count: categoriesCount
      });

      // Show refresh notification if requested
      if (showRefreshNotification) {
        inventoryToast.success(
          'Inventory Refreshed',
          {
            description: `Successfully loaded ${totalItems} items from ${categoriesCount} categories.`,
            duration: 3000,
            id: `inventory-refreshed-${Date.now()}`,
          }
        );
      }

    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🏗️ InventoryManagement component mounted!');
    console.log('🏗️ Component state:', { showAddDialog, showEditDialog, showDeleteDialog });
    console.log('🎯 INVENTORY COMPONENT IS NOW ACTIVE AND MOUNTED!');
    
    fetchInventoryData(); // Don't show refresh notification on initial load
  }, []);

  // Handle pending notifications after component renders
  useEffect(() => {
    if (pendingNotification && !loading) {
      const notification = pendingNotification;
      // Clear the pending notification immediately to prevent duplicates
      setPendingNotification(null);
      
      // Small delay to ensure DOM is fully updated
      setTimeout(() => {
        if (notification.type === 'success') {
          inventoryToast.success(notification.title, {
            description: notification.description,
            duration: 6000,
            icon: notification.icon,
          });
        } else {
          inventoryToast.error(notification.title, {
            description: notification.description,
            duration: 6000,
            icon: notification.icon,
          });
        }
        console.log('🎉 Displayed queued notification:', notification.title);
      }, 100);
    }
  }, [pendingNotification, loading]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category_id: "",
      unit: "",
      current_quantity: "",
      minimum_quantity: "",
      maximum_quantity: "",
      cost_per_unit: "",
      storage_location: "",
      expiration_days: ""
    });
  };

  // Handle form submit for adding new item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('� FORM SUBMITTED - handleAddItem called!');
    console.log('🔥 Form data:', formData);
    console.log('�🚀 Starting add item process for:', formData.name);
    
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([{
          ...formData,
          current_quantity: parseFloat(formData.current_quantity) || 0,
          minimum_quantity: parseFloat(formData.minimum_quantity) || 0,
          maximum_quantity: formData.maximum_quantity ? parseFloat(formData.maximum_quantity) : null,
          cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
          expiration_days: formData.expiration_days ? parseInt(formData.expiration_days) : null
        }])
        .select();

      if (error) {
        console.error('❌ Supabase error during add:', error);
        throw error;
      }
      
      console.log('✅ Item successfully added to database:', data);
      
      setShowAddDialog(false);
      resetForm();
      
      console.log('🎯 About to show add notification for:', formData.name);
      
      // Show centered success notification immediately - using inventoryToast
      inventoryToast.success('Item Added Successfully', {
        description: `${formData.name} has been added to your inventory.`,
        duration: 3000,
        id: `item-added-${formData.name}-${Date.now()}`,
      });
      
      console.log('✅ Item added successfully:', formData.name);
      
      // Refresh data after notification
      fetchInventoryData();
    } catch (error) {
      console.error('❌ Error adding item:', error);
      // Show error notification using inventoryToast
      inventoryToast.error('Failed to Add Item', {
        description: `Unable to add ${formData.name}. Please try again.`,
        duration: 4000,
      });
      console.log('❌ Add item failed:', formData.name);
    }
  };

  // Handle form submit for editing item
  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    console.log('� FORM SUBMITTED - handleEditItem called!');
    console.log('🔥 Form data:', formData);
    console.log('�🚀 Starting edit item process for:', formData.name);
    
    try {
      // Validation
      const currentQty = parseFloat(formData.current_quantity) || 0;
      const minQty = parseFloat(formData.minimum_quantity) || 0;
      const maxQty = formData.maximum_quantity ? parseFloat(formData.maximum_quantity) : null;

      // Validate logical quantities
      if (maxQty && minQty > maxQty) {
        console.log('❌ Validation Error: Minimum quantity cannot be greater than maximum quantity.');
        inventoryToast.error('Validation Error', {
          description: 'Minimum quantity cannot be greater than maximum quantity.',
          duration: 4000,
        });
        console.log('❌ Validation error toast shown');
        return;
      }

      if (maxQty && currentQty > maxQty) {
        console.log('❌ Validation Error: Current quantity exceeds maximum.');
        inventoryToast.error('Validation Error', {
          description: 'Current quantity exceeds maximum quantity.',
          duration: 4000,
        });
        console.log('❌ Validation error toast shown');
        return;
      }

      const { error } = await supabase
        .from('inventory_items')
        .update({
          ...formData,
          current_quantity: currentQty,
          minimum_quantity: minQty,
          maximum_quantity: maxQty,
          cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
          expiration_days: formData.expiration_days ? parseInt(formData.expiration_days) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);

      if (error) {
        console.error('❌ Supabase error during update:', error);
        throw error;
      }
      
      console.log('✅ Item successfully updated in database');

      setShowEditDialog(false);
      setSelectedItem(null);
      resetForm();
      
      console.log('🎯 About to show update notification for:', formData.name);
      
      // Show centered success notification immediately - using inventoryToast
      inventoryToast.success('Item Updated Successfully', {
        description: `${formData.name} has been updated in your inventory.`,
        duration: 3000,
        id: `item-updated-${formData.name}-${Date.now()}`,
      });
      
      console.log('✅ Item updated successfully:', formData.name);
      
      // Refresh data after notification
      fetchInventoryData();
    } catch (error) {
      console.error('❌ Error updating item:', error);
      
      // Show error notification using inventoryToast
      inventoryToast.error('Failed to Update Item', {
        description: `Unable to update ${formData.name}. Please try again.`,
        duration: 4000,
      });
      
      console.log('❌ Item update failed:', error);
    }
  };

  // Open edit dialog with item data
  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    
    // Find the category_id based on the category_name
    const category = categories.find(cat => cat.name === item.category_name);
    
    setFormData({
      name: item.name,
      description: item.description || "",
      category_id: category?.id || "", // Use the matched category_id
      unit: item.unit,
      current_quantity: item.current_quantity.toString(),
      minimum_quantity: item.minimum_quantity.toString(),
      maximum_quantity: item.maximum_quantity?.toString() || "",
      cost_per_unit: item.cost_per_unit.toString(),
      storage_location: item.storage_location || "",
      expiration_days: item.expiration_days?.toString() || ""
    });
    setShowEditDialog(true);
  };

  // Open view dialog
  const openViewDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowViewDialog(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  // Handle item deletion
  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    console.log('� DELETE BUTTON CLICKED - handleDeleteItem called!');
    console.log('🔥 Selected item:', selectedItem);
    console.log('�🚀 Starting delete process for:', selectedItem.name);

    try {
      console.log('🗑️ Starting delete for:', selectedItem.name);

      // Additional safety check - warn if item has significant stock
      if (selectedItem.current_quantity > 10) {
        // Close current dialog and show stock warning
        setShowDeleteDialog(false);
        setShowStockWarningDialog(true);
        console.log('⚠️ High stock warning for:', selectedItem.name);
        return;
      }

      // Delete from Supabase
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', selectedItem.id);

      if (error) {
        console.error('❌ Supabase error during delete:', error);
        throw error;
      }
      
      console.log('✅ Item successfully deleted from database');

      // Close dialog
      setShowDeleteDialog(false);
      setSelectedItem(null);

      console.log('🎯 About to show delete notification for:', selectedItem.name);
      
      // Show centered success notification immediately - using inventoryToast
      inventoryToast.success('Item Deleted Successfully', {
        description: `${selectedItem.name} has been removed from your inventory.`,
        duration: 3000,
        id: `item-deleted-${selectedItem.name}-${Date.now()}`,
      });
      
      console.log('✅ Item deleted successfully:', selectedItem.name);

      // Refresh inventory data after notification
      await fetchInventoryData();

    } catch (error) {
      console.error('❌ Error deleting item:', error);
      
      // Show error notification using inventoryToast
      inventoryToast.error('Failed to Delete Item', {
        description: `Unable to delete ${selectedItem.name}. Please try again.`,
        duration: 4000,
      });
      
      console.log('❌ Delete failed:', error);
    }
  };

  // Handle forced deletion (after stock warning)
  const handleForceDelete = async () => {
    if (!selectedItem) return;

    try {
      console.log('🗑️ Force delete starting for:', selectedItem.name);

      // Delete from Supabase
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', selectedItem.id);

      if (error) throw error;

      // Close all dialogs
      setShowStockWarningDialog(false);
      setShowDeleteDialog(false);
      setSelectedItem(null);

      // Refresh inventory data
      await fetchInventoryData();

      // Force delete completed successfully (notification removed to avoid duplicate alerts)
      console.log('✅ Item force deleted successfully:', selectedItem.name);

    } catch (error) {
      console.error('Error deleting item:', error);
      
      // Error handling without toast notification
      let errorMessage = 'Unable to delete the item. Please try again.';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Delete failed: ${error.message}`;
      }
      
      console.log('❌ Force delete failed:', errorMessage);
    }
  };

  // Generate AI insights
  const generateAIInsights = async () => {
    if (!session?.user?.id) return;
    
    // Show immediate loading feedback
    inventoryToast.loading(
      <div className="flex items-center gap-2">
        <CpuChipIcon className="h-4 w-4 text-purple-400" />
        <span>Generating AI Insights</span>
      </div>, 
      {
        description: 'Analyzing inventory data and generating intelligent recommendations...',
        duration: Infinity,
        id: 'ai-insights-generation',
      }
    );
    
    setIsGeneratingInsights(true);
    try {
      const response = await fetch('/api/inventory-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data.insights);
      
      // Dismiss loading toast
      inventoryToast.dismiss('ai-insights-generation');
      
      setShowInsightsDialog(true);
      
      // Success notification removed to avoid duplicate alerts (insights dialog provides feedback)
      
    } catch (error) {
      // Dismiss loading toast
      inventoryToast.dismiss('ai-insights-generation');
      
      console.error('Error generating insights:', error);
      inventoryToast.error('AI Insights Failed', {
        description: 'Unable to generate AI insights. Please check your connection and try again.',
        duration: 5000,
        icon: <XCircle className="h-4 w-4" />,
        action: {
          label: 'Retry',
          onClick: () => generateAIInsights(),
        },
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Handle automated reorder execution
  const handleExecuteReorder = async (item: any) => {
    try {
      console.log('🔄 Starting reorder for:', item.item_name);
      
      const response = await fetch('/api/auto-reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item,
          orderQuantity: item.suggested_order_quantity,
          reasoning: item.reasoning
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute reorder');
      }

      const data = await response.json();
      console.log('✅ Reorder API response:', data);
      
      // Close insights dialog immediately to prevent showing stale data
      setShowInsightsDialog(false);
      
      // Show centered success notification for reorder completion
      inventoryToast.success(
        'Reorder Completed Successfully',
        {
          description: `${item.item_name} has been reordered with ${item.suggested_order_quantity} units.`,
          duration: 4000,
          id: `reorder-completed-${item.item_name}`,
        }
      );
      console.log('✅ Reorder completed for:', item.item_name);
      
      // Refresh inventory data to show updated quantities
      await fetchInventoryData();
      console.log('📊 Inventory data refreshed after reorder');
      
    } catch (error) {
      console.error('Error executing reorder:', error);
      
      // Error handling without toast notification
      console.log('❌ Reorder failed for:', item.item_name);
    }
  };

  // Handle waste prevention action execution
  const handleExecuteWasteAction = async (item: any) => {
    // Close the insights dialog immediately
    setShowInsightsDialog(false);
    
    try {
      console.log('🛡️ Starting waste prevention for:', item.item_name);
      
      const response = await fetch('/api/waste-prevention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item,
          action: item
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute waste prevention action');
      }

      const data = await response.json();
      console.log('✅ Waste prevention API response:', data);
      
      // Show centered success notification for waste prevention completion
      const actionDetails = data.actionTaken || `Reduced minimum stock level to ${data.newMinimum || item.minimum_quantity} units`;
      inventoryToast.success(
        'Waste Prevention Applied',
        {
          description: `${item.item_name}: ${actionDetails}`,
          duration: 4000,
          id: `waste-prevention-${item.item_name}`,
        }
      );
      console.log('✅ Waste prevention applied for:', item.item_name, actionDetails);
      
      // Refresh inventory data
      await fetchInventoryData();
      console.log('📊 Inventory data refreshed after waste prevention');
      
    } catch (error) {
      console.error('Error executing waste prevention action:', error);
      
      // Error handling without toast notification
      console.log('❌ Waste prevention failed for:', item.item_name);
    }
  };

  // Filter items based on category and search
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category_name === selectedCategory;
    const matchesSearch = searchTerm === "" || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Get stock status badge
  const getStockBadge = (status: string, quantity: number, minQuantity: number) => {
    switch (status) {
      case 'low':
        return <Badge variant="destructive" className="gap-1 bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>;
      case 'overstocked':
        return <Badge variant="secondary" className="gap-1 bg-orange-500 hover:bg-orange-600 text-white">
          <BarChart className="h-3 w-3" />
          Overstocked
        </Badge>;
      case 'recently_reordered':
        return <Badge variant="secondary" className="gap-1 bg-blue-500 hover:bg-blue-600 text-white">
          <CheckCircle className="h-3 w-3" />
          Recently Reordered
        </Badge>;
      default:
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          Normal
        </Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 text-yellow-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#23232a] border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-white">{stats.total_items}</p>
              </div>
              <Package className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#23232a] border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Low Stock</p>
                <p className="text-2xl font-bold text-red-400">{stats.low_stock_items}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#23232a] border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-green-400">
                  ${stats.total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <BarChart className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#23232a] border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Categories</p>
                <p className="text-2xl font-bold text-purple-400">{stats.categories_count}</p>
              </div>
              <Settings className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-[#23232a] border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 px-4 py-2 bg-[#1a1a21] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-text transition-colors"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-[#1a1a21] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer transition-colors hover:border-gray-500"
              >
                <option value="all" className="bg-[#1a1a21] text-white">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name} className="bg-[#1a1a21] text-white">
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  console.log('🔥 "Add Item" dialog button clicked!');
                  setShowAddDialog(true);
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
              <Button 
                onClick={generateAIInsights}
                disabled={isGeneratingInsights}
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors disabled:cursor-not-allowed"
              >
                {isGeneratingInsights ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Insights
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Items */}
      <Card className="bg-[#23232a] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Items ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No inventory items found</p>
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="mt-4 bg-yellow-600 hover:bg-yellow-700 cursor-pointer transition-colors"
              >
                Add Your First Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <Card 
                  key={item.id} 
                  className={cn(
                    "bg-[#1a1a21] border-gray-600 hover:border-gray-500 transition-colors cursor-default",
                    item.stock_status === 'low' && "border-red-600/50 bg-red-950/20 hover:border-red-500/70"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs text-gray-400 mb-2">{item.description}</p>
                        )}
                        {item.category_name && (
                          <Badge 
                            variant="outline" 
                            className="text-xs mb-2"
                            style={{ borderColor: item.category_color, color: item.category_color }}
                          >
                            {item.category_name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white cursor-pointer transition-colors"
                          onClick={() => openViewDialog(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white cursor-pointer transition-colors"
                          onClick={() => {
                            console.log('🔥 Edit button clicked for item:', item.name);
                            openEditDialog(item);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 cursor-pointer transition-colors"
                          onClick={() => {
                            console.log('🔥 Delete button clicked for item:', item.name);
                            openDeleteDialog(item);
                          }}
                          title={`Delete ${item.name}`}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Quantity:</span>
                        <span className={cn(
                          "text-sm font-medium",
                          item.stock_status === 'low' 
                            ? "text-red-400 font-bold" 
                            : "text-white"
                        )}>
                          {item.current_quantity} {item.unit}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Status:</span>
                        {getStockBadge(item.stock_status, item.current_quantity, item.minimum_quantity)}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Value:</span>
                        <span className="text-sm font-medium text-green-400">
                          ${item.total_value.toFixed(2)}
                        </span>
                      </div>

                      {item.storage_location && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Location:</span>
                          <span className="text-sm text-gray-300">{item.storage_location}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar for stock level */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Stock Level</span>
                        <span>{((item.current_quantity / (item.maximum_quantity || item.minimum_quantity * 2)) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={cn(
                            "h-2 rounded-full transition-all",
                            item.stock_status === 'low' ? "bg-red-500" :
                            item.stock_status === 'overstocked' ? "bg-orange-500" :
                            item.stock_status === 'recently_reordered' ? "bg-blue-500" : "bg-green-500"
                          )}
                          style={{ 
                            width: `${Math.min(100, (item.current_quantity / (item.maximum_quantity || item.minimum_quantity * 2)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#23232a] border-gray-700 text-white max-w-2xl [&>button]:cursor-pointer">
          <form onSubmit={handleAddItem}>
            <DialogHeader>
              <DialogTitle className="text-white">Add New Inventory Item</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new item to your restaurant inventory.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Item Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-white">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  placeholder="e.g., lbs, kg, pieces"
                  className="bg-[#1a1a21] border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">Category</Label>
                <select
                  id="category"
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  className="w-full px-3 py-2 bg-[#1a1a21] border border-gray-600 rounded-md text-white"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage_location" className="text-white">Storage Location</Label>
                <Input
                  id="storage_location"
                  value={formData.storage_location}
                  onChange={(e) => setFormData({...formData, storage_location: e.target.value})}
                  placeholder="e.g., Walk-in Cooler"
                  className="bg-[#1a1a21] border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_quantity" className="text-white">Current Quantity</Label>
                <Input
                  id="current_quantity"
                  type="number"
                  step="0.01"
                  value={formData.current_quantity}
                  onChange={(e) => setFormData({...formData, current_quantity: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_quantity" className="text-white">Minimum Quantity</Label>
                <Input
                  id="minimum_quantity"
                  type="number"
                  step="0.01"
                  value={formData.minimum_quantity}
                  onChange={(e) => setFormData({...formData, minimum_quantity: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maximum_quantity" className="text-white">Maximum Quantity (Optional)</Label>
                <Input
                  id="maximum_quantity"
                  type="number"
                  step="0.01"
                  value={formData.maximum_quantity}
                  onChange={(e) => setFormData({...formData, maximum_quantity: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_per_unit" className="text-white">Cost Per Unit ($)</Label>
                <Input
                  id="cost_per_unit"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration_days" className="text-white">Expiration Days (Optional)</Label>
                <Input
                  id="expiration_days"
                  type="number"
                  value={formData.expiration_days}
                  onChange={(e) => setFormData({...formData, expiration_days: e.target.value})}
                  placeholder="Days until expiration"
                  className="bg-[#1a1a21] border-gray-600 text-white"
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {setShowAddDialog(false); resetForm();}}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer transition-colors"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 cursor-pointer transition-colors" onClick={() => console.log('🔥 ADD ITEM BUTTON CLICKED!')}>
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#23232a] border-gray-700 text-white max-w-2xl [&>button]:cursor-pointer">
          <form onSubmit={handleEditItem}>
            <DialogHeader>
              <DialogTitle className="text-white">Edit Inventory Item</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update the details for {selectedItem?.name}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name" className="text-white">Item Name</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_unit" className="text-white">Unit</Label>
                <Input
                  id="edit_unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit_description" className="text-white">Description</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_current_quantity" className="text-white">Current Quantity</Label>
                <Input
                  id="edit_current_quantity"
                  type="number"
                  step="0.01"
                  value={formData.current_quantity}
                  onChange={(e) => setFormData({...formData, current_quantity: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_minimum_quantity" className="text-white">Minimum Quantity</Label>
                <Input
                  id="edit_minimum_quantity"
                  type="number"
                  step="0.01"
                  value={formData.minimum_quantity}
                  onChange={(e) => setFormData({...formData, minimum_quantity: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_maximum_quantity" className="text-white">Maximum Quantity (Optional)</Label>
                <Input
                  id="edit_maximum_quantity"
                  type="number"
                  step="0.01"
                  value={formData.maximum_quantity}
                  onChange={(e) => setFormData({...formData, maximum_quantity: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                  placeholder="Leave empty for no maximum"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_cost_per_unit" className="text-white">Cost Per Unit ($)</Label>
                <Input
                  id="edit_cost_per_unit"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_storage_location" className="text-white">Storage Location</Label>
                <Input
                  id="edit_storage_location"
                  value={formData.storage_location}
                  onChange={(e) => setFormData({...formData, storage_location: e.target.value})}
                  className="bg-[#1a1a21] border-gray-600 text-white"
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {setShowEditDialog(false); setSelectedItem(null); resetForm();}}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer transition-colors"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 cursor-pointer transition-colors" onClick={() => console.log('🔥 UPDATE ITEM BUTTON CLICKED!')}>
                Update Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Item Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="bg-[#23232a] border-gray-700 text-white [&>button]:cursor-pointer">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5" />
              {selectedItem?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Detailed view of inventory item
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Current Quantity</Label>
                  <p className="text-white font-medium">{selectedItem.current_quantity} {selectedItem.unit}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Status</Label>
                  <div className="mt-1">
                    {getStockBadge(selectedItem.stock_status, selectedItem.current_quantity, selectedItem.minimum_quantity)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-400">Total Value</Label>
                  <p className="text-green-400 font-medium">${selectedItem.total_value.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Cost Per Unit</Label>
                  <p className="text-white font-medium">${selectedItem.cost_per_unit.toFixed(2)}</p>
                </div>
                {selectedItem.category_name && (
                  <div>
                    <Label className="text-gray-400">Category</Label>
                    <p className="text-white font-medium">{selectedItem.category_name}</p>
                  </div>
                )}
                {selectedItem.storage_location && (
                  <div>
                    <Label className="text-gray-400">Storage Location</Label>
                    <p className="text-white font-medium">{selectedItem.storage_location}</p>
                  </div>
                )}
              </div>
              
              {selectedItem.description && (
                <div>
                  <Label className="text-gray-400">Description</Label>
                  <p className="text-white mt-1">{selectedItem.description}</p>
                </div>
              )}

              <div className="bg-[#1a1a21] rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Stock Levels</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Minimum:</span>
                    <span className="text-white">{selectedItem.minimum_quantity} {selectedItem.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Current:</span>
                    <span className="text-white">{selectedItem.current_quantity} {selectedItem.unit}</span>
                  </div>
                  {selectedItem.maximum_quantity && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Maximum:</span>
                      <span className="text-white">{selectedItem.maximum_quantity} {selectedItem.unit}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              onClick={() => setShowViewDialog(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer transition-colors"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setShowViewDialog(false);
                if (selectedItem) openEditDialog(selectedItem);
              }}
              className="bg-yellow-600 hover:bg-yellow-700 cursor-pointer transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Professional AI Insights Dialog */}
      <InventoryInsightsDialog 
        isOpen={showInsightsDialog}
        onClose={() => setShowInsightsDialog(false)}
        insights={insights}
        onExecuteReorder={handleExecuteReorder}
        onExecuteWasteAction={handleExecuteWasteAction}
        toast={inventoryToast}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!open && selectedItem) {
          // Dialog is being closed
          setSelectedItem(null);
        }
        setShowDeleteDialog(open);
      }}>
        <DialogContent className="bg-[#23232a] border-gray-700 text-white [&>button]:cursor-pointer">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <Trash className="h-5 w-5" />
              Delete Inventory Item
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold text-white">"{selectedItem?.name}"</span>{" "}
              from your inventory system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-200">
                  <p className="font-medium mb-1">Warning: Permanent Deletion</p>
                  <ul className="text-red-300 space-y-1">
                    <li>• All item data will be permanently removed</li>
                    <li>• Transaction history will be preserved</li>
                    <li>• This action cannot be reversed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false); 
                setSelectedItem(null);
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer transition-colors"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                console.log('🔥 DELETE PERMANENTLY BUTTON CLICKED!');
                handleDeleteItem();
              }}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer transition-colors"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Warning Dialog */}
      <Dialog open={showStockWarningDialog} onOpenChange={(open) => {
        if (!open && selectedItem) {
          // Dialog is being closed
          setSelectedItem(null);
        }
        setShowStockWarningDialog(open);
      }}>
        <DialogContent className="bg-[#23232a] border-gray-700 text-white [&>button]:cursor-pointer">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              High Stock Alert
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              This item has significant stock remaining. Consider reducing inventory before deletion.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Stock Information */}
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-200 mb-2">Current Stock Level</p>
                  <div className="text-white text-lg font-semibold">
                    {selectedItem?.current_quantity} {selectedItem?.unit}
                  </div>
                  <p className="text-yellow-300 text-sm mt-1">
                    Consider reducing quantity to 0 before deletion to avoid inventory loss.
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200">
                  <p className="font-medium mb-2">Recommended Actions</p>
                  <ul className="text-blue-300 space-y-1 text-sm">
                    <li>• Edit item and set quantity to 0</li>
                    <li>• Create waste prevention transaction</li>
                    <li>• Update minimum/maximum levels first</li>
                    <li>• Document reason for inventory adjustment</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowStockWarningDialog(false);
                openEditDialog(selectedItem!);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Item Instead
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleForceDelete}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer transition-colors"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Professional Toast Notifications */}
      <Toaster 
        position="top-center"
        richColors
        expand={true}
        duration={4000}
        offset={20}
        toastOptions={{
          className: 'group toast group-[.toaster]:bg-[#23232a] group-[.toaster]:text-white group-[.toaster]:border-gray-700 group-[.toaster]:shadow-2xl',
          style: {
            zIndex: 9999,
            background: 'linear-gradient(135deg, #23232a 0%, #2a2a32 100%)',
            border: '1px solid #374151',
            borderRadius: '12px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            padding: '16px 20px',
            maxWidth: '420px',
            minHeight: '64px',
          },
          descriptionClassName: 'text-gray-300 text-sm',
          actionButtonStyle: {
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: '600',
            fontSize: '12px',
          },
          cancelButtonStyle: {
            background: 'rgba(107, 114, 128, 0.2)',
            color: '#d1d5db',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: '500',
            fontSize: '12px',
          },
        }}
        icons={{
          loading: <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>,
          success: <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>,
          error: <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>,
        }}
        style={{
          zIndex: 55,
        }}
      />
    </div>
  );
}