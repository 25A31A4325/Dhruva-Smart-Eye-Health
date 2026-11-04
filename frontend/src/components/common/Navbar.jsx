import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock, Menu, X, ShieldAlert, Sparkles, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';

export const Navbar = ({ onToggleMobileSidebar, isMobileSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { activeSession, elapsedSeconds, isTabFocused } = useSession();

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Toggle & Brand for Mobile */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
            aria-label="Toggle navigation"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-700 via-primary-600 to-primary-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-lg">Dhruva</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-primary-100 text-primary-700">
                  Swasth Bharat
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-600 font-medium leading-none">
                Smart Eye Health Monitoring
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Live Session Banner if Active */}
        {activeSession && (
          <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 bg-primary-50 border border-primary-200/80 rounded-full text-xs text-primary-800 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-primary-600"></div>
            <span className="font-medium">Active Session:</span>
            <span className="font-mono font-semibold text-primary-900 bg-white px-2 py-0.5 rounded-full border border-primary-200">
              {formatTimer(elapsedSeconds)}
            </span>
            {!isTabFocused && (
              <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-medium">
                Tab Inactive
              </span>
            )}
          </div>
        )}

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200/70">
            <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-200 text-primary-700 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">{user?.full_name || 'User'}</div>
              <div className="text-[11px] text-slate-600 leading-none truncate max-w-[130px]">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
