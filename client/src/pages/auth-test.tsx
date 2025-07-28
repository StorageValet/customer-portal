import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AuthTest() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await apiRequest('POST', '/api/auth/login', { email, password });
      toast({
        title: "Login successful!",
        description: "Welcome back!",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      await apiRequest('POST', '/api/auth/signup', {
        email,
        password,
        firstName: "Test",
        lastName: "User",
        plan: "Starter"
      });
      toast({
        title: "Account created!",
        description: "Welcome to Storage Valet!",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Account creation failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-navy to-teal p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Authentication Test</CardTitle>
          <p className="text-muted-foreground">
            Quick test login or create account
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleLogin} 
              className="flex-1"
              disabled={loading}
            >
              {loading ? "..." : "Login"}
            </Button>
            <Button 
              onClick={handleSignup} 
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              {loading ? "..." : "Create Account"}
            </Button>
          </div>
          
          <div className="text-center pt-4">
            <Button
              onClick={() => window.location.href = '/api/login'}
              variant="outline"
              className="w-full"
            >
              Try Google OAuth
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}