// navigator.share / clipboard replacement. Links point at the live web app (same URLs the web shares).
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { WEB_ORIGIN } from './config';
import toast from './toast';

export const webUrl = (path) => `${WEB_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;

export async function shareLink({ title, text, url }) {
  try {
    await Share.share({ title, message: [text, url].filter(Boolean).join('\n'), url });
  } catch (_) {
    await Clipboard.setStringAsync(url || text || '');
    toast.success('Link copied');
  }
}

export async function copyText(value, message = 'Copied!') {
  await Clipboard.setStringAsync(String(value ?? ''));
  toast.success(message);
}
