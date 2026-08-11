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
 *
 * IMPORTANT: the fallback tab is opened SYNCHRONOUSLY, before any `await`,
 * directly inside the click handler's call stack. Opening a tab *after* an
 * `await` (e.g. after `navigator.share()` has settled) is unreliable —
 * browsers tie "this was allowed because the user just tapped something" to
 * the click event, and that permission can expire during the await, so the
 * popup either gets silently blocked or ends up sitting on a blank page far
 * longer than it should. Opening the (initially blank) tab first and then
 * pointing it at the intent URL avoids that entirely.
 */
export async function shareToX(file: File, shareUrl?: string): Promise<"native" | "intent" | "cancelled"> {
  const canUseNativeShare =
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  if (canUseNativeShare) {
    try {
      await navigator.share({
        files: [file],
        title: "HH Goa 2026",
        text: SHARE_CAPTION,
      });
      return "native";
    } catch (err) {
      // If the user deliberately dismissed the native share sheet, respect
      // that and stop — silently forcing open an X tab right after someone
      // cancels is surprising and feels like the button "did something
      // wrong" rather than what they asked.
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      // Any other failure (rare) falls through to the intent link below.
    }
  }

  // Open the tab FIRST, synchronously, still inside the original click's
  // call stack — this is what keeps it from being blocked or stalling on a
  // blank page.
  const tab = window.open("", "_blank");

  const params = new URLSearchParams({ text: SHARE_CAPTION });
  if (shareUrl) params.set("url", shareUrl);
  const intentUrl = `https://x.com/intent/tweet?${params.toString()}`;

  if (tab) {
    tab.opener = null; // mitigate reverse-tabnabbing; destination is fixed to x.com
    tab.location.href = intentUrl;
  } else {
    // Popup blocked outright (e.g. browser setting) — fall back to
    // navigating the current tab so the share still goes through.
    window.location.href = intentUrl;
  }

  return "intent";
}
