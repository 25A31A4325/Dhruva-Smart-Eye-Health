import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Clock,
  Maximize2,
  Sun,
  Eye,
  Compass,
  Droplets,
  Type,
  Sparkles,
  Search,
} from 'lucide-react';
import { tipsAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const TipsPage = () => {
  const [tips, setTips] = useState([]);
  const [dailyTip, setDailyTip] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTips = async () => {
      setLoading(true);
      try {
        const [allRes, dailyRes] = await Promise.all([
          tipsAPI.getAll(),
          tipsAPI.getDaily(),
        ]);
        setTips(allRes.data.tips || []);
        setCategories(['ALL', ...(allRes.data.categories || [])]);
        setDailyTip(dailyRes.data.tip);
      } catch (err) {
        console.error('Failed to load tips:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTips();
  }, []);

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'BREAKS':
        return <Clock className="w-4 h-4 text-primary-600" />;
      case 'DISTANCE':
        return <Maximize2 className="w-4 h-4 text-emerald-600" />;
      case 'LIGHTING':
        return <Sun className="w-4 h-4 text-amber-600" />;
      case 'BLINKING':
        return <Eye className="w-4 h-4 text-sky-600" />;
      case 'POSTURE':
        return <Compass className="w-4 h-4 text-indigo-600" />;
      case 'HYDRATION':
        return <Droplets className="w-4 h-4 text-blue-600" />;
      default:
        return <Lightbulb className="w-4 h-4 text-primary-600" />;
    }
  };

  const filteredTips = tips.filter((t) => {
    const matchesCategory = activeCategory === 'ALL' || t.category === activeCategory;
    const matchesQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.actionable_step.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-primary-600" />
          <span>Evidence-Informed Ergonomics Library</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Eye Care Guidelines</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Clinically substantiated daily habits to prevent accommodative spasm, ciliary muscle fatigue, and tear film desiccation.
        </p>
      </div>

      {/* Featured Daily Tip Hero Card */}
      {dailyTip && (
        <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-primary-900/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl -mr-16 -mt-16"></div>

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-primary-100 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-primary-300" />
              <span>Today's Featured Ergonomic Spotlight</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{dailyTip.title}</h2>
            <p className="text-xs sm:text-sm text-primary-100/90 leading-relaxed">{dailyTip.content}</p>
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs text-white">
              <span className="font-bold text-primary-200">Action Step Today: </span>
              <span>{dailyTip.actionable_step}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guidelines..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
          />
        </div>
      </div>

      {/* Tips Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading guidelines...</div>
      ) : filteredTips.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">No guidelines matched your search criteria.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTips.map((tip) => (
            <Card key={tip.id} className="flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                    {getCategoryIcon(tip.category)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {tip.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{tip.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{tip.content}</p>

                <div className="p-3 bg-primary-50/50 rounded-xl border border-primary-100 text-xs">
                  <span className="font-semibold text-primary-950">Action Step: </span>
                  <span className="text-primary-800">{tip.actionable_step}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 italic">
                <strong>Why it works:</strong> {tip.scientific_rationale}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
