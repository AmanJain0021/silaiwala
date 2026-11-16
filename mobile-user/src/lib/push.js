/*
 * Native push (replaces the Flutter wrapper's FCM bridge + web usePushNotifications).
 * - Device FCM token -> PUT /user/fcm-token { platform: 'mobile' } (same call the web made for the wrapper token)
 * - Token refresh re-registers; logout removes it (POST /notifications/fcm-token/remove)
 * - Foreground: OS banner + the web's toast; tap (foreground/background/killed): open data.url
 * Requires google-services.json (FCM). Without it getDevicePushTokenAsync throws and push stays off.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from './api';
import storage from './storage';
import toast from './toast';
import { navigate } from './nav';

let currentToken = storage.getItem('fcm_token');
let tokenSub = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const syncToken = async (token, userId) => {
  if (!token || !storage.getItem('token')) return;
  currentToken = token;
  storage.setItem('fcm_token', token);
  const syncedKey = `fcm_token_synced_${String(userId || 'gen').slice(-8)}_${token.slice(-10)}`;
  if (storage.getItem(syncedKey) === 'true') return;
  const payload = { fcmToken: token, token, platform: 'mobile' };
  try {
    await api.put('/user/fcm-token', payload);
    storage.setItem(syncedKey, 'true');
  } catch (err) {
    try {
      await api.post('/notifications/fcm-token', payload);
      storage.setItem(syncedKey, 'true');
    } catch (_) { /* retried on next launch */ }
  }
};

export async function registerForPush(userId) {
  if (!userId || !Device.isDevice) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications',
        // eslint-disable-next-line import/namespace -- exported at runtime (NotificationChannelManager.types)
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: '#843D9B',
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return null;
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    await syncToken(token, userId);
    tokenSub?.remove();
    tokenSub = Notifications.addPushTokenListener(({ data }) => syncToken(data, userId));
    return token;
  } catch (_) {
    // FCM not configured (google-services.json missing) or Play services unavailable
    return null;
  }
}

export async function removeDeviceTokenOnLogout() {
  const deviceToken = currentToken || storage.getItem('fcm_token');
  if (deviceToken) {
    try {
      await api.post('/notifications/fcm-token/remove', { fcmToken: deviceToken, token: deviceToken }).catch(async () => {
        await api.post('/auth/logout', { fcmToken: deviceToken, token: deviceToken });
      });
    } catch (_) { /* best effort */ }
    // keys are cleared so the next login re-registers the token
    const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
    try {
      const keys = await AsyncStorage.getAllKeys();
      keys.filter((k) => k.includes('fcm_token_synced_')).forEach((k) => storage.removeItem(k.replace(/^sz:/, '')));
    } catch (_) { /* ignore */ }
  }
  tokenSub?.remove();
  tokenSub = null;
  currentToken = null;
  storage.removeItem('fcm_token');
}

const targetFromData = (data = {}) => {
  let url = data.url || data.targetUrl || '';
  if (!url || url === '/') return '/user';
  try {
    if (/^https?:\/\//.test(url)) url = new URL(url).pathname + new URL(url).search;
  } catch (_) { /* keep as is */ }
  return url.startsWith('/user') || url.startsWith('/welcome') ? url : '/user';
};

export function attachNotificationListeners() {
  const received = Notifications.addNotificationReceivedListener((n) => {
    const data = n.request.content.data || {};
    const title = data.title || n.request.content.title || 'SewZella';
    const body = data.body || data.message || n.request.content.body || 'New Notification';
    const orderId = data.orderId || data.id || data.order;
    const status = data.status;
    const id = orderId && status
      ? `toast-status-${orderId}-${String(status).toLowerCase()}`
      : orderId ? `toast-new-order-${orderId}` : `toast-fcm-${title}-${body}`.replace(/\s+/g, '-').toLowerCase();
    toast.success(`🔔 ${title}\n${body}`, { id, duration: 5000 });
  });
  const response = Notifications.addNotificationResponseReceivedListener((r) => {
    navigate(targetFromData(r.notification.request.content.data));
  });
  return () => {
    received.remove();
    response.remove();
  };
}

/** Notification that launched the app from a killed state. */
export async function handleInitialNotification() {
  try {
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      navigate(targetFromData(last.notification.request.content.data));
      Notifications.clearLastNotificationResponse();
    }
  } catch (_) { /* none */ }
}

/** Same as web hooks/usePushNotifications testPushToThisDevice: backend sends to the stored tokens. */
export const testPushToThisDevice = async () => {
  const response = await api.post('/notifications/test-push', {});
  if (response.data && response.data.success === false) {
    throw new Error(response.data.message || 'Push notification failed to deliver.');
  }
  return response.data;
};
