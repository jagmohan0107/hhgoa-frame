import { useState } from "react";
import { Download, Send, Check, Loader2 } from "lucide-react";
import { shareToX } from "../utils/shareToX";

interface ShareButtonsProps {
  blob: Blob;
  filename: string;
  shareUrl?: string;
}

export default function ShareButtons({ blob, filename, shareUrl }: ShareButtonsProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleDownload = () => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleShare = async () => {
    // NOTE: this must stay a synchronous call, not `await`ed before
    // shareToX runs — shareToX itself opens its fallback tab synchronously
    // on the very first line of execution (before any internal await), so
    // the browser still counts it as a direct response to this click.
    setIsSharing(true);
    const file = new File([blob], filename, { type: "image/png" });
    try {
      await shareToX(file, shareUrl);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="w-full flex flex-col sm:flex-row gap-3">
      <button
        type="button"
        onClick={handleDownload}
        className="flex-1 rounded-full bg-gold text-ink font-display font-black tracking-wide
                   text-base py-5 flex items-center justify-center gap-2 shadow-card
                   active:scale-[0.97] transition-transform"
      >
        {downloaded ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
        {downloaded ? "SAVED" : "DOWNLOAD IMAGE"}
      </button>

      <button
        type="button"
        onClick={handleShare}
        disabled={isSharing}
        className="flex-1 rounded-full bg-ink border-2 border-seafoam/50 text-sand font-display
                   font-black tracking-wide text-base py-5 flex items-center justify-center gap-2
                   active:scale-[0.97] transition-transform disabled:opacity-70"
      >
        {isSharing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            OPENING X…
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            SHARE TO X
          </>
        )}
      </button>
    </div>
  );
}
