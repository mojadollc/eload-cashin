"use client";
import { useEffect, useState } from "react";
import { Download, X, Wallet } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if dismissed this session
    if (sessionStorage.getItem("pwa_dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa_dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#038E80] rounded-2xl flex items-center justify-center shrink-0">
          <Wallet size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-[#17202A]">Install CashIn Tap</p>
          <p className="text-xs text-gray-500 mt-0.5">Add to your home screen for quick access</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 bg-[#038E80] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#058174] transition-colors shrink-0"
        >
          <Download size={13} /> Install
        </button>
        <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
