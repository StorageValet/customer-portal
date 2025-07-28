import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Eye, EyeOff, Mail } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest('POST', '/api/auth/login', { email, password });
      
      // Invalidate auth query to refresh user state immediately
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
      
      // Navigate to root path, which will redirect to dashboard for authenticated users
      navigate("/");
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

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest('POST', '/api/auth/magic-link', { email });
      setMagicLinkSent(true);
      toast({
        title: "Magic link sent!",
        description: "Check your email for the sign-in link.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send magic link",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-oxford-blue via-charcoal to-sea-green p-4">
      <Card className="w-full max-w-md border-silver shadow-xl">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-bold text-oxford-blue">Welcome Back</CardTitle>
          <p className="text-charcoal">
            Sign in to your Storage Valet account
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showMagicLink ? (
            <>
          {/* Google OAuth Button */}
          <Button
            onClick={() => {
              // Navigate to Replit OAuth login
              window.location.href = '/api/login';
            }}
            variant="outline"
            className="w-full justify-start h-12 hover:bg-silver/20 border-silver"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <Link href="/forgot-password">
                <a className="text-sm text-sea-green hover:text-sea-green/80 underline">
                  Forgot password?
                </a>
              </Link>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 bg-sea-green hover:bg-sea-green/90 text-white" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In with Password"}
            </Button>
          </form>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-11 border-silver hover:bg-silver/20"
              onClick={() => setShowMagicLink(true)}
            >
              <Mail className="mr-2 h-4 w-4" />
              Sign in with Magic Link
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-silver" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-charcoal">New to Storage Valet?</span>
              </div>
            </div>
            
            <div className="text-center">
              <Link href="/signup">
                <Button 
                  variant="ghost" 
                  className="text-sea-green hover:text-sea-green/80 hover:bg-transparent"
                >
                  Create an account
                </Button>
              </Link>
            </div>
          </div>
            </>
          ) : (
            <>
              {!magicLinkSent ? (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <Mail className="mx-auto h-12 w-12 text-sea-green" />
                    <h3 className="text-lg font-semibold text-oxford-blue">Magic Link Sign In</h3>
                    <p className="text-sm text-charcoal">
                      We'll send you a secure link to sign in instantly
                    </p>
                  </div>
                  
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div>
                      <Label htmlFor="magic-email">Email Address</Label>
                      <Input
                        id="magic-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="your@email.com"
                        className="h-11 border-silver focus:border-sea-green"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-sea-green hover:bg-sea-green/90 text-white" 
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send Magic Link"}
                    </Button>
                  </form>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-charcoal hover:text-oxford-blue"
                    onClick={() => setShowMagicLink(false)}
                  >
                    ← Back to other sign in options
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-sea-green">
                    <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-oxford-blue">Check your email!</h3>
                    <p className="text-charcoal">
                      We've sent a secure sign-in link to:
                    </p>
                    <p className="font-medium text-oxford-blue">{email}</p>
                  </div>
                  <div className="pt-4 space-y-3">
                    <p className="text-sm text-charcoal">
                      Click the link in your email to sign in instantly
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-silver"
                      onClick={() => {
                        setShowMagicLink(false);
                        setMagicLinkSent(false);
                        setEmail("");
                      }}
                    >
                      Try another sign in method
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}