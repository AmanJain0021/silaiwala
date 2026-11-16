// Resolves web image references (bundled public paths, uploads, URLs) to expo-image sources.
import ASSETS from './assetMap';
import { WEB_ORIGIN, SOCKET_URL } from './config';

export function resolveImageSource(src) {
  if (src == null || src === '') return null;
  if (typeof src === 'number') return src;
  if (typeof src === 'object') return src;
  const s = String(src);
  if (/^(https?:|data:|file:|content:)/.test(s)) return { uri: s };
  const decoded = s.startsWith('/') ? decodeURI(s) : `/${s}`;
  if (ASSETS[decoded]) return ASSETS[decoded];
  if (/^\/?uploads\//.test(s) || /^\/?api\//.test(s)) return { uri: `${SOCKET_URL}${s.startsWith('/') ? '' : '/'}${s}` };
  // unbundled public asset of the web app
  return { uri: `${WEB_ORIGIN}${s.startsWith('/') ? '' : '/'}${encodeURI(decodeURI(s.replace(/^\//, '')))}` };
}

export const asset = (webPath) => ASSETS[webPath];
