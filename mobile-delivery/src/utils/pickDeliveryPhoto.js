/**
 * Port of modules/delivery/utils/pickDeliveryPhoto.js — proof photo: instant preview, then a JPEG
 * data URL (longest edge 1280px, quality 0.72) for the API payload. Canvas -> expo-image-manipulator.
 * `input` is the web-like event target `{ files: [file] }` produced for the native picker.
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export const compressToJpegDataUrl = async (file, maxEdge = 1280, quality = 0.72) => {
  const uri = typeof file === 'string' ? file : file?.uri;
  if (!uri) return null;
  const ctx = ImageManipulator.manipulate(uri);
  const w = file?.width;
  const h = file?.height;
  if (w && h && Math.max(w, h) > maxEdge) ctx.resize(w >= h ? { width: maxEdge } : { height: maxEdge });
  else if (!w || !h) ctx.resize({ width: maxEdge });
  const image = await ctx.renderAsync();
  const out = await image.saveAsync({ compress: quality, format: SaveFormat.JPEG, base64: true });
  return out.base64 ? `data:image/jpeg;base64,${out.base64}` : null;
};

export const readBlobAsDataUrl = (file) => compressToJpegDataUrl(file, 4096, 0.92);

/** Ensure the proof sent to the API is a data URL (already one, or a local file uri to encode). */
export const ensurePhotoDataUrl = async (value) => {
  if (!value || typeof value !== 'string') return value;
  if (value.startsWith('data:') || /^https?:/.test(value)) return value;
  try {
    return (await compressToJpegDataUrl(value)) || value;
  } catch (_) {
    return value;
  }
};

/**
 * @param {{ files: Array<{uri:string,width?:number,height?:number,size?:number}> }} input
 * @param {(url: string) => void} setPreview
 * @param {{ fromCamera?: boolean, onProcessing?: (v: boolean) => void }} opts
 */
export const pickPhotoFromInput = (input, setPreview, opts = {}) => {
  const { onProcessing } = opts;
  const file = input?.files?.[0];
  if (!file?.uri) return;
  if (file.size > 20 * 1024 * 1024) throw new Error('Image too large');
  setPreview(file.uri);
  onProcessing?.(true);
  compressToJpegDataUrl(file)
    .then((dataUrl) => { if (dataUrl) setPreview(dataUrl); })
    .catch(() => { /* keep the file preview if compression failed */ })
    .finally(() => onProcessing?.(false));
};
