import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [location, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated && !authLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  useEffect(() => {
    // Check if user was redirected back from cancelled Stripe checkout
    const params = new URLSearchParams(window.location.search);
    if (params.get('cancelled') === '1') {
      setErr("Payment was cancelled. Please try again.");
    }
  }, [location]);
  
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); 
    setErr(null); 
    setMsg(null); 
    setLoading(true);
    
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    
    try {
      const r = await fetch("/api/auth/register", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Registration failed");
      
      if (j.status === "waitlist") {
        setMsg("We're not in your area yet. You've been added to our priority waitlist and we'll notify you as soon as we expand to your location!");
      } else if (j.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = j.checkout_url;
        return;
      } else {
        setMsg("Almost there—please check your email.");
      }
    } catch (e:any) { 
      setErr(e.message); 
    } finally { 
      setLoading(false); 
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-600 mt-2">Start your white-glove storage journey</p>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full name *
            </label>
            <input 
              name="full_name" 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input 
              name="email" 
              type="email" 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="john@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone (optional)
            </label>
            <input 
              name="phone" 
              type="tel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="(201) 555-0123"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <input 
              name="address" 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="123 Main Street"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apartment/Unit (optional)
            </label>
            <input 
              name="unit" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Apt 4B"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input 
                name="city" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Hoboken"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select 
                name="state" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="NJ">New Jersey</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP code *
            </label>
            <input 
              name="zip" 
              required 
              pattern="^\d{5}(-\d{4})?$" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="07030"
              title="Please enter a valid 5-digit ZIP code"
            />
            <p className="text-xs text-gray-500 mt-1">
              Currently serving Hoboken, Jersey City, Weehawken, and surrounding areas
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose your plan *
            </label>
            <select 
              name="plan_tier" 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="199">Starter - $199/month</option>
              <option value="299">Medium - $299/month</option>
              <option value="359">Family - $359/month</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Setup fee will be added at checkout
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Promo Code (optional)
            </label>
            <input 
              name="promo_code" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Enter promo code"
            />
            <p className="text-xs text-gray-500 mt-1">
              Have a promo code? Enter it here to waive setup fees
            </p>
          </div>
          
          <div className="flex items-start">
            <input 
              id="tos" 
              name="agree_tos" 
              type="checkbox" 
              required 
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="tos" className="ml-2 text-sm text-gray-700">
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>
          
          <input type="hidden" name="form_source" value="Website" />
          
          <button 
            type="submit"
            disabled={loading} 
            className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Continue to payment"}
          </button>
          
          {msg && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{msg}</p>
            </div>
          )}
          
          {err && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{err}</p>
            </div>
          )}
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}