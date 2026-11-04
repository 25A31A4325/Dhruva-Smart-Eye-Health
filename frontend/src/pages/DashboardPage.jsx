import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  Flame,
  Activity,
  Maximize2,
  Lightbulb,
  Play,
  ArrowRight,
  ClipboardCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { analyticsAPI, tipsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { activeSession, startSession } = useSession();

  const [dailySummary, setDailySummary] = useState(null);
  const [dailyTip, setDailyTip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, tipRes] = await Promise.all([
          analyticsAPI.getDailySummary(),
          tipsAPI.getDaily(),
        ]);
        setDailySummary(summaryRes.data);
        setDailyTip(tipRes.data.tip);
      } catch (err) {
        console.warn('Backend waking up or offline; initializing instant dashboard state:', err);
        setDailySummary({
          total_screen_seconds: 0,
          active_screen_seconds: 0,
          breaks_completed: 0,
          total_break_seconds: 0,
          break_compliance_rate: 100,
          current_streak_days: 1,
          awareness_score: 95,
          latest_distance_cm: null,
          latest_distance_category: null,
          active_sessions_count: 0,
        });
        setDailyTip({
          title: "The Clinical 20-20-20 Rule",
          category: "BREAKS",
          actionable_step: "Every 20 minutes, shift your gaze to an object 20 feet away for 20 seconds.",
          scientific_rationale: "Relaxes the ciliary muscles and restores healthy blink frequency to prevent ocular drying."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatHours = (seconds) => {
    if (!seconds) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const getScoreBadgeVariant = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'primary';
    return 'warning';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-primary-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-primary-100 mb-3 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-primary-300" />
            <span>Swasth Bharat • Preventive Healthcare Initiative</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name || 'Innovator'}!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-primary-100/90 leading-relaxed">
            Monitor your daily screen study duration, enforce the 20-20-20 rule, and maintain comfortable ergonomic viewing distances.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          {!activeSession ? (
            <button
              onClick={() => startSession('Quick started from dashboard')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-primary-900 font-bold text-xs sm:text-sm shadow-md hover:bg-primary-50 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 text-primary-700 fill-primary-700" />
              <span>Start Screen Session</span>
            </button>
          ) : (
            <Link
              to="/session"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md hover:bg-emerald-600 transition-all"
            >
              <Clock className="w-4 h-4 animate-spin" />
              <span>View Active Session</span>
            </Link>
          )}

          <Link
            to="/distance"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Check Distance</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 6 Core Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1: In-App Screen Time */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Screen Time</span>
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {formatHours(dailySummary?.total_screen_seconds || 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Today's In-App Work</div>
          </div>
        </Card>

        {/* Metric 2: Completed Sessions */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sessions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {dailySummary?.sessions_completed ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Completed Today</div>
          </div>
        </Card>

        {/* Metric 3: Break Compliance */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Break Rate</span>
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {dailySummary?.break_compliance_percent ?? 100}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">20-20-20 Adherence</div>
          </div>
        </Card>

        {/* Metric 4: Break Streak */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Streak</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {dailySummary?.current_break_streak ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Consecutive Breaks</div>
          </div>
        </Card>

        {/* Metric 5: Eye Health Score */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Health Score</span>
            <Badge variant={getScoreBadgeVariant(dailySummary?.eye_health_score || 85)}>
              {dailySummary?.health_score_status || 'Good'}
            </Badge>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {dailySummary?.eye_health_score ?? 85}/100
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Awareness Index</div>
          </div>
        </Card>

        {/* Metric 6: Latest Distance */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Distance</span>
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {dailySummary?.latest_distance_cm ? `${dailySummary.latest_distance_cm} cm` : '-- cm'}
            </div>
            <div className={`text-[11px] font-medium mt-1 truncate ${dailySummary?.latest_distance_zone ? 'text-emerald-600' : 'text-slate-500'}`}>
              {dailySummary?.latest_distance_zone || 'Not Checked Today'}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Body Split: Featured Tip & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Featured Tip & 20-20-20 Habit Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Eye Health Tip Card */}
          {dailyTip && (
            <Card
              title="Featured Daily Eye Care Guideline"
              subtitle="Evidence-based habit coaching for computer users"
              action={
                <Link to="/tips" className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                  <span>All Guidelines</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-100">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-100 text-primary-800">
                    Category: {dailyTip.category}
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{dailyTip.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{dailyTip.content}</p>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-800">Immediate Action Step: </span>
                    <span className="text-slate-600">{dailyTip.actionable_step}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Ergonomics Checklist */}
          <Card title="Healthy Screen Habits Checklist" subtitle="Simple workstation adjustments that protect your ciliary muscles">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-xs font-medium text-slate-800">Maintain at least arm's length distance (50 to 70 cm)</span>
                </div>
                <Link to="/distance" className="text-xs font-semibold text-primary-600 hover:underline">Check</Link>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-xs font-medium text-slate-800">Practice the 20-20-20 rule during continuous work</span>
                </div>
                <Link to="/session" className="text-xs font-semibold text-primary-600 hover:underline">Track</Link>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-xs font-medium text-slate-800">Evaluate digital eye strain symptoms weekly</span>
                </div>
                <Link to="/assessment" className="text-xs font-semibold text-primary-600 hover:underline">Survey</Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Quick Access Tools */}
        <div className="space-y-6">
          <Card title="Quick Preventive Actions">
            <div className="space-y-3">
              <Link
                to="/session"
                className="group p-4 rounded-xl border border-slate-200/80 hover:border-primary-300 hover:bg-primary-50/40 transition-all flex items-center justify-between block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Session Tracker</h5>
                    <p className="text-[11px] text-slate-500">Live 20-min countdown</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/distance"
                className="group p-4 rounded-xl border border-slate-200/80 hover:border-primary-300 hover:bg-primary-50/40 transition-all flex items-center justify-between block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Distance Assistant</h5>
                    <p className="text-[11px] text-slate-500">Ergonomic guidance</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/assessment"
                className="group p-4 rounded-xl border border-slate-200/80 hover:border-primary-300 hover:bg-primary-50/40 transition-all flex items-center justify-between block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ClipboardCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Eye Strain Survey</h5>
                    <p className="text-[11px] text-slate-500">7-Point self-assessment</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/analytics"
                className="group p-4 rounded-xl border border-slate-200/80 hover:border-primary-300 hover:bg-primary-50/40 transition-all flex items-center justify-between block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Analytics & Reports</h5>
                    <p className="text-[11px] text-slate-500">Weekly adherence trends</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
