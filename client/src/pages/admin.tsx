import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  DollarSign,
  Shield,
  Calendar,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";

interface AdminSettings {
  pricing: {
    starter: { monthly: number; setup: number };
    medium: { monthly: number; setup: number };
    family: { monthly: number; setup: number };
  };
  insurance: {
    starter: number;
    medium: number;
    family: number;
  };
  calendar: {
    availableDays: string[];
    timeSlots: Array<{
      id: string;
      label: string;
      startTime: string;
      endTime: string;
      weekendOnly: boolean;
      premium: boolean;
    }>;
    advanceBookingDays: number;
    emergencyBookingEnabled: boolean;
  };
  referralCredits: {
    newCustomerCredit: number;
    referrerCredit: number;
    enabled: boolean;
  };
  serviceAreas: {
    primaryZones: string[];
    extendedZones: string[];
    rushDeliveryZones: string[];
  };
}

export default function AdminPanel() {
  const [isSettingUpTestData, setIsSettingUpTestData] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<AdminSettings>({
    pricing: {
      starter: { monthly: 199, setup: 99.5 },
      medium: { monthly: 299, setup: 149.5 },
      family: { monthly: 349, setup: 174.5 },
    },
    insurance: {
      starter: 2000,
      medium: 3000,
      family: 4000,
    },
    calendar: {
      availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      timeSlots: [
        {
          id: "1",
          label: "8:00 AM - 12:00 PM",
          startTime: "08:00",
          endTime: "12:00",
          weekendOnly: false,
          premium: false,
        },
        {
          id: "2",
          label: "12:00 PM - 4:00 PM",
          startTime: "12:00",
          endTime: "16:00",
          weekendOnly: false,
          premium: false,
        },
        {
          id: "3",
          label: "4:00 PM - 8:00 PM",
          startTime: "16:00",
          endTime: "20:00",
          weekendOnly: false,
          premium: false,
        },
        {
          id: "4",
          label: "9:00 AM - 1:00 PM (Weekend)",
          startTime: "09:00",
          endTime: "13:00",
          weekendOnly: true,
          premium: true,
        },
      ],
      advanceBookingDays: 14,
      emergencyBookingEnabled: true,
    },
    referralCredits: {
      newCustomerCredit: 50,
      referrerCredit: 50,
      enabled: true,
    },
    serviceAreas: {
      primaryZones: ["Downtown", "Midtown", "Uptown"],
      extendedZones: ["Suburbs North", "Suburbs South", "Suburbs East", "Suburbs West"],
      rushDeliveryZones: ["Downtown", "Midtown"],
    },
  });

  // Check if user is admin (you can modify this logic based on your auth system)
  const isAdmin = user?.email === "admin@mystoragevalet.com" || user?.email === "carol@example.com";

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: AdminSettings) => {
      // This would normally save to your backend
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error("Failed to save settings");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Admin settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleSetupTestData = async () => {
    if (!confirm("This will create test customer accounts and sample data. Continue?")) {
      return;
    }

    setIsSettingUpTestData(true);
    try {
      const response = await apiRequest("POST", "/api/setup-test-data");
      const data = await response.json();

      toast({
        title: "Test Data Created",
        description: "Test customer accounts and sample data have been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to setup test data",
        variant: "destructive",
      });
    } finally {
      setIsSettingUpTestData(false);
    }
  };

  const updatePricing = (plan: string, field: string, value: number) => {
    setSettings((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [plan]: {
          ...prev.pricing[plan as keyof typeof prev.pricing],
          [field]: value,
        },
      },
    }));
  };

  const updateInsurance = (plan: string, value: number) => {
    setSettings((prev) => ({
      ...prev,
      insurance: {
        ...prev.insurance,
        [plan]: value,
      },
    }));
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white-teal">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-navy mb-2">Access Restricted</h1>
              <p className="text-gray-regent">
                You don't have permission to access the admin panel.
              </p>
            </CardContent>
          </Card>
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
                  <Settings className="mr-3 h-6 w-6" />
                  Admin Panel
                </h1>
                <p className="text-gray-regent">
                  Manage pricing, insurance, calendar settings, and service areas
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={saveSettingsMutation.isPending}
                className="bg-teal text-navy hover:bg-teal-medium"
              >
                <Save className="mr-2 h-4 w-4" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save All Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="pricing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="service-areas">Service Areas</TabsTrigger>
          </TabsList>

          {/* Pricing Management */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-navy">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Pricing Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(settings.pricing).map(([plan, pricing]) => (
                    <Card key={plan} className="border-2">
                      <CardHeader>
                        <CardTitle className="text-center text-navy capitalize">
                          {plan} Plan
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <Label>Monthly Fee ($)</Label>
                          <Input
                            type="number"
                            value={pricing.monthly}
                            onChange={(e) => updatePricing(plan, "monthly", Number(e.target.value))}
                            className="text-center text-lg font-bold"
                          />
                        </div>
                        <div>
                          <Label>Setup Fee ($)</Label>
                          <Input
                            type="number"
                            value={pricing.setup}
                            onChange={(e) => updatePricing(plan, "setup", Number(e.target.value))}
                            className="text-center"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insurance Management */}
          <TabsContent value="insurance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-navy">
                  <Shield className="mr-2 h-5 w-5" />
                  Insurance Coverage Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(settings.insurance).map(([plan, coverage]) => (
                    <Card key={plan} className="border-2">
                      <CardHeader>
                        <CardTitle className="text-center text-navy capitalize">
                          {plan} Plan
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div>
                          <Label>Coverage Limit ($)</Label>
                          <Input
                            type="number"
                            value={coverage}
                            onChange={(e) => updateInsurance(plan, Number(e.target.value))}
                            className="text-center text-lg font-bold"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Management */}
          <TabsContent value="calendar">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-navy">
                    <Calendar className="mr-2 h-5 w-5" />
                    Calendar Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Advance Booking Days</Label>
                      <Input
                        type="number"
                        value={settings.calendar.advanceBookingDays}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            calendar: {
                              ...prev.calendar,
                              advanceBookingDays: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.calendar.emergencyBookingEnabled}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            calendar: { ...prev.calendar, emergencyBookingEnabled: checked },
                          }))
                        }
                      />
                      <Label>Enable Emergency Booking</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-navy">
                    <Clock className="mr-2 h-5 w-5" />
                    Time Slots
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {settings.calendar.timeSlots.map((slot, index) => (
                      <div
                        key={slot.id}
                        className="flex items-center space-x-4 p-4 border rounded-lg"
                      >
                        <Input
                          value={slot.label}
                          onChange={(e) => {
                            const newSlots = [...settings.calendar.timeSlots];
                            newSlots[index] = { ...slot, label: e.target.value };
                            setSettings((prev) => ({
                              ...prev,
                              calendar: { ...prev.calendar, timeSlots: newSlots },
                            }));
                          }}
                          className="flex-1"
                        />
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={slot.weekendOnly}
                            onCheckedChange={(checked) => {
                              const newSlots = [...settings.calendar.timeSlots];
                              newSlots[index] = { ...slot, weekendOnly: checked };
                              setSettings((prev) => ({
                                ...prev,
                                calendar: { ...prev.calendar, timeSlots: newSlots },
                              }));
                            }}
                          />
                          <Label className="text-sm">Weekend Only</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={slot.premium}
                            onCheckedChange={(checked) => {
                              const newSlots = [...settings.calendar.timeSlots];
                              newSlots[index] = { ...slot, premium: checked };
                              setSettings((prev) => ({
                                ...prev,
                                calendar: { ...prev.calendar, timeSlots: newSlots },
                              }));
                            }}
                          />
                          <Label className="text-sm">Premium</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Referral Management */}
          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-navy">
                  <Users className="mr-2 h-5 w-5" />
                  Referral Program
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.referralCredits.enabled}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          referralCredits: { ...prev.referralCredits, enabled: checked },
                        }))
                      }
                    />
                    <Label>Enable Referral Program</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>New Customer Credit ($)</Label>
                      <Input
                        type="number"
                        value={settings.referralCredits.newCustomerCredit}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            referralCredits: {
                              ...prev.referralCredits,
                              newCustomerCredit: Number(e.target.value),
                            },
                          }))
                        }
                        disabled={!settings.referralCredits.enabled}
                      />
                    </div>

                    <div>
                      <Label>Referrer Credit ($)</Label>
                      <Input
                        type="number"
                        value={settings.referralCredits.referrerCredit}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            referralCredits: {
                              ...prev.referralCredits,
                              referrerCredit: Number(e.target.value),
                            },
                          }))
                        }
                        disabled={!settings.referralCredits.enabled}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Areas */}
          <TabsContent value="service-areas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-navy">
                  <Users className="mr-2 h-5 w-5" />
                  Service Areas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <Label>Primary Service Zones</Label>
                    <Textarea
                      value={settings.serviceAreas.primaryZones.join(", ")}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          serviceAreas: {
                            ...prev.serviceAreas,
                            primaryZones: e.target.value.split(", ").filter((zone) => zone.trim()),
                          },
                        }))
                      }
                      placeholder="Downtown, Midtown, Uptown"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Extended Service Zones</Label>
                    <Textarea
                      value={settings.serviceAreas.extendedZones.join(", ")}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          serviceAreas: {
                            ...prev.serviceAreas,
                            extendedZones: e.target.value.split(", ").filter((zone) => zone.trim()),
                          },
                        }))
                      }
                      placeholder="Suburbs North, Suburbs South"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Rush Delivery Zones</Label>
                    <Textarea
                      value={settings.serviceAreas.rushDeliveryZones.join(", ")}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          serviceAreas: {
                            ...prev.serviceAreas,
                            rushDeliveryZones: e.target.value
                              .split(", ")
                              .filter((zone) => zone.trim()),
                          },
                        }))
                      }
                      placeholder="Downtown, Midtown"
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Developer Tools */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg text-navy">
              <Settings className="mr-2 h-5 w-5" />
              Developer Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Test Data Setup</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Create test customer accounts with realistic scenarios for QA testing.
                </p>
                <Button
                  onClick={handleSetupTestData}
                  disabled={isSettingUpTestData}
                  variant="outline"
                >
                  {isSettingUpTestData ? "Setting up..." : "Create Test Data"}
                </Button>
                <div className="mt-4 text-sm text-gray-600">
                  <p>This will create:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>new.customer@test.com - Brand new user (no items)</li>
                    <li>active.family@test.com - Family plan (50 seasonal items)</li>
                    <li>premium.user@test.com - Medium plan (20 high-value items)</li>
                  </ul>
                  <p className="mt-2">All test accounts use password: test123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Alert */}
        {saveSettingsMutation.isSuccess && (
          <Alert className="mt-6">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Settings saved successfully! All changes are now active across the platform.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
