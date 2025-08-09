import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
} from "lucide-react";
import { format, isToday, isTomorrow, parseISO, isAfter, isBefore } from "date-fns";

interface AppointmentCalendarProps {
  movements: any[];
  onReschedule?: (movementId: number) => void;
  onCancel?: (movementId: number) => void;
}

export default function AppointmentCalendar({
  movements,
  onReschedule,
  onCancel,
}: AppointmentCalendarProps) {
  const organizedMovements = useMemo(() => {
    const now = new Date();

    // Helper to safely parse date
    const parseDate = (dateValue: any) => {
      if (!dateValue) return new Date();
      if (dateValue instanceof Date) return dateValue;
      if (typeof dateValue === 'string') {
        // Try to parse ISO string or other date formats
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
      }
      return new Date();
    };

    // Sort movements by date
    const sortedMovements = movements
      .filter((movement) => movement && movement.status !== "cancelled")
      .sort((a, b) => parseDate(a.scheduledDate).getTime() - parseDate(b.scheduledDate).getTime());

    // Group movements
    const upcoming = sortedMovements.filter((movement) => {
      const movementDate = parseDate(movement.scheduledDate);
      return isAfter(movementDate, now) || isToday(movementDate);
    });

    const past = sortedMovements
      .filter((movement) => {
        const movementDate = parseDate(movement.scheduledDate);
        return isBefore(movementDate, now) && !isToday(movementDate);
      })
      .reverse();

    const today = sortedMovements.filter((movement) => {
      const movementDate = parseDate(movement.scheduledDate);
      return isToday(movementDate);
    });

    return { upcoming, past, today };
  }, [movements]);

  const getMovementIcon = (type: string) => {
    return type === "pickup" ? <Package className="h-5 w-5" /> : <Truck className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue/10 text-blue border-blue";
      case "completed":
        return "bg-emerald/10 text-emerald border-emerald";
      case "cancelled":
        return "bg-red/10 text-red border-red";
      default:
        return "bg-gray/10 text-gray border-gray";
    }
  };

  const getDateLabel = (date: any) => {
    if (!date) return "Date TBD";
    
    let parsedDate: Date;
    if (date instanceof Date) {
      parsedDate = date;
    } else if (typeof date === 'string') {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return "Invalid Date";
      }
    } else {
      return "Invalid Date";
    }
    
    if (isToday(parsedDate)) return "Today";
    if (isTomorrow(parsedDate)) return "Tomorrow";
    return format(parsedDate, "MMM d, yyyy");
  };

  const MovementCard = ({ movement }: { movement: any }) => {
    const itemCount = movement.itemIds
      ? Array.isArray(movement.itemIds)
        ? movement.itemIds.length
        : typeof movement.itemIds === "string"
          ? JSON.parse(movement.itemIds).length
          : 0
      : 0;

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-lg ${
                  movement.type === "pickup" ? "bg-teal/10" : "bg-navy/10"
                }`}
              >
                {getMovementIcon(movement.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-navy capitalize">
                    {movement.type} Appointment
                  </h4>
                  <Badge className={getStatusColor(movement.status)}>{movement.status}</Badge>
                </div>

                <div className="space-y-1 text-sm text-gray-regent">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{getDateLabel(movement.scheduledDate)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{movement.timeSlot}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>
                      {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {movement.specialInstructions && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <strong>Notes:</strong> {movement.specialInstructions}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {movement.status === "scheduled" && (
              <div className="flex items-center space-x-2">
                {onReschedule && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReschedule(movement.id)}
                    className="text-navy border-navy hover:bg-navy hover:text-white"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}

                {onCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCancel(movement.id)}
                    className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Today's Appointments */}
      {organizedMovements.today.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg text-navy">
              <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {organizedMovements.today.map((movement) => (
              <MovementCard key={movement.id} movement={movement} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg text-navy">
            <CalendarIcon className="mr-2 h-5 w-5 text-teal" />
            Upcoming Appointments ({organizedMovements.upcoming.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {organizedMovements.upcoming.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-regent">No upcoming appointments scheduled</p>
            </div>
          ) : (
            organizedMovements.upcoming.map((movement) => (
              <MovementCard key={movement.id} movement={movement} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      {organizedMovements.past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg text-navy">
              <CheckCircle2 className="mr-2 h-5 w-5 text-emerald" />
              Recent History ({organizedMovements.past.slice(0, 5).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {organizedMovements.past.slice(0, 5).map((movement) => (
              <MovementCard key={movement.id} movement={movement} />
            ))}

            {organizedMovements.past.length > 5 && (
              <div className="text-center mt-4">
                <Button variant="outline" size="sm">
                  View Full History ({organizedMovements.past.length - 5} more)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-navy">Appointment Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-teal">
                {organizedMovements.upcoming.length}
              </div>
              <div className="text-sm text-gray-regent">Upcoming</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-emerald">
                {movements.filter((m) => m.status === "completed").length}
              </div>
              <div className="text-sm text-gray-regent">Completed</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-navy">
                {movements.filter((m) => m.type === "pickup").length}
              </div>
              <div className="text-sm text-gray-regent">Pickups</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple">
                {movements.filter((m) => m.type === "delivery").length}
              </div>
              <div className="text-sm text-gray-regent">Deliveries</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
