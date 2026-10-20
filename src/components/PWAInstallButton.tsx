import { useState } from 'react';
import type { FC } from 'react';
import { Download, Smartphone, Check, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'hero' | 'banner';
}

export const PWAInstallButton: FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAndroidManualModal, setShowAndroidManualModal] = useState(false);

  // If already running in standalone PWA window, don't show prompt
  if (isInstalled) {
    if (variant === 'hero') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
          <Check className="w-3.5 h-3.5" />
          <span>Installed as Native App</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowAndroidManualModal(true);
    }
  };

  const buttonClass =
    variant === 'header'
      ? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/40 rounded-lg transition-all shadow-xs active:scale-95'
      : 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95';

  return (
    <>
      <button
        onClick={handleClick}
        className={buttonClass}
        title="Install this app on your device for fast offline access without browser bar"
      >
        <Smartphone className="w-4 h-4 text-emerald-400" />
        <span>Install App</span>
      </button>

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Apple Safari requires adding to home screen through the Share menu:
            </p>

            <ol className="text-xs text-slate-700 space-y-2.5 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the <Share className="w-3.5 h-3.5 inline mx-1 text-indigo-600" /> <strong>Share</strong> button at the bottom of Safari.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>"Add to Home Screen"</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Tap <strong>Add</strong> in the top right corner. The app will launch standalone without browser bars!
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Android / Chrome Manual Help Modal (when browser prompt is delayed or in iframe) */}
      {showAndroidManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Install App (Android/Chrome)</h3>
              </div>
              <button
                onClick={() => setShowAndroidManualModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              To install this app on your phone:
            </p>

            <ol className="text-xs text-slate-700 space-y-2 mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <li>1. Tap the three dots (<strong>⋮</strong>) in the Chrome browser menu.</li>
              <li>2. Select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.</li>
              <li>3. Launch it directly from your home screen just like a regular APK!</li>
            </ol>

            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 mb-5">
              ✓ Works 100% Offline with pre-cached questions and notes.
            </div>

            <button
              onClick={() => setShowAndroidManualModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
