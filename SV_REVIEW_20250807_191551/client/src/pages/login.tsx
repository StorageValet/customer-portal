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
      await apiRequest("POST", "/api/auth/login", { email, password });

      // Invalidate auth query to refresh user state immediately
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });

      // Navigate directly to dashboard after successful login
      navigate("/dashboard");
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
      await apiRequest("POST", "/api/auth/magic-link", { email });
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
    <div className="min-h-screen flex items-center justify-center bg-white_smoke p-4">
      <Card className="w-full max-w-md border-paynes_gray shadow-xl bg-white">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-bold text-oxford-blue">Welcome Back</CardTitle>
          <p className="text-charcoal">Sign in to your Storage Valet account</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showMagicLink ? (
            <>
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
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-turquoise hover:text-turquoise/80 underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-midnight_green hover:bg-midnight_green/90 text-white"
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
                      className="text-turquoise hover:text-turquoise/80 hover:bg-transparent"
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
                    <Mail className="mx-auto h-12 w-12 text-midnight_green" />
                    <h3 className="text-lg font-semibold text-oxford_blue">Magic Link Sign In</h3>
                    <p className="text-sm text-paynes_gray">
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
                      className="w-full h-11 bg-midnight_green hover:bg-midnight_green/90 text-white"
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
                  <div className="text-turquoise">
                    <svg
                      className="mx-auto h-16 w-16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-oxford-blue">Check your email!</h3>
                    <p className="text-charcoal">We've sent a secure sign-in link to:</p>
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
