"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { X, Flashlight, ZoomIn } from "lucide-react";
import { parseQRPh, QRPhData } from "@/lib/qrph/parser";

interface QRScannerProps {
  onResult: (data: QRPhData) => void;
  onClose: () => void;
}

export default function QRScanner({ onResult, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState("");
  const [torch, setTorch] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [hint, setHint] = useState("Point camera at QR code");

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const scan = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scan);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Dynamically import jsQR to keep it client-only
    import("jsqr").then(({ default: jsQR }) => {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert", // faster — QRPh codes are always dark on light
      });

      if (code?.data) {
        setScanning(false);
        setHint("QR detected! Parsing...");

        const parsed = parseQRPh(code.data);
        if (parsed) {
          stopCamera();
          onResult(parsed);
        } else {
          // Not a QRPh code — keep scanning
          setHint("Not a valid QRPh code. Try another.");
          setScanning(true);
          rafRef.current = requestAnimationFrame(scan);
        }
      } else {
        rafRef.current = requestAnimationFrame(scan);
      }
    });
  }, [onResult, stopCamera]);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        // Request back camera with high resolution for fast QR detection
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        });

        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play();

        // Apply continuous autofocus if supported
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        if (capabilities?.focusMode?.includes("continuous")) {
          await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as any] });
        }

        rafRef.current = requestAnimationFrame(scan);
      } catch (err: any) {
        if (!mounted) return;
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError("Could not start camera: " + err.message);
        }
      }
    };

    startCamera();
    return () => {
      mounted = false;
      stopCamera();
    };
  }, [scan, stopCamera]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch } as any] });
      setTorch(t => !t);
    } catch {
      // Torch not supported
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 z-10">
        <button onClick={() => { stopCamera(); onClose(); }}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X size={18} className="text-white" />
        </button>
        <p className="text-white font-semibold text-sm">Scan QRPh Code</p>
        <button onClick={toggleTorch}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${torch ? "bg-yellow-400" : "bg-white/10"}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke={torch ? "#000" : "#fff"} strokeWidth={2} className="w-5 h-5">
            <path d="M8 2h8l-1 7h-6L8 2z" /><path d="M9 9l-2 13h10L15 9" /><line x1="12" y1="13" x2="12" y2="17" />
          </svg>
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay with cutout */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Dark overlay around the scan area */}
            <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />

            {/* Animated scan line */}
            {scanning && (
              <div className="absolute inset-x-0 h-0.5 bg-[#038E80] opacity-80 animate-scan-line" />
            )}

            {/* Corner brackets */}
            {[
              "top-0 left-0 border-t-4 border-l-4 rounded-tl-xl",
              "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl",
              "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl",
              "bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl",
            ].map((cls, i) => (
              <div key={i} className={`absolute w-8 h-8 border-[#038E80] ${cls}`} />
            ))}
          </div>
        </div>

        {/* Hint text */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
            <p className="text-white text-sm font-medium">{hint}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6">
            <div className="bg-white rounded-2xl p-6 text-center space-y-3 max-w-xs">
              <p className="text-4xl">📷</p>
              <p className="font-semibold text-gray-800">{error}</p>
              <button onClick={() => { stopCamera(); onClose(); }}
                className="w-full py-2.5 rounded-xl bg-[#038E80] text-white font-semibold text-sm">
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="bg-black/80 px-4 py-4 text-center">
        <p className="text-white/50 text-xs">Works with GCash, Maya, BPI, BDO, UnionBank and all QRPh-compliant codes</p>
      </div>

      <style jsx>{`
        @keyframes scan-line {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
