
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add necessary capacitor imports
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

console.log('🚀 main.tsx loading...');
console.log('📱 Platform:', Capacitor.getPlatform());

// Global error handler for iOS
window.onerror = function(message, source, lineno, colno, error) {
  console.error('💥 Global Error:', {
    message,
    source,
    lineno,
    colno,
    error: error?.toString()
  });
  return false;
};

window.onunhandledrejection = function(event) {
  console.error('💥 Unhandled Promise Rejection:', event.reason);
};

try {
  // Call the element loader after the platform has been bootstrapped
  defineCustomElements(window);
  console.log('✅ PWA elements defined');

  // Hide native splash screen on iOS/Android after React loads
  if (Capacitor.isNativePlatform()) {
    console.log('📱 Hiding native splash screen...');
    SplashScreen.hide({ fadeOutDuration: 300 }).catch((err) => {
      console.warn('⚠️ Could not hide splash screen:', err);
    });
  }

  console.log('🎨 Rendering React app...');
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  createRoot(rootElement).render(<App />);
  console.log('✅ React app rendered');

} catch (error) {
  console.error('💥 Fatal error in main.tsx:', error);
  
  // Show error on screen for debugging
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; background: #f44336; color: white; font-family: monospace;">
        <h2>App Error</h2>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        <p style="font-size: 12px; margin-top: 20px;">Check Xcode console for details</p>
      </div>
    `;
  }
}
