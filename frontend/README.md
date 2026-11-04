# Dhruva: Frontend Application

**National Innovation Challenge Project (Swasth & Samavesh Bharat)**  
**Version:** 2.0.0 (100% Software-Based Web Platform)  
**Framework:** React 18 / Vite / Tailwind CSS / Recharts / Lucide React / Axios

---

## Overview

The **Dhruva Frontend** is a modern, responsive web application designed for digital eye strain awareness and ergonomic prevention. It connects to the FastAPI backend service to provide:

1. **Screen Session Tracker:** Real-time in-app study/work monitoring with the HTML5 Page Visibility API.
2. **20-20-20 Break Reminders:** Interactive 20-second distant gaze countdown with gentle Web Audio API bell chimes.
3. **Ergonomic Distance Assistant:** Workstation distance verification with interactive SVG eye-to-screen schematics.
4. **7-Point Digital Eye Strain Survey:** Multi-step clinical self-assessment evaluating tear film dryness and ciliary fatigue.
5. **Analytics Cockpit:** Longitudinal Recharts visualizers for daily screen hours, break adherence rates, and health scores.
6. **Curated Guidelines:** Evidence-informed eye care habits and daily tips.

---

## Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
By default, the Vite dev server starts at:
- **Local Application URL:** [http://127.0.0.1:5173](http://127.0.0.1:5173)

### 3. Build for Production
```bash
npm run build
```
Generates optimized, minified production assets in `frontend/dist/`.

---

## Architecture & Integration

- **API Base URL:** `http://127.0.0.1:8000` (Managed via `src/services/api.js`).
- **Authentication:** JWT Bearer tokens stored in `localStorage` with automatic Authorization headers and 401 session expiration handling.
- **Synthesized Audio:** Native browser `AudioContext` (528 Hz Solfeggio harmony) requiring zero external audio file downloads.
