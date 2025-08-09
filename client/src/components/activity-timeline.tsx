import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Movement } from "@shared/schema";

interface ActivityTimelineProps {
  movements: Movement[];
}

export default function ActivityTimeline({ movements }: ActivityTimelineProps) {
  // Sort movements by date descending and take recent 5
  const recentMovements = movements
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
    .slice(0, 5);

  const getMovementIcon = (type: string) => {
    return type === "pickup" ? (
      <Package className="h-5 w-5 text-teal" />
    ) : (
      <Truck className="h-5 w-5 text-navy" />
    );
  };

  const getMovementText = (type: string) => {
    return type === "pickup" ? "Pickup scheduled" : "Delivery scheduled";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (movements.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg text-navy">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {recentMovements.length > 0 ? (
          <div className="space-y-4">
            {recentMovements.map((movement, index) => (
              <div key={movement.id} className="flex items-start space-x-4">
                <div className="relative">
                  <div className="bg-white-teal p-3 rounded-full shadow-sm">
                    {getMovementIcon(movement.type)}
                  </div>
                  {index < recentMovements.length - 1 && (
                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-gray-200" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-navy">{getMovementText(movement.type)}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(movement.status)}`}
                    >
                      {movement.status.charAt(0).toUpperCase() + movement.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center mt-1 text-sm text-gray-regent">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(movement.scheduledDate), "MMM dd, yyyy 'at' h:mm a")}
                  </div>
                  {movement.specialInstructions && (
                    <p className="mt-2 text-sm text-gray-600">{movement.specialInstructions}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-regent">No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">
              Schedule a pickup or delivery to get started
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
