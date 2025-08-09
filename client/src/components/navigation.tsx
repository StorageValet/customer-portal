import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Menu,
  User,
  LogOut,
  Home,
  Box,
  Calendar,
  Truck,
  BarChart,
  Settings,
  HelpCircle,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import { useTutorial } from "@/contexts/tutorial-context";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { resetTutorial } = useTutorial();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Clear all cached data
      queryClient.clear();
      // Navigate using wouter's navigation
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect on error using wouter
      navigate("/login");
    }
    setIsOpen(false);
  };

  const closeSheet = () => setIsOpen(false);

  // Check if user is admin
  const isAdmin = user?.email === "admin@mystoragevalet.com" || user?.email === "carol@example.com";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home, mobileLabel: "Home" },
    { href: "/inventory", label: "Inventory", icon: Box, mobileLabel: "Items" },
    { href: "/appointments", label: "Appointments", icon: Calendar, mobileLabel: "Appts" },
    { href: "/schedule-pickup", label: "Schedule Pickup", icon: Package, mobileLabel: "Pickup" },
    { href: "/request-delivery", label: "Request Delivery", icon: Truck, mobileLabel: "Delivery" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Settings, mobileLabel: "Admin" }] : []),
  ];

  if (!user) return null;

  return (
    <>
      <nav className="bg-gradient-to-r from-oxford_blue to-midnight_green shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard">
              <div className="flex items-center space-x-2 cursor-pointer">
                <Package className="h-8 w-8 text-turquoise" />
                <span className="text-xl font-bold text-white">Storage Valet</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                        isActive
                          ? "bg-turquoise text-oxford_blue"
                          : "text-white hover:bg-midnight_green"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                );
              })}

              {/* User Menu */}
              <div className="ml-4 pl-4 border-l border-paynes_gray">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-midnight_green px-3 py-2"
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">{user.firstName}</span>
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white border-paynes_gray">
                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        My Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/subscription">
                      <DropdownMenuItem className="cursor-pointer">
                        <Package className="h-4 w-4 mr-2" />
                        {user.plan} Plan
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={resetTutorial} className="cursor-pointer">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Restart Tutorial
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mobile User Menu */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <UserCircle className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border-paynes_gray">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-oxford_blue">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-paynes_gray capitalize">{user.plan} Plan</p>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/subscription">
                    <DropdownMenuItem className="cursor-pointer">
                      <Package className="h-4 w-4 mr-2" />
                      Subscription
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={resetTutorial} className="cursor-pointer">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Help
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-paynes_gray safe-area-bottom z-50">
        <div className="grid grid-cols-5 h-16">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex flex-col items-center justify-center h-full transition-colors ${
                    isActive ? "text-turquoise" : "text-paynes_gray"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.mobileLabel}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
