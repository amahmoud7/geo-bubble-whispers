import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geobubblewhispers.app.dev',
  appName: 'Geo Bubble Whispers Dev',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: "https://822f9e01-fc97-40d1-b506-2512241aa634.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  ios: {
    contentInset: 'always',
    scheme: 'Geo Bubble Whispers Dev',
    backgroundColor: '#ffffff',
    allowsLinkPreview: false,
    scrollEnabled: true,
    minVersion: '13.0',
    webContentsDebuggingEnabled: true,
    preferredContentMode: 'mobile'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#ff6b35",
      androidSplashResourceName: "splash",
      showSpinner: true,
      androidScaleType: "CENTER_CROP",
      spinnerColor: "#ffffff",
      iosSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true
    },
    Geolocation: {
      permissions: {
        ios: ["locationWhenInUse", "locationAlways"]
      }
    },
    Camera: {
      permissions: {
        ios: ["camera", "photos"]
      }
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#ff6b35",
      overlaysWebView: false
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true
    },
    App: {
      urlScheme: "geobubblewhispers-dev"
    },
    Device: {},
    Haptics: {},
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#ff6b35",
      sound: "beep.wav"
    },
    Share: {},
    Filesystem: {}
  }
};

export default config;