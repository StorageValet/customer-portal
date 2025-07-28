import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, Truck } from "lucide-react";
import Navigation from "@/components/navigation";
import AppointmentCalendar from "@/components/appointment-calendar";
import AIChatbot from "@/components/ai-chatbot";
import { Link } from "wouter";
import { AppointmentsSkeleton } from "@/components/loading-skeleton";

export default function Appointments() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!user) {
    return <div>Please log in to view your appointments.</div>;
  }

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['/api/movements'],
    queryFn: api.getMovements,
  });

  if (isLoading) {
    return <AppointmentsSkeleton />;
  }

  const cancelMovementMutation = useMutation({
    mutationFn: (id: number) => api.updateMovement(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/movements'] });
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    },
  });

  const handleReschedule = (movementId: number) => {
    const movement = movements.find(m => m.id === movementId);
    if (movement) {
      if (movement.type === 'pickup') {
        setLocation('/schedule-pickup');
      } else {
        setLocation('/request-delivery');
      }
    }
  };

  const handleCancel = (movementId: number) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      cancelMovementMutation.mutate(movementId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white-teal">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-teal border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-regent">Loading your appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white-teal">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-navy flex items-center">
                  <Calendar className="mr-3 h-6 w-6" />
                  My Appointments
                </h1>
                <p className="text-gray-regent">Manage your pickup and delivery appointments</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  className="bg-teal text-navy hover:bg-teal-medium"
                  asChild
                >
                  <Link href="/schedule-pickup">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Pickup
                  </Link>
                </Button>
                
                <Button
                  variant="outline"
                  className="text-navy border-navy hover:bg-navy hover:text-white"
                  asChild
                >
                  <Link href="/request-delivery">
                    <Truck className="mr-2 h-4 w-4" />
                    Request Delivery
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Calendar */}
        <AppointmentCalendar
          movements={movements}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
        />
      </div>

      {/* AI Chatbot */}
      <AIChatbot 
        currentPage="appointments"
        userContext={{
          totalAppointments: movements.length,
          upcomingAppointments: movements.filter(m => m.status === 'scheduled').length,
          completedAppointments: movements.filter(m => m.status === 'completed').length
        }}
      />
    </div>
  );
}