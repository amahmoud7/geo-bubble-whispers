
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lo.social',
  appName: 'Lo',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      backgroundColor: "#043651",
      androidSplashResourceName: "splash",
      showSpinner: false,
      spinnerColor: "#13D3AA",
    },
    Geolocation: {
      permissions: {
        ios: ["locationWhenInUse"]
      }
    }
  }
};

export default config;
