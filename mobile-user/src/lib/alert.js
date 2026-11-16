// window.alert / window.confirm replacements (native dialogs).
import { Alert } from 'react-native';

export const alert = (message) => Alert.alert('', String(message ?? ''));

/** Promise<boolean> — web confirm() is synchronous; callers must `await confirm(...)`. */
export const confirm = (message, { ok = 'OK', cancel = 'Cancel', destructive = false } = {}) =>
  new Promise((resolve) => {
    Alert.alert('', String(message ?? ''), [
      { text: cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: ok, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
