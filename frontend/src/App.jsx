import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { Layout } from './components/common/Layout';
import { BreakReminderModal } from './components/session/BreakReminderModal';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SessionTrackerPage } from './pages/SessionTrackerPage';
import { DistanceAwarenessPage } from './pages/DistanceAwarenessPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { TipsPage } from './pages/TipsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

// Route Guard (Ensures instant loading)
const ProtectedRoute = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Loading Dhruva Health...</span>
        </div>
      </div>
    );
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          {/* Global 20-20-20 Break Modal */}
          <BreakReminderModal />

          <Routes>
            {/* Overview & Start Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/start" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Navigate to="/start" replace />} />

            {/* Application Workspace */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/session" element={<SessionTrackerPage />} />
              <Route path="/distance" element={<DistanceAwarenessPage />} />
              <Route path="/assessment" element={<AssessmentPage />} />
              <Route path="/tips" element={<TipsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
