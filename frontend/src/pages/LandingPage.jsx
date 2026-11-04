import React from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  Shield,
  Clock,
  Maximize2,
  ClipboardCheck,
  BarChart2,
  Sparkles,
  ArrowRight,
  CheckCircle,
  HeartPulse,
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-700 via-primary-600 to-primary-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">Dhruva</span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                Swasth Bharat
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-primary-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-600/20 transition-all hover:scale-[1.02]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white via-primary-50/30 to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100/80 border border-primary-200 text-primary-800 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>National Innovation Challenge • Healthcare & Preventive Technology</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Intelligent Eye Health Monitoring & <span className="text-primary-600">Digital Strain Prevention</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Dhruva is an accessible, 100% software-based digital health companion helping students, competitive exam aspirants, and professionals build healthy screen habits through the clinical 20-20-20 rule and ergonomic distance awareness.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-base shadow-lg shadow-primary-600/25 transition-all hover:scale-105"
            >
              <span>Start Monitoring Session</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base border border-slate-200 shadow-sm transition-all"
            >
              <span>Sign In to Dashboard</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
              <div className="text-2xl font-black text-primary-600">20-20-20</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Clinical Break Rule</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
              <div className="text-2xl font-black text-primary-600">50-70 cm</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Ergonomic Safe Zone</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
              <div className="text-2xl font-black text-primary-600">7-Point</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Eye Strain Survey</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
              <div className="text-2xl font-black text-primary-600">100%</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Software-Based & Free</div>
            </div>
          </div>
        </div>
      </section>

      {/* The 20-20-20 Rule Deep Dive */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Evidence-Informed Ergonomics</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Why Does Prolonged Screen Work Cause Digital Eye Strain?
              </h2>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                When staring at laptops or mobile phones, the tiny ciliary muscles inside your eyes contract continuously to maintain near-focus accommodation. At the same time, your blink rate drops by up to 60%, evaporating your protective tear film.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    20
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Every 20 Minutes</h4>
                    <p className="text-xs text-slate-500">Take an intentional visual break from your monitor.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    20
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Look 20 Feet (6 Meters) Away</h4>
                    <p className="text-xs text-slate-500">Looking into the distance forces ciliary muscles to relax to optical infinity.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    20
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">For at Least 20 Seconds</h4>
                    <p className="text-xs text-slate-500">Allow your tear film to restore and pupil muscles to reset balance.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-primary-100/60 rounded-3xl p-8 border border-primary-200 text-center relative overflow-hidden">
              <div className="w-32 h-32 rounded-full bg-white shadow-xl mx-auto flex flex-col items-center justify-center border-4 border-primary-500/30 animate-breathe">
                <HeartPulse className="w-8 h-8 text-primary-600 mb-1" />
                <span className="text-xl font-black text-slate-900 font-mono">20s</span>
                <span className="text-[9px] uppercase font-bold text-primary-700">Distant Gaze</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-6">Automated In-App Guidance</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-2 leading-relaxed">
                Dhruva tracks your active study sessions directly in your browser. Whenever you hit 20 minutes of continuous focus, a calming audio chime and interactive 20-second countdown guide your recovery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Everything You Need for Digital Ergonomics</h2>
            <p className="mt-3 text-sm text-slate-600">Built for the Swasth & Samavesh Bharat mission with zero cost and maximum accessibility.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Screen Session Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accurately logs in-app session duration using the browser Page Visibility API, pausing automatically when you minimize or switch tabs.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5">
                <Maximize2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Viewing Distance Awareness</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verify your workstation distance against ergonomic standards for laptops and desktop monitors, with interactive SVG diagrams and ciliary strain feedback.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">7-Point Eye Strain Survey</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take a self-paced assessment covering dry eye symptoms, headaches, lighting contrast, and conscious blinking habits with tailored recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Medical Disclaimer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto space-y-3">
          <p className="font-semibold text-slate-700">
            Dhruva — Swasth & Samavesh Bharat Innovation Challenge Project
          </p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            <strong className="text-slate-800">Medical Disclaimer:</strong> Dhruva is an educational, behavioral awareness platform designed to assist users in maintaining healthy screen work pacing. It does not provide medical or clinical diagnosis, measure intraocular pressure or visual acuity, or prescribe optical corrections. If you experience persistent visual discomfort, please consult a qualified ophthalmologist.
          </p>
          <div className="text-[11px] text-slate-500 pt-2">
            © 2026 Team Dhruva. 100% Software-Based Preventive Health System.
          </div>
        </div>
      </footer>
    </div>
  );
};
