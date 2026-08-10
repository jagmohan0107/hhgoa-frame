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
    const appUrl = `twitter://post?message=${encodeURIComponent(text)}`;
    const androidIntent = `intent://post?message=${encodeURIComponent(text)}#Intent;package=com.twitter.android;scheme=twitter;end`;

    let fallbackOpened = false;
    const tryOpenFallback = () => {
      if (fallbackOpened) return;
      fallbackOpened = true;
      window.open(webIntent, "_blank", "noopener,noreferrer");
    };

    const onVisibility = () => {
      if (document.hidden) {
        // Page was hidden — likely the app opened successfully
        fallbackOpened = true;
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    // Attempt platform-appropriate deep link
    try {
      if (isAndroid) {
        // Use Android intent first, then scheme fallback
        window.location.href = androidIntent;
      } else {
        window.location.href = appUrl;
      }
    } catch (e) {
      try {
        window.open(isAndroid ? androidIntent : appUrl, "_blank", "noopener,noreferrer");
      } catch {}
    }

    // If the app didn't open within ~800ms, fall back to the web intent
    const timer = window.setTimeout(() => {
      tryOpenFallback();
      document.removeEventListener("visibilitychange", onVisibility);
    }, 800);

    // Clean up after a short while
    setTimeout(() => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    }, 2000);

    return "intent";
  }

  // Desktop / unknown platform: open web intent
  window.open(webIntent, "_blank", "noopener,noreferrer");
  return "intent";
}
