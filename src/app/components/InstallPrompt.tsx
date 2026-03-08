"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem("pwa-install-dismissed")) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (ios) {
      // rAF: setState en callback, no en el cuerpo del efecto
      const id = requestAnimationFrame(() => {
        setIsIos(true);
        setVisible(true);
      });
      return () => {
        cancelAnimationFrame(id);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!promptRef.current) return;
    await promptRef.current.prompt();
    const { outcome } = await promptRef.current.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem("pwa-install-dismissed", "1");
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <Image
            src="/icons/icon-192.png"
            alt="App icon"
            width={48}
            height={48}
            className="rounded-xl flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100">
              Instalá la app
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {isIos
                ? 'Tocá el botón compartir y luego "Agregar a pantalla de inicio"'
                : "Acceso rápido desde tu pantalla de inicio, sin abrir el browser."}
            </p>

            {isIos ? (
              <button
                onClick={handleDismiss}
                className="mt-3 text-xs text-slate-400 underline"
              >
                Entendido
              </button>
            ) : (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-slate-100 text-slate-900 text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-white transition-colors"
                >
                  Instalar
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-xs text-slate-400 px-2 hover:text-slate-300 transition-colors"
                >
                  Ahora no
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5"
            aria-label="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
