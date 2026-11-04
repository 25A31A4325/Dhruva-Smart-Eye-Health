import React, { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Clock,
  Volume2,
  VolumeX,
  Target,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const SettingsPage = () => {
  const { user, updatePreferences, logout } = useAuth();

  const [breakInterval, setBreakInterval] = useState(
    user?.preferences?.break_interval_minutes || 20
  );
  const [breakDuration, setBreakDuration] = useState(
    user?.preferences?.break_duration_seconds || 20
  );
  const [soundEnabled, setSoundEnabled] = useState(
    user?.preferences?.sound_enabled ?? true
  );
  const [dailyTargetHours, setDailyTargetHours] = useState(
    user?.preferences?.target_daily_screen_hours || 6.0
  );

  // Sync state whenever user profile is fetched or updated
  React.useEffect(() => {
    if (user?.preferences) {
      setBreakInterval(user.preferences.break_interval_minutes || 20);
      setBreakDuration(user.preferences.break_duration_seconds || 20);
      setSoundEnabled(user.preferences.sound_enabled ?? true);
      setDailyTargetHours(user.preferences.target_daily_screen_hours || 6.0);
    }
  }, [user]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const result = await updatePreferences({
      break_interval_minutes: parseInt(breakInterval, 10),
      break_duration_seconds: parseInt(breakDuration, 10),
      sound_enabled: soundEnabled,
      target_daily_screen_hours: parseFloat(dailyTargetHours),
    });

    setSaving(false);
    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(result.error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('Browser desktop notifications enabled successfully!');
      } else {
        alert('Notification permission was not granted by your browser.');
      }
    } else {
      alert('Your browser does not support native desktop notifications.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold mb-2">
          <Settings className="w-3.5 h-3.5 text-primary-600" />
          <span>System Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Profile & Ergonomic Settings</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Personalize your 20-20-20 reminder pacing, audio notification chimes, and daily screen time budgets.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Your ergonomic preferences have been saved and synchronized with the backend.</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* User Account Profile Card */}
      <Card title="User Account Information" subtitle="Your registered Dhruva user details">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Full Name</span>
            <div className="text-sm font-bold text-slate-900 mt-1">{user?.full_name || 'Innovator'}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Email Address</span>
            <div className="text-sm font-bold text-slate-900 mt-1">{user?.email}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">User ID</span>
            <div className="text-xs font-mono font-medium text-slate-600 mt-1 truncate">{user?.id}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Account Status</span>
            <div className="mt-1">
              <Badge variant="success">Active (Verified)</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Preferences Form */}
      <Card title="Ergonomic & Reminder Preferences" subtitle="Adjust the pacing parameters for in-app eye break alerts">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Break Reminder Interval
              </label>
              <select
                value={breakInterval}
                onChange={(e) => setBreakInterval(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 font-medium"
              >
                <option value={15}>Every 15 Minutes (Intense Reading)</option>
                <option value={20}>Every 20 Minutes (Clinical 20-20-20 Standard)</option>
                <option value={25}>Every 25 Minutes (Pomodoro Pacing)</option>
                <option value={30}>Every 30 Minutes (Relaxed Desk Pacing)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Break Countdown Duration
              </label>
              <select
                value={breakDuration}
                onChange={(e) => setBreakDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 font-medium"
              >
                <option value={15}>15 Seconds</option>
                <option value={20}>20 Seconds (Recommended Standard)</option>
                <option value={30}>30 Seconds (Deep Ciliary Relaxation)</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Daily Screen Work Target (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="16"
                step="0.5"
                value={dailyTargetHours}
                onChange={(e) => setDailyTargetHours(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 font-medium"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Healthy guideline for non-essential digital tasks: 4 to 6 hours
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <span className="block text-xs font-semibold text-slate-700 mb-2">
                Audio Chime Feedback
              </span>
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all ${
                  soundEnabled
                    ? 'bg-primary-50 border-primary-300 text-primary-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-primary-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{soundEnabled ? 'Synthesized Bell Chime Enabled' : 'Audio Alert Muted'}</span>
                </div>
                <Badge variant={soundEnabled ? 'success' : 'neutral'}>
                  {soundEnabled ? 'Active' : 'Muted'}
                </Badge>
              </button>
            </div>
          </div>

          {/* Desktop Notification Permission */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-slate-900">Desktop Browser Notifications</h5>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Receive break reminders even when you are working on other browser tabs or windows.
              </p>
            </div>
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shrink-0"
            >
              Request Browser Permission
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-md shadow-primary-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Sign Out Card */}
      <Card title="Account Sign Out">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-xs font-bold text-slate-900">Sign Out of Dhruva</h5>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Securely terminate your current session on this device.
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </Card>
    </div>
  );
};
