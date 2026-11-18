// Port of utils/audio.js. The web synthesises a short alert with the Web Audio API (not available in
// React Native); natively the same rhythm is played as a vibration pattern: a triple pulse for the
// tailor/delivery "new order" alert, a single soft pulse otherwise.
import { Vibration } from 'react-native';

export const playNotificationSound = (role = 'customer') => {
  try {
    if (role === 'delivery' || role === 'tailor') Vibration.vibrate([0, 100, 50, 100, 50, 160]);
    else Vibration.vibrate(80);
  } catch (_) { /* best effort, like the web */ }
};

export default playNotificationSound;
