import {
  FRAME_WIDTH,
  FRAME_HEIGHT,
  PHOTO_AREA,
  NAME_TEXT,
  ROLE_TEXT,
  BUILDER_TITLE_TEXT,
  HAS_BUILDER_TITLE,
} from "../config/frameConfig";
import type { TextSlot } from "../config/frameConfig";
import { computeSmartCrop } from "./imageProcessor";
import type { CropRect } from "./imageProcessor";

export interface RenderInputs {
  photo: HTMLImageElement | null;
  frame: HTMLImageElement;
  name: string;
  role: string;
  builderTitle?: string;
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawPhotoLayer(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  crop: CropRect
) {
  const { x, y, width, height, borderRadius, rotationDeg } = PHOTO_AREA;

  ctx.save();

  const cx = x + width / 2;
  const cy = y + height / 2;
  if (rotationDeg) {
    ctx.translate(cx, cy);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  drawRoundedRectPath(ctx, x, y, width, height, borderRadius);
  ctx.clip();

  ctx.drawImage(
    photo,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    x,
    y,
    width,
    height
  );

  ctx.restore();
}

/** Draws text centered/aligned per a TextSlot, auto-shrinking font size to fit maxWidth. */
function drawTextSlot(ctx: CanvasRenderingContext2D, slot: TextSlot, rawText: string) {
  const text = slot.uppercase ? rawText.toUpperCase() : rawText;
  if (!text.trim()) return;

  let fontSize = slot.fontSize;
  ctx.textAlign = slot.align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = slot.color;

  const measureWithSpacing = (size: number) => {
    ctx.font = `${slot.fontWeight} ${size}px ${slot.fontFamily}`;
    const base = ctx.measureText(text).width;
    return base + slot.letterSpacing * Math.max(0, text.length - 1);
  };

  while (fontSize > slot.minFontSize && measureWithSpacing(fontSize) > slot.maxWidth) {
    fontSize -= 1;
  }

  ctx.font = `${slot.fontWeight} ${fontSize}px ${slot.fontFamily}`;

  if (slot.letterSpacing === 0) {
    ctx.fillText(text, slot.x, slot.y, slot.maxWidth);
    return;
  }

  // Manual letter-spacing: draw glyph by glyph, since Canvas ignores CSS letter-spacing.
  const totalWidth = measureWithSpacing(fontSize);
  let startX: number;
  if (slot.align === "center") startX = slot.x - totalWidth / 2;
  else if (slot.align === "right") startX = slot.x - totalWidth;
  else startX = slot.x;

  const originalAlign = ctx.textAlign;
  ctx.textAlign = "left";
  let cursorX = startX;
  for (const char of text) {
    ctx.fillText(char, cursorX, slot.y);
    cursorX += ctx.measureText(char).width + slot.letterSpacing;
  }
  ctx.textAlign = originalAlign;
}

/**
 * Composites the final flattened image in the required layer order:
 * 1. Uploaded photo  2. Frame artwork  3. Name  4. Role  5. Builder title.
 * Returns a canvas at the frame's native resolution (no upscale/downscale),
 * preserving the supplied frame's exact dimensions and aspect ratio.
 */
export async function renderFinalImage(inputs: RenderInputs): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_WIDTH;
  canvas.height = FRAME_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);

  // 1. Photo (behind the frame)
  if (inputs.photo) {
    const crop = await computeSmartCrop(inputs.photo, PHOTO_AREA.width, PHOTO_AREA.height);
    drawPhotoLayer(ctx, inputs.photo, crop);
  }

  // 2. Frame artwork, pixel-perfect, drawn at native size
  ctx.drawImage(inputs.frame, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

  // 3. Name
  drawTextSlot(ctx, NAME_TEXT, inputs.name);

  // 4. Role / stack
  drawTextSlot(ctx, ROLE_TEXT, inputs.role);

  // 5. Optional builder title
  if (HAS_BUILDER_TITLE && inputs.builderTitle) {
    drawTextSlot(ctx, BUILDER_TITLE_TEXT, inputs.builderTitle);
  }

  return canvas;
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export canvas to PNG"));
    }, "image/png");
  });
}
