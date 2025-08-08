import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

// iOS Components
import MobileLayout from './MobileLayout';
import MobileHeader from './MobileHeader';
import MobileMapView from './MobileMapView';

// Existing pages adapted for mobile
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import ProfileSetup from '@/pages/ProfileSetup';
import NotFound from '@/pages/NotFound';

// Mobile-specific pages
import MobileHome from './pages/MobileHome';
import MobileDiscover from './pages/MobileDiscover';
import MobileCamera from './pages/MobileCamera';
import MobileInbox from './pages/MobileInbox';
import MobileProfile from './pages/MobileProfile';

interface MobileAppProps {
  className?: string;
}

const MobileApp: React.FC<MobileAppProps> = ({ className }) => {
  const isMobile = useIsMobile();

  // On desktop, fall back to regular app
  if (!isMobile) {
    return null; // Regular App component will handle desktop
  }

  return (
    <MobileLayout className={className}>
      <Routes>
        {/* Landing and auth routes - no tab bar */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        
        {/* Main app routes - with tab bar */}
        <Route path="/home" element={<MobileHome />} />
        <Route path="/app" element={<MobileHome />} />
        <Route path="/list" element={<MobileDiscover />} />
        <Route path="/camera" element={<MobileCamera />} />
        <Route path="/inbox" element={<MobileInbox />} />
        <Route path="/profile" element={<MobileProfile />} />
        
        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MobileLayout>
  );
};

export default MobileApp;