import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { sessionsAPI, breaksAPI } from '../services/api';
import { soundService } from '../services/sound';
import { useAuth } from './AuthContext';

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [activeSession, setActiveSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTabFocused, setIsTabFocused] = useState(true);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [currentBreakId, setCurrentBreakId] = useState(null);
  const [breakStreak, setBreakStreak] = useState(0);
  const [loading, setLoading] = useState(false);

  const heartbeatIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const lastHeartbeatTimeRef = useRef(Date.now());
  const activeSecondsAccumulatorRef = useRef(0);

  // 1. Page Visibility API Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsTabFocused(isVisible);
    };

    const handleFocus = () => setIsTabFocused(true);
    const handleBlur = () => setIsTabFocused(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // 2. High-Precision Local UI Display Timer
  useEffect(() => {
    if (activeSession && activeSession.status === 'ACTIVE') {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        if (isTabFocused) {
          activeSecondsAccumulatorRef.current += 1;
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeSession, isTabFocused]);

  // 3. Periodic Backend Heartbeat (Every 60 Seconds)
  useEffect(() => {
    if (activeSession && activeSession.status === 'ACTIVE') {
      heartbeatIntervalRef.current = setInterval(async () => {
        const delta = Math.max(1, activeSecondsAccumulatorRef.current);
        activeSecondsAccumulatorRef.current = 0;

        try {
          const res = await sessionsAPI.heartbeat({
            session_id: activeSession.id,
            active_seconds_delta: delta,
            is_window_focused: isTabFocused,
          });

          setActiveSession((prev) => ({
            ...prev,
            total_duration_seconds: res.data.total_duration_seconds,
            active_duration_seconds: res.data.active_duration_seconds,
          }));

          // Trigger 20-20-20 Break Modal if due
          if (res.data.is_break_due && !isBreakModalOpen) {
            triggerBreakReminder(activeSession.id);
          }
        } catch (err) {
          console.warn('Heartbeat synchronization notice:', err);
        }
      }, 60000); // 60 seconds
    } else {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    }

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [activeSession, isTabFocused, isBreakModalOpen]);

  // Trigger Break Reminder Modal & Sound
  const triggerBreakReminder = async (sessionId) => {
    try {
      soundService.playBreakChime();

      // Browser Notification if granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Dhruva 20-20-20 Eye Break', {
          body: 'Look at an object at least 20 feet away for 20 seconds to relax your ciliary muscles!',
          icon: '/favicon.svg',
        });
      }

      const res = await breaksAPI.logPrompt({
        session_id: sessionId,
        prompt_message: '20-20-20 Rule Reminder: Look 20 feet away for 20 seconds!',
      });

      setCurrentBreakId(res.data.id);
      setIsBreakModalOpen(true);
    } catch (err) {
      console.warn('Failed to log break prompt:', err);
      setIsBreakModalOpen(true);
    }
  };

  const startSession = async (notes = '') => {
    setLoading(true);
    try {
      const breakInterval = user?.preferences?.break_interval_minutes || 20;
      const res = await sessionsAPI.start({
        client_info: `Browser (${navigator.userAgent.slice(0, 50)})`,
        break_interval_minutes: breakInterval,
        notes,
      });

      setActiveSession(res.data);
      setElapsedSeconds(0);
      activeSecondsAccumulatorRef.current = 0;
      return { success: true, session: res.data };
    } catch (err) {
      console.warn('Backend unavailable, running local session:', err);
      const localSession = {
        id: `local_${Date.now()}`,
        status: 'ACTIVE',
        break_interval_minutes: user?.preferences?.break_interval_minutes || 20,
        total_duration_seconds: 0,
        active_duration_seconds: 0,
        started_at: new Date().toISOString(),
        notes: notes || 'Screen Monitoring Session',
      };
      setActiveSession(localSession);
      setElapsedSeconds(0);
      activeSecondsAccumulatorRef.current = 0;
      return { success: true, session: localSession };
    } finally {
      setLoading(false);
    }
  };

  const pauseResumeSession = async () => {
    if (!activeSession) return;
    const newAction = activeSession.status === 'ACTIVE' ? 'pause' : 'resume';
    setLoading(true);
    try {
      const res = await sessionsAPI.pauseResume({
        session_id: activeSession.id,
        action: newAction,
      });
      setActiveSession(res.data);
      return { success: true, status: res.data.status };
    } catch (err) {
      const updated = {
        ...activeSession,
        status: newAction === 'pause' ? 'PAUSED' : 'ACTIVE',
      };
      setActiveSession(updated);
      return { success: true, status: updated.status };
    } finally {
      setLoading(false);
    }
  };

  const stopSession = async (finalNotes = '') => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const res = await sessionsAPI.stop({
        session_id: activeSession.id,
        final_notes: finalNotes,
      });
      setActiveSession(null);
      setElapsedSeconds(0);
      activeSecondsAccumulatorRef.current = 0;
      return { success: true, session: res.data };
    } catch (err) {
      setActiveSession(null);
      setElapsedSeconds(0);
      activeSecondsAccumulatorRef.current = 0;
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeBreak = async (completed, elapsedSeconds = 20) => {
    if (!currentBreakId) {
      setIsBreakModalOpen(false);
      return;
    }
    try {
      await breaksAPI.acknowledge({
        break_id: currentBreakId,
        completed,
        elapsed_break_seconds: elapsedSeconds,
      });

      if (completed) {
        setBreakStreak((prev) => prev + 1);
      } else {
        setBreakStreak(0);
      }
    } catch (err) {
      console.warn('Failed to acknowledge break event:', err);
    } finally {
      setIsBreakModalOpen(false);
      setCurrentBreakId(null);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        activeSession,
        elapsedSeconds,
        isTabFocused,
        isBreakModalOpen,
        breakStreak,
        loading,
        startSession,
        pauseResumeSession,
        stopSession,
        triggerBreakReminder: () => activeSession && triggerBreakReminder(activeSession.id),
        acknowledgeBreak,
        closeBreakModal: () => setIsBreakModalOpen(false),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
