import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { TutorialProvider } from "@/contexts/tutorial-context";
import { useAuth } from "@/hooks/useAuth";
import TutorialOverlay from "@/components/tutorial-overlay";
import AIChatbot from "@/components/ai-chatbot";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import AuthTest from "@/pages/auth-test";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import SchedulePickup from "@/pages/schedule-pickup";
import ScheduleDelivery from "@/pages/schedule-delivery";
import RequestDelivery from "@/pages/request-delivery";
import TestEmail from "@/pages/test-email";
import SetupPayment from "@/pages/setup-payment";
import Subscription from "@/pages/subscription";
import Analytics from "@/pages/analytics";
import Appointments from "@/pages/appointments";
import AdminPanel from "@/pages/admin";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import MagicLinkVerify from "@/pages/magic-link-verify";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/magic-link-verify" component={MagicLinkVerify} />
          <Route path="/auth-test" component={AuthTest} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/schedule-pickup" component={SchedulePickup} />
          <Route path="/schedule-delivery" component={ScheduleDelivery} />
          <Route path="/request-delivery" component={RequestDelivery} />
          <Route path="/appointments" component={Appointments} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/setup-payment" component={SetupPayment} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/test-email" component={TestEmail} />
          <Route component={NotFound} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TutorialProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <Router />
              <TutorialOverlay />
              <AIChatbot />
              <Toaster />
            </div>
          </TooltipProvider>
        </TutorialProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
