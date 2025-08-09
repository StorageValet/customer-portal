import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, useLocation } from "wouter";
import {
  Package,
  DollarSign,
  PieChart,
  Plus,
  CalendarCheck,
  Truck,
  CreditCard,
  Shield,
  TrendingUp,
  BarChart,
} from "lucide-react";
import ItemCard from "@/components/item-card";
import InventoryInsights from "@/components/inventory-insights";
import AppointmentCalendar from "@/components/appointment-calendar";
import AIChatbot from "@/components/ai-chatbot";
import Navigation from "@/components/navigation";
import ActivityTimeline from "@/components/activity-timeline";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { useTutorial } from "@/contexts/tutorial-context";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/items"],
    queryFn: api.getItems,
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["/api/movements"],
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
    <div className="min-h-screen bg-neutralLight dark:bg-[#0B1320]">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <Card className="mb-8 border border-neutralDark/20 dark:border-white/10 bg-white dark:bg-[#0F1B2A]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-primary dark:text-white">
                  Welcome back, {user.firstName}!
                </h1>
                <p className="text-neutralDark dark:text-[#DCE4EA]">Your storage overview</p>
              </div>
              <Link href="/inventory">
                <Button className="bg-accent text-primary hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards - Combined */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Combined Value & Insurance Card */}
          <Card className="overflow-hidden item-card-hover border border-neutralDark/20 dark:border-white/10 bg-white dark:bg-[#0F1B2A]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-4 rounded-xl">
                  <Shield className="text-primary h-8 w-8" />
                </div>
                <p className="text-sm font-medium text-neutralDark dark:text-[#A9B3BD] uppercase tracking-wider">
                  Value & Insurance
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-primary dark:text-white">
                    ${Math.round(totalValue).toLocaleString()}
                  </p>
                  <p className="text-sm text-neutralDark dark:text-[#A9B3BD]">Total value protected</p>
                </div>
                <div>
                  <Progress
                    value={Math.min((totalValue / (user?.insuranceCoverage || 2000)) * 100, 100)}
                    className="h-2 bg-neutralDark/20"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-neutralDark dark:text-[#A9B3BD]">
                      {Math.round((totalValue / (user?.insuranceCoverage || 2000)) * 100)}% of $
                      {(user?.insuranceCoverage || 2000).toLocaleString()} coverage
                    </p>
                    {totalValue >= (user?.insuranceCoverage || 2000) * 0.9 && (
                      <Link href="/subscription">
                        <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                          Add Coverage
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Combined Items & Plan Usage Card */}
          <Card className="overflow-hidden item-card-hover border border-neutralDark/20 dark:border-white/10 bg-white dark:bg-[#0F1B2A]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-accent/20 to-accent/10 p-4 rounded-xl">
                  <Package className="text-accent h-8 w-8" />
                </div>
                <p className="text-sm font-medium text-neutralDark dark:text-[#A9B3BD] uppercase tracking-wider">
                  Storage Status
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-primary dark:text-white">{totalItems} Items</p>
                  <p className="text-sm text-neutralDark dark:text-[#A9B3BD]">Currently stored</p>
                </div>
                <div>
                  <Progress
                    value={(totalItems / planLimit) * 100}
                    className="h-2 bg-neutralDark/20"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-neutralDark dark:text-[#A9B3BD]">
                      {Math.round((totalItems / planLimit) * 100)}% of {user.plan} plan
                    </p>
                    {totalItems >= planLimit * 0.8 && (
                      <Link href="/subscription">
                        <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                          Upgrade Plan
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 border border-neutralDark/20 dark:border-white/10 bg-neutralLight dark:bg-[#0E1A27] quick-actions-card">
          <CardHeader>
            <CardTitle className="text-lg text-primary dark:text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/inventory">
                  <Button className="w-full bg-accent text-primary hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Item
                  </Button>
                </Link>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      {user?.setupFeePaid ? (
                        <Link href="/schedule-pickup">
                          <Button className="w-full bg-primary text-white hover:bg-primary/90">
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            Schedule Pickup
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          className="w-full bg-neutralDark/20 text-neutralDark cursor-not-allowed"
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
                          <Button className="w-full border-2 border-accent text-primary bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent">
                            <Truck className="mr-2 h-4 w-4" />
                            Request Delivery
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          className="w-full bg-neutralDark/20 text-neutralDark cursor-not-allowed border-2 border-neutralDark/20"
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
          <Card className="mb-8 border border-accent dark:border-accent/50 bg-warmNeutral dark:bg-[#0E1A27]">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-primary dark:text-white">
                <CreditCard className="mr-2 h-5 w-5 text-accent" />
                Setup Payment Required
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-neutralDark dark:text-[#DCE4EA] mb-4">
                Complete your setup payment to activate your storage service and begin scheduling
                pickups.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/setup-payment">
                  <Button className="w-full bg-accent text-primary hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent">
                    Pay Setup Fee ($
                    {user?.plan === "starter"
                      ? "99.50"
                      : user?.plan === "medium"
                        ? "149.50"
                        : "174.50"}
                    )
                  </Button>
                </Link>
                <Link href="/subscription">
                  <Button
                    variant="outline"
                    className="w-full border-accent text-accent hover:bg-warmNeutral"
                  >
                    Setup Monthly Billing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Timeline */}
        {movements && movements.length > 0 && (
          <Card className="mb-8 border border-neutralDark/20 dark:border-white/10 bg-white dark:bg-[#0F1B2A]">
            <ActivityTimeline movements={movements} />
          </Card>
        )}

        {/* Smart Insights Section */}
        {user && items && (
          <InventoryInsights
            items={items}
            movements={movements || []}
            userPlan={user.plan}
            onSchedulePickup={() => navigate("/schedule-pickup")}
            onScheduleDelivery={() => navigate("/request-delivery")}
          />
        )}

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
                <Link href="/inventory">View All Items</Link>
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
                <Link
                  href="/inventory"
                  className="text-oxford-blue hover:text-sea-green font-medium"
                >
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
            onReschedule={(id) => console.log("Reschedule movement:", id)}
            onCancel={(id) => console.log("Cancel movement:", id)}
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
          totalValue: totalValue,
        }}
      />
    </div>
  );
}
