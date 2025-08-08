import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geobubblewhispers.app',
  appName: 'Geo Bubble Whispers',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'always',
    scheme: 'Geo Bubble Whispers',
    backgroundColor: '#ffffff',
    allowsLinkPreview: false,
    scrollEnabled: true,
    minVersion: '13.0',
    webContentsDebuggingEnabled: false,
    preferredContentMode: 'mobile'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#6366f1",
      androidSplashResourceName: "splash",
      showSpinner: false,
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
      backgroundColor: "#6366f1",
      overlaysWebView: false
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true
    },
    App: {
      urlScheme: "geobubblewhispers"
    },
    Device: {},
    Haptics: {},
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#6366f1",
      sound: "beep.wav"
    },
    Share: {},
    Filesystem: {}
  }
};

export default config;