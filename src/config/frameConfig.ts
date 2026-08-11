/**
 * FRAME CONFIG — single source of truth for the HH Goa 2026 frame geometry.
 *
 * ✅ CALIBRATED against the real supplied artwork
 * (ChatGPT_Image_Aug_10__2026__11_06_22_AM.png, 1086×1448, 3:4).
 *
 * All coordinates below were measured directly from the source pixels
 * (connected-component analysis of the flat placeholder box, and glyph
 * bounding boxes for the name/role pills) — not eyeballed.
 *
 * IMPORTANT — the shipped frame asset (`public/frame/hhgoa-frame.png`) is a
 * processed copy of the original: every pixel of visible artwork is
 * byte-identical, but the flat dark-green placeholder rectangle has been
 * converted to a transparent window (with a ~1px feathered edge) so the
 * user's photo can sit *behind* it. This was required because the source
 * file supplied had that area painted solid, not transparent — layering a
 * photo behind an opaque frame would otherwise hide it completely. No
 * colors, typography, illustrations, logos, proportions, or layout were
 * changed; only alpha was added to that one placeholder region so the
 * existing design could function as a live photo window. Decorative
 * elements that overlap the box edge (the mug, coconut, diamond accents)
 * remain fully opaque and correctly render in front of the user's photo.
 */

export interface TextSlot {
  /** Center x of the text baseline area, in frame-pixel space */
  x: number;
  /** Center y of the text baseline area, in frame-pixel space */
  y: number;
  /** Max width text is allowed to occupy before auto-shrinking font size */
  maxWidth: number;
  /** Starting font size in frame-pixels (auto-shrinks to fit maxWidth) */
  fontSize: number;
  /** Minimum font size floor when auto-shrinking */
  minFontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  color: string;
  align: CanvasTextAlign;
  /** Extra letter spacing in px, applied manually since Canvas has no CSS letter-spacing */
  letterSpacing: number;
  /** Uppercase the text before drawing, matching most frame typography */
  uppercase: boolean;
}

export interface PhotoArea {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Corner radius for the photo mask, 0 for square corners */
  borderRadius: number;
  /** Rotation in degrees, 0 if the photo window is axis-aligned */
  rotationDeg: number;
}

export const FRAME_SRC = "/frame/hhgoa-frame.png";

// Real frame native pixel dimensions
export const FRAME_WIDTH = 1086;
export const FRAME_HEIGHT = 1448; // exactly 3:4

// Measured bounding box of the designated photo window (the flat
// placeholder rectangle in the source art, now the transparent cutout)
export const PHOTO_AREA: PhotoArea = {
  x: 312,
  y: 391,
  width: 475,
  height: 556,
  borderRadius: 0, // the box has sharp corners in the source artwork
  rotationDeg: 0,
};

// Measured from the "MADHAVAN SINGH" sample text baked into the artwork's
// dark-green name pill (pill spans x:170–885, y:1150–1251)
export const NAME_TEXT: TextSlot = {
  x: 528, // pill's horizontal center
  y: 1201, // sample glyph vertical center
  maxWidth: 580, // stays clear of the sparkle icons at the pill's edges
  fontSize: 74, // sample glyph cap-height was ~57px
  minFontSize: 30,
  fontFamily: "'Archivo Black', sans-serif",
  fontWeight: 400,
  color: "#F2E1B9", // sampled cream from the actual glyph fill
  align: "center",
  letterSpacing: 1,
  uppercase: true,
};

// Measured from the "AI/ML ENGINEER | PYTHON | TENSORFLOW | DATA SCIENCE"
// sample text in the orange role pill (pill spans x:198–876, y:1278–1346)
export const ROLE_TEXT: TextSlot = {
  x: 537, // pill's horizontal center
  y: 1313, // sample glyph vertical center
  maxWidth: 610, // stays clear of the lightning-bolt icons at the edges
  fontSize: 38, // sample glyph cap-height was ~28px
  minFontSize: 16,
  fontFamily: "'Oswald', sans-serif",
  fontWeight: 700,
  color: "#93192B", // sampled maroon-red from the actual glyph fill
  align: "center",
  letterSpacing: 1,
  uppercase: true,
};

// The supplied frame has no separate builder-title slot (only the two
// pills above), so per the brief this stays disabled rather than adding a
// new box to the design.
export const HAS_BUILDER_TITLE = false;

export const BUILDER_TITLE_TEXT: TextSlot = {
  x: FRAME_WIDTH / 2,
  y: 0,
  maxWidth: 0,
  fontSize: 0,
  minFontSize: 0,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 400,
  color: "#000000",
  align: "center",
  letterSpacing: 0,
  uppercase: false,
};

export const BUILDER_TITLES = [
  "THE BUILDER",
  "THE SHIPPER",
  "THE DEBUGGER",
  "THE VISIONARY",
  "THE PROBLEM SOLVER",
  "THE CODE WIZARD",
  "THE HACKER",
] as const;

export const OUTPUT_MIME = "image/png" as const;
export const OUTPUT_FILENAME_PREFIX = "HHGOA26";

export const SHARE_CAPTION =
  "Just framed my HH Goa 2026 identity 🌴💻\nReady to build, ship and create in Goa.\nCreate your id: https://hhgoa-frame-theta.vercel.app/"\n#FrameInGoa #HHGoa2026";
