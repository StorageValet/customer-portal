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
  AlertTriangle
} from "lucide-react";
import Navigation from "@/components/navigation";
import AIChatbot from "@/components/ai-chatbot";
import { format, subDays, subMonths } from "date-fns";
import { AnalyticsSkeleton } from "@/components/loading-skeleton";

export default function Analytics() {
  const { user } = useAuth();

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/items'],
    queryFn: api.getItems,
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ['/api/movements'],
    queryFn: api.getMovements,
  });

  if (itemsLoading || movementsLoading) {
    return <AnalyticsSkeleton />;
  }

  // Calculate analytics data
  const totalValue = items.reduce((sum, item) => sum + item.estimatedValue, 0);
  const totalItems = items.length;
  const storedItems = items.filter(item => item.status === 'in_storage');
  const homeItems = items.filter(item => item.status === 'at_home');
  
  const insuranceLimit = user?.plan === 'starter' ? 2000 : 
                        user?.plan === 'medium' ? 3000 : 4000;
  const insuranceUtilization = (totalValue / insuranceLimit) * 100;
  const insuranceUsage = Math.min(insuranceUtilization, 100);
  
  const planLimits = { starter: 50, medium: 100, family: 200 };
  const planLimit = planLimits[user?.plan as keyof typeof planLimits] || 100;
  const storageUsed = Math.min(planLimit, Math.floor(totalItems * 3.5));
  const storageUtilization = (storageUsed / planLimit) * 100;

  // Category breakdown
  const categoryStats = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Value distribution
  const valueRanges = {
    'Under $100': items.filter(item => item.estimatedValue < 100).length,
    '$100-500': items.filter(item => item.estimatedValue >= 100 && item.estimatedValue < 500).length,
    '$500-1000': items.filter(item => item.estimatedValue >= 500 && item.estimatedValue < 1000).length,
    'Over $1000': items.filter(item => item.estimatedValue >= 1000).length,
  };

  // Movement activity (last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentMovements = movements.filter(movement => 
    new Date(movement.createdAt) >= thirtyDaysAgo
  );
  const recentPickups = recentMovements.filter(m => m.type === 'pickup');
  const recentDeliveries = recentMovements.filter(m => m.type === 'delivery');

  // Alerts and recommendations
  const alerts = [];
  if (insuranceUtilization > 80) {
    alerts.push({
      type: 'warning',
      title: 'Insurance Limit Alert',
      message: `You're using ${Math.round(insuranceUtilization)}% of your insurance coverage`,
    });
  }
  if (storageUtilization > 85) {
    alerts.push({
      type: 'warning',
      title: 'Storage Capacity Alert',
      message: `You're using ${Math.round(storageUtilization)}% of your storage space`,
    });
  }
  if (homeItems.length > 10) {
    alerts.push({
      type: 'info',
      title: 'Pickup Recommendation',
      message: `You have ${homeItems.length} items at home ready for pickup`,
    });
  }

  return (
    <div className="min-h-screen bg-white-teal">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-navy">Storage Analytics</h1>
                <p className="text-gray-regent">Insights into your storage patterns and utilization</p>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart className="h-6 w-6 text-teal" />
                <Badge variant="outline" className="text-navy border-navy">
                  {user?.plan?.charAt(0).toUpperCase() + (user?.plan?.slice(1) || '')} Plan
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-orange-800">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Alerts & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-semibold text-orange-800">{alert.title}</p>
                      <p className="text-sm text-orange-700">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-regent">Total Value</p>
                  <p className="text-2xl font-bold text-navy">${totalValue.toLocaleString()}</p>
                </div>
                <div className="bg-emerald/10 p-3 rounded-full">
                  <DollarSign className="text-emerald h-6 w-6" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={insuranceUtilization} className="h-2" />
                <p className="text-xs text-gray-regent mt-1">
                  {Math.round(insuranceUtilization)}% of ${insuranceLimit.toLocaleString()} insurance
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-regent">Items Stored</p>
                  <p className="text-2xl font-bold text-navy">{storedItems.length}</p>
                </div>
                <div className="bg-teal/10 p-3 rounded-full">
                  <Package className="text-teal h-6 w-6" />
                </div>
              </div>
              <p className="text-xs text-gray-regent mt-2">
                {homeItems.length} items at home
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-regent">Storage Used</p>
                  <p className="text-2xl font-bold text-navy">{Math.round(storageUtilization)}%</p>
                </div>
                <div className="bg-blue/10 p-3 rounded-full">
                  <PieChart className="text-blue h-6 w-6" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={storageUtilization} className="h-2" />
                <p className="text-xs text-gray-regent mt-1">
                  {storageUsed} of {planLimit} ft³
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-regent">Recent Activity</p>
                  <p className="text-2xl font-bold text-navy">{recentMovements.length}</p>
                </div>
                <div className="bg-purple/10 p-3 rounded-full">
                  <TrendingUp className="text-purple h-6 w-6" />
                </div>
              </div>
              <p className="text-xs text-gray-regent mt-2">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-navy">Items by Category</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {topCategories.map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-navy">{category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-teal h-2 rounded-full" 
                          style={{ width: `${(count / totalItems) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-regent w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Value Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-navy">Value Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {Object.entries(valueRanges).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between">
                    <span className="text-sm text-navy">{range}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald h-2 rounded-full" 
                          style={{ width: `${(count / totalItems) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-regent w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Movement Activity */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg text-navy">Recent Movement Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-teal/10 p-4 rounded-full inline-flex mb-2">
                  <Calendar className="text-teal h-8 w-8" />
                </div>
                <p className="text-2xl font-bold text-navy">{recentPickups.length}</p>
                <p className="text-sm text-gray-regent">Pickups (30 days)</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue/10 p-4 rounded-full inline-flex mb-2">
                  <Package className="text-blue h-8 w-8" />
                </div>
                <p className="text-2xl font-bold text-navy">{recentDeliveries.length}</p>
                <p className="text-sm text-gray-regent">Deliveries (30 days)</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple/10 p-4 rounded-full inline-flex mb-2">
                  <Clock className="text-purple h-8 w-8" />
                </div>
                <p className="text-2xl font-bold text-navy">
                  {recentMovements.length > 0 ? Math.round(recentMovements.length / 4.3) : 0}
                </p>
                <p className="text-sm text-gray-regent">Weekly Average</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-navy">Optimization Tips</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-navy">Space Efficiency</h4>
                <ul className="space-y-2 text-sm text-gray-regent">
                  <li>• Consider donating items under $50 you haven't used in 6+ months</li>
                  <li>• Bundle similar seasonal items together for easier access</li>
                  <li>• Use vacuum storage bags for clothing to save 50% space</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-navy">Cost Optimization</h4>
                <ul className="space-y-2 text-sm text-gray-regent">
                  <li>• Schedule pickups and deliveries together to save on fees</li>
                  <li>• Consider upgrading if approaching storage/insurance limits</li>
                  <li>• Regular inventory reviews help identify items to retrieve or donate</li>
                </ul>
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
          insuranceUsage: insuranceUsage
        }}
      />
    </div>
  );
}