'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, TrendingUp, Package, Loader2 } from 'lucide-react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { toast as sonnerToast } from 'sonner';

interface InventoryAnalysis {
  reorderSuggestions: Array<{
    item_id: string;
    item_name: string;
    current_quantity: number;
    suggested_order_quantity: number;
    reasoning: string;
    urgency: 'low' | 'medium' | 'high';
    estimated_days_until_stockout: number;
  }>;
  wasteAlerts: Array<{
    item_id: string;
    item_name: string;
    potential_waste_amount: number;
    reason: string;
    action_recommended: string;
  }>;
  costOptimization: Array<{
    category: string;
    potential_savings: number;
    recommendation: string;
  }>;
  demandForecast: Array<{
    item_id: string;
    item_name: string;
    predicted_usage_7_days: number;
    predicted_usage_30_days: number;
    confidence_score: number;
  }>;
}

interface InventoryInsightsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  insights: InventoryAnalysis | null;
  onExecuteReorder: (item: any) => Promise<void>;
  onExecuteWasteAction: (item: any) => Promise<void>;
  toast?: {
    success: (message: string, options?: any) => any;
    loading: (content: any, options?: any) => any;
    dismiss: (id?: string) => any;
    error: (message: string, options?: any) => any;
  };
}

export function InventoryInsightsDialog({ 
  isOpen, 
  onClose, 
  insights, 
  onExecuteReorder,
  onExecuteWasteAction,
  toast
}: InventoryInsightsDialogProps) {
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  const handleExecuteAction = async (actionType: 'reorder' | 'waste', item: any) => {
    const actionId = `${actionType}-${item.item_id}`;
    setExecutingActions(prev => new Set([...prev, actionId]));
    
    try {
      if (actionType === 'reorder') {
        await onExecuteReorder(item);
      } else {
        await onExecuteWasteAction(item);
      }
    } catch (error) {
      console.error(`Failed to execute ${actionType} action:`, error);
    } finally {
      setExecutingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const downloadReport = () => {
    if (!insights || isDownloading) return;
    
    setIsDownloading(true);
    
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    // Calculate total potential savings
    const totalSavings = insights.costOptimization.reduce((sum, opt) => sum + opt.potential_savings, 0);
    
    const reportContent = `
INVENTORY INTELLIGENCE REPORT
Generated: ${currentDate} at ${currentTime}
============================================

EXECUTIVE SUMMARY
• Reorder Suggestions: ${insights.reorderSuggestions.length} items
• Waste Alerts: ${insights.wasteAlerts.length} items  
• Cost Optimization Opportunities: ${insights.costOptimization.length} identified
• Total Potential Savings: $${totalSavings.toFixed(2)}

REORDER RECOMMENDATIONS
${insights.reorderSuggestions.length === 0 ? '• No reorder suggestions at this time' : 
  insights.reorderSuggestions.map(item => 
    `• ${item.item_name}: Order ${item.suggested_order_quantity} units (${item.urgency.toUpperCase()} priority)
  Current Stock: ${item.current_quantity} units
  Estimated Stockout: ${(() => {
    const days = item.estimated_days_until_stockout;
    
    // Check if we have a valid number
    if (days != null && !isNaN(days) && days >= 0) {
      // Handle singular vs plural properly
      return days === 1 ? '1 day' : `${days} days`;
    }
    
    // Fallback calculation if AI didn't provide valid estimate
    const currentQty = item.current_quantity || 0;
    
    // Simple fallback: if current quantity is very low, assume urgent
    if (currentQty <= 2) {
      return currentQty <= 1 ? '0-1 days' : '1-2 days';
    } else if (currentQty <= 5) {
      return '3-5 days';
    } else if (currentQty <= 10) {
      return '5-10 days';
    } else {
      return '10+ days';
    }
  })()}
  Reasoning: ${item.reasoning}
`).join('\n')}

WASTE PREVENTION ALERTS
${insights.wasteAlerts.length === 0 ? '• No waste alerts detected' :
  insights.wasteAlerts.map(alert => 
    `• ${alert.item_name}: ${alert.potential_waste_amount} units at risk
  Reason: ${alert.reason}
  Recommended Action: ${alert.action_recommended}
`).join('\n')}

COST OPTIMIZATION OPPORTUNITIES
${insights.costOptimization.length === 0 ? '• No cost optimization opportunities identified' :
  insights.costOptimization.map(opt => 
    `• ${opt.category}: $${opt.potential_savings.toFixed(2)} potential savings
  Recommendation: ${opt.recommendation}
`).join('\n')}

DEMAND FORECAST
${insights.demandForecast.length === 0 ? '• No demand forecasts available' :
  insights.demandForecast.map(forecast => 
    `• ${forecast.item_name}:
  7-day forecast: ${forecast.predicted_usage_7_days} units
  30-day forecast: ${forecast.predicted_usage_30_days} units
  Confidence: ${(forecast.confidence_score * 100).toFixed(0)}%
`).join('\n')}

============================================
Report generated by HostMate Inventory Management System
`;

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show clean success notification with heroicon - use direct toast to avoid double notifications
    sonnerToast.success('Report Downloaded', {
      description: `Inventory intelligence report saved successfully`,
      duration: 3000,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
    });
    
    setIsDownloading(false);
  };

  if (!insights) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto [&>button]:cursor-pointer">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Inventory Intelligence Report
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="reorder" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reorder" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Reorder Suggestions ({insights.reorderSuggestions.filter(r => r.item_id).length})
            </TabsTrigger>
            <TabsTrigger value="waste" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Waste Alerts ({insights.wasteAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Cost Optimization
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Demand Forecast
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reorder" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reorder Recommendations</CardTitle>
                <CardDescription>
                  AI-generated suggestions for inventory restocking based on current levels and predicted demand
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Suggested Order</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Days Until Stockout</TableHead>
                      <TableHead>Reasoning</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insights.reorderSuggestions.filter(suggestion => suggestion.item_id).map((suggestion) => (
                      <TableRow key={suggestion.item_id}>
                        <TableCell className="font-medium">{suggestion.item_name}</TableCell>
                        <TableCell>{suggestion.current_quantity}</TableCell>
                        <TableCell className="font-semibold text-blue-600">
                          {suggestion.suggested_order_quantity}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getUrgencyColor(suggestion.urgency)}>
                            {suggestion.urgency.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={suggestion.estimated_days_until_stockout <= 3 ? 'text-red-600 font-semibold' : ''}>
                            {(() => {
                              const days = suggestion.estimated_days_until_stockout;
                              
                              // Check if we have a valid number
                              if (days != null && !isNaN(days) && days >= 0) {
                                // Handle singular vs plural properly
                                return days === 1 ? '1 day' : `${days} days`;
                              }
                              
                              // Fallback calculation if AI didn't provide valid estimate
                              const currentQty = suggestion.current_quantity || 0;
                              const suggestedQty = suggestion.suggested_order_quantity || 0;
                              
                              // Simple fallback: if current quantity is very low, assume urgent
                              if (currentQty <= 2) {
                                return currentQty <= 1 ? '0-1 days' : '1-2 days';
                              } else if (currentQty <= 5) {
                                return '3-5 days';
                              } else if (currentQty <= 10) {
                                return '5-10 days';
                              } else {
                                return '10+ days';
                              }
                            })()}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground">
                          {suggestion.reasoning}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                            onClick={() => handleExecuteAction('reorder', suggestion)}
                            disabled={executingActions.has(`reorder-${suggestion.item_id}`)}
                          >
                            {executingActions.has(`reorder-${suggestion.item_id}`) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Execute Order
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waste" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Waste Prevention Alerts</CardTitle>
                <CardDescription>
                  Items at risk of spoilage or waste with recommended preventive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Potential Waste</TableHead>
                      <TableHead>Risk Reason</TableHead>
                      <TableHead>Recommended Action</TableHead>
                      <TableHead>Execute</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insights.wasteAlerts.map((alert) => (
                      <TableRow key={alert.item_id}>
                        <TableCell className="font-medium">{alert.item_name}</TableCell>
                        <TableCell>
                          <span className="text-red-600 font-semibold">
                            {alert.potential_waste_amount} units
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {alert.reason}
                        </TableCell>
                        <TableCell className="max-w-xs text-sm">
                          {alert.action_recommended}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white cursor-pointer transition-colors"
                            onClick={() => handleExecuteAction('waste', alert)}
                            disabled={executingActions.has(`waste-${alert.item_id}`)}
                          >
                            {executingActions.has(`waste-${alert.item_id}`) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Apply Action'
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization Opportunities</CardTitle>
                <CardDescription>
                  Identified opportunities to reduce costs and improve profit margins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.costOptimization.map((optimization, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{optimization.category}</h4>
                        <Badge variant="outline" className="text-green-600">
                          ${optimization.potential_savings.toFixed(2)} savings
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {optimization.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Demand Forecast</CardTitle>
                <CardDescription>
                  Predicted usage patterns based on historical data and upcoming reservations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>7-Day Forecast</TableHead>
                      <TableHead>30-Day Forecast</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insights.demandForecast.map((forecast) => (
                      <TableRow key={forecast.item_id}>
                        <TableCell className="font-medium">{forecast.item_name}</TableCell>
                        <TableCell>{forecast.predicted_usage_7_days} units</TableCell>
                        <TableCell>{forecast.predicted_usage_30_days} units</TableCell>
                        <TableCell>
                          <span className={getConfidenceColor(forecast.confidence_score)}>
                            {(forecast.confidence_score * 100).toFixed(0)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4">
          <Button 
            onClick={downloadReport} 
            disabled={isDownloading}
            variant="default" 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download Report
              </>
            )}
          </Button>
          <Button 
            onClick={onClose} 
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer transition-colors"
          >
            Close Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
