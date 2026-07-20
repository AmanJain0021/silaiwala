/**
 * Mobile-safe photo pick: instant blob preview, then optional JPEG compress for API payload.
 */

export const readBlobAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

export const compressToJpegDataUrl = async (file, maxEdge = 1280, quality = 0.72) => {
  const raw = await readBlobAsDataUrl(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxEdge || height > maxEdge) {
          if (width > height) {
            height = Math.round((height * maxEdge) / width);
            width = maxEdge;
          } else {
            width = Math.round((width * maxEdge) / height);
            height = maxEdge;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = raw;
    });
  } catch {
    return typeof raw === 'string' ? raw : null;
  }
};

/** Ensure value sent to API is a base64 data URL (not blob:). */
export const ensurePhotoDataUrl = async (value) => {
  if (!value || typeof value !== 'string') return null;
  if (value.startsWith('data:')) return value;
  if (value.startsWith('blob:')) {
    const res = await fetch(value);
    const blob = await res.blob();
    return readBlobAsDataUrl(blob);
  }
  return value;
};

/**
 * @param {HTMLInputElement} input
 * @param {(url: string) => void} setPreview
 * @param {{ fromCamera?: boolean, onProcessing?: (v: boolean) => void }} opts
 */
export const pickPhotoFromInput = (input, setPreview, opts = {}) => {
  const { fromCamera = false, onProcessing } = opts;

  const run = (attempt = 0) => {
    const file = input?.files?.[0];
    if (!file || file.size === 0) {
      if (fromCamera && attempt < 8) {
        setTimeout(() => run(attempt + 1), 80);
      }
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Image too large');
    }

    let blobUrl = null;
    try {
      blobUrl = URL.createObjectURL(file);
      setPreview(blobUrl);
    } catch {
      /* preview optional */
    }

    onProcessing?.(true);

    compressToJpegDataUrl(file)
      .then((dataUrl) => {
        if (dataUrl && typeof dataUrl === 'string') {
          if (blobUrl) URL.revokeObjectURL(blobUrl);
          setPreview(dataUrl);
        }
      })
      .catch(() => {
        /* keep blob: preview if compress failed */
      })
      .finally(() => {
        onProcessing?.(false);
        if (input) input.value = '';
      });
  };

  if (fromCamera) {
    // Android often populates files[] after returning from native camera
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => run(0), 80);
      });
    });
  } else {
    run(0);
  }
};
