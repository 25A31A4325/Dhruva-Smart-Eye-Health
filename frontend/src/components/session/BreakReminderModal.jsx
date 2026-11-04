import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle2, XCircle, Flame, Sparkles } from 'lucide-react';
import { useSession } from '../../context/SessionContext';

export const BreakReminderModal = () => {
  const { isBreakModalOpen, acknowledgeBreak, breakStreak } = useSession();
  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    let timer = null;
    if (isBreakModalOpen) {
      setCountdown(20);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBreakModalOpen]);

  if (!isBreakModalOpen) return null;

  const handleComplete = () => {
    acknowledgeBreak(true, 20 - countdown);
  };

  const handleSkip = () => {
    acknowledgeBreak(false, 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-primary-100 text-center relative overflow-hidden">
        {/* Decorative background aura */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-100 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary-200 rounded-full blur-3xl opacity-50"></div>

        {/* Header Streak Chip */}
        <div className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold mb-6">
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Current Break Streak: {breakStreak}</span>
        </div>

        {/* Animated Visual Focus Guide */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 text-white flex flex-col items-center justify-center shadow-xl shadow-primary-500/25 animate-breathe">
            <Eye className="w-8 h-8 mb-1 animate-pulse" />
            <span className="text-3xl font-extrabold tracking-tight font-mono">{countdown}s</span>
            <span className="text-[10px] font-medium tracking-wide uppercase opacity-85">Look 20ft Away</span>
          </div>
        </div>

        {/* Guidance Prompt */}
        <div className="relative mt-6 space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Time for Your 20-20-20 Break!</h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Direct your gaze away from all screens toward a distant object (at least 20 feet / 6 meters away). Breathe deeply and let your ciliary eye muscles completely relax.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleComplete}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Break Completed</span>
          </button>

          <button
            onClick={handleSkip}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-sm transition-all"
          >
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>Skip Once</span>
          </button>
        </div>

        <p className="relative mt-4 text-[11px] text-slate-600">
          Tip: Consciously perform 3-5 slow, complete blinks while gazing into the distance.
        </p>
      </div>
    </div>
  );
};
