import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { CreditCard, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SetupPaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const setupFees = {
    starter: 100,
    medium: 150,
    family: 180
  };

  const monthlyFees = {
    starter: 199,
    medium: 299,
    family: 359
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements || !user) {
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Mark setup fee as paid
      try {
        await apiRequest("POST", "/api/setup-fee-paid");
        toast({
          title: "Payment Successful",
          description: "Your setup fee has been processed. Welcome to Storage Valet!",
        });
      } catch (err) {
        console.error("Failed to mark setup fee as paid:", err);
      }
    }
    setIsLoading(false);
  };

  if (!user) return null;

  const planAmount = setupFees[user.plan as keyof typeof setupFees] || 169;
  const monthlyAmount = monthlyFees[user.plan as keyof typeof monthlyFees] || 29;

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-navy">
          <CreditCard className="mr-2 h-5 w-5" />
          Setup Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
          </Badge>
          <div className="mt-4">
            <div className="text-3xl font-bold text-navy">${planAmount}</div>
            <div className="text-sm text-gray-600">One-time setup fee</div>
            <Separator className="my-4" />
            <div className="text-sm text-gray-600">
              Then ${monthlyAmount}/month
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <Button 
            type="submit" 
            disabled={!stripe || isLoading} 
            className="w-full bg-teal text-navy hover:bg-teal-medium"
          >
            {isLoading ? 'Processing...' : `Pay $${planAmount} Setup Fee`}
          </Button>
        </form>

        <div className="text-xs text-gray-500 text-center">
          Secure payment processed by Stripe. Your storage service will begin after payment confirmation.
        </div>
      </CardContent>
    </Card>
  );
};

export default function SetupPayment() {
  const [clientSecret, setClientSecret] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-payment-intent")
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error("Failed to create payment intent:", error);
      });
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Please log in to access payment.</div>
        </div>
      </div>
    );
  }

  if (user.setupFeePaid) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Link href="/dashboard">
            <Button 
              variant="ghost" 
              className="mb-4 text-oxford-blue hover:bg-silver/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-navy mb-2">Setup Complete</h2>
              <p className="text-gray-600">Your setup fee has been paid and your account is active.</p>
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="mt-4 bg-teal text-navy hover:bg-teal-medium"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-center mt-4">Preparing payment...</p>
          </div>
        </div>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard">
          <Button 
            variant="ghost" 
            className="mb-4 text-oxford-blue hover:bg-silver/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <SetupPaymentForm />
        </Elements>
      </div>
    </div>
  );
}