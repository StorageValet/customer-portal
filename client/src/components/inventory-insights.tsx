import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  Clock,
  Package,
  Target,
  Truck,
  Home,
} from "lucide-react";
import { format, subMonths, isAfter } from "date-fns";

interface InventoryInsightsProps {
  items: any[];
  movements: any[];
  userPlan: string;
  onSchedulePickup: () => void;
  onScheduleDelivery: () => void;
}

export default function InventoryInsights({
  items,
  movements,
  userPlan,
  onSchedulePickup,
  onScheduleDelivery,
}: InventoryInsightsProps) {
  const insights = useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + item.estimatedValue, 0);
    const storedItems = items.filter((item) => item.status === "in_storage");
    const homeItems = items.filter((item) => item.status === "at_home");

    // Insurance analysis
    const insuranceLimits = { starter: 2000, medium: 3000, family: 4000 };
    const insuranceLimit = insuranceLimits[userPlan as keyof typeof insuranceLimits] || 2000;
    const insuranceUtilization = (totalValue / insuranceLimit) * 100;

    // Storage analysis
    const planLimits = { starter: 50, medium: 100, family: 200 };
    const planLimit = planLimits[userPlan as keyof typeof planLimits] || 50;
    const estimatedSpace = items.length * 3.5; // 3.5 sq ft per item average
    const storageUtilization = (estimatedSpace / planLimit) * 100;

    // Value distribution analysis
    const highValueItems = items.filter((item) => item.estimatedValue > 500);
    const lowValueItems = items.filter((item) => item.estimatedValue < 100);

    // Movement pattern analysis
    const sixMonthsAgo = subMonths(new Date(), 6);
    const recentMovements = movements.filter((movement) =>
      isAfter(new Date(movement.createdAt), sixMonthsAgo)
    );
    const pickupFrequency = recentMovements.filter((m) => m.type === "pickup").length;
    const deliveryFrequency = recentMovements.filter((m) => m.type === "delivery").length;

    // Items that haven't moved in 6+ months
    const staleItems = storedItems.filter((item) => {
      const itemMovements = movements.filter((m) => {
        const itemIds = Array.isArray(m.itemIds) ? m.itemIds : [];
        return itemIds.includes(item.id.toString()) && m.type === "delivery";
      });
      return (
        itemMovements.length === 0 ||
        !isAfter(new Date(itemMovements[itemMovements.length - 1]?.createdAt || 0), sixMonthsAgo)
      );
    });

    // Category concentration
    const categoryCount = items.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const dominantCategory = Object.entries(categoryCount).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    )[0];

    const categoryConcentration = dominantCategory
      ? ((dominantCategory[1] as number) / items.length) * 100
      : 0;

    return {
      totalValue,
      insuranceUtilization,
      storageUtilization,
      highValueItems: highValueItems.length,
      lowValueItems: lowValueItems.length,
      staleItems: staleItems.length,
      homeItems: homeItems.length,
      pickupFrequency,
      deliveryFrequency,
      categoryConcentration,
      dominantCategory: dominantCategory?.[0] || "None",
    };
  }, [items, movements, userPlan]);

  const recommendations = useMemo(() => {
    const recs = [];

    // Insurance recommendations
    if (insights.insuranceUtilization > 90) {
      recs.push({
        type: "urgent",
        title: "Insurance Limit Exceeded",
        description:
          "Your stored items exceed your insurance coverage. Consider upgrading your plan.",
        action: "Upgrade Plan",
        priority: 1,
      });
    } else if (insights.insuranceUtilization > 75) {
      recs.push({
        type: "warning",
        title: "Approaching Insurance Limit",
        description: `You're using ${Math.round(insights.insuranceUtilization)}% of your insurance coverage.`,
        action: "Review Coverage",
        priority: 2,
      });
    }

    // Storage recommendations
    if (insights.storageUtilization > 85) {
      recs.push({
        type: "warning",
        title: "Storage Nearly Full",
        description: "Consider donating unused items or upgrading your plan.",
        action: "Optimize Storage",
        priority: 2,
      });
    }

    // Activity recommendations
    if (insights.homeItems > 8) {
      recs.push({
        type: "info",
        title: "Pickup Opportunity",
        description: `You have ${insights.homeItems} items ready for pickup.`,
        action: "Schedule Pickup",
        priority: 3,
      });
    }

    // Value optimization
    if (insights.lowValueItems > 10) {
      recs.push({
        type: "tip",
        title: "Cost Optimization",
        description: `Consider donating ${insights.lowValueItems} low-value items to reduce storage costs.`,
        action: "Review Low-Value Items",
        priority: 4,
      });
    }

    return recs.sort((a, b) => a.priority - b.priority);
  }, [insights]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "info":
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case "tip":
        return <Target className="h-5 w-5 text-green-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-orange-200 bg-orange-50";
      case "info":
        return "border-blue-200 bg-blue-50";
      case "tip":
        return "border-green-200 bg-green-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Insights Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg text-navy">
            <TrendingUp className="mr-2 h-5 w-5 text-teal" />
            Storage Insights Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <DollarSign className="h-8 w-8 text-emerald mx-auto mb-2" />
              <div className="text-2xl font-bold text-navy">
                ${Math.round(insights.totalValue).toLocaleString()}
              </div>
              <div className="text-sm text-gray-regent">Total Value</div>
              <Progress value={insights.insuranceUtilization} className="mt-2 h-2" />
              <div className="text-xs text-gray-400 mt-1">
                {Math.round(insights.insuranceUtilization)}% of insurance
              </div>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Package className="h-8 w-8 text-teal mx-auto mb-2" />
              <div className="text-2xl font-bold text-navy">
                {Math.round(insights.storageUtilization)}%
              </div>
              <div className="text-sm text-gray-regent">Storage Used</div>
              <Progress value={insights.storageUtilization} className="mt-2 h-2" />
              <div className="text-xs text-gray-400 mt-1">{items.length} items stored</div>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Home className="h-8 w-8 text-blue mx-auto mb-2" />
              <div className="text-2xl font-bold text-navy">{insights.homeItems}</div>
              <div className="text-sm text-gray-regent">Items at Home</div>
              {insights.homeItems > 0 && (
                <Button
                  size="sm"
                  className="mt-2 bg-teal text-navy hover:bg-teal-medium"
                  onClick={onSchedulePickup}
                >
                  Schedule Pickup
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg text-navy">
              <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
              Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <Alert key={index} className={getRecommendationColor(rec.type)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getRecommendationIcon(rec.type)}
                      <div>
                        <h4 className="font-semibold">{rec.title}</h4>
                        <AlertDescription className="mt-1">{rec.description}</AlertDescription>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-4"
                      onClick={() => {
                        if (rec.action === "Schedule Pickup") {
                          onSchedulePickup();
                        } else if (rec.action === "Schedule Delivery") {
                          onScheduleDelivery();
                        }
                      }}
                    >
                      {rec.action}
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
