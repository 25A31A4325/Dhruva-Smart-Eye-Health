import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  Maximize2,
  ClipboardCheck,
  Lightbulb,
  BarChart3,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/session', label: 'Session Tracker', icon: Clock, badge: 'Live' },
  { path: '/distance', label: 'Distance Awareness', icon: Maximize2 },
  { path: '/assessment', label: 'Eye Strain Survey', icon: ClipboardCheck },
  { path: '/tips', label: 'Eye Care Guidelines', icon: Lightbulb },
  { path: '/analytics', label: 'Reports & Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings & Profile', icon: Settings },
];

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5">
          {/* Brand Heading */}
          <div className="flex items-center gap-2.5 px-3 py-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Dhruva Health</div>
              <div className="text-[10px] text-slate-600 font-medium">Preventive Ergonomics</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Ergonomic Info Pill */}
        <div className="p-4 m-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/60 border border-primary-200/70">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-primary-900">20-20-20 Rule</div>
              <p className="text-[11px] text-primary-700 mt-0.5 leading-relaxed">
                Every 20 mins, look 20 feet away for 20 seconds to relax ciliary muscles.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
