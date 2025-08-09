import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AuthPreferences {
  preferredAuthMethod: string;
  lastAuthMethod: string | null;
  hasPassword: boolean;
  hasSSO: boolean;
}

interface SmartLoginProps {
  onSuccess?: () => void;
}

export default function SmartLogin({ onSuccess }: SmartLoginProps) {
  const [step, setStep] = useState<"email" | "method" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authPrefs, setAuthPrefs] = useState<AuthPreferences | null>(null);
  const { toast } = useToast();

  const fetchAuthPreferences = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/auth/preferences/${encodeURIComponent(userEmail)}`);
      const prefs = await response.json();
      setAuthPrefs(prefs);

      // Show method selection for new users or let them choose
      setStep("method");
    } catch (error) {
      console.error("Error fetching auth preferences:", error);
      setStep("method");
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      fetchAuthPreferences(email);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email,
        password,
      });

      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMethodBadge = (method: string) => {
    const badges = {
      email: { label: "Password", variant: "secondary" as const },
      google: { label: "Preferred", variant: "default" as const },
      apple: { label: "Preferred", variant: "default" as const },
    };
    return badges[method as keyof typeof badges];
  };

  if (step === "email") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <p className="text-muted-foreground">
            Enter your email to continue with your preferred sign-in method
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === "method") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Sign-In Method</CardTitle>
          <p className="text-muted-foreground">How would you like to sign in as {email}?</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => setStep("password")}
            variant="outline"
            className="w-full justify-start"
            disabled={!authPrefs?.hasPassword}
          >
            <Mail className="mr-2 h-4 w-4" />
            Sign in with password
            {authPrefs?.preferredAuthMethod === "email" && (
              <Badge className="ml-auto" variant={getMethodBadge("email").variant}>
                {getMethodBadge("email").label}
              </Badge>
            )}
          </Button>

          <Button
            type="button"
            onClick={() => setStep("email")}
            variant="ghost"
            className="w-full mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to email
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "password") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Enter Password</CardTitle>
          <p className="text-muted-foreground">Sign in to your account as {email}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center space-y-2">
              <Button
                type="button"
                onClick={() => setStep("method")}
                variant="ghost"
                className="text-sm"
              >
                Try a different sign-in method
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return null;
}
