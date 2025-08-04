'use client';

import { toast } from 'sonner';
import { CpuChipIcon } from '@heroicons/react/24/outline';
import React from 'react';

// Professional notification helpers for inventory management
export const InventoryNotifications = {
  reorderSuccess: (itemName: string, quantity: number, newTotal: number) => {
    toast.success('Reorder Completed', {
      description: `Successfully ordered ${quantity} units of ${itemName}. New stock level: ${newTotal} units.`,
      duration: 5000,
    });
  },

  wastePreventionSuccess: (itemName: string, newMinimum: number, actionDetails?: string) => {
    const message = actionDetails || `Reduced minimum stock level for ${itemName} to ${newMinimum} units to prevent over-ordering.`;
    
    toast.success('✅ Waste Prevention Applied', {
      description: message,
      duration: 7000,
      action: {
        label: 'View Inventory',
        onClick: () => {
          // This could trigger a scroll to the inventory section
          console.log('Navigate to inventory');
        },
      },
    });
  },

  insightsGenerated: (reorderCount: number, wasteAlerts: number) => {
    toast.info('AI Insights Updated', {
      description: `Generated ${reorderCount} reorder suggestions and ${wasteAlerts} waste prevention alerts.`,
      duration: 4000,
    });
  },

  itemAdded: (itemName: string) => {
    toast.success('Item Added', {
      description: `Successfully added ${itemName} to inventory.`,
      duration: 3000,
    });
  },

  itemDeleted: (itemName: string) => {
    toast.success('✅ Item Deleted', {
      description: `${itemName} has been permanently removed from inventory.`,
      duration: 5000,
      action: {
        label: 'Refresh',
        onClick: () => {
          window.location.reload();
        },
      },
    });
  },

  itemUpdated: (itemName: string) => {
    toast.success('Item Updated', {
      description: `Successfully updated ${itemName}.`,
      duration: 3000,
    });
  },

  actionError: (action: string, details?: string) => {
    toast.error(`${action} Failed`, {
      description: details || 'An unexpected error occurred. Please try again.',
      duration: 5000,
    });
  },

  // Immediate action feedback
  actionStarted: (action: string, itemName: string) => {
    const actionVerb = action === 'Waste Prevention' ? 'Applying waste prevention strategy' : 
                      action === 'Auto Reorder' ? 'Processing automatic reorder' : 
                      `Processing ${action.toLowerCase()}`;
    
    toast.loading(`${action} in Progress`, {
      description: `${actionVerb} for ${itemName}... This may take a few seconds.`,
      duration: Infinity, // Will be dismissed manually
      id: `action-${action}-${itemName}`, // Unique ID to dismiss later
      icon: React.createElement(CpuChipIcon, { className: 'h-4 w-4' }),
    });
  },

  dismissLoading: (action: string, itemName: string) => {
    toast.dismiss(`action-${action}-${itemName}`);
  },

  inventoryUpdated: () => {
    toast.success('Inventory Updated', {
      description: 'Inventory data has been successfully refreshed.',
      duration: 3000,
    });
  },

  // reportDownloaded notification removed to avoid duplicate alerts
};
