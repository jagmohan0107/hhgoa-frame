# HH Goa 2026 — Frame / ID Card Generator

A mobile-first, client-side generator: upload a photo → it's composited behind
the HH Goa 2026 frame artwork → add name + role → download or share to X.
No backend, no login, no signup.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (mobile view: resize your browser to ~390px wide,
or open on your phone via the "Network" URL Vite prints).

```bash
npm run build   # production build -> dist/
```

## Calibrated against your real frame

`public/frame/hhgoa-frame.png` is your supplied artwork
(1086x1448, exactly 3:4), processed in exactly two targeted ways — nothing
else about it was touched:

1. **The photo window made transparent.** Your source file had that area
   painted solid dark green rather than transparent, so a photo placed
   "behind" it would've been completely hidden. That flat region (and only
   that flat region — every decorative element that overlaps its edge,
   like the mug, coconut, and diamond accents, stays fully opaque and
   correctly renders in front of the photo) is now a transparent cutout.
2. **The baked-in sample text removed.** "MADHAVAN SINGH" and the sample
   role line were permanently painted into the pill artwork, not just a
   placeholder — so live-generated text was rendering on top of and
   overlapping them. Those glyphs were removed with texture-aware
   inpainting (OpenCV Telea), which reconstructs the pill's original paper
   texture/vignette from its own surrounding pixels rather than flattening
   it to one flat color. The pills, borders, sparkle and lightning-bolt
   icons, and every other pixel are otherwise byte-identical to what you
   supplied.

All resulting coordinates live in `src/config/frameConfig.ts`, measured
directly from the source pixels (connected-component analysis for the photo
box, glyph bounding boxes for the name/role text) rather than eyeballed:

| Element | Coordinates (px, 1086x1448 space) |
|---|---|
| Photo window | x:312, y:391, 475x556, sharp corners |
| Name text | center (528, 1201), Archivo Black, ~74px, cream `#F2E1B9` |
| Role text | center (537, 1313), Oswald Bold, ~38px, maroon `#93192B` |

The frame has no separate "builder title" slot (only the two pills above),
so per the brief that optional feature is left disabled
(`HAS_BUILDER_TITLE = false`) rather than adding a new box to the design.

If you ever swap in a revised version of the artwork, `frameConfig.ts` is
the only file you should need to touch — see the comments inside it for
what each value controls.

## How compositing works

- **Live preview** (`FramePreview.tsx`) is a fast, CSS-only layered preview
  (photo `<img>` + frame `<img>` + absolutely-positioned text, all driven by
  percentages from `frameConfig.ts`) — it updates instantly on every
  keystroke with no recompute cost.
- **Final export** (`utils/canvasRenderer.ts`) runs once, on tapping
  "CREATE MY HH GOA ID": draws the photo (smart-cropped), then the frame
  artwork at native resolution, then each text layer, onto an off-screen
  `<canvas>` sized exactly to the frame's pixel dimensions, then flattens it
  to a PNG blob. This guarantees the download matches the frame's original
  aspect ratio and resolution exactly.

## Smart photo cropping

`utils/imageProcessor.ts` handles JPG/PNG/HEIC/HEIF uploads (HEIC/HEIF is
transcoded client-side via `heic2any`), then computes an object-fit: cover
style crop into the photo window. Where the browser supports the native
`FaceDetector` API (Chrome/Android), the crop is centered on the detected
face; elsewhere it falls back to a slight upward bias from center, which
works well for typical portrait/selfie framing. The photo's pixels are never
altered, beautified, or regenerated — only the crop window shifts.

## Share to X

`utils/shareToX.ts` first tries the native `navigator.share()` API with the
actual PNG file attached (works on most mobile browsers, lets the user pick
the X app directly). If unavailable, it falls back to X's web intent with
the pre-filled caption. A web intent alone can't attach a binary image, so
for the link-unfurl-with-image experience described in the brief, host each
generated image (e.g. upload the blob to your own storage/CDN on share) and
pass its URL as `shareUrl` to `shareToX()`, with that page's `<meta
property="og:image">` pointing at the hosted image. That last piece needs a
minimal storage endpoint since it's the one part of this brief that isn't
purely client-side — everything else here runs entirely in the browser.

## Project structure

```
src/
 |- components/
 |    |- UploadPanel.tsx      # photo upload, HEIC handling, drag & drop
 |    |- InputPanel.tsx       # name / role inputs
 |    |- FramePreview.tsx     # live CSS preview layer
 |    |- GenerateButton.tsx
 |    |- ShareButtons.tsx     # download + share to X
 |- utils/
 |    |- imageProcessor.ts    # HEIC conversion, smart crop, face detection
 |    |- canvasRenderer.ts    # final flattened PNG compositor
 |    |- shareToX.ts
 |- config/
 |    |- frameConfig.ts       # single source of truth for all coordinates
 |- App.tsx                   # landing -> form -> result flow
public/
 |- frame/hhgoa-frame.png     # your real artwork, photo window + text pills prepped
```
