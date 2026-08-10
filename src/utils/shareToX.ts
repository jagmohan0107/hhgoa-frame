import { SHARE_CAPTION } from "../config/frameConfig";

/**
 * Shares the generated image to X.
 *
 * Preferred path: native Web Share API (navigator.share) with the actual
 * PNG file attached — supported on most mobile browsers (iOS Safari,
 * Android Chrome) and lets the user pick the X app directly.
 *
 * Fallback: opens X's web share intent with the pre-filled caption. Since a
 * plain web intent cannot attach a binary image file, the caption should be
 * paired with a page URL whose Open Graph og:image points at the hosted
 * generated image, so the link unfurls with the actual HH Goa card.
 */
export async function shareToX(file: File, shareUrl?: string): Promise<"native" | "intent"> {
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: "HH Goa 2026",
        text: SHARE_CAPTION,
      });
      return "native";
    } catch {
      // user cancelled or share failed — fall through to intent link
    }
  }

  const params = new URLSearchParams({ text: SHARE_CAPTION });
  if (shareUrl) params.set("url", shareUrl);
  const intentUrl = `https://x.com/intent/tweet?${params.toString()}`;
  window.open(intentUrl, "_blank", "noopener,noreferrer");
  return "intent";
}
