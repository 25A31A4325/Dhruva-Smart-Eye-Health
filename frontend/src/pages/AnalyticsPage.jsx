import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
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
import { analyticsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const AnalyticsPage = () => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
          analyticsAPI.getDailySummary(),
          analyticsAPI.getWeeklyTrends(),
          analyticsAPI.getMonthlyTrends(),
        ]);
        setDailyData(dailyRes.data);
        setWeeklyData(weeklyRes.data);
        setMonthlyData(monthlyRes.data);
      } catch (err) {
        console.error('Failed to load analytics trends:', err);
        setError('Unable to fetch historical analytics data from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading analytics trends...</div>;
  }

  const chartDays = weeklyData?.days || [];

  // Pie chart data for break compliance
  const totalBreaksPrompted = dailyData?.breaks_prompted || 0;
  const totalBreaksCompleted = dailyData?.breaks_completed || 0;
  const totalBreaksSkipped = Math.max(0, totalBreaksPrompted - totalBreaksCompleted);

  const breakPieData = [
    { name: 'Completed Breaks', value: totalBreaksCompleted > 0 ? totalBreaksCompleted : 1, color: '#059669' },
    { name: 'Missed / Skipped', value: totalBreaksSkipped, color: '#E2E8F0' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold mb-2">
          <BarChart3 className="w-3.5 h-3.5 text-primary-600" />
          <span>Longitudinal Ergonomic Metrics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Track in-app digital study duration, 20-20-20 rule adherence rates, and eye health awareness score progressions over time.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top 3 Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">7-Day Total Screen Time</div>
          <div className="text-3xl font-black text-slate-900 font-mono mt-2">
            {weeklyData?.total_screen_time_hours || 0} hrs
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Average: {weeklyData?.average_daily_screen_time_hours || 0} hrs / day
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Break Compliance</div>
          <div className="text-3xl font-black text-primary-600 font-mono mt-2">
            {weeklyData?.overall_break_compliance_percent || 100}%
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            20-20-20 rule adherence rate
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Health Score</div>
          <div className="text-3xl font-black text-slate-900 font-mono mt-2">
            {weeklyData?.average_eye_health_score || 85} / 100
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Period: {weeklyData?.period_start} to {weeklyData?.period_end}
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Chart 1: Daily Screen Time (Bar Chart) */}
        <Card title="Daily In-App Screen Time (Mins)" subtitle="Active monitoring duration logged over the last 7 days">
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day_name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} mins`, 'Active Screen Time']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="screen_time_minutes" fill="#0284C7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Eye Health Awareness Score Trend (Line Chart) */}
        <Card title="Eye Health Score Progression" subtitle="Composite wellness rating (0-100) based on breaks and pacing">
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartDays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day_name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} / 100`, 'Health Score']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="eye_health_score"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#059669' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 3: Break Compliance Ratio (Donut Chart) */}
        <Card title="Today's Break Adherence" subtitle="Ratio of prompted vs completed 20-20-20 breaks">
          <div className="h-64 w-full pt-2 flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie
                  data={breakPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {breakPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 text-xs font-semibold mt-1">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                Completed ({totalBreaksCompleted})
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
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
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Screen Hours</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {monthlyData?.total_screen_time_hours || 0} hrs
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 font-medium">Completed Sessions</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {monthlyData?.total_sessions || 0}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 font-medium">Breaks Completed</div>
            <div className="text-2xl font-black text-primary-600 font-mono mt-1">
              {monthlyData?.total_breaks_completed || 0}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 font-medium">Overall Adherence</div>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
              {monthlyData?.overall_compliance_percent || 100}%
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
