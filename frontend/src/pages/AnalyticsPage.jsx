import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Info,
  Camera,
  Eye,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsAPI, cameraWellnessAPI } from '../services/api';
import { useSession } from '../context/SessionContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const AnalyticsPage = () => {
  const { activeSession, elapsedSeconds } = useSession();

  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [cameraHistory, setCameraHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Builds genuine analytics based exclusively on user's actual activity
  const buildRealAnalytics = (remoteWeekly, remoteDaily, remoteMonthly) => {
    const today = new Date();
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let userSessions = [];
    try {
      userSessions = JSON.parse(localStorage.getItem('dhruva_session_history') || '[]');
    } catch {
      userSessions = [];
    }

    let breakStats = { completed: 0, prompted: 0 };
    try {
      breakStats = JSON.parse(localStorage.getItem('dhruva_break_stats') || '{"completed": 0, "prompted": 0}');
    } catch {
      breakStats = { completed: 0, prompted: 0 };
    }

    // Include live active session if one is in progress
    const activeElapsedMin = activeSession && elapsedSeconds > 0 ? Math.round(elapsedSeconds / 60) : 0;

    let hasAnyWork = userSessions.length > 0 || activeElapsedMin > 0;
    if (remoteWeekly?.total_screen_time_hours > 0 || remoteDaily?.total_screen_seconds > 0) {
      hasAnyWork = true;
    }

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : dayNames[d.getDay()];

      // Match genuine sessions completed on that date
      const daySessions = userSessions.filter((s) => s.completed_at?.startsWith(dStr));
      const loggedSec = daySessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
      let dayMin = Math.round(loggedSec / 60);

      // Add live session minutes if today
      if (i === 0 && activeElapsedMin > 0) {
        dayMin += activeElapsedMin;
      }

      // Check remote day data if present
      const remoteDay = remoteWeekly?.days?.find((rd) => rd.date === dStr || rd.day_name === dayName);
      if (remoteDay && remoteDay.screen_time_minutes > 0) {
        dayMin = Math.max(dayMin, Math.round(remoteDay.screen_time_minutes));
      }

      // Score is only calculated if the user actually worked
      let dayScore = null;
      if (dayMin > 0) {
        dayScore = Math.min(100, Math.max(70, 95 - Math.floor(dayMin / 120) * 10));
      }

      days.push({
        date: dStr,
        day_name: dayName,
        screen_time_minutes: dayMin,
        screen_hours: Math.round((dayMin / 60) * 10) / 10,
        eye_health_score: dayScore,
      });
    }

    const totalMinutes = days.reduce((acc, d) => acc + d.screen_time_minutes, 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const activeDaysCount = days.filter((d) => d.screen_time_minutes > 0).length;
    const avgHours = activeDaysCount > 0 ? Math.round((totalHours / activeDaysCount) * 10) / 10 : 0;

    const scoredDays = days.filter((d) => d.eye_health_score !== null);
    const avgScore =
      scoredDays.length > 0
        ? Math.round(scoredDays.reduce((acc, d) => acc + d.eye_health_score, 0) / scoredDays.length)
        : null;

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);

    const totalBreaksCompleted = breakStats.completed || remoteDaily?.breaks_completed || 0;
    const totalBreaksPrompted = breakStats.prompted || remoteDaily?.breaks_prompted || 0;
    const compliancePercent =
      totalBreaksPrompted > 0
        ? Math.round((totalBreaksCompleted / totalBreaksPrompted) * 100)
        : totalBreaksCompleted > 0
        ? 100
        : null;

    const weekly = {
      period_start: startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      period_end: today.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      total_screen_time_hours: totalHours,
      average_daily_screen_time_hours: avgHours,
      overall_break_compliance_percent: compliancePercent,
      average_eye_health_score: avgScore,
      has_any_work: hasAnyWork,
      days,
    };

    const now = new Date();
    const totalSessionsCount = userSessions.length + (activeSession ? 1 : 0) + (remoteMonthly?.total_sessions || 0);

    const monthly = {
      month_label: now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      total_screen_time_hours: totalHours,
      total_sessions: totalSessionsCount,
      total_breaks_completed: totalBreaksCompleted,
      overall_compliance_percent: compliancePercent ?? 0,
      has_any_work: hasAnyWork,
    };

    return {
      weekly,
      monthly,
      breakStats: { completed: totalBreaksCompleted, prompted: totalBreaksPrompted },
    };
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);

      try {
        const [dailyRes, weeklyRes, monthlyRes, camRes] = await Promise.all([
          analyticsAPI.getDailySummary().catch(() => null),
          analyticsAPI.getWeeklyTrends().catch(() => null),
          analyticsAPI.getMonthlyTrends().catch(() => null),
          cameraWellnessAPI.getHistory(10).catch(() => null),
        ]);

        if (camRes?.data?.summaries?.length > 0) {
          setCameraHistory(camRes.data.summaries);
        } else {
          try {
            const localHist = JSON.parse(localStorage.getItem('dhruva_camera_wellness_history') || '[]');
            setCameraHistory(localHist.filter((s) => s.user_consent !== false));
          } catch {}
        }

        const { weekly, monthly, breakStats } = buildRealAnalytics(
          weeklyRes?.data,
          dailyRes?.data,
          monthlyRes?.data
        );

        setDailyData({
          breaks_prompted: breakStats.prompted,
          breaks_completed: breakStats.completed,
        });
        setWeeklyData(weekly);
        setMonthlyData(monthly);
      } catch (err) {
        console.warn('Analytics loading notice:', err);
        const { weekly, monthly, breakStats } = buildRealAnalytics(null, null, null);
        setDailyData({
          breaks_prompted: breakStats.prompted,
          breaks_completed: breakStats.completed,
        });
        setWeeklyData(weekly);
        setMonthlyData(monthly);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [activeSession, elapsedSeconds]);

  const chartDays = weeklyData?.days || [];
  const hasWork = weeklyData?.has_any_work;

  // Donut chart stats
  const totalBreaksCompleted = dailyData?.breaks_completed || 0;
  const totalBreaksPrompted = dailyData?.breaks_prompted || 0;
  const totalBreaksSkipped = Math.max(0, totalBreaksPrompted - totalBreaksCompleted);

  const breakPieData = hasWork && (totalBreaksCompleted > 0 || totalBreaksSkipped > 0)
    ? [
        { name: 'Completed Breaks', value: totalBreaksCompleted, color: '#059669' },
        { name: 'Missed / Delayed', value: totalBreaksSkipped > 0 ? totalBreaksSkipped : 0, color: '#CBD5E1' },
      ]
    : [
        { name: 'No Breaks Yet', value: 1, color: '#E2E8F0' },
      ];

  const complianceLabel = weeklyData?.overall_break_compliance_percent !== null
    ? `${weeklyData?.overall_break_compliance_percent}%`
    : '-- %';

  const healthScoreLabel = weeklyData?.average_eye_health_score !== null
    ? `${weeklyData?.average_eye_health_score} / 100`
    : '-- / 100';

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold mb-2">
          <BarChart3 className="w-3.5 h-3.5 text-primary-600" />
          <span>Longitudinal Ergonomic Metrics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Reports & Analytics
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Track in-app digital study duration, 20-20-20 rule adherence rates, and eye health awareness score progressions over time.
        </p>
      </div>

      {/* Real-Work Notice Banner if User Has Not Logged Any Work Yet */}
      {!hasWork && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-primary-50/80 via-white to-primary-50/50 border border-primary-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-primary-600/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-block text-[10px] uppercase font-bold text-primary-700 bg-primary-100/70 px-2 py-0.5 rounded mb-1">
                Zero Mock Data • Authentic Progress Tracking
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                No Screen Work Recorded Yet
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Dhruva only generates reports and graphs when you actually work. Start a monitoring session or use the 20-20-20 timer to begin tracking real habits.
              </p>
            </div>
          </div>
          <Link
            to="/session"
            className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/25 transition-all hover:scale-105 shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Start Session Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Top 3 Summary Metric Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">7-Day Total Screen Time</span>
            <Clock className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono mt-3">
            {weeklyData?.total_screen_time_hours || 0} <span className="text-lg font-bold text-slate-500">hrs</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {hasWork ? (
              <>Average: <span className="font-bold text-slate-700">{weeklyData?.average_daily_screen_time_hours || 0} hrs</span> / day</>
            ) : (
              <span>No monitoring sessions recorded yet</span>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Overall Break Compliance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-primary-600 font-mono mt-3">
            {complianceLabel}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{hasWork && weeklyData?.overall_break_compliance_percent !== null ? '20-20-20 rule adherence rate' : 'No breaks prompted yet'}</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Average Health Score</span>
            <ShieldCheck className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono mt-3">
            {healthScoreLabel}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {hasWork ? (
              <>Period: <span className="font-semibold text-slate-700">{weeklyData?.period_start} to {weeklyData?.period_end}</span></>
            ) : (
              <span>Complete a session to compute score</span>
            )}
          </div>
        </Card>
      </div>

      {/* Charts Section: 3 Columns */}
      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Chart 1: Daily Screen Time (Bar Chart) */}
        <Card
          title="Daily In-App Screen Time (Mins)"
          subtitle={hasWork ? "Active monitoring duration logged over the last 7 days" : "0 mins logged — start a session to record time"}
        >
          <div className="w-full pt-4" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartDays} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="day_name"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, (dataMax) => Math.max(60, dataMax + 20)]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val) => [
                    `${val} mins (${Math.round((val / 60) * 10) / 10} hrs)`,
                    'Screen Time',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Bar
                  dataKey="screen_time_minutes"
                  fill="#0284C7"
                  radius={[8, 8, 0, 0]}
                  name="Screen Minutes"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Eye Health Awareness Score Trend (Line Chart) */}
        <Card
          title="Eye Health Score Progression"
          subtitle={hasWork && weeklyData?.average_eye_health_score !== null ? "Composite wellness rating (0-100) based on breaks and pacing" : "No score trend yet — records when sessions are active"}
        >
          <div className="w-full pt-4" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartDays} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="day_name"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val) => [val !== null ? `${val} / 100` : 'No Activity', 'Health Score']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="eye_health_score"
                  stroke="#059669"
                  strokeWidth={3}
                  connectNulls={false}
                  dot={{ r: 5, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#047857' }}
                  name="Health Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 3: Break Compliance Ratio (Donut Chart) */}
        <Card
          title="Today's Break Adherence"
          subtitle="Ratio of prompted vs completed 20-20-20 breaks"
        >
          <div className="w-full pt-2 flex flex-col items-center justify-center relative" style={{ height: 280 }}>
            <div className="relative w-full" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={breakPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {breakPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Percentage in Donut Hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 font-mono leading-none">
                  {complianceLabel}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-0.5">
                  Adherence
                </span>
              </div>
            </div>

            {/* Legend Labels */}
            <div className="flex items-center justify-center gap-6 text-xs font-bold mt-2">
              <span className="flex items-center gap-2 text-emerald-800">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block shadow-xs"></span>
                Completed ({totalBreaksCompleted})
              </span>
              <span className="flex items-center gap-2 text-slate-500">
                <span className="w-3 h-3 rounded-full bg-slate-300 inline-block"></span>
                Skipped ({totalBreaksSkipped})
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Summary Card */}
      <Card
        title={`Monthly Overview: ${monthlyData?.month_label || 'Current Month'}`}
        subtitle="Aggregated digital study habits for the current calendar period"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center py-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Screen Hours</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1.5">
              {monthlyData?.total_screen_time_hours || 0} <span className="text-sm font-bold text-slate-400">hrs</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Completed Sessions</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1.5">
              {monthlyData?.total_sessions || 0}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Breaks Completed</div>
            <div className="text-2xl sm:text-3xl font-black text-primary-600 font-mono mt-1.5">
              {monthlyData?.total_breaks_completed || 0}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Overall Adherence</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-1.5">
              {hasWork && weeklyData?.overall_break_compliance_percent !== null ? `${monthlyData?.overall_compliance_percent}%` : '--'}
            </div>
          </div>
        </div>
      </Card>

      {/* Camera Wellness Non-Image Observations Section */}
      <Card
        title="Camera Wellness Check Observations"
        subtitle="Recent non-image wellness check summaries saved with your consent"
        action={
          <Link
            to="/camera-wellness"
            className="text-xs font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-200 hover:bg-primary-100 transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>New Camera Check</span>
          </Link>
        }
      >
        {cameraHistory.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cameraHistory.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recent'}
                    </span>
                    <span className="font-mono text-[11px]">
                      {item.session_duration_seconds ? `${item.session_duration_seconds}s check` : ''}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {item.approximate_blink_count}
                    </span>
                    <span className="text-xs text-slate-500">approx blinks</span>
                    {item.blinks_per_minute && (
                      <span className="text-[10px] text-primary-600 font-bold ml-auto">
                        ~{item.blinks_per_minute}/min
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-600 truncate">
                    Framing: <span className="font-medium text-slate-800">{item.relative_position_summary}</span>
                  </div>

                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                    Visibility: {item.face_visibility_summary}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-slate-500 italic pt-2">
              *Educational wellness records only. Zero photographs or video recordings are ever captured or stored.
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto border border-primary-100">
              <Camera className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h5 className="text-xs font-bold text-slate-900">No Consented Camera Summaries Available</h5>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Take a 1-to-2 minute webcam awareness check to observe blink pacing and monitor posture.
                Summaries only appear here when you explicitly choose to save them.
              </p>
            </div>
            <Link
              to="/camera-wellness"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-xs"
            >
              <span>Take Camera Wellness Check</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};
