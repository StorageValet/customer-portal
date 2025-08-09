import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/navigation";
import AIChatbot from "@/components/ai-chatbot";
import { User, Mail, Phone, MapPin, Save, Package, CreditCard, Shield, Bell } from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    zip: user?.zip || "",
    deliveryInstructions: "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="min-h-screen bg-white_smoke">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <Card className="mb-8 border-paynes_gray bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-oxford_blue/20 to-oxford_blue/10 p-4 rounded-full">
                  <User className="h-8 w-8 text-oxford_blue" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-oxford_blue">My Profile</h1>
                  <p className="text-paynes_gray">Manage your account information</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-paynes_gray bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-oxford_blue flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-paynes_gray bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-oxford_blue flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Service Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="San Francisco"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="CA"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      placeholder="94111"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
                  <Textarea
                    id="deliveryInstructions"
                    name="deliveryInstructions"
                    value={formData.deliveryInstructions}
                    onChange={handleInputChange}
                    placeholder="Gate code, building access, parking instructions, etc."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-midnight_green text-white hover:bg-midnight_green/90"
              disabled={updateProfileMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>

        {/* Quick Links */}
        <Card className="mt-8 border-paynes_gray bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-oxford_blue">Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/subscription">
                <div className="flex items-center space-x-3 p-4 border border-paynes_gray rounded-lg hover:bg-white_smoke cursor-pointer transition-colors">
                  <Package className="h-5 w-5 text-oxford_blue" />
                  <div>
                    <p className="font-medium text-oxford_blue">Subscription Plan</p>
                    <p className="text-sm text-paynes_gray capitalize">{user.plan} Plan</p>
                  </div>
                </div>
              </Link>

              <Link href="/subscription">
                <div className="flex items-center space-x-3 p-4 border border-paynes_gray rounded-lg hover:bg-white_smoke cursor-pointer transition-colors">
                  <CreditCard className="h-5 w-5 text-oxford_blue" />
                  <div>
                    <p className="font-medium text-oxford_blue">Billing & Payment</p>
                    <p className="text-sm text-paynes_gray">Manage payment methods</p>
                  </div>
                </div>
              </Link>

              <div className="flex items-center space-x-3 p-4 border border-paynes_gray rounded-lg">
                <Shield className="h-5 w-5 text-oxford_blue" />
                <div>
                  <p className="font-medium text-oxford_blue">Insurance Coverage</p>
                  <p className="text-sm text-paynes_gray">
                    ${(user.insuranceCoverage || 2000).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 border border-paynes_gray rounded-lg">
                <Bell className="h-5 w-5 text-oxford_blue" />
                <div>
                  <p className="font-medium text-oxford_blue">Notification Preferences</p>
                  <p className="text-sm text-paynes_gray">Email notifications enabled</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Chatbot */}
      <AIChatbot
        currentPage="profile"
        userContext={{
          userName: `${user.firstName} ${user.lastName}`,
          plan: user.plan,
        }}
      />
    </div>
  );
}
