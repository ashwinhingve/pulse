import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.CAPACITOR_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.military.pulselogic',
  appName: 'PulseLogic',
  webDir: 'out',

  server: {
    // In dev, connect to local dev server for live reload
    ...(isDev && {
      url: 'http://10.0.2.2:3000', // Android emulator → host machine
      cleartext: true,
    }),
    // Production uses bundled assets (webDir)
    androidScheme: isDev ? 'http' : 'https',
    iosScheme: 'https',
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
    allowMixedContent: isDev, // Only allow mixed content in dev
    captureInput: true,
    webContentsDebuggingEnabled: isDev,
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
      keychainAccessibility: 'afterFirstUnlock',
    },

    // App configuration — prevent screenshots for HIPAA
    App: {},
  },
};

export default config;

