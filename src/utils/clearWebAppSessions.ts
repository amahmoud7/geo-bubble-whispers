import { supabase } from '@/integrations/supabase/client';

export const clearAllSessions = async () => {
  try {
    console.log('Clearing all existing sessions and storage...');
    
    // Clear Supabase session
    await supabase.auth.signOut();
    
    // Clear all localStorage related to auth
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('supabase') || 
        key.startsWith('sb-') || 
        key.includes('auth') ||
        key.includes('session') ||
        key.includes('token')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.startsWith('supabase') || 
        key.startsWith('sb-') || 
        key.includes('auth') ||
        key.includes('session') ||
        key.includes('token')
      )) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log('All sessions and auth storage cleared');
    
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
};

export const clearBrowserAuthData = () => {
  // Clear any cookies related to the web app (if we can access them)
  try {
    // Clear URL fragments that might contain auth data
    if (window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    console.log('Browser auth data cleared');
  } catch (error) {
    console.error('Error clearing browser auth data:', error);
  }
};