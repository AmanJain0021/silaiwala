// Expo config. Name/package/version: see MEMORY.md §2 (no Flutter wrapper; package from Play Store listing).
const fs = require('fs');
const path = require('path');

const hasGoogleServices = fs.existsSync(path.join(__dirname, 'google-services.json'));
const BRAND_DARK = '#282726';

module.exports = {
  expo: {
    name: 'Sewzella',
    slug: 'sewzella-user',
    scheme: 'sewzella',
    version: '1.0.3',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    backgroundColor: '#ffffff',
    android: {
      package: 'com.sewzella.user',
      versionCode: 10,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: BRAND_DARK,
      },
      softwareKeyboardLayoutMode: 'resize',
      ...(hasGoogleServices ? { googleServicesFile: './google-services.json' } : {}),
      config: {
        googleMaps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY },
      },
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.CAMERA',
        'android.permission.POST_NOTIFICATIONS',
      ],
      blockedPermissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
    },
    ios: { bundleIdentifier: 'com.sewzella.user' },
    plugins: [
      'expo-router',
      'expo-status-bar',
      'expo-secure-store',
      'expo-font',
      'expo-image',
      [
        'expo-splash-screen',
        { image: './assets/splash-icon.png', imageWidth: 220, resizeMode: 'contain', backgroundColor: BRAND_DARK },
      ],
      ['expo-location', { locationWhenInUsePermission: 'Allow Sewzella to use your location to find tailors and set your delivery address.' }],
      ['expo-image-picker', { photosPermission: 'Allow Sewzella to access your photos to upload designs and fabric images.', cameraPermission: 'Allow Sewzella to use the camera to capture designs and fabric images.', microphonePermission: false }],
      ['expo-notifications', { color: '#843D9B' }],
      '@react-native-google-signin/google-signin',
      // R8 minify is off: with it on, Room/WorkManager (via Firebase) crashed at launch (WorkDatabase_Impl stripped). Reflection-heavy SDKs (Razorpay, Google Sign-In) are also at risk.
      ['expo-build-properties', { android: { usesCleartextTraffic: false, enableMinifyInReleaseBuilds: false, enableShrinkResourcesInReleaseBuilds: false } }],
    ],
    experiments: { typedRoutes: false },
    owner: 'amankuril',
    extra: { eas: { projectId: '2aa70428-87aa-4ae4-b7a6-61f2e4ccd759' } },
  },
};
