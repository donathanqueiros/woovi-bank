import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "./button";
import { useTranslation } from "react-i18next";

type CameraCaptureProps = {
  onCapture: (base64: string) => void;
  value?: string | null;
  className?: string;
};

type CameraState =
  | "idle"
  | "requesting"
  | "streaming"
  | "captured"
  | "error";

function CameraCapture({ onCapture, value, className }: CameraCaptureProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CameraState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const capturedImage = value ?? null;
  const displayState = capturedImage ? "captured" : state;

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setState("requesting");
    setErrorMsg(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setState("streaming");
    } catch (err) {
      const denied =
        err instanceof DOMException && err.name === "NotAllowedError";
      setErrorMsg(
        denied
          ? t("kyc.selfie.permissionDenied")
          : t("kyc.selfie.cameraNotAvailable"),
      );
      setState("error");
    }
  }, [t]);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    stopStream();
    setState("captured");
    onCapture(base64);
  }, [onCapture, stopStream]);

  const retake = useCallback(() => {
    onCapture("");
    void startCamera();
  }, [onCapture, startCamera]);

  // Auto-start when mounted
  useEffect(() => {
    if (value) return;

    // Defer so the effect body itself doesn't call setState synchronously
    const id = setTimeout(() => { void startCamera(); }, 0);
    return () => { clearTimeout(id); stopStream(); };
  }, [startCamera, stopStream, value]);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-input bg-muted aspect-4/3">
        {displayState === "streaming" && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}

        {displayState === "captured" && capturedImage && (
          <img
            src={capturedImage}
            alt="Selfie capturada"
            className="h-full w-full object-cover"
          />
        )}

        {(displayState === "idle" || displayState === "requesting") && (
          <div className="flex h-full items-center justify-center">
            <Camera className="size-12 text-muted-foreground animate-pulse" />
          </div>
        )}

        {displayState === "error" && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <AlertCircle className="size-10 text-destructive" />
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
          </div>
        )}

        {/* Face oval guide */}
        {displayState === "streaming" && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="h-[60%] w-[45%] rounded-full border-2 border-white/60 shadow-inner" />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <p className="max-w-xs text-center text-sm text-muted-foreground">
        {t("kyc.selfie.instructions")}
      </p>

      <div className="flex gap-3">
        {displayState === "streaming" && (
          <Button type="button" onClick={capture} size="lg">
            <Camera className="mr-2 size-4" />
            {t("kyc.selfie.capture")}
          </Button>
        )}
        {displayState === "captured" && (
          <Button type="button" variant="outline" onClick={retake}>
            <RefreshCw className="mr-2 size-4" />
            {t("kyc.selfie.retake")}
          </Button>
        )}
        {displayState === "error" && (
          <Button type="button" variant="outline" onClick={() => void startCamera()}>
            <RefreshCw className="mr-2 size-4" />
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  );
}

export { CameraCapture };
