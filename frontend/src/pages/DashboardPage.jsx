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
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { analyticsAPI, tipsAPI, cameraWellnessAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { activeSession, startSession } = useSession();

  const [dailySummary, setDailySummary] = useState(null);
  const [dailyTip, setDailyTip] = useState(null);
  const [latestCameraSummary, setLatestCameraSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interactive Checklist State
  const [completedHabits, setCompletedHabits] = useState(() => {
    try {
      const saved = localStorage.getItem('dhruva_screen_habits');
      return saved ? JSON.parse(saved) : { distance: false, breaks: false, survey: false };
    } catch {
      return { distance: false, breaks: false, survey: false };
    }
  });

  const toggleHabit = (habitKey) => {
    setCompletedHabits((prev) => {
      const updated = { ...prev, [habitKey]: !prev[habitKey] };
      localStorage.setItem('dhruva_screen_habits', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (activeSession) {
      setCompletedHabits((prev) => {
        if (!prev.breaks) {
          const updated = { ...prev, breaks: true };
          localStorage.setItem('dhruva_screen_habits', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, [activeSession]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, tipRes, camRes] = await Promise.allSettled([
          analyticsAPI.getDailySummary(),
          tipsAPI.getDaily(),
          cameraWellnessAPI.getLatest(),
        ]);
        if (summaryRes.status === 'fulfilled') setDailySummary(summaryRes.value.data);
        if (tipRes.status === 'fulfilled') setDailyTip(tipRes.value.data.tip);
        if (camRes.status === 'fulfilled' && camRes.value.data) {
          setLatestCameraSummary(camRes.value.data);
        } else {
          try {
            const localCam = JSON.parse(localStorage.getItem('dhruva_camera_wellness_latest'));
            if (localCam) setLatestCameraSummary(localCam);
          } catch {}
        }
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
          <Card
            title="Healthy Screen Habits Checklist"
            subtitle="Simple workstation adjustments that protect your ciliary muscles"
            action={
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-100 text-primary-800">
                {Object.values(completedHabits).filter(Boolean).length} of 3 Done
              </span>
            }
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5 font-medium">
                <span>Daily Habit Progress</span>
                <span className="font-bold text-slate-700">
                  {Math.round((Object.values(completedHabits).filter(Boolean).length / 3) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${(Object.values(completedHabits).filter(Boolean).length / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Habit 1 */}
              <div
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all select-none cursor-pointer ${
                  completedHabits.distance
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80'
                }`}
                onClick={() => toggleHabit('distance')}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Toggle habit 1"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      completedHabits.distance
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'border-2 border-slate-300 text-slate-500 bg-white hover:border-primary-500'
                    }`}
                  >
                    {completedHabits.distance ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">1</span>}
                  </button>
                  <div>
                    <span className={`text-xs font-semibold block ${completedHabits.distance ? 'text-emerald-950 line-through opacity-80' : 'text-slate-800'}`}>
                      Maintain at least arm's length distance (50 to 70 cm)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {completedHabits.distance ? '✓ Completed today (tap to toggle)' : 'Tap to mark done or open check tool'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                  <Link
                    to="/distance"
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 shadow-xs hover:border-primary-400 transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                  >
                    <span>Check</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Habit 2 */}
              <div
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all select-none cursor-pointer ${
                  completedHabits.breaks
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80'
                }`}
                onClick={() => toggleHabit('breaks')}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Toggle habit 2"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      completedHabits.breaks
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'border-2 border-slate-300 text-slate-500 bg-white hover:border-primary-500'
                    }`}
                  >
                    {completedHabits.breaks ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">2</span>}
                  </button>
                  <div>
                    <span className={`text-xs font-semibold block ${completedHabits.breaks ? 'text-emerald-950 line-through opacity-80' : 'text-slate-800'}`}>
                      Practice the 20-20-20 rule during continuous work
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {completedHabits.breaks ? '✓ Completed today (tap to toggle)' : 'Tap to mark done or start tracker'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                  <Link
                    to="/session"
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 shadow-xs hover:border-primary-400 transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                  >
                    <span>Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Habit 3 */}
              <div
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all select-none cursor-pointer ${
                  completedHabits.survey
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80'
                }`}
                onClick={() => toggleHabit('survey')}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Toggle habit 3"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      completedHabits.survey
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'border-2 border-slate-300 text-slate-500 bg-white hover:border-primary-500'
                    }`}
                  >
                    {completedHabits.survey ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">3</span>}
                  </button>
                  <div>
                    <span className={`text-xs font-semibold block ${completedHabits.survey ? 'text-emerald-950 line-through opacity-80' : 'text-slate-800'}`}>
                      Evaluate digital eye strain symptoms weekly
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {completedHabits.survey ? '✓ Completed today (tap to toggle)' : 'Tap to mark done or take 7-point survey'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                  <Link
                    to="/assessment"
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 shadow-xs hover:border-primary-400 transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                  >
                    <span>Survey</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* AI Camera-Based Eye Wellness Check Card */}
          <Card
            title="AI Camera-Based Eye Wellness Check"
            subtitle="In-browser blink awareness and ergonomic framing observations (100% on-device)"
            action={
              <Link
                to="/camera-wellness"
                className="text-xs font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-200 hover:bg-primary-100 transition-all"
              >
                <span>{latestCameraSummary ? 'Check Again' : 'Start Check'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {latestCameraSummary ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Approx Blinks
                    </span>
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {latestCameraSummary.approximate_blink_count}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      ~{latestCameraSummary.blinks_per_minute || 0} / min
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Framing Status
                    </span>
                    <span className="text-xs font-bold text-slate-800 block mt-1 truncate">
                      {latestCameraSummary.relative_position_summary || 'Comfortable'}
                    </span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      Observed
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Last Check
                    </span>
                    <span className="text-xs font-bold text-slate-800 block mt-1">
                      {latestCameraSummary.timestamp ? new Date(latestCameraSummary.timestamp).toLocaleDateString() : 'Today'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Duration: {latestCameraSummary.session_duration_seconds || 60}s
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50/60 border border-primary-100 text-xs">
                  <span className="text-slate-700">
                    {latestCameraSummary.educational_tips?.[0] || 'Remember to execute complete blinks to lubricate corneal surfaces.'}
                  </span>
                  <Link
                    to="/camera-wellness"
                    className="text-primary-700 font-bold hover:underline shrink-0 ml-3"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary-50/50 to-slate-50 border border-primary-100/80">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">No Camera Check Performed Today</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Take a 60-second webcam awareness check to observe blink frequency and screen framing.
                    </p>
                  </div>
                </div>
                <Link
                  to="/camera-wellness"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-xs shrink-0 transition-all hover:scale-105 active:scale-95"
                >
                  Start Wellness Check
                </Link>
              </div>
            )}
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
                to="/camera-wellness"
                className="group p-4 rounded-xl border border-slate-200/80 hover:border-primary-300 hover:bg-primary-50/40 transition-all flex items-center justify-between block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Camera Wellness Check</h5>
                    <p className="text-[11px] text-slate-500">Blink & posture check</p>
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
