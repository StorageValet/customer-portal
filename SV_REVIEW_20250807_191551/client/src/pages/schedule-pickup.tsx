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

export default function SchedulePickup() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get selected items from URL
  const urlParams = new URLSearchParams(window.location.search);
  const selectedItemIds =
    urlParams
      .get("items")
      ?.split(",")
      .map((id) => parseInt(id))
      .filter(Boolean) || [];

  if (!user) {
    return <div>Please log in to schedule a pickup.</div>;
  }

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/items"],
    queryFn: api.getItems,
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["/api/movements"],
    queryFn: api.getMovements,
  });

  const schedulePickupMutation = useMutation({
    mutationFn: api.createMovement,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Pickup Scheduled!",
        description:
          "Your pickup has been scheduled successfully. You'll receive a confirmation email shortly.",
      });
      // Small delay to allow user to see success message
      setTimeout(() => setLocation("/dashboard"), 1500);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.response?.data?.message || "Failed to schedule pickup";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Get item IDs already scheduled for pickup in pending movements
  const scheduledItemIds = movements
    .filter((movement) => movement.type === "pickup" && movement.status === "scheduled")
    .flatMap((movement) =>
      Array.isArray(movement.itemIds) ? movement.itemIds : JSON.parse(movement.itemIds)
    );

  const availableItems = items.filter(
    (item) => item.status === "at_home" && !scheduledItemIds.includes(item.id)
  );

  const handleSchedule = (data: any) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to schedule a pickup",
        variant: "destructive",
      });
      return;
    }

    // Ensure itemIds are strings
    const itemIds = data.itemIds.map((id: any) => String(id));
    
    schedulePickupMutation.mutate({
      type: "pickup",
      scheduledDate: new Date(data.scheduledDate),
      scheduledTimeSlot: data.timeSlot || data.scheduledTimeSlot,
      itemIds: itemIds,
      address: user.address || "",
      specialInstructions: data.specialInstructions || "",
      status: "scheduled",
      userId: user.id.toString(),
      totalVolume: data.totalVolume || null,
      totalWeight: data.totalWeight || null,
      truckSize: data.truckSize || null,
      estimatedDuration: data.estimatedTime || null,
    });
  };

  return (
    <div className="min-h-screen bg-white_smoke">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4 text-oxford_blue hover:bg-paynes_gray/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <SmartScheduler
          type="pickup"
          availableItems={availableItems}
          existingMovements={movements}
          onSchedule={handleSchedule}
          isLoading={schedulePickupMutation.isPending}
          preSelectedItemIds={selectedItemIds}
        />
      </div>

      {/* AI Chatbot */}
      <AIChatbot
        currentPage="schedule-pickup"
        userContext={{
          availableItems: availableItems.length,
          existingMovements: movements.length,
        }}
      />
    </div>
  );
}
