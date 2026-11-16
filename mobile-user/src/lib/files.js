/*
 * <input type="file"> replacement. Returns RN file objects usable in FormData
 * ({ uri, name, type, size, base64? }) or null when cancelled / permission denied.
 */
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import toast from './toast';

const toFile = (a, fallbackName) => ({
  uri: a.uri,
  name: a.fileName || a.name || fallbackName || a.uri.split('/').pop(),
  type: a.mimeType || (a.type === 'video' ? 'video/mp4' : a.type === 'image' ? 'image/jpeg' : 'application/octet-stream'),
  size: a.fileSize ?? a.size ?? 0,
  base64: a.base64,
  width: a.width,
  height: a.height,
});

/** Gallery picker. options: { multiple, video, base64, camera } */
export async function pickImage({ multiple = false, video = false, base64 = false, camera = false, limit = 0 } = {}) {
  const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : { granted: true };
  if (!perm.granted) {
    toast.error('Camera permission denied\nAllow camera access in Settings to take a photo.');
    return multiple ? [] : null;
  }
  const opts = {
    mediaTypes: video ? ['images', 'videos'] : ['images'],
    allowsMultipleSelection: multiple,
    selectionLimit: limit,
    quality: 0.8,
    base64,
  };
  const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets?.length) return multiple ? [] : null;
  const files = res.assets.map((a, i) => toFile(a, `upload_${Date.now()}_${i}.${a.type === 'video' ? 'mp4' : 'jpg'}`));
  return multiple ? files : files[0];
}

export async function pickVideo() {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
  if (res.canceled || !res.assets?.length) return null;
  return toFile(res.assets[0], `video_${Date.now()}.mp4`);
}

export async function pickDocument({ type = '*/*', multiple = false } = {}) {
  const res = await DocumentPicker.getDocumentAsync({ type, multiple, copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return multiple ? [] : null;
  const files = res.assets.map((a) => toFile(a));
  return multiple ? files : files[0];
}

export const fileToDataUrl = (file) => (file?.base64 ? `data:${file.type || 'image/jpeg'};base64,${file.base64}` : null);

/** FileReader.readAsDataURL replacement for a picked file object. */
export async function readAsDataUrl(file) {
  if (file?.base64) return fileToDataUrl(file);
  const { File: FSFile } = require('expo-file-system');
  const b64 = await new FSFile(file.uri).base64();
  return `data:${file.type || 'image/jpeg'};base64,${b64}`;
}
