import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { TutorialProvider } from "@/contexts/tutorial-context";
import { useAuth } from "@/hooks/useAuth";
import TutorialOverlay from "@/components/tutorial-overlay";
// import AIChatbot from "@/components/ai-chatbot";
import AIChatbotSimple from "@/components/ai-chatbot-simple";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProtectedRoute } from "@/components/protected-route";
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
import Profile from "@/pages/profile";
import AdminPanel from "@/pages/admin";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import MagicLinkVerify from "@/pages/magic-link-verify";
import NotFound from "@/pages/not-found";

function Router() {
  // Routes are always rendered, protection happens inside components
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/magic-link-verify" component={MagicLinkVerify} />
      <Route path="/auth-test" component={AuthTest} />

      {/* Protected routes - always rendered, protection inside */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/inventory">
        <ProtectedRoute>
          <Inventory />
        </ProtectedRoute>
      </Route>
      <Route path="/schedule-pickup">
        <ProtectedRoute>
          <SchedulePickup />
        </ProtectedRoute>
      </Route>
      <Route path="/schedule-delivery">
        <ProtectedRoute>
          <ScheduleDelivery />
        </ProtectedRoute>
      </Route>
      <Route path="/request-delivery">
        <ProtectedRoute>
          <RequestDelivery />
        </ProtectedRoute>
      </Route>
      <Route path="/appointments">
        <ProtectedRoute>
          <Appointments />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/setup-payment">
        <ProtectedRoute>
          <SetupPayment />
        </ProtectedRoute>
      </Route>
      <Route path="/subscription">
        <ProtectedRoute>
          <Subscription />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <AdminPanel />
        </ProtectedRoute>
      </Route>

      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TutorialProvider>
            <TooltipProvider>
              <div className="min-h-screen bg-background">
                <Router />
                <TutorialOverlay />
                <AuthenticatedAssistant />
                <Toaster />
              </div>
            </TooltipProvider>
          </TutorialProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Only show AI assistant to authenticated users
function AuthenticatedAssistant() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  // Return the simple, stable AI assistant
  return <AIChatbotSimple />;
}

export default App;
