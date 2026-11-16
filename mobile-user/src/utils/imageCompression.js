// Port of utils/imageCompression.js (canvas) — resize to maxWidth and re-encode JPEG via expo-image-manipulator.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export const compressImage = async (file, maxWidth = 1200, quality = 0.8) => {
  if (!file?.uri || !/^image\//.test(file.type || 'image/')) return file;
  try {
    const ctx = ImageManipulator.manipulate(file.uri);
    if (file.width && file.width > maxWidth) ctx.resize({ width: maxWidth });
    const image = await ctx.renderAsync();
    const result = await image.saveAsync({ compress: quality, format: SaveFormat.JPEG });
    return { ...file, uri: result.uri, type: 'image/jpeg', width: result.width, height: result.height, name: (file.name || 'image').replace(/\.\w+$/, '') + '.jpg' };
  } catch (_) {
    return file; // fallback like the web
  }
};
