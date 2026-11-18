import jsQR from 'jsqr';

/**
 * Attempts to decode an EMVCo QRIS QR code payload from an uploaded image File
 * inside the browser by scanning both the full frame and centered poster crops.
 */
export async function decodeQrisFromImageFile(file: File): Promise<string | null> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal membaca berkas gambar QRIS'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar QRIS'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Gagal memuat pratinjau gambar QRIS'));
    el.src = dataUrl;
  });

  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Limit max decode dimension to keep browser decode fast even on high-res posters
  const maxDim = 1400;
  const baseScale = Math.min(1, maxDim / Math.max(w, h));

  const tryDecode = (sx: number, sy: number, sw: number, sh: number, scale: number): string | null => {
    const targetW = Math.max(64, Math.round(sw * scale));
    const targetH = Math.max(64, Math.round(sh * scale));
    canvas.width = targetW;
    canvas.height = targetH;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
    const imageData = ctx.getImageData(0, 0, targetW, targetH);
    const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    return decoded?.data?.trim() || null;
  };

  const regions: Array<[number, number, number, number, number]> = [
    [0, 0, w, h, baseScale],
    [0, 0, w, h, baseScale * 0.65],
    [Math.round(w * 0.05), Math.round(h * 0.22), Math.round(w * 0.9), Math.round(h * 0.62), baseScale],
    [Math.round(w * 0.1), Math.round(h * 0.28), Math.round(w * 0.8), Math.round(h * 0.54), baseScale],
  ];

  for (const [sx, sy, sw, sh, scale] of regions) {
    const found = tryDecode(sx, sy, sw, sh, scale);
    if (found) return found;
  }

  return null;
}
