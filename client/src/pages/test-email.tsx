import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";

export default function TestEmail() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'pickup',
    scheduledDate: '',
    timeSlot: '9:00 AM - 12:00 PM',
    itemIds: 'Test Item 1,Test Item 2',
    specialInstructions: 'This is a test email notification'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/movements', formData);
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Email notification sent successfully! Check the server logs to see the email data.",
        });
        
        // Reset form
        setFormData({
          type: 'pickup',
          scheduledDate: '',
          timeSlot: '9:00 AM - 12:00 PM',
          itemIds: 'Test Item 1,Test Item 2',
          specialInstructions: 'This is a test email notification'
        });
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email notification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to test email notifications.</div>;
  }

  return (
    <div className="min-h-screen bg-white-teal">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Email Notifications</CardTitle>
            <p className="text-sm text-gray-600">
              Test the email notification system for pickup and delivery confirmations.
              Check the server logs to see the generated email data.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Service Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({...formData, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">Pickup</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="timeSlot">Time Slot</Label>
                <Select 
                  value={formData.timeSlot} 
                  onValueChange={(value) => setFormData({...formData, timeSlot: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9:00 AM - 12:00 PM">9:00 AM - 12:00 PM</SelectItem>
                    <SelectItem value="12:00 PM - 3:00 PM">12:00 PM - 3:00 PM</SelectItem>
                    <SelectItem value="3:00 PM - 6:00 PM">3:00 PM - 6:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="itemIds">Items (comma-separated)</Label>
                <Input
                  id="itemIds"
                  value={formData.itemIds}
                  onChange={(e) => setFormData({...formData, itemIds: e.target.value})}
                  placeholder="Item 1, Item 2, Item 3"
                />
              </div>

              <div>
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                  placeholder="Any special instructions for the service"
                  className="min-h-[100px]"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Sending...' : 'Send Test Email Notification'}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">How to Setup Email Integration:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Create a Zapier webhook URL in your Zapier account</li>
                <li>Set the <code>ZAPIER_WEBHOOK_URL</code> environment variable</li>
                <li>Configure Gmail integration in your Zap</li>
                <li>Test the integration using this form</li>
              </ol>
              <p className="text-xs text-gray-600 mt-2">
                Without the webhook URL, email data will be logged to the console for testing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}