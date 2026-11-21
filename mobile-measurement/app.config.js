// Expo config for the Sewzella Measurement (executive) app. Name/package/version: see MEMORY.md §2 (Play Store listing).
const fs = require('fs');
const path = require('path');
const { withAndroidManifest } = require('expo/config-plugins');

const hasGoogleServices = fs.existsSync(path.join(__dirname, 'google-services.json'));
const BRAND_BG = '#ffffff';

// Expo writes a plain round bitmap for roundIcon, which launchers show on a tinted plate. Without it they use the adaptive icon.
const withAdaptiveIconOnly = (config) => withAndroidManifest(config, (c) => {
  delete c.modResults.manifest.application[0].$['android:roundIcon'];
  return c;
});

module.exports = {
  expo: {
    name: 'Sewzella Measurement',
    slug: 'sewzella-measurement',
    scheme: 'sewzellameasurement',
    version: '1.0.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    backgroundColor: '#ffffff',
    android: {
      package: 'com.sewzella.measurement',
      versionCode: 2,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: BRAND_BG,
      },
      softwareKeyboardLayoutMode: 'resize',
      ...(hasGoogleServices ? { googleServicesFile: './google-services.json' } : {}),
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.CAMERA',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.VIBRATE',
      ],
      blockedPermissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
    },
    ios: { bundleIdentifier: 'com.sewzella.measurement' },
    plugins: [
      withAdaptiveIconOnly,
      'expo-router',
      'expo-status-bar',
      'expo-secure-store',
      'expo-font',
      'expo-image',
      [
        'expo-splash-screen',
        { image: './assets/splash-icon.png', imageWidth: 288, resizeMode: 'contain', backgroundColor: BRAND_BG },
      ],
      ['expo-location', { locationWhenInUsePermission: 'Allow Sewzella to use your location to show nearby measurement requests and guide you to customers.' }],
      ['expo-image-picker', { photosPermission: 'Allow Sewzella to access your photos to upload measurement and profile images.', cameraPermission: 'Allow Sewzella to use the camera to capture measurement and profile photos.', microphonePermission: false }],
      ['expo-notifications', { color: '#843D9B' }],
      // R8 minify is off: with it on, Room/WorkManager (via Firebase) crashed at launch (WorkDatabase_Impl stripped).
      ['expo-build-properties', { android: { usesCleartextTraffic: false, enableMinifyInReleaseBuilds: false, enableShrinkResourcesInReleaseBuilds: false } }],
    ],
    experiments: { typedRoutes: false },
    extra: { eas: {} },
  },
};
