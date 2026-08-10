import { SHARE_CAPTION } from "../config/frameConfig";

// Small on-screen debug toast useful on mobile when devtools aren't available
function showDebugToast(message: string) {
  try {
    const id = "share-to-x-debug-toast";
    let el = document.getElementById(id) as HTMLDivElement | null;
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.style.position = "fixed";
      el.style.bottom = "16px";
      el.style.left = "50%";
      el.style.transform = "translateX(-50%)";
      el.style.background = "rgba(0,0,0,0.85)";
      el.style.color = "white";
      el.style.padding = "8px 12px";
      el.style.borderRadius = "8px";
      import { SHARE_CAPTION } from "../config/frameConfig";

      /**
       * Simple share-to-Twitter utility.
       * - Tries native `navigator.share` with the provided file when available.
       * - Otherwise opens the Twitter web intent with the caption and a URL.
       */
      export async function shareToX(file?: File, shareUrl?: string): Promise<"native" | "intent"> {
        const nav = navigator as Navigator & {
          canShare?: (data?: ShareData) => boolean;
          share?: (data: ShareData) => Promise<void>;
        };

        if (nav.canShare && nav.share && file && nav.canShare({ files: [file] })) {
          try {
            await nav.share({ files: [file], title: "HH Goa 2026", text: SHARE_CAPTION });
            return "native";
          } catch {
            // user cancelled or share failed — fall back to web intent
          }
        }

        const text = encodeURIComponent(SHARE_CAPTION || "I just created my HH Goa 2026 card! 🌴🔥 #HHGoa2026");
        const url = encodeURIComponent(shareUrl || window.location.href);

        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "noopener,noreferrer");
        return "intent";
      }
 */
