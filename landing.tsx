import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Package, LogIn, Shield, Calendar, BarChart } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-teal">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="h-8 w-8 text-white" />
          <span className="text-2xl font-bold text-white">Storage Valet</span>
        </div>
        <nav className="flex gap-4 sm:gap-6">
          <button 
            onClick={() => window.location.href = '/login'}
            className="text-sm font-medium text-white hover:text-teal transition-colors"
          >
            Portal Login
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Storage Valet
            <span className="block text-teal">Customer Portal</span>
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Access your digital inventory, schedule pickups and deliveries, and manage your storage account.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-teal text-navy hover:bg-teal-medium text-lg px-6 py-4"
                onClick={() => window.location.href = '/login'}
              >
                <LogIn className="mr-2 h-5 w-5" />
                Portal Sign In
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-navy text-lg px-6 py-4"
                onClick={() => window.location.href = '/api/login'}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Quick Google Sign-In
              </Button>
            </div>
          </div>

          {/* Portal Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 text-teal mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Digital Inventory</h3>
                <p className="text-blue-100">
                  View and manage all your stored items with photos and detailed information.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 text-teal mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Smart Scheduling</h3>
                <p className="text-blue-100">
                  Schedule pickups and deliveries with intelligent time slot recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <BarChart className="h-12 w-12 text-teal mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-blue-100">
                  Track storage utilization, costs, and get personalized recommendations.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Customer Information */}
          <div className="mt-16 p-6 bg-white/5 rounded-lg border border-white/10">
            <Shield className="h-8 w-8 text-teal mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">New Customer?</h3>
            <p className="text-blue-100">
              Register through our main website to receive your portal access credentials. 
              Once you're a customer, you'll get login details to access all these features.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}