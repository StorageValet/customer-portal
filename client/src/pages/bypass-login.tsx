import { useEffect } from "react";
import { useLocation } from "wouter";

export default function BypassLogin() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Set a fake user in localStorage to bypass auth
    localStorage.setItem('bypass-auth', 'true');
    localStorage.setItem('bypass-user', JSON.stringify({
      id: 'test-user',
      email: 'test@mystoragevalet.com',
      firstName: 'Test',
      lastName: 'User',
      plan: 'Starter'
    }));
    
    // Go straight to dashboard
    setLocation("/dashboard");
  }, []);
  
  return <div>Bypassing login...</div>;
}