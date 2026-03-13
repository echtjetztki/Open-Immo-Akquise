import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'at.Open-Akquise.immo.admin',
  appName: 'Open-Akquise Admin',
  webDir: 'public',
  server: {
    url: 'https://open-akquise.vercel.app',
    cleartext: true
  },
  appendUserAgent: "OpenAkquiseAdmin",
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0A0A0A",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#D4AF37",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0A0A0A",
    }
  }
};

export default config;

