import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Package, Menu, User, LogOut, Home, Inventory, Calendar, Truck, BarChart, Settings, HelpCircle } from "lucide-react";
import { useTutorial } from "@/contexts/tutorial-context";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const { resetTutorial } = useTutorial();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'GET' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/';
    }
    setIsOpen(false);
  };

  const closeSheet = () => setIsOpen(false);

  // Check if user is admin
  const isAdmin = user?.email === 'admin@mystoragevalet.com' || user?.email === 'carol@example.com';

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/appointments", label: "Appointments", icon: Calendar },
    { href: "/schedule-pickup", label: "Schedule Pickup", icon: Calendar },
    { href: "/request-delivery", label: "Request Delivery", icon: Truck },
    { href: "/analytics", label: "Analytics", icon: BarChart },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", icon: Settings }] : []),
  ];

  if (!user) return null;

  return (
    <nav className="bg-oxford-blue text-mint-cream shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Package className="h-8 w-8 text-sea-green" />
              <span className="text-xl font-bold text-mint-cream">Storage Valet</span>
            </div>
          </Link>

          {/* Desktop Navigation - More Compact */}
          <div className="hidden lg:flex items-center space-x-2">
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center space-x-1 px-2 py-1.5 rounded-md transition-colors cursor-pointer text-sm ${
                    isActive 
                      ? "bg-sea-green text-mint-cream" 
                      : "text-mint-cream hover:bg-charcoal"
                  }`}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </div>
                </Link>
              );
            })}
            
            {/* More Menu for Additional Items */}
            {navItems.length > 4 && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-mint-cream hover:bg-charcoal px-2">
                    <Menu className="h-4 w-4" />
                    <span className="ml-1 hidden xl:inline">More</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="top" className="bg-oxford-blue text-mint-cream border-charcoal">
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {navItems.slice(4).map((item) => {
                      const Icon = item.icon;
                      const isActive = location === item.href;
                      return (
                        <Link key={item.href} href={item.href}>
                          <div className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                            isActive 
                              ? "bg-sea-green text-mint-cream" 
                              : "text-mint-cream hover:bg-charcoal"
                          }`}>
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            )}
            
            {/* User Menu */}
            <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-charcoal">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4 text-mint-cream" />
                <span className="text-sm text-mint-cream hidden xl:inline">{user.firstName}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetTutorial}
                className="text-mint-cream hover:bg-charcoal px-2"
                title="Restart Tutorial"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-mint-cream hover:bg-charcoal px-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-mint-cream">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-oxford-blue text-mint-cream border-charcoal">
                <div className="flex items-center space-x-2 mb-8">
                  <Package className="h-6 w-6 text-sea-green" />
                  <span className="text-lg font-bold">Storage Valet</span>
                </div>
                
                <div className="space-y-4">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    return (
                      <Link key={item.href} href={item.href}>
                        <div 
                          onClick={closeSheet}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors cursor-pointer ${
                            isActive 
                              ? "bg-sea-green text-mint-cream" 
                              : "text-mint-cream hover:bg-charcoal"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                  
                  <div className="border-t border-charcoal pt-4 mt-6">
                    <div className="flex items-center space-x-3 px-4 py-2 text-sm text-silver">
                      <User className="h-4 w-4" />
                      <span>{user.firstName} {user.lastName}</span>
                    </div>
                    <div className="px-4 py-1 text-xs text-silver capitalize">
                      {user.plan} Plan
                    </div>
                    <Button
                      variant="ghost"
                      onClick={resetTutorial}
                      className="w-full justify-start text-mint-cream hover:bg-charcoal mt-2"
                    >
                      <HelpCircle className="h-4 w-4 mr-3" />
                      Restart Tutorial
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start text-mint-cream hover:bg-charcoal mt-2"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}