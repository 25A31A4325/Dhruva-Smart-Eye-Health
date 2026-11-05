import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: inject JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dhruva_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid looping if auth endpoint itself returned 401
      const isAuthEndpoint = error.config.url.includes('/api/v1/auth/login') || error.config.url.includes('/api/v1/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('dhruva_token');
        localStorage.removeItem('dhruva_user');
        window.dispatchEvent(new Event('dhruva:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Typed API Endpoints Interface
// ---------------------------------------------------------------------------

export const authAPI = {
  register: (data) => api.post('/api/v1/auth/register', data),
  login: (data) => api.post('/api/v1/auth/login', data),
  getMe: () => api.get('/api/v1/auth/me'),
  updatePreferences: (data) => api.put('/api/v1/auth/preferences', data),
};

export const sessionsAPI = {
  start: (data) => api.post('/api/v1/sessions/start', data),
  heartbeat: (data) => api.post('/api/v1/sessions/heartbeat', data),
  pauseResume: (data) => api.post('/api/v1/sessions/pause-resume', data),
  stop: (data) => api.post('/api/v1/sessions/stop', data),
  getHistory: (limit = 20) => api.get(`/api/v1/sessions/history?limit=${limit}`),
};

export const breaksAPI = {
  logPrompt: (data) => api.post('/api/v1/breaks/log-prompt', data),
  acknowledge: (data) => api.post('/api/v1/breaks/acknowledge', data),
  getHistory: (limit = 30) => api.get(`/api/v1/breaks/history?limit=${limit}`),
  getStats: () => api.get('/api/v1/breaks/stats'),
};

export const distanceAPI = {
  check: (data) => api.post('/api/v1/distance/check', data),
  getHistory: (limit = 20) => api.get(`/api/v1/distance/history?limit=${limit}`),
};

export const assessmentAPI = {
  getQuestions: () => api.get('/api/v1/assessment/questions'),
  submit: (data) => api.post('/api/v1/assessment/submit', data),
  getHistory: (limit = 10) => api.get(`/api/v1/assessment/history?limit=${limit}`),
};

export const tipsAPI = {
  getAll: () => api.get('/api/v1/tips'),
  getDaily: () => api.get('/api/v1/tips/daily'),
};

export const analyticsAPI = {
  getDailySummary: (date = null) => api.get(`/api/v1/analytics/daily-summary${date ? `?date=${date}` : ''}`),
  getWeeklyTrends: () => api.get('/api/v1/analytics/weekly-trends'),
  getMonthlyTrends: () => api.get('/api/v1/analytics/monthly-trends'),
};

export const cameraWellnessAPI = {
  saveSummary: (data) => api.post('/api/v1/camera-wellness/summary', data),
  getLatest: () => api.get('/api/v1/camera-wellness/latest'),
  getHistory: (limit = 20) => api.get(`/api/v1/camera-wellness/history?limit=${limit}`),
};

export default api;
