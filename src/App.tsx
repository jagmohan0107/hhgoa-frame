import { useEffect, useRef, useState } from "react";
import UploadPanel from "./components/UploadPanel";
import InputPanel from "./components/InputPanel";
import FramePreview from "./components/FramePreview";
import GenerateButton from "./components/GenerateButton";
import ShareButtons from "./components/ShareButtons";
import { loadImage } from "./utils/imageProcessor";
import { renderFinalImage, canvasToPngBlob } from "./utils/canvasRenderer";
import { FRAME_SRC, OUTPUT_FILENAME_PREFIX } from "./config/frameConfig";
import { ArrowLeft, PalmtreeIcon } from "lucide-react";

type Step = "landing" | "form" | "result";

function sanitizeForFilename(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function App() {
  const [step, setStep] = useState<Step>("landing");

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const photoImgRef = useRef<HTMLImageElement | null>(null);
  const frameImgRef = useRef<HTMLImageElement | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Preload the frame artwork once, up front, so it's ready by generation time.
  useEffect(() => {
    loadImage(FRAME_SRC)
      .then((img) => {
        frameImgRef.current = img;
      })
      .catch(() => setGenError("Couldn't load the HH Goa frame artwork."));
  }, []);

  const handlePhotoReady = async (_file: File, url: string) => {
    setPhotoUrl(url);
    setStep("form");
    try {
      photoImgRef.current = await loadImage(url);
    } catch {
      setGenError("That photo couldn't be read. Try another one.");
    }
  };

  const handleGenerate = async () => {
    if (!frameImgRef.current) {
      setGenError("The frame is still loading — try again in a moment.");
      return;
    }
    setGenError(null);
    setIsGenerating(true);
    try {
      const canvas = await renderFinalImage({
        photo: photoImgRef.current,
        frame: frameImgRef.current,
        name,
        role,
      });
      const blob = await canvasToPngBlob(canvas);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      setStep("result");
    } catch (err) {
      console.error(err);
      setGenError("Something went wrong generating your ID. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartOver = () => {
    setStep("landing");
    setPhotoUrl(null);
    photoImgRef.current = null;
    setName("");
    setRole("");
    setResultBlob(null);
    setResultUrl(null);
    setGenError(null);
  };

  const filename = `${OUTPUT_FILENAME_PREFIX}-${sanitizeForFilename(name) || "Builder"}.png`;

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-5 py-8 sm:py-12">
      <div className="noise-overlay" />

      <header className="w-full max-w-md flex items-center justify-between mb-6">
        {step !== "landing" ? (
          <button
            onClick={() => (step === "result" ? setStep("form") : setStep("landing"))}
            aria-label="Go back"
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-sand" />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <span className="font-display text-xs tracking-[0.3em] text-seafoam">HH GOA 2026</span>
        <div className="w-10" />
      </header>

      <main className="w-full max-w-md flex-1 flex flex-col gap-8">
        {step === "landing" && (
          <div className="flex flex-col items-center text-center gap-8 pt-6">
            <div className="float-slow">
              <PalmtreeIcon className="w-14 h-14 text-gold" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-display font-black text-4xl sm:text-5xl leading-[1.05] shimmer-text">
                FRAME YOUR GOA.
              </h1>
              <p className="text-seafoam font-body mt-4 text-base max-w-xs mx-auto">
                Create your HH Goa 2026 identity in a few seconds. No login, no signup.
              </p>
            </div>

            <div className="w-full rounded-3xl overflow-hidden shadow-card border border-seafoam/20">
              <FramePreview photoUrl={null} name="YOUR NAME" role="YOUR ROLE" />
            </div>

            <div className="w-full">
              <UploadPanel onPhotoReady={handlePhotoReady} />
            </div>
          </div>
        )}

        {step === "form" && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-display text-xs tracking-[0.2em] text-seafoam mb-3">YOUR PHOTO</p>
              <FramePreview photoUrl={photoUrl} name={name} role={role} />
            </div>

            <InputPanel name={name} role={role} onNameChange={setName} onRoleChange={setRole} />

            {genError && (
              <p className="text-sm text-papaya text-center font-body">{genError}</p>
            )}

            <GenerateButton
              onClick={handleGenerate}
              isGenerating={isGenerating}
              disabled={!photoUrl || !name.trim()}
            />
          </div>
        )}

        {step === "result" && resultUrl && resultBlob && (
          <div className="flex flex-col gap-6 items-center">
            <div className="text-center">
              <h2 className="font-display font-black text-2xl text-sand">YOUR HH GOA ID IS READY.</h2>
            </div>

            <img
              src={resultUrl}
              alt="Your generated HH Goa 2026 ID card"
              className="w-full rounded-2xl shadow-card border border-seafoam/20"
            />

            <ShareButtons blob={resultBlob} filename={filename} />

            <button
              onClick={handleStartOver}
              className="text-seafoam font-body text-sm underline underline-offset-4 mt-2"
            >
              Start over
            </button>
          </div>
        )}
      </main>

      <footer className="w-full max-w-md text-center mt-10">
        <p className="text-sand/30 font-body text-xs">Built for HH Goa 2026 · Framed on-device</p>
      </footer>
    </div>
  );
}
