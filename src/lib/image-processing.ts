const CANVAS_WIDTH = 1400;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function getCenteredImagePlacement(sourceWidth: number, sourceHeight: number) {
  const canvasWidth = Math.min(
    CANVAS_WIDTH,
    Math.max(100, Math.ceil(Math.max(sourceWidth, sourceHeight * (4 / 3))))
  );
  const canvasHeight = Math.round(canvasWidth * (3 / 4));
  const scale = Math.min(1, canvasWidth / sourceWidth, canvasHeight / sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  return {
    canvasWidth,
    canvasHeight,
    width,
    height,
    x: Math.round((canvasWidth - width) / 2),
    y: Math.round((canvasHeight - height) / 2),
  };
}

type DecodedImage = {
  width: number;
  height: number;
  source: CanvasImageSource;
  close?: () => void;
};

async function decodeImage(file: File): Promise<DecodedImage | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {width: bitmap.width, height: bitmap.height, source: bitmap, close: () => bitmap.close()};
    } catch {
      // Some browsers do not support decoding every accepted image variant.
    }
  }

  if (typeof window === 'undefined' || typeof URL.createObjectURL !== 'function') return null;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('No se ha podido leer la imagen.'));
      element.src = objectUrl;
    });
    return {width: image.naturalWidth, height: image.naturalHeight, source: image};
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/** Prepares a listing photo without allowing the server validation to be bypassed. */
export async function normalizeListingImage(file: File): Promise<File> {
  if (typeof document === 'undefined') return file;

  const decoded = await decodeImage(file);
  if (!decoded || !decoded.width || !decoded.height) return file;

  const canvas = document.createElement('canvas');
  const placement = getCenteredImagePlacement(decoded.width, decoded.height);
  canvas.width = placement.canvasWidth;
  canvas.height = placement.canvasHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    decoded.close?.();
    return file;
  }

  context.fillStyle = '#f4f6f3';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(decoded.source, placement.x, placement.y, placement.width, placement.height);
  decoded.close?.();

  for (const quality of [0.88, 0.78, 0.68]) {
    const blob = await canvasBlob(canvas, quality);
    if (blob && blob.size <= MAX_FILE_SIZE) {
      const name = file.name.replace(/\.[^.]+$/, '') || 'imagen';
      return new File([blob], `${name}.jpg`, {type: 'image/jpeg', lastModified: Date.now()});
    }
  }

  return file;
}

