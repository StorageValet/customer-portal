import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  DollarSign,
  Package,
  TrendingUp,
  Calendar,
  PieChart,
  Shield,
  Clock,
  Target,
  AlertTriangle,
} from "lucide-react";
import Navigation from "@/components/navigation";
import AIChatbot from "@/components/ai-chatbot";
import { format, subDays, subMonths } from "date-fns";
import { AnalyticsSkeleton } from "@/components/loading-skeleton";

export default function Analytics() {
  const { user } = useAuth();

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/items"],
    queryFn: api.getItems,
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ["/api/movements"],
    queryFn: api.getMovements,
  });

  if (itemsLoading || movementsLoading) {
    return <AnalyticsSkeleton />;
  }

  // Calculate analytics data
  const totalValue = items.reduce((sum, item) => sum + item.estimatedValue, 0);
  const totalItems = items.length;
  const storedItems = items.filter((item) => item.status === "in_storage");
  const homeItems = items.filter((item) => item.status === "at_home");

  const insuranceLimit = user?.plan === "starter" ? 2000 : user?.plan === "medium" ? 3000 : 4000;
  const insuranceUtilization = (totalValue / insuranceLimit) * 100;
  const insuranceUsage = Math.min(insuranceUtilization, 100);

  const planLimits = { starter: 50, medium: 100, family: 200 };
  const planLimit = planLimits[user?.plan as keyof typeof planLimits] || 100;
  const storageUsed = Math.min(planLimit, Math.floor(totalItems * 3.5));
  const storageUtilization = (storageUsed / planLimit) * 100;

  // Category breakdown
  const categoryStats = items.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topCategories = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Value distribution
  const valueRanges = {
    "Under $100": items.filter((item) => item.estimatedValue < 100).length,
    "$100-500": items.filter((item) => item.estimatedValue >= 100 && item.estimatedValue < 500)
      .length,
    "$500-1000": items.filter((item) => item.estimatedValue >= 500 && item.estimatedValue < 1000)
      .length,
    "Over $1000": items.filter((item) => item.estimatedValue >= 1000).length,
  };

  // Movement activity (last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentMovements = movements.filter(
    (movement) => new Date(movement.createdAt) >= thirtyDaysAgo
  );
  const recentPickups = recentMovements.filter((m) => m.type === "pickup");
  const recentDeliveries = recentMovements.filter((m) => m.type === "delivery");

  // Alerts and recommendations
  const alerts = [];
  if (insuranceUtilization > 80) {
    alerts.push({
      type: "warning",
      title: "Insurance Limit Alert",
      message: `You're using ${Math.round(insuranceUtilization)}% of your insurance coverage`,
    });
  }
  if (storageUtilization > 85) {
    alerts.push({
      type: "warning",
      title: "Storage Capacity Alert",
      message: `You're using ${Math.round(storageUtilization)}% of your storage space`,
    });
  }
  if (homeItems.length > 10) {
    alerts.push({
      type: "info",
      title: "Pickup Recommendation",
      message: `You have ${homeItems.length} items at home ready for pickup`,
    });
  }

  return (
    <div className="min-h-screen bg-white_smoke">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <Card className="mb-8 border-paynes_gray bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-oxford_blue">Storage Analytics</h1>
                <p className="text-paynes_gray">
                  Insights into your storage patterns and utilization
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart className="h-6 w-6 text-turquoise" />
                <Badge variant="outline" className="text-oxford_blue border-paynes_gray">
                  {user?.plan?.charAt(0).toUpperCase() + (user?.plan?.slice(1) || "")} Plan
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="mb-8 border-turquoise bg-soft_cream">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-oxford_blue">
                <AlertTriangle className="mr-2 h-5 w-5 text-turquoise" />
                Alerts & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        alert.type === "warning" ? "bg-turquoise" : "bg-midnight_green"
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-oxford_blue">{alert.title}</p>
                      <p className="text-sm text-paynes_gray">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-paynes_gray bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-paynes_gray">Total Value</p>
                  <p className="text-2xl font-bold text-oxford_blue">
                    ${totalValue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-turquoise/10 p-3 rounded-full">
                  <DollarSign className="text-turquoise h-6 w-6" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={insuranceUtilization} className="h-2 bg-paynes_gray/20" />
                <p className="text-xs text-paynes_gray mt-1">
                  {Math.round(insuranceUtilization)}% of ${insuranceLimit.toLocaleString()}{" "}
                  insurance
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-paynes_gray bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-paynes_gray">Items Stored</p>
                  <p className="text-2xl font-bold text-oxford_blue">{storedItems.length}</p>
                </div>
                <div className="bg-midnight_green/10 p-3 rounded-full">
                  <Package className="text-midnight_green h-6 w-6" />
                </div>
              </div>
              <p className="text-xs text-paynes_gray mt-2">{homeItems.length} items at home</p>
            </CardContent>
          </Card>

          <Card className="border-paynes_gray bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-paynes_gray">Storage Used</p>
                  <p className="text-2xl font-bold text-oxford_blue">
                    {Math.round(storageUtilization)}%
                  </p>
                </div>
                <div className="bg-oxford_blue/10 p-3 rounded-full">
                  <PieChart className="text-oxford_blue h-6 w-6" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={storageUtilization} className="h-2 bg-paynes_gray/20" />
                <p className="text-xs text-paynes_gray mt-1">
                  {storageUsed} of {planLimit} ft³
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-paynes_gray bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-paynes_gray">Recent Activity</p>
                  <p className="text-2xl font-bold text-oxford_blue">{recentMovements.length}</p>
                </div>
                <div className="bg-turquoise/10 p-3 rounded-full">
                  <TrendingUp className="text-turquoise h-6 w-6" />
                </div>
              </div>
              <p className="text-xs text-paynes_gray mt-2">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card className="mb-8 border-paynes_gray bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-oxford_blue">Items by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {topCategories.map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 bg-white_smoke rounded-lg"
                >
                  <span className="text-sm font-medium text-oxford_blue">{category}</span>
                  <span className="text-sm text-paynes_gray bg-white px-2 py-1 rounded">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Movement Activity */}
        <Card className="mb-8 border-paynes_gray bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-oxford_blue">Recent Movement Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-midnight_green/10 p-4 rounded-full inline-flex mb-2">
                  <Calendar className="text-midnight_green h-8 w-8" />
                </div>
                <p className="text-2xl font-bold text-oxford_blue">{recentPickups.length}</p>
                <p className="text-sm text-paynes_gray">Pickups (30 days)</p>
              </div>

              <div className="text-center">
                <div className="bg-oxford_blue/10 p-4 rounded-full inline-flex mb-2">
                  <Package className="text-oxford_blue h-8 w-8" />
                </div>
                <p className="text-2xl font-bold text-oxford_blue">{recentDeliveries.length}</p>
                <p className="text-sm text-paynes_gray">Deliveries (30 days)</p>
              </div>

              <div className="text-center">
                <div className="bg-turquoise/10 p-4 rounded-full inline-flex mb-2">
                  <Clock className="text-turquoise h-8 w-8" />
                </div>
                <p className="text-2xl font-bold text-oxford_blue">
                  {recentMovements.length > 0 ? Math.round(recentMovements.length / 4.3) : 0}
                </p>
                <p className="text-sm text-paynes_gray">Weekly Average</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Chatbot */}
      <AIChatbot
        currentPage="analytics"
        userContext={{
          totalItems: items.length,
          totalValue: totalValue,
          storageUtilization: storageUtilization,
          insuranceUsage: insuranceUsage,
        }}
      />
    </div>
  );
}
