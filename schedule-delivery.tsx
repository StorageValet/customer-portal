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

export default function ScheduleDelivery() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get selected items from URL
  const urlParams = new URLSearchParams(window.location.search);
  const selectedItemIds = urlParams.get('items')?.split(',').map(id => parseInt(id)).filter(Boolean) || [];

  if (!user) {
    return <div>Please log in to schedule a delivery.</div>;
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

  // Get item IDs already scheduled for delivery in pending movements
  const scheduledItemIds = movements
    .filter(movement => movement.type === 'delivery' && movement.status === 'scheduled')
    .flatMap(movement => JSON.parse(movement.itemIds));

  const availableItems = items.filter(item => 
    item.status === 'in_storage' && !scheduledItemIds.includes(item.id)
  );

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
          availableItems={availableItems}
          existingMovements={movements}
          onSchedule={handleSchedule}
          isLoading={scheduleDeliveryMutation.isPending}
          preSelectedItemIds={selectedItemIds}
        />
      </div>

      {/* AI Chatbot */}
      <AIChatbot 
        currentPage="schedule-delivery"
        userContext={{
          availableItems: availableItems.length,
          existingMovements: movements.length
        }}
      />
    </div>
  );
}