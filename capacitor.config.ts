import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.logospraxis.study",
  appName: "LogosPraxis",
  webDir: "dist",
  server: {
    hostname: "localhost",
    androidScheme: "https"
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#f1f3ef",
    webContentsDebuggingEnabled: false
  },
  ios: {
    allowsLinkPreview: false,
    backgroundColor: "#f1f3ef",
    contentInset: "never",
    preferredContentMode: "recommended",
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      style: "LIGHT",
      hidden: false,
      animation: "NONE"
    },
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: false,
      backgroundColor: "#f1f3efff",
      androidScaleType: "CENTER_INSIDE",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false
    }
  }
};

export default config;
