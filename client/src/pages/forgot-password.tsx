import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
      setEmailSent(true);
      toast({
        title: "Check your email",
        description:
          "If an account exists with this email, you will receive a password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mint-cream p-4">
        <Card className="w-full max-w-md border-silver shadow-xl">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto mb-4 w-12 h-12 bg-sea-green/20 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-sea-green" />
            </div>
            <CardTitle className="text-2xl font-bold text-oxford-blue">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-charcoal">
              We've sent a password reset link to <strong>{email}</strong> if an account exists with
              that email address.
            </p>
            <p className="text-center text-sm text-charcoal">
              The link will expire in 1 hour. Don't forget to check your spam folder.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => navigate("/login")}
                className="w-full bg-sea-green hover:bg-sea-green/90 text-mint-cream"
              >
                Back to Login
              </Button>
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                variant="outline"
                className="w-full border-silver"
              >
                Try Different Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mint-cream p-4">
      <Card className="w-full max-w-md border-silver shadow-xl">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-bold text-oxford-blue">Forgot Password?</CardTitle>
          <p className="text-charcoal">Enter your email and we'll send you a reset link</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="border-silver"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-sea-green hover:bg-sea-green/90 text-mint-cream"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-sea-green hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
