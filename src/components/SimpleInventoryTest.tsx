"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SimpleInventoryTest() {
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
    
    // Simple alert
    alert(`${type.toUpperCase()}: ${title}\n${message}`);
  };

  const testAdd = () => {
    console.log('🔥 TEST ADD CLICKED!');
    showNotification('success', 'Item Added Successfully', 'Test item has been added to your inventory.');
  };

  const testEdit = () => {
    console.log('🔥 TEST EDIT CLICKED!');
    showNotification('success', 'Item Updated Successfully', 'Test item has been updated in your inventory.');
  };

  const testDelete = () => {
    console.log('🔥 TEST DELETE CLICKED!');
    showNotification('success', 'Item Deleted Successfully', 'Test item has been removed from your inventory.');
  };

  const testError = () => {
    console.log('🔥 TEST ERROR CLICKED!');
    showNotification('error', 'Failed to Process', 'Something went wrong. Please try again.');
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold text-white mb-6">Simple Inventory Notification Test</h1>
      
      {/* Visual Notification */}
      {notification.show && (
        <div 
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-md ${
            notification.type === 'success' 
              ? 'bg-green-600 border-green-500 text-white'
              : notification.type === 'error'
              ? 'bg-red-600 border-red-500 text-white'
              : 'bg-blue-600 border-blue-500 text-white'
          }`}
        >
          <h3 className="font-semibold">{notification.title}</h3>
          <p className="text-sm mt-1">{notification.message}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <Button 
          onClick={testAdd}
          className="bg-green-600 hover:bg-green-700 text-white mr-4"
        >
          Test Add Notification
        </Button>
        
        <Button 
          onClick={testEdit}
          className="bg-blue-600 hover:bg-blue-700 text-white mr-4"
        >
          Test Edit Notification
        </Button>
        
        <Button 
          onClick={testDelete}
          className="bg-yellow-600 hover:bg-yellow-700 text-white mr-4"
        >
          Test Delete Notification
        </Button>
        
        <Button 
          onClick={testError}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Test Error Notification
        </Button>
      </div>
      
      <div className="mt-8 p-4 bg-gray-800 rounded">
        <h3 className="text-white font-semibold mb-2">Instructions:</h3>
        <p className="text-gray-300 text-sm">
          Click any button above. You should see:
          <br />1. Console logs in browser dev tools
          <br />2. A visual notification in top-right corner
          <br />3. A browser alert popup
        </p>
      </div>
    </div>
  );
}
