
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import LoadingSplash from "@/components/splash/LoadingSplash";
import Index from "./pages/Index";
import Home from "./pages/Home";
import List from "./pages/List";
import Profile from "./pages/Profile";
import Inbox from "./pages/Inbox";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import DownloadApp from "./pages/DownloadApp";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import SubscriptionConfirmed from "./pages/SubscriptionConfirmed";

// Create a new client
const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize app services and connections on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Just check if we can connect to Supabase
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        
        if (error) {
          console.error('Supabase connection error:', error);
        } else {
          console.log('Supabase connected successfully');
        }
      } catch (err) {
        console.error('Failed to check Supabase connection:', err);
      }

      // Mark as initialized
      setIsInitialized(true);
    };
    
    initializeApp();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show loading splash while initializing or when explicitly showing splash
  if (!isInitialized || showSplash) {
    return <LoadingSplash onComplete={handleSplashComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/list" element={<List />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/app" element={<Index />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/download" element={<DownloadApp />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/subscription-confirmed" element={<SubscriptionConfirmed />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
