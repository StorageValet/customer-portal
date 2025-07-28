import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import SmartScheduler from "@/components/smart-scheduler";
import AIChatbot from "@/components/ai-chatbot";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function RequestDelivery() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!user) {
    return <div>Please log in to request a delivery.</div>;
  }

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['/api/items'],
    queryFn: api.getItems,
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['/api/movements'],
    queryFn: api.getMovements,
  });

  const scheduleDeliveryMutation = useMutation({
    mutationFn: api.createMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/movements'] });
      toast({
        title: "Delivery Scheduled!",
        description: "Your delivery has been scheduled successfully. You'll receive a confirmation email shortly.",
      });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule delivery",
        variant: "destructive",
      });
    },
  });

  const storedItems = items.filter(item => item.status === 'in_storage');

  const handleSchedule = (data: any) => {
    scheduleDeliveryMutation.mutate({
      type: 'delivery',
      scheduledDate: new Date(data.scheduledDate),
      timeSlot: data.timeSlot,
      itemIds: JSON.stringify(data.itemIds),
      specialInstructions: data.specialInstructions,
      status: 'scheduled',
    });
  };

  return (
    <div className="min-h-screen bg-white-teal">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/dashboard">
          <Button 
            variant="ghost" 
            className="mb-4 text-oxford-blue hover:bg-silver/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <SmartScheduler
          type="delivery"
          availableItems={storedItems}
          existingMovements={movements}
          onSchedule={handleSchedule}
          isLoading={scheduleDeliveryMutation.isPending}
        />
      </div>

      {/* AI Chatbot */}
      <AIChatbot 
        currentPage="request-delivery"
        userContext={{
          storedItems: storedItems.length,
          existingMovements: movements.length
        }}
      />
    </div>
  );
}