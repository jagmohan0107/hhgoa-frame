import { Loader2, Sparkles } from "lucide-react";

interface GenerateButtonProps {
  onClick: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

export default function GenerateButton({ onClick, isGenerating, disabled }: GenerateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isGenerating}
      className="w-full rounded-full bg-papaya text-ink font-display font-black tracking-wide
                 text-base py-5 flex items-center justify-center gap-2 shadow-card
                 active:scale-[0.97] transition-transform
                 disabled:opacity-40 disabled:active:scale-100"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          FRAMING YOUR GOA…
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5" />
          CREATE MY HH GOA ID
        </>
      )}
    </button>
  );
}
