import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meowise.app',
  appName: '喵食记',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
  },
};

export default config;
