import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'at.Open-Akquise.immo.localtest',
    appName: 'Open-Akquise Local Test',
    webDir: 'mobile-local-test',
    appendUserAgent: 'openakquiseLocalTest',
    plugins: {
        SplashScreen: {
            launchShowDuration: 1200,
            launchAutoHide: true,
            backgroundColor: '#0A0A0A',
            androidSplashResourceName: 'splash',
            androidScaleType: 'CENTER_CROP',
            showSpinner: true,
            androidSpinnerStyle: 'large',
            spinnerColor: '#D4AF37',
        },
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#0A0A0A',
        },
    },
};

export default config;

