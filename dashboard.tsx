import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "wouter";
import { Package, DollarSign, PieChart, Plus, CalendarCheck, Truck, Mail, CreditCard, Shield, TrendingUp, BarChart } from "lucide-react";
import ItemCard from "@/components/item-card";
import InventoryInsights from "@/components/inventory-insights";
import AppointmentCalendar from "@/components/appointment-calendar";
import AIChatbot from "@/components/ai-chatbot";
import Navigation from "@/components/navigation";
import CategoryChart from "@/components/category-chart";
import ActivityTimeline from "@/components/activity-timeline";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { useTutorial } from "@/contexts/tutorial-context";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['/api/items'],
    queryFn: api.getItems,
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['/api/movements'],
    queryFn: api.getMovements,
  });

  if (!user) {
    return <div>Please log in to access your dashboard.</div>;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + item.estimatedValue, 0);
  const storageUsed = Math.min(78, Math.floor(totalItems * 3.5)); // Rough calculation
  const recentItems = items.slice(-6);

  const planLimits = {
    starter: 50,
    medium: 100,
    family: 200,
  };

  const planLimit = planLimits[user.plan as keyof typeof planLimits] || 100;

  return (
    <div className="min-h-screen bg-mint-cream">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <Card className="mb-8 border-silver dashboard-header">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-oxford-blue">
                  Welcome back, {user.firstName}!
                </h1>
                <p className="text-charcoal">Your storage overview</p>
              </div>
              <Link href="/inventory">
                <Button className="bg-sea-green text-mint-cream hover:bg-sea-green/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 stats-cards">
          <Card className="overflow-hidden hover:shadow-lg transition-shadow border-silver">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-sea-green/20 to-sea-green/10 p-4 rounded-xl">
                  <Package className="text-sea-green h-8 w-8" />
                </div>
                <p className="text-sm font-medium text-charcoal uppercase tracking-wider">Total Items</p>
              </div>
              <p className="text-3xl font-bold text-oxford-blue">{totalItems}</p>
              <p className="text-sm text-charcoal mt-1">In your storage</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-lg transition-shadow border-silver">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-oxford-blue/20 to-oxford-blue/10 p-4 rounded-xl">
                  <DollarSign className="text-oxford-blue h-8 w-8" />
                </div>
                <p className="text-sm font-medium text-charcoal uppercase tracking-wider">Total Value</p>
              </div>
              <p className="text-3xl font-bold text-oxford-blue">${totalValue.toLocaleString()}</p>
              <p className="text-sm text-charcoal mt-1">Protected assets</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-lg transition-shadow border-silver">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-charcoal/20 to-charcoal/10 p-4 rounded-xl">
                  <Shield className="text-charcoal h-8 w-8" />
                </div>
                <p className="text-sm font-medium text-charcoal uppercase tracking-wider">Insurance</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-oxford-blue">
                  ${user?.insuranceCoverage?.toLocaleString() || '2,000'}
                </p>
                <div className="mt-3">
                  <Progress 
                    value={Math.min((totalValue / (user?.insuranceCoverage || 2000)) * 100, 100)} 
                    className="h-2 bg-silver"
                  />
                  <p className="text-xs text-charcoal mt-2">
                    {Math.round((totalValue / (user?.insuranceCoverage || 2000)) * 100)}% coverage used
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-lg transition-shadow border-silver">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-sea-green/20 to-sea-green/10 p-4 rounded-xl">
                  <BarChart className="text-sea-green h-8 w-8" />
                </div>
                <p className="text-sm font-medium text-charcoal uppercase tracking-wider">Plan Usage</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-oxford-blue">{Math.floor((storageUsed / planLimit) * 100)}%</p>
                <div className="mt-3">
                  <Progress 
                    value={(storageUsed / planLimit) * 100} 
                    className="h-2 bg-silver"
                  />
                  <p className="text-xs text-charcoal mt-2">
                    {storageUsed} of {planLimit} ft³ used
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 border-silver quick-actions-card">
          <CardHeader>
            <CardTitle className="text-lg text-oxford-blue">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/inventory">
                  <Button className="w-full bg-sea-green text-mint-cream hover:bg-sea-green/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Item
                  </Button>
                </Link>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      {user?.setupFeePaid ? (
                        <Link href="/schedule-pickup">
                          <Button className="w-full bg-oxford-blue text-mint-cream hover:bg-charcoal">
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            Schedule Pickup
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          className="w-full bg-silver text-charcoal cursor-not-allowed"
                          disabled={true}
                        >
                          <CalendarCheck className="mr-2 h-4 w-4" />
                          Schedule Pickup
                        </Button>
                      )}
                    </div>
                  </TooltipTrigger>
                  {!user?.setupFeePaid && (
                    <TooltipContent>
                      <p>Please complete your setup payment to enable scheduling</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      {user?.setupFeePaid ? (
                        <Link href="/request-delivery">
                          <Button className="w-full border-2 border-sea-green text-mint-cream bg-sea-green hover:bg-sea-green/90">
                            <Truck className="mr-2 h-4 w-4" />
                            Request Delivery
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          className="w-full bg-silver text-charcoal cursor-not-allowed border-2 border-silver"
                          disabled={true}
                        >
                          <Truck className="mr-2 h-4 w-4" />
                          Request Delivery
                        </Button>
                      )}
                    </div>
                  </TooltipTrigger>
                  {!user?.setupFeePaid && (
                    <TooltipContent>
                      <p>Please complete your setup payment to enable delivery requests</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Payment Status */}
        {!user?.setupFeePaid && (
          <Card className="mb-8 border-sea-green bg-mint-cream/50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-oxford-blue">
                <CreditCard className="mr-2 h-5 w-5 text-sea-green" />
                Setup Payment Required
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-charcoal mb-4">
                Complete your setup payment to activate your storage service and begin scheduling pickups.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/setup-payment">
                  <Button className="w-full bg-sea-green text-mint-cream hover:bg-sea-green/90">
                    Pay Setup Fee (${user?.plan === 'starter' ? '100' : user?.plan === 'medium' ? '150' : '180'})
                  </Button>
                </Link>
                <Link href="/subscription">
                  <Button variant="outline" className="w-full border-sea-green text-sea-green hover:bg-mint-cream/50">
                    Setup Monthly Billing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Email Notifications */}
        <Card className="mb-8 border-silver">
          <CardHeader>
            <CardTitle className="flex items-center text-lg text-oxford-blue">
              <Mail className="mr-2 h-5 w-5 text-sea-green" />
              Test Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-charcoal mb-4">
              Test the email notification system for pickup and delivery confirmations.
            </p>
            <Button 
              onClick={async () => {
                try {
                  const testData = {
                    type: 'pickup',
                    scheduledDate: '2025-01-15',
                    timeSlot: '9:00 AM - 12:00 PM',
                    itemIds: 'Test Item 1,Test Item 2',
                    specialInstructions: 'This is a test email notification'
                  };
                  
                  const response = await fetch('/api/movements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(testData)
                  });
                  
                  if (response.ok) {
                    alert('Email notification test sent! Check the console logs for email data.');
                  } else {
                    alert('Failed to send test notification.');
                  }
                } catch (error) {
                  alert('Error sending test notification.');
                }
              }}
              className="w-full bg-sea-green text-mint-cream hover:bg-sea-green/90"
            >
              Send Test Email Notification
            </Button>
          </CardContent>
        </Card>

        {/* Value by Category and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Value by Category Chart */}
          <CategoryChart items={items} />
          
          {/* Recent Activity Timeline */}
          <ActivityTimeline movements={movements} />
        </div>

        {/* Smart Insights Section */}
        <InventoryInsights
          items={items}
          movements={movements}
          userPlan={user.plan}
          onSchedulePickup={() => window.location.href = '/schedule-pickup'}
          onScheduleDelivery={() => window.location.href = '/request-delivery'}
        />

        {/* Recent Items */}
        <Card className="mt-8 border-silver recent-items-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-oxford-blue">Recent Items</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="text-oxford-blue border-oxford-blue hover:bg-oxford-blue hover:text-mint-cream"
                asChild
              >
                <Link href="/inventory">
                  View All Items
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-charcoal">Loading your items...</p>
              </div>
            ) : recentItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-charcoal">No items yet. Add your first item to get started!</p>
                <Link href="/inventory">
                  <Button className="mt-4 bg-sea-green text-mint-cream hover:bg-sea-green/90">
                    Add Item
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
            {recentItems.length > 0 && (
              <div className="mt-6 text-center">
                <Link href="/inventory" className="text-oxford-blue hover:text-sea-green font-medium">
                  View All Items →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointments Calendar */}
        <div className="mt-8">
          <AppointmentCalendar
            movements={movements}
            onReschedule={(id) => console.log('Reschedule movement:', id)}
            onCancel={(id) => console.log('Cancel movement:', id)}
          />
        </div>
      </div>
      
      {/* AI Chatbot */}
      <AIChatbot 
        currentPage="dashboard"
        userContext={{
          items: items.length,
          movements: movements.length,
          recentItems: recentItems.length,
          totalValue: totalValue
        }}
      />
    </div>
  );
}
