import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const [location, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Extract token from URL query params
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");

    if (!tokenParam) {
      toast({
        title: "Invalid Link",
        description: "This password reset link is invalid or has expired.",
        variant: "destructive",
      });
      navigate("/login");
    } else {
      setToken(tokenParam);
    }
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await apiRequest("POST", "/api/auth/reset-password", { token, password });
      setSuccess(true);
      toast({
        title: "Password Reset Successfully",
        description: "Your password has been updated. You can now log in with your new password.",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mint-cream p-4">
        <Card className="w-full max-w-md border-silver shadow-xl">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto mb-4 w-12 h-12 bg-sea-green/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-sea-green" />
            </div>
            <CardTitle className="text-2xl font-bold text-oxford-blue">
              Password Reset Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-charcoal">
              Your password has been successfully reset. You will be redirected to the login page
              shortly.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-sea-green hover:bg-sea-green/90 text-mint-cream"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mint-cream p-4">
      <Card className="w-full max-w-md border-silver shadow-xl">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto mb-4 w-12 h-12 bg-sea-green/20 rounded-full flex items-center justify-center">
            <Lock className="h-6 w-6 text-sea-green" />
          </div>
          <CardTitle className="text-3xl font-bold text-oxford-blue">Reset Your Password</CardTitle>
          <p className="text-charcoal">Enter your new password below</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="pr-10 border-silver"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-charcoal hover:text-oxford-blue"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-charcoal">Password must be at least 6 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="pr-10 border-silver"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-charcoal hover:text-oxford-blue"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-sea-green hover:bg-sea-green/90 text-mint-cream"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
