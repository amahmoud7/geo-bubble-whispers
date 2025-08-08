
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.822f9e01fc9740d1b5062512241aa634',
  appName: 'geo-bubble-whispers',
  webDir: 'dist',
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
