import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { normalizeToObjectUrl } from "../utils/imageProcessor";

interface UploadPanelProps {
  onPhotoReady: (file: File, objectUrl: string) => void;
}

export default function UploadPanel({ onPhotoReady }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setError(null);
    setIsProcessing(true);
    try {
      const objectUrl = await normalizeToObjectUrl(file);
      onPhotoReady(file, objectUrl);
    } catch (err) {
      console.error(err);
      setError("Couldn't read that photo. Try a different one.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <button
        type="button"
        disabled={isProcessing}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`w-full rounded-3xl border-2 border-dashed px-6 py-14 flex flex-col items-center justify-center gap-4 transition-all
          ${isDragging ? "border-gold bg-gold/10 scale-[1.01]" : "border-seafoam/40 bg-white/5"}
          active:scale-[0.98] disabled:opacity-60`}
      >
        {isProcessing ? (
          <Loader2 className="w-10 h-10 text-gold animate-spin" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-papaya flex items-center justify-center shadow-card">
            <Upload className="w-7 h-7 text-sand" strokeWidth={2.5} />
          </div>
        )}
        <div className="text-center">
          <p className="font-display font-black tracking-wide text-lg text-sand">
            {isProcessing ? "READING YOUR PHOTO…" : "UPLOAD YOUR PHOTO"}
          </p>
          <p className="text-xs text-seafoam mt-1 font-body">
            JPG, PNG, or HEIC · any crop or angle works
          </p>
        </div>
      </button>

      {error && (
        <p className="mt-3 text-sm text-papaya text-center font-body">{error}</p>
      )}
    </div>
  );
}
