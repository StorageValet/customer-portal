import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function MagicLinkVerify() {
  const [, navigate] = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // The magic link verification is handled by the backend GET route
    // which will redirect to dashboard if successful or to login with error
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error) {
      setVerifying(false);
      setError(true);

      if (error === "invalid_token") {
        toast({
          title: "Invalid Magic Link",
          description: "This magic link is invalid. Please request a new one.",
          variant: "destructive",
        });
      } else if (error === "expired_token") {
        toast({
          title: "Expired Magic Link",
          description: "This magic link has expired. Please request a new one.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } else {
      // If no error, we're processing the magic link
      // The backend will handle the redirect
      setTimeout(() => {
        // If we're still here after 5 seconds, something went wrong
        setVerifying(false);
        setError(true);
        toast({
          title: "Verification Timeout",
          description: "The verification is taking too long. Please try again.",
          variant: "destructive",
        });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }, 5000);
    }
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-oxford-blue via-charcoal to-sea-green p-4">
      <Card className="w-full max-w-md border-silver shadow-xl">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto mb-4 w-12 h-12 bg-sea-green/20 rounded-full flex items-center justify-center">
            {verifying ? (
              <Loader2 className="h-6 w-6 text-sea-green animate-spin" />
            ) : error ? (
              <XCircle className="h-6 w-6 text-red-600" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-sea-green" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-oxford-blue">
            {verifying ? "Verifying Magic Link" : error ? "Verification Failed" : "Success!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-charcoal">
            {verifying
              ? "Please wait while we verify your magic link..."
              : error
                ? "There was a problem with your magic link. Redirecting to login..."
                : "You've been successfully signed in! Redirecting..."}
          </p>
          {verifying && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 text-sea-green animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
