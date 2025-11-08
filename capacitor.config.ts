
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lo.social',
  appName: 'Lo',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'always',
    allowsInlineMediaPlayback: true,
    limitsNavigationsToAppBoundDomains: false,
    preferredContentMode: 'mobile',
    backgroundColor: '#043651',
    // Performance optimizations for enhanced build
    webContentsDebuggingEnabled: true,
    allowsBackForwardNavigationGestures: false,
    scrollEnabled: true,
    // Enhanced security settings
    allowsLinkPreview: false,
    // iPhone 16 Pro Max specific optimizations
    scheme: 'https',
    hostname: 'localhost'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#043651",
      androidSplashResourceName: "splash",
      showSpinner: false,
      spinnerColor: "#13D3AA",
      androidScaleType: 'CENTER_CROP',
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
        ios: ["camera", "microphone", "photos"],
        android: ["camera", "record_audio", "modify_audio_settings"]
      }
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#043651'
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true
    }
  },
  server: {
    // url: 'http://localhost:8080', // Uncomment for live reload during development
    iosScheme: 'https',
    androidScheme: 'https',
    hostname: 'localhost',
    cleartext: true,
    // Performance optimization
    allowNavigation: [
      'https://*.google.com',
      'https://*.googleapis.com',
      'https://*.supabase.co',
      'https://*.ticketmaster.com'
    ]
  }
};

export default config;
