
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.822f9e01fc9740d1b5062512241aa634',
  appName: 'geo-bubble-whispers',
  webDir: 'dist',
  server: {
    url: "https://822f9e01-fc97-40d1-b506-2512241aa634.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF",
      androidSplashResourceName: "splash",
      showSpinner: true,
      spinnerColor: "#999999",
    },
    Geolocation: {
      permissions: {
        ios: ["locationWhenInUse"]
      }
    }
  }
};

export default config;
