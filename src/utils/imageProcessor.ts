import heic2any from "heic2any";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const HEIC_TYPES = ["image/heic", "image/heif"];

/**
 * Normalizes any supported upload (JPG/JPEG/PNG/HEIC/HEIF) into a
 * browser-renderable object URL. HEIC/HEIF is transcoded to JPEG client-side
 * since almost no browser can decode HEIC in an <img> or <canvas> natively.
 */
export async function normalizeToObjectUrl(file: File): Promise<string> {
  const isHeic =
    HEIC_TYPES.includes(file.type.toLowerCase()) ||
    /\.(heic|heif)$/i.test(file.name);

  if (!isHeic) {
    return URL.createObjectURL(file);
  }

  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  const blob = Array.isArray(converted) ? converted[0] : converted;
  return URL.createObjectURL(blob);
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Detects a face's approximate bounding box using the browser's native
 * FaceDetector API where available (Chrome/Android WebView). Returns null on
 * unsupported browsers (Safari, Firefox) or when no face is found — callers
 * should fall back to a sensible center-weighted crop in that case.
 *
 * This ONLY reads pixel geometry to bias cropping. It never alters,
 * beautifies, or regenerates any part of the photo.
 */
async function detectFaceCenter(
  img: HTMLImageElement
): Promise<{ x: number; y: number } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FaceDetectorCtor = (window as any).FaceDetector;
  if (!FaceDetectorCtor) return null;

  try {
    const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(img);
    if (!faces || faces.length === 0) return null;

    const box = faces[0].boundingBox;
    return {
      x: box.x + box.width / 2,
      y: box.y + box.height * 0.4, // bias slightly above center (eyes, not chin)
    };
  } catch {
    return null;
  }
}

/**
 * Computes the source crop rectangle (in original-image pixel space) that
 * should be drawn into a target box of aspect ratio targetW:targetH, using
 * object-fit: cover semantics. When a face is detected, the crop window is
 * shifted so the face stays inside frame instead of a plain center-crop.
 */
export async function computeSmartCrop(
  img: HTMLImageElement,
  targetW: number,
  targetH: number
): Promise<CropRect> {
  const targetAspect = targetW / targetH;
  const srcAspect = img.naturalWidth / img.naturalHeight;

  let cropWidth: number;
  let cropHeight: number;

  if (srcAspect > targetAspect) {
    // source is wider than target -> crop the sides
    cropHeight = img.naturalHeight;
    cropWidth = cropHeight * targetAspect;
  } else {
    // source is taller than target -> crop top/bottom
    cropWidth = img.naturalWidth;
    cropHeight = cropWidth / targetAspect;
  }

  let centerX = img.naturalWidth / 2;
  let centerY = img.naturalHeight / 2;

  const face = await detectFaceCenter(img);
  if (face) {
    centerX = face.x;
    centerY = face.y;
  } else {
    // Heuristic fallback for uncropped selfies/portraits: bias slightly
    // upward from dead-center, since faces are rarely in the bottom half.
    centerY = img.naturalHeight * 0.42;
  }

  let x = centerX - cropWidth / 2;
  let y = centerY - cropHeight / 2;

  // Clamp so the crop window never leaves the source image bounds
  x = Math.max(0, Math.min(x, img.naturalWidth - cropWidth));
  y = Math.max(0, Math.min(y, img.naturalHeight - cropHeight));

  return { x, y, width: cropWidth, height: cropHeight };
}
