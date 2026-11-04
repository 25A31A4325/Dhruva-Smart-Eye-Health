import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, ArrowRight, Sparkles, Shield, Clock, Ruler, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { startApp } = useAuth();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    await startApp();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-primary-700 via-primary-600 to-primary-500 flex items-center justify-center text-white shadow-xl shadow-primary-500/30">
            <Eye className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Dhruva
        </h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
          Swasth & Samavesh Bharat • Smart Eye Health Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/80 text-primary-700 text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>100% Software-Based • Instant Access</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            Digital Eye Strain Monitoring
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Protect your vision with automatic 20-20-20 break reminders, ergonomic distance guidance, and personalized eye-health analytics.
          </p>

          {/* Feature Highlights Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-800">20-20-20 Rule</div>
                <div className="text-[11px] text-slate-500">Scheduled break alerts</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <Ruler className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-800">Distance Guide</div>
                <div className="text-[11px] text-slate-500">50-70 cm safe zone</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <ClipboardCheck className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-800">7-Point Test</div>
                <div className="text-[11px] text-slate-500">Strain self-assessment</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-800">Non-Clinical</div>
                <div className="text-[11px] text-slate-500">Preventive ergonomics</div>
              </div>
            </div>
          </div>

          {/* Prominent Start Button */}
          <div className="mt-8">
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold text-base shadow-lg shadow-primary-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75"
            >
              {isStarting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Launching Dashboard...</span>
                </>
              ) : (
                <>
                  <span>Start Dhruva</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="mt-5">
            <Link
              to="/"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Back to Overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
