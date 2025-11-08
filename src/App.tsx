
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { EnhancedMapProvider } from "@/contexts/EnhancedMapContext";
import { SpectaclesProvider } from "@/contexts/SpectaclesContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useEffect, useState, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";
import SplashScreen from "@/components/SplashScreen";
import PermissionRequest from "@/components/PermissionRequest";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const List = lazy(() => import("./pages/List"));
const ModernProfile = lazy(() => import("./pages/ModernProfile"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Chat = lazy(() => import("./pages/Chat"));
const Explore = lazy(() => import("./pages/Explore"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Landing = lazy(() => import("./pages/Landing"));
const DownloadApp = lazy(() => import("./pages/DownloadApp"));
const Auth = lazy(() => import("./pages/Auth"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const SubscriptionConfirmed = lazy(() => import("./pages/SubscriptionConfirmed"));
const GoogleMapsDiagnosticPage = lazy(() => import("./pages/GoogleMapsDiagnostic"));
const SimpleMapTest = lazy(() => import("./pages/SimpleMapTest"));

// Create a new client
const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  console.log('🎯 App component rendering');
  console.log('🎯 showSplash:', showSplash, 'isInitialized:', isInitialized);

  // Initialize app services and connections on mount
  useEffect(() => {
    console.log('🔄 App useEffect running');
    const initializeApp = async () => {
      try {
        // Quick health check with timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), 3000)
        );
        
        const healthCheckPromise = supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true });
        
        await Promise.race([healthCheckPromise, timeoutPromise])
          .then(() => {
            console.log('✅ Supabase connected successfully');
          })
          .catch((err) => {
            console.warn('⚠️ Supabase connection check failed or timed out:', err.message);
            // Continue anyway - connection might work later
          });
      } catch (err) {
        console.warn('⚠️ App initialization warning:', err);
        // Don't block app startup on initialization errors
      }

      // Mark as initialized
      setIsInitialized(true);
    };
    
    initializeApp();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowPermissions(true);
  };

  const handlePermissionsComplete = () => {
    setShowPermissions(false);
  };

  // Show loading splash while initializing or when explicitly showing splash
  if (!isInitialized || showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={2500} />;
  }

  console.log('🎯 App rendering main content after splash');
  console.log('🎯 showPermissions:', showPermissions);

  return (
    <ErrorBoundary>
      <>
        {showPermissions && (
          <PermissionRequest onComplete={handlePermissionsComplete} />
        )}
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <EnhancedMapProvider>
                <ErrorBoundary
                  fallback={
                    <div className="flex items-center justify-center min-h-screen bg-slate-50">
                      <div className="text-center p-8">
                        <p className="text-slate-600 mb-4">Loading enhanced features...</p>
                        <p className="text-sm text-slate-400">Some features may be unavailable</p>
                      </div>
                    </div>
                  }
                >
                  <SpectaclesProvider autoConnect={false}>
                    <TooltipProvider>
                      <BrowserRouter>
                        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/home" element={<Home />} />
                            <Route path="/list" element={<List />} />
                            <Route path="/profile" element={<ModernProfile />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/inbox" element={<Inbox />} />
                            <Route path="/chat/:conversationId" element={<Chat />} />
                            <Route path="/explore" element={<Explore />} />
                            <Route path="/landing" element={<Landing />} />
                            <Route path="/app" element={<Index />} />
                            <Route path="/profile-setup" element={<ProfileSetup />} />
                            <Route path="/download" element={<DownloadApp />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/subscription-confirmed" element={<SubscriptionConfirmed />} />
                            <Route path="/diagnostic" element={<GoogleMapsDiagnosticPage />} />
                            <Route path="/simple-map-test" element={<SimpleMapTest />} />
                            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                        <Toaster />
                        <Sonner />
                        </BrowserRouter>
                      </TooltipProvider>
                    </SpectaclesProvider>
                  </ErrorBoundary>
              </EnhancedMapProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </>
    </ErrorBoundary>
  );
};

export default App;
