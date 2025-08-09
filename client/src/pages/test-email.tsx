import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TestEmail() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailType, setEmailType] = useState("welcome");

  const sendTestEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/test-email", {
        email,
        type: emailType,
      });

      toast({
        title: "Email Test Sent",
        description: `Test ${emailType} email has been triggered for ${email}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Email Testing</CardTitle>
          <CardDescription>
            Test the email notification system. If ZAPIER_WEBHOOK_URL is not configured, email
            content will be logged to the console.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailType">Email Type</Label>
            <Select value={emailType} onValueChange={setEmailType}>
              <SelectTrigger id="emailType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">Welcome Email</SelectItem>
                <SelectItem value="pickup">Pickup Confirmation</SelectItem>
                <SelectItem value="delivery">Delivery Confirmation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={sendTestEmail} disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send Test Email"}
          </Button>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Email Templates:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <strong>Welcome:</strong> Sent when a new user signs up
              </li>
              <li>
                <strong>Pickup:</strong> Sent when a pickup is scheduled
              </li>
              <li>
                <strong>Delivery:</strong> Sent when a delivery is scheduled
              </li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Webhook Status:</h3>
            <p className="text-sm text-gray-600">
              Check the server console to see if ZAPIER_WEBHOOK_URL is configured. If not
              configured, email data will be logged instead of sent.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
