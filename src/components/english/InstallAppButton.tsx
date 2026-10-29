"use client";

// ============================================================
// (2026-Z32) زرار تثبيت المنصة كتطبيق — نسخة إنجليزية خفيفة (بدون i18n
// عشان المنصة الإنجليزية مفيهاش zustand). نفس منطق InstallPwaButton:
//   1) المتصفح جاهز للتثبيت → نافذة التثبيت الرسمية فورًا
//   2) التطبيق متثبت فعلًا → رسالة «مثبت بالفعل»
//   3) غير كده (آيفون/متصفح مؤجل) → تعليمات قصيرة خطوة بخطوة
// ============================================================
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, X, Download, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [already, setAlready] = useState(false);

  useEffect(function () {
    var alone = false;
    try {
      alone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
    } catch (e) {}
    setStandalone(alone);
    var ua = String(window.navigator.userAgent || "");
    setIsIos(/iphone|ipad|ipod/i.test(ua));
    var handler = function (e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return function () {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  var install = async function () {
    /* 1) المتصفح جاهز → نافذة التثبيت الرسمية فورًا */
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice;
      } catch (e) {}
      return;
    }
    /* 2) التطبيق متثبت فعلًا → رسالة واضحة */
    try {
      var nav = window.navigator as any;
      if (typeof nav.getInstalledRelatedApps === "function") {
        var related = await nav.getInstalledRelatedApps();
        if (related && related.length > 0) {
          setAlready(true);
          setShowHint(true);
          return;
        }
      }
    } catch (e) {}
    if (standalone) {
      setAlready(true);
      setShowHint(true);
      return;
    }
    /* 3) تعليمات قصيرة (آيفون أساسًا — أبل مش بتسمح بتثبيت تلقائي) */
    setAlready(false);
    setShowHint(true);
  };

  return { isIos: isIos, showHint: showHint, already: already, setShowHint: setShowHint, install: install };
}

function InstallHintModal({ isIos, already, onClose }: { isIos: boolean; already: boolean; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[95] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-sm rounded-2xl border shadow-2xl p-5 space-y-3"
        onClick={function (e) {
          e.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 font-bold text-sm">
            {already && <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
            {already ? "The app is already installed ✅" : "Install the App"}
          </p>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {already ? (
          <p className="text-sm text-muted-foreground">
            Open the platform from the app icon on your screen — full screen, no browser.
          </p>
        ) : isIos ? (
          <ol className="text-sm space-y-2 text-muted-foreground list-decimal pl-5">
            <li>Open the platform in Safari (if you are using Chrome, switch to Safari)</li>
            <li>
              Tap the Share button <span className="font-bold text-foreground">⬆️</span> at the
              bottom middle
            </li>
            <li>
              Scroll down and tap{" "}
              <span className="font-bold text-foreground">Add to Home Screen</span>
            </li>
            <li>
              Tap <span className="font-bold text-foreground">Add</span> — the app will appear on
              your home screen
            </li>
          </ol>
        ) : (
          <ol className="text-sm space-y-2 text-muted-foreground list-decimal pl-5">
            <li>
              Open the browser menu <span className="font-bold text-foreground">⋮</span> next to
              the address bar
            </li>
            <li>
              Choose <span className="font-bold text-foreground">Install app</span> (or{" "}
              <span className="font-bold text-foreground">Add to Home Screen</span>)
            </li>
            <li>
              Tap <span className="font-bold text-foreground">Install</span> — the app will appear
              on your screen
            </li>
          </ol>
        )}
        <p className="text-[11px] text-muted-foreground">
          After installing, open the platform directly from the app icon — full screen, no browser
        </p>
      </div>
    </div>
  );
}

/* زرار عادي للنافبار — ظاهر دايمًا في كل الحالات */
export function InstallAppButton({
  variant = "outline",
  label = "App",
  className = "",
}: {
  variant?: "default" | "outline" | "ghost" | "secondary";
  label?: string;
  className?: string;
}) {
  var pwa = usePwaInstall();
  return (
    <>
      <Button
        variant={variant}
        className={className}
        onClick={pwa.install}
        aria-label="Install the platform as an app on your device"
      >
        <Smartphone className="h-4 w-4" aria-hidden="true" />
        <span>{label}</span>
      </Button>
      {pwa.showHint && (
        <InstallHintModal
          isIos={pwa.isIos}
          already={pwa.already}
          onClose={function () {
            pwa.setShowHint(false);
          }}
        />
      )}
    </>
  );
}

/* الزرار العايم الثابت — شمال تحت في كل الصفحات */
export function FloatingInstallAppButton() {
  var pwa = usePwaInstall();
  return (
    <>
      <button
        onClick={pwa.install}
        aria-label="Install the platform as an app on your device"
        className="fixed z-[90] left-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] flex items-center gap-2 rounded-full bg-[#7C3AED] text-white shadow-xl border border-[#7C3AED]/30 pl-4 pr-3.5 min-h-[44px] font-bold text-sm hover:shadow-2xl hover:scale-[1.04] active:scale-95 transition-all"
      >
        <Download className="h-4 w-4 animate-pulse" aria-hidden="true" />
        Install App
      </button>
      {pwa.showHint && (
        <InstallHintModal
          isIos={pwa.isIos}
          already={pwa.already}
          onClose={function () {
            pwa.setShowHint(false);
          }}
        />
      )}
    </>
  );
}
