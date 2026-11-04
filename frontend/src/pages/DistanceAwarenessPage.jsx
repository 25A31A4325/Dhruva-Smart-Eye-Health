import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  Ruler,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  History,
} from 'lucide-react';
import { distanceAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { DistanceIllustration } from '../components/distance/DistanceIllustration';

export const DistanceAwarenessPage = () => {
  const [distanceCm, setDistanceCm] = useState(55);
  const [screenDiagonal, setScreenDiagonal] = useState(15.6);
  const [workstationType, setWorkstationType] = useState('LAPTOP');
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await distanceAPI.getHistory(10);
      setHistory(res.data.checks || []);
    } catch (err) {
      console.warn('Failed to fetch distance history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await distanceAPI.check({
        reported_distance_cm: parseFloat(distanceCm),
        screen_diagonal_inches: parseFloat(screenDiagonal),
        workstation_type: workstationType,
      });
      setAssessmentResult(res.data);
      fetchHistory();
    } catch (err) {
      console.error('Failed to submit distance check:', err);
    } finally {
      setLoading(false);
    }
  };

  const getZoneBadgeVariant = (zone) => {
    switch (zone) {
      case 'OPTIMAL':
        return 'success';
      case 'WARNING_CLOSE':
        return 'warning';
      case 'DANGER_TOO_CLOSE':
        return 'danger';
      default:
        return 'primary';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold mb-2">
          <Maximize2 className="w-3.5 h-3.5 text-primary-600" />
          <span>Ergonomic Posture Assistant</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Viewing Distance Awareness</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Verify whether your current screen positioning provides adequate relief from ocular convergence fatigue. Compare your distance against clinical workstation guidelines.
        </p>
      </div>

      {/* Prominent Educational Notice */}
      <div className="p-4 rounded-2xl bg-primary-50/80 border border-primary-200 text-primary-900 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Educational Ergonomic Assistant:</span>
          <p className="text-[11px] text-primary-700 leading-relaxed">
            This module evaluates your manually entered viewing distance against recommended ergonomic standards. It does not utilize webcams or physical optical sensors, guaranteeing complete privacy and honesty.
          </p>
        </div>
      </div>

      {/* Interactive SVG Diagram */}
      <DistanceIllustration currentDistance={distanceCm} />

      {/* Input Form & Evaluation Results Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Input Form */}
        <Card title="Enter Your Workstation Parameters">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Slider for Distance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">Estimated Viewing Distance</label>
                <span className="font-mono font-bold text-primary-700 text-sm bg-primary-50 px-2.5 py-0.5 rounded-lg border border-primary-200">
                  {distanceCm} cm (~{Math.round(distanceCm / 2.54)} inches)
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="110"
                step="1"
                value={distanceCm}
                onChange={(e) => setDistanceCm(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-medium mt-1">
                <span>20 cm (Too Close)</span>
                <span>50-70 cm (Arm's Length)</span>
                <span>110 cm (Far)</span>
              </div>
            </div>

            {/* Screen Size & Device Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Screen Diagonal</label>
                <select
                  value={screenDiagonal}
                  onChange={(e) => setScreenDiagonal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
                >
                  <option value={10.1}>10.1" (Tablet)</option>
                  <option value={13.3}>13.3" (Ultra-portable)</option>
                  <option value={14.0}>14.0" (Standard Laptop)</option>
                  <option value={15.6}>15.6" (Large Laptop)</option>
                  <option value={24.0}>24.0" (Desktop Monitor)</option>
                  <option value={27.0}>27.0" (Wide Desktop)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Workstation Type</label>
                <select
                  value={workstationType}
                  onChange={(e) => setWorkstationType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
                >
                  <option value="LAPTOP">Laptop on Desk</option>
                  <option value="DESKTOP_MONITOR">External Monitor</option>
                  <option value="TABLET">Tablet / Stand</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              <Ruler className="w-4 h-4" />
              <span>{loading ? 'Evaluating...' : 'Evaluate Ergonomic Safety'}</span>
            </button>
          </form>
        </Card>

        {/* Right: Assessment Feedback */}
        <Card title="Physiological Feedback">
          {assessmentResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Zone Classification:</span>
                <Badge variant={getZoneBadgeVariant(assessmentResult.zone)}>
                  {assessmentResult.status_label}
                </Badge>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Ciliary Muscle Strain Risk
                </h5>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800">
                  {assessmentResult.ciliary_strain_risk}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Clinical Guidance
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed bg-primary-50/50 p-3.5 rounded-xl border border-primary-100">
                  {assessmentResult.educational_guidance}
                </p>
              </div>

              <div className="pt-2 text-[11px] text-slate-600 border-t border-slate-100 italic">
                {assessmentResult.disclaimer}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <Ruler className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Adjust the slider on the left and click "Evaluate Ergonomic Safety" to view clinical distance feedback.</p>
            </div>
          )}
        </Card>
      </div>

      {/* History Table */}
      <Card title="Previous Distance Evaluations" subtitle="Record of previous workstation checks">
        {historyLoading ? (
          <div className="py-6 text-center text-xs text-slate-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">No previous distance assessments logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Reported Distance</th>
                  <th className="py-3 px-4">Ergonomic Zone</th>
                  <th className="py-3 px-4">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-800">
                      {new Date(h.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary-700">
                      {h.reported_distance_cm} cm
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getZoneBadgeVariant(h.zone)}>
                        {h.status_label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {h.educational_guidance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
