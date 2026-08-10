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

  // Build the text for the post (caption + optional URL)
  const textParts = [SHARE_CAPTION];
  if (shareUrl) textParts.push(shareUrl);
  const text = textParts.join("\n\n");

  const webIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  // Try deep-linking into the native X/Twitter app on mobile platforms.
  if (isIOS || isAndroid) {
    const androidIntent = `intent://tweet?text=${encodeURIComponent(text)}#Intent;package=com.twitter.android;scheme=twitter;end`;

    // Try multiple candidate schemes/paths — different Twitter app versions expect different params
    const candidates: string[] = [];
    if (isAndroid) {
      candidates.push(androidIntent);
      candidates.push(`twitter://post?message=${encodeURIComponent(text)}`);
      candidates.push(`twitter://post?text=${encodeURIComponent(text)}`);
      candidates.push(`twitter://compose?message=${encodeURIComponent(text)}`);
      candidates.push(`twitter://compose?text=${encodeURIComponent(text)}`);
    } else {
      // iOS
      candidates.push(`twitter://post?message=${encodeURIComponent(text)}`);
      candidates.push(`twitter://post?text=${encodeURIComponent(text)}`);
      candidates.push(`twitter://compose?message=${encodeURIComponent(text)}`);
      candidates.push(`twitter://compose?text=${encodeURIComponent(text)}`);
    }

    const tryOpen = async (url: string) => {
      console.debug("shareToX: attempting deep link ->", url);
      let opened = false;

      const onVisibility = () => {
        if (document.hidden) opened = true;
      };

      document.addEventListener("visibilitychange", onVisibility);

      try {
        // First try changing location (works in many mobile browsers)
        window.location.href = url;
      } catch (e) {
        try {
          window.open(url, "_blank", "noopener,noreferrer");
        } catch {}
      }

      // wait briefly to see if the page gets hidden (app opened)
      await new Promise((res) => setTimeout(res, 1200));
      document.removeEventListener("visibilitychange", onVisibility);
      return opened;
    };

    for (const candidate of candidates) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const ok = await tryOpen(candidate);
        if (ok) return "intent";
      } catch (e) {
        console.debug("shareToX: deep link attempt failed", e);
      }
    }

    // nothing opened the native app — fall back to web intent
    window.open(webIntent, "_blank", "noopener,noreferrer");
    return "intent";
  }

  // Desktop / unknown platform: open web intent
  window.open(webIntent, "_blank", "noopener,noreferrer");
  return "intent";
}
