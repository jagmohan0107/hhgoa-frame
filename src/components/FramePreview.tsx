import type { CSSProperties } from "react";
import {
  FRAME_SRC,
  FRAME_WIDTH,
  FRAME_HEIGHT,
  PHOTO_AREA,
  NAME_TEXT,
  ROLE_TEXT,
  BUILDER_TITLE_TEXT,
  HAS_BUILDER_TITLE,
} from "../config/frameConfig";
import type { TextSlot } from "../config/frameConfig";

interface FramePreviewProps {
  photoUrl: string | null;
  name: string;
  role: string;
  builderTitle?: string;
}

const pct = (value: number, total: number) => `${(value / total) * 100}%`;
// cqw = 1% of the container's inline size — lets font sizes scale fluidly
// with the preview's rendered width instead of a fixed pixel value.
const cqw = (value: number) => `${(value / FRAME_WIDTH) * 100}cqw`;

function textStyle(slot: TextSlot): CSSProperties {
  return {
    position: "absolute",
    left: pct(slot.x, FRAME_WIDTH),
    top: pct(slot.y, FRAME_HEIGHT),
    transform: "translate(-50%, -50%)",
    width: cqw(slot.maxWidth),
    textAlign: slot.align === "center" ? "center" : slot.align === "right" ? "right" : "left",
    fontFamily: slot.fontFamily,
    fontWeight: slot.fontWeight,
    fontSize: cqw(slot.fontSize),
    letterSpacing: cqw(slot.letterSpacing),
    color: slot.color,
    textTransform: slot.uppercase ? "uppercase" : "none",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: 1.1,
    pointerEvents: "none",
  };
}

export default function FramePreview({ photoUrl, name, role, builderTitle }: FramePreviewProps) {
  return (
    <div
      className="relative w-full mx-auto rounded-2xl overflow-hidden shadow-card bg-black/20"
      style={{
        aspectRatio: `${FRAME_WIDTH} / ${FRAME_HEIGHT}`,
        containerType: "inline-size",
      }}
    >
      {/* Layer 1: uploaded photo, behind the frame */}
      {photoUrl && (
        <div
          className="absolute overflow-hidden"
          style={{
            left: pct(PHOTO_AREA.x, FRAME_WIDTH),
            top: pct(PHOTO_AREA.y, FRAME_HEIGHT),
            width: pct(PHOTO_AREA.width, FRAME_WIDTH),
            height: pct(PHOTO_AREA.height, FRAME_HEIGHT),
            borderRadius: cqw(PHOTO_AREA.borderRadius),
            transform: PHOTO_AREA.rotationDeg ? `rotate(${PHOTO_AREA.rotationDeg}deg)` : undefined,
          }}
        >
          <img
            src={photoUrl}
            alt="Your uploaded photo"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}

      {/* Layer 2: frame artwork, exact/pixel-perfect, never modified */}
      <img
        src={FRAME_SRC}
        alt="HH Goa 2026 frame"
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        draggable={false}
      />

      {/* Layer 3: name */}
      {name && <div style={textStyle(NAME_TEXT)}>{name}</div>}

      {/* Layer 4: role / stack */}
      {role && <div style={textStyle(ROLE_TEXT)}>{role}</div>}

      {/* Layer 5: optional builder title */}
      {HAS_BUILDER_TITLE && builderTitle && (
        <div style={textStyle(BUILDER_TITLE_TEXT)}>{builderTitle}</div>
      )}
    </div>
  );
}
