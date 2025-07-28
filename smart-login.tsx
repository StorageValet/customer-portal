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
  const [step, setStep] = useState<'email' | 'method' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setStep('method');
    } catch (error) {
      console.error('Error fetching auth preferences:', error);
      setStep('method');
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
      const response = await apiRequest('POST', '/api/auth/login', {
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

  if (step === 'email') {
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

  if (step === 'method') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Sign-In Method</CardTitle>
          <p className="text-muted-foreground">
            How would you like to sign in as {email}?
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => setStep('password')}
            variant="outline"
            className="w-full justify-start"
            disabled={!authPrefs?.hasPassword}
          >
            <Mail className="mr-2 h-4 w-4" />
            Sign in with password
            {authPrefs?.preferredAuthMethod === 'email' && (
              <Badge className="ml-auto" variant={getMethodBadge('email').variant}>
                {getMethodBadge('email').label}
              </Badge>
            )}
          </Button>

          <Separator className="my-4" />

          <Button
            onClick={() => window.location.href = '/api/login'}
            variant="outline"
            className="w-full justify-start"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
            {authPrefs?.preferredAuthMethod === 'google' && (
              <Badge className="ml-auto" variant={getMethodBadge('google').variant}>
                {getMethodBadge('google').label}
              </Badge>
            )}
          </Button>

          <Button
            onClick={() => window.location.href = '/api/login?provider=apple'}
            variant="outline"
            className="w-full justify-start"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 6.02.88 7.13-.22.75-.71 1.48-1.92 3.07v.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
            {authPrefs?.preferredAuthMethod === 'apple' && (
              <Badge className="ml-auto" variant={getMethodBadge('apple').variant}>
                {getMethodBadge('apple').label}
              </Badge>
            )}
          </Button>

          <Button
            type="button"
            onClick={() => setStep('email')}
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

  if (step === 'password') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Enter Password</CardTitle>
          <p className="text-muted-foreground">
            Sign in to your account as {email}
          </p>
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            
            <div className="text-center space-y-2">
              <Button
                type="button"
                onClick={() => setStep('method')}
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