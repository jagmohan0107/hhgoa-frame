import { SHARE_CAPTION } from "../config/frameConfig";

/**
 * Shares the generated image to X.
 *
 * Preferred path: native Web Share API (navigator.share) with the actual
 * PNG file attached - supported on most mobile browsers (iOS Safari,
 * Android Chrome) and lets the user pick the X app directly.
 *
 * Fallback: opens X's web share intent with the pre-filled caption. Since a
 * plain web intent cannot attach a binary image file, the caption should be
 * paired with a page URL whose Open Graph og:image points at the hosted
 * generated image, so the link unfurls with the actual HH Goa card.
 *
 * IMPORTANT: the fallback tab is opened SYNCHRONOUSLY, before any `await`,
 * directly inside the click handler's call stack. Opening a tab *after* an
 * `await` (e.g. after `navigator.share()` has settled) is unreliable -
 * browsers tie "this was allowed because the user just tapped something" to
 * the click event, and that permission can expire during the await, so the
 * popup either gets silently blocked or ends up sitting on a blank page far
 * longer than it should. Opening the (initially blank) tab first and then
 * pointing it at the intent URL avoids that entirely.
 *
 * Native file-sharing is attempted on EVERY platform, not just mobile.
 * X actually does register itself as an OS-level share target on desktop
 * too: its installed PWA (Edge/Chrome "Install app") declares a
 * `share_target` with a `files` param in its manifest, so once a person has
 * installed the X app from their browser, Windows' native Share flyout
 * (and the equivalent on macOS/ChromeOS) lists X as a real destination for
 * an image + caption - selecting it opens X's compose view with the photo
 * already attached, exactly like the mobile flow. There is no reliable way
 * to detect from here whether that PWA happens to be installed, so instead
 * of guessing by platform, we just ask the browser: if `navigator.share`
 * exists and `canShare` says it can handle this file, we let the OS show
 * whatever share surface it has (which may or may not include X) rather
 * than skipping straight past it. If nothing suitable is picked, or the
 * OS has nothing to offer, this rejects/aborts and we fall through to the
 * intent-tab fallback below - so there's no dead end either way.
 */
export async function shareToX(file: File, shareUrl?: string): Promise<"native" | "intent"> {
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
    } catch {
      // Any failure here - including AbortError, which some desktop
      // browsers (notably Windows Chrome/Edge) throw near-instantly when
      // there's no OS-level share target for a file, NOT only on a
      // deliberate user cancel - falls through to the reliable X intent
      // link below. Silently stopping here would make the button appear
      // completely dead on exactly those browsers.
    }
  }

  const params = new URLSearchParams({ text: SHARE_CAPTION });
  if (shareUrl) params.set("url", shareUrl);
  const intentUrl = "https://twitter.com/intent/tweet?" + params.toString();
  const shareText = [SHARE_CAPTION, shareUrl].filter(Boolean).join("\n");

  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

  if (isMobile) {
    const twitterAppUrl = `twitter://post?message=${encodeURIComponent(shareText)}`;
    const androidIntentUrl = `intent://post?message=${encodeURIComponent(shareText)}#Intent;package=com.twitter.android;scheme=twitter;end`;

    const fallbackToWeb = () => {
      const newTab = window.open(intentUrl, "_blank", "noopener,noreferrer");
      if (!newTab) {
        window.location.assign(intentUrl);
      }
    };

    try {
      if (/Android/i.test(ua)) {
        window.location.assign(androidIntentUrl);
      } else {
        window.location.assign(twitterAppUrl);
      }
      setTimeout(fallbackToWeb, 800);
    } catch {
      fallbackToWeb();
    }
    return "intent";
  }

  const newTab = window.open(intentUrl, "_blank", "noopener,noreferrer");
  if (!newTab) {
    window.location.assign(intentUrl);
  }

  return "intent";
}
