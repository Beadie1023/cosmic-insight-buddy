import { useEffect, useState } from "react";

// Chrome/Edge/Android fire this event when the app is installable.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "footing-install-dismissed";

const NIGHT = "#1B2438";
const NIGHT_2 = "#232E45";
const AMBER = "#E3A857";
const PAPER = "#F3EBDD";

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/i.test(ua) || iPadOS;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed and running as an app

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* storage unavailable: just keep showing the button */
    }
    if (dismissed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep the event so our own button can trigger it
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => {
      setDeferred(null);
      setHidden(true);
      setShowSteps(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt, so show the button with steps instead.
    if (isIOS()) {
      setIos(true);
      setHidden(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      setDeferred(null); // the event can only be used once
      if (outcome === "accepted") setHidden(true);
      return;
    }
    if (ios) setShowSteps(true);
  };

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
    setShowSteps(false);
  };

  // Nothing to offer on this browser (e.g. the one-shot prompt was already used).
  if (!deferred && !ios) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        zIndex: 50,
        fontFamily: "'Work Sans', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 10,
      }}
    >
      {showSteps && (
        <div
          role="dialog"
          aria-label="How to install Skywise"
          style={{
            maxWidth: 280,
            background: NIGHT_2,
            color: PAPER,
            border: `1px solid ${AMBER}`,
            borderRadius: 14,
            padding: "14px 16px",
            fontSize: 14,
            lineHeight: 1.5,
            boxShadow: "0 8px 30px rgba(0,0,0,.45)",
          }}
        >
          <strong style={{ color: AMBER }}>Add Skywise to your Home Screen</strong>
          <ol style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            <li>Tap the Share button in Safari (the square with an arrow).</li>
            <li>Scroll down and tap “Add to Home Screen”.</li>
            <li>Tap “Add”.</li>
          </ol>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          type="button"
          onClick={install}
          style={{
            background: AMBER,
            color: NIGHT,
            border: "none",
            borderRadius: 999,
            padding: "12px 18px",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,0,0,.4)",
          }}
        >
          Install app
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide install button"
          style={{
            background: NIGHT_2,
            color: PAPER,
            border: `1px solid ${AMBER}`,
            borderRadius: 999,
            width: 36,
            height: 36,
            fontSize: 18,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
