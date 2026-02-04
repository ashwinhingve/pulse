import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.military.pulselogic',
  appName: 'PulseLogic',
  webDir: 'out',

  server: {
    // Force HTTPS for security
    androidScheme: 'https',
    iosScheme: 'https',
    // Allow cleartext only in development
    cleartext: process.env.NODE_ENV === 'development',
  },

  // iOS specific configurations
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f172a',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },

  // Android specific configurations
  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
  },

  plugins: {
    // Splash screen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    // Status bar configuration
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a',
    },

    // Keyboard configuration
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },

    // Secure storage (for tokens)
    SecureStoragePlugin: {
      // Enable keychain sharing for iOS
      keychainAccessibility: 'afterFirstUnlock',
    },

    // App configuration
    App: {
      // Prevent app content from appearing in screenshots/task switcher
      // Important for HIPAA compliance
    },

    // Push notifications (disabled for MVP - out of scope)
    // PushNotifications: {
    //   presentationOptions: ['badge', 'sound', 'alert'],
    // },
  },
};

export default config;
