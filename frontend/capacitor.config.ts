import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cifar10.imageclassifier',
  appName: 'ImageClassifier',
  webDir: 'dist',
  // Server configuration: Allow loading external API URLs from the native WebView
  server: {
    // Allow all external origins for API calls
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      // Permissions are declared in AndroidManifest.xml automatically by Capacitor
    }
  }
};

export default config;
