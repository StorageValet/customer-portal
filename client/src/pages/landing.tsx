import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Package, LogIn, Shield, Calendar, BarChart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-neutralLight dark:bg-[#0B1320] text-neutralDark dark:text-[#DCE4EA]">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between bg-primary dark:bg-primary">
        <div className="flex items-center space-x-2">
          <Package className="h-8 w-8 text-accent" />
          <span className="text-2xl font-bold text-white">Storage Valet</span>
        </div>
        <nav className="flex gap-4 sm:gap-6">
          <Link href="/login" className="text-sm font-medium text-white hover:text-accent">
            Portal Login
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-primary dark:text-white">
            Storage Valet
            <span className="block text-accent dark:text-accent">Customer Portal</span>
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-neutralDark dark:text-[#DCE4EA] max-w-3xl mx-auto">
            Access your digital inventory, schedule pickups and deliveries, and manage your storage
            account.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-accent text-primary hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent text-lg px-6 py-4"
              >
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-neutralDark border border-neutralDark/25 hover:border-neutralDark/40 text-lg px-6 py-4"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Portal Sign In
              </Button>
            </Link>
          </div>

          {/* Portal Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="bg-warmNeutral dark:bg-[#0F1B2A] border border-neutralDark/20 dark:border-white/10 shadow-lg">
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-primary dark:text-white">Digital Inventory</h3>
                <p className="text-neutralDark dark:text-[#DCE4EA]">
                  View and manage all your stored items with photos and detailed information.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-warmNeutral dark:bg-[#0F1B2A] border border-neutralDark/20 dark:border-white/10 shadow-lg">
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-primary dark:text-white">Smart Scheduling</h3>
                <p className="text-neutralDark dark:text-[#DCE4EA]">
                  Schedule pickups and deliveries with intelligent time slot recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-warmNeutral dark:bg-[#0F1B2A] border border-neutralDark/20 dark:border-white/10 shadow-lg">
              <CardContent className="p-6 text-center">
                <BarChart className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-primary dark:text-white">Analytics Dashboard</h3>
                <p className="text-neutralDark dark:text-[#DCE4EA]">
                  Track storage utilization, costs, and get personalized recommendations.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Customer Information */}
          <div className="mt-16 p-6 bg-white dark:bg-[#0F1B2A] rounded-lg border border-neutralDark/20 dark:border-white/10 shadow-lg">
            <Shield className="h-8 w-8 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-primary dark:text-white">New Customer?</h3>
            <p className="text-neutralDark dark:text-[#DCE4EA] mb-4">
              Join Storage Valet today and experience white-glove storage service.
              We're currently serving Hoboken, Jersey City, Weehawken, and surrounding areas.
            </p>
            <Link href="/signup">
              <Button
                className="bg-accent text-primary hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
