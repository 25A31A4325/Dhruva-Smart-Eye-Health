import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  VideoOff,
  Eye,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  Maximize2,
  Sun,
  Activity,
  ArrowRight,
  Sparkles,
  Lock,
  StopCircle,
  Play
} from 'lucide-react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { cameraWellnessAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

const MEDICAL_DISCLAIMER =
  "This camera-based feature provides basic eye wellness awareness only. It is not a medical examination, eyesight test, or diagnostic tool. Camera estimates may be inaccurate. Consult a qualified eye-care professional if you have concerns about your vision.";

// Landmark indices for Eye Aspect Ratio (EAR)
// Left eye: vertical (159, 145), (158, 144); horizontal (33, 133)
// Right eye: vertical (386, 374), (385, 373); horizontal (362, 263)
const calculateEAR = (landmarks, v1, v2, v3, v4, h1, h2) => {
  const p_v1 = landmarks[v1];
  const p_v2 = landmarks[v2];
  const p_v3 = landmarks[v3];
  const p_v4 = landmarks[v4];
  const p_h1 = landmarks[h1];
  const p_h2 = landmarks[h2];

  const distV1 = Math.hypot(p_v1.x - p_v2.x, p_v1.y - p_v2.y);
  const distV2 = Math.hypot(p_v3.x - p_v4.x, p_v3.y - p_v4.y);
  const distH = Math.hypot(p_h1.x - p_h2.x, p_h1.y - p_h2.y);

  if (distH === 0) return 0.3;
  return (distV1 + distV2) / (2.0 * distH);
};

export const CameraWellnessPage = () => {
  // Consent & Permission States
  const [hasConsented, setHasConsented] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Real-time Detection States
  const [faceDetected, setFaceDetected] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [positionFeedback, setPositionFeedback] = useState("Position your face comfortably in front of the camera");
  const [positionStatus, setPositionStatus] = useState("OPTIMAL"); // "CLOSE", "FAR", "OPTIMAL", "OFF_CENTER"
  const [lightingCondition, setLightingCondition] = useState("Checking lighting...");
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Session Results State
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Refs for Video, Stream & Processing Loop
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Blink state tracking refs
  const eyeClosedRef = useRef(false);
  const lastBlinkTimeRef = useRef(0);
  const blinksRef = useRef(0);
  const faceVisibleFramesRef = useRef(0);
  const totalFramesRef = useRef(0);
  const positionHistoryRef = useRef([]);
  const lightingHistoryRef = useRef([]);

  // 1. Initialize MediaPipe FaceLandmarker
  const initFaceLandmarker = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;

    setModelLoading(true);
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        outputFaceBlendshapes: false,
        runningMode: "VIDEO",
        numFaces: 1
      });
      landmarkerRef.current = faceLandmarker;
      setModelLoading(false);
      return faceLandmarker;
    } catch (err) {
      console.error("Failed to load FaceLandmarker:", err);
      setModelLoading(false);
      throw new Error("Unable to initialize on-device vision model. Please check your internet connection.");
    }
  };

  // 2. Start Camera with explicit user gesture
  const startCamera = async () => {
    if (!hasConsented) {
      setCameraError("Please review and confirm the privacy consent agreement first.");
      return;
    }

    setCameraError(null);
    setCameraLoading(true);
    setSessionCompleted(false);
    setSavedSuccess(false);

    try {
      // Initialize vision model if not yet loaded
      const landmarker = await initFaceLandmarker();

      // Request webcam with NO audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false // STRICT PRIVACY: NEVER REQUEST MICROPHONE
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setIsCameraActive(true);
            setCameraLoading(false);

            // Reset session metrics
            blinksRef.current = 0;
            faceVisibleFramesRef.current = 0;
            totalFramesRef.current = 0;
            positionHistoryRef.current = [];
            lightingHistoryRef.current = [];
            setBlinkCount(0);
            setSessionSeconds(0);

            // Start session timer
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = setInterval(() => {
              setSessionSeconds((prev) => prev + 1);
            }, 1000);

            // Start continuous vision detection loop
            startDetectionLoop(landmarker);
          });
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera permission was denied. Please allow camera access in your browser settings to proceed.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("No webcam was detected on this device. Please connect a camera and try again.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError("Webcam is already in use by another application. Please close other camera apps and retry.");
      } else {
        setCameraError(err.message || "Could not access camera. Please check browser permissions.");
      }
    }
  };

  // 3. Stop Camera & Cleanup all tracks immediately
  const stopCamera = useCallback((finishSession = false) => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop and release all video media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setCameraLoading(false);

    if (finishSession) {
      compileSessionResults();
    }
  }, []);

  // 4. Guaranteed cleanup on component unmount
  useEffect(() => {
    return () => {
      stopCamera(false);
    };
  }, [stopCamera]);

  // 5. Vision Frame Processing Loop
  const startDetectionLoop = (landmarker) => {
    let lastVideoTime = -1;

    const processFrame = () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
        lastVideoTime = video.currentTime;
        totalFramesRef.current += 1;

        const startTimeMs = performance.now();
        const results = landmarker.detectForVideo(video, startTimeMs);

        // Analyze lighting by sampling frame brightness
        if (canvas) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Sample lighting every 15 frames for performance
            if (totalFramesRef.current % 15 === 0) {
              try {
                const sample = ctx.getImageData(0, 0, Math.min(canvas.width, 160), Math.min(canvas.height, 120));
                let totalBrightness = 0;
                for (let i = 0; i < sample.data.length; i += 16) {
                  const r = sample.data[i];
                  const g = sample.data[i + 1];
                  const b = sample.data[i + 2];
                  totalBrightness += 0.299 * r + 0.587 * g + 0.114 * b;
                }
                const avgBrightness = totalBrightness / (sample.data.length / 16);
                let lightDesc = "Adequate illumination";
                if (avgBrightness < 55) {
                  lightDesc = "Low ambient lighting (increase room light)";
                } else if (avgBrightness > 215) {
                  lightDesc = "High contrast / glare detected";
                }
                setLightingCondition(lightDesc);
                lightingHistoryRef.current.push(lightDesc);
              } catch {
                // Ignore canvas security errors
              }
            }
          }
        }

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          faceVisibleFramesRef.current += 1;
          setFaceDetected(true);

          const landmarks = results.faceLandmarks[0];

          // Compute Apparent Face Bounding Box for Framing
          let minX = 1, maxX = 0, minY = 1, maxY = 0;
          for (let i = 0; i < landmarks.length; i++) {
            const p = landmarks[i];
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          }

          const faceWidthRatio = maxX - minX;
          const centerX = (minX + maxX) / 2;

          // Non-medical relative positioning observations
          if (centerX < 0.25 || centerX > 0.75) {
            setPositionFeedback("Center your face comfortably in the camera frame");
            setPositionStatus("OFF_CENTER");
            positionHistoryRef.current.push("Off-Center");
          } else if (faceWidthRatio > 0.52) {
            setPositionFeedback("You appear relatively close to the camera. Move slightly back if comfortable.");
            setPositionStatus("CLOSE");
            positionHistoryRef.current.push("Relatively Close");
          } else if (faceWidthRatio < 0.18) {
            setPositionFeedback("Move slightly closer into the camera frame.");
            setPositionStatus("FAR");
            positionHistoryRef.current.push("Relatively Distant");
          } else {
            setPositionFeedback("Your face is comfortably positioned in the camera frame.");
            setPositionStatus("OPTIMAL");
            positionHistoryRef.current.push("Comfortably Positioned");
          }

          // Compute Eye Openness (Eye Aspect Ratio - EAR)
          const leftEAR = calculateEAR(landmarks, 159, 145, 158, 144, 33, 133);
          const rightEAR = calculateEAR(landmarks, 386, 374, 385, 373, 362, 263);
          const avgEAR = (leftEAR + rightEAR) / 2.0;

          const now = Date.now();
          // Blink threshold: EAR below ~0.19 represents eyelid closure
          const BLINK_THRESHOLD_CLOSE = 0.20;
          const BLINK_THRESHOLD_OPEN = 0.23;

          if (avgEAR < BLINK_THRESHOLD_CLOSE) {
            eyeClosedRef.current = true;
          } else if (avgEAR > BLINK_THRESHOLD_OPEN && eyeClosedRef.current) {
            // Check cooldown to avoid double counting
            if (now - lastBlinkTimeRef.current > 180) {
              blinksRef.current += 1;
              setBlinkCount(blinksRef.current);
              lastBlinkTimeRef.current = now;
            }
            eyeClosedRef.current = false;
          }
        } else {
          setFaceDetected(false);
          setPositionFeedback("Move into the camera frame and keep face steady");
          setPositionStatus("NOT_DETECTED");
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  // 6. Compile Non-Image Summary on Session Finish
  const compileSessionResults = () => {
    const duration = sessionSeconds || 1;
    const blinks = blinksRef.current;
    const bpm = duration > 0 ? Number(((blinks / duration) * 60).toFixed(1)) : 0;

    // Face visibility ratio
    const visibilityPercent = totalFramesRef.current > 0
      ? Math.round((faceVisibleFramesRef.current / totalFramesRef.current) * 100)
      : 100;

    let visibilitySummary = "Consistently detected throughout session";
    if (visibilityPercent < 50) {
      visibilitySummary = "Intermittently detected (frequently moved out of frame)";
    } else if (visibilityPercent < 80) {
      visibilitySummary = "Mostly detected with occasional movement";
    }

    // Relative Position Summary
    const positions = positionHistoryRef.current;
    const closeCount = positions.filter((p) => p === "Relatively Close").length;
    let posSummary = "Comfortable apparent distance and framing maintained";
    if (closeCount > positions.length * 0.4) {
      posSummary = "Appeared relatively close to camera for extended periods";
    }

    // Lighting summary
    const lightSummary = lightingCondition || "Adequate ambient lighting";

    const educationalTips = [
      "Conscious Blinking: Digital screens cause users to blink up to 50% less often. Practice intentional full blinks to lubricate corneal tissue.",
      "The 20-20-20 Habit: Every 20 minutes, gaze at an object 20 feet away for at least 20 seconds to release continuous ciliary muscle accommodation.",
      "Workstation Ergonomics: Position your display roughly at arm's length (50-70 cm) with the top bezel at or slightly below eye level."
    ];

    const summary = {
      session_duration_seconds: duration,
      approximate_blink_count: blinks,
      blinks_per_minute: bpm,
      face_visibility_summary: visibilitySummary,
      relative_position_summary: posSummary,
      lighting_summary: lightSummary,
      educational_tips: educationalTips,
      timestamp: new Date().toISOString()
    };

    setSessionSummary(summary);
    setSessionCompleted(true);
  };

  // 7. Save Non-Image Summary to Backend / LocalStorage
  const handleSaveSummary = async () => {
    if (!sessionSummary) return;
    setIsSaving(true);
    setCameraError(null);

    const payload = {
      session_duration_seconds: sessionSummary.session_duration_seconds,
      approximate_blink_count: sessionSummary.approximate_blink_count,
      blinks_per_minute: sessionSummary.blinks_per_minute,
      face_visibility_summary: sessionSummary.face_visibility_summary,
      relative_position_summary: sessionSummary.relative_position_summary,
      lighting_summary: sessionSummary.lighting_summary,
      user_consent: saveToProfile
    };

    try {
      if (saveToProfile) {
        await cameraWellnessAPI.saveSummary(payload);
      }

      // Always save locally for offline-resilience
      try {
        const existing = JSON.parse(localStorage.getItem('dhruva_camera_wellness_history') || '[]');
        const updated = [
          {
            id: `cw-${Date.now()}`,
            ...sessionSummary,
            user_consent: saveToProfile
          },
          ...existing
        ].slice(0, 30);
        localStorage.setItem('dhruva_camera_wellness_history', JSON.stringify(updated));
        localStorage.setItem('dhruva_camera_wellness_latest', JSON.stringify(sessionSummary));
      } catch (localErr) {
        console.warn("Could not save to localStorage:", localErr);
      }

      setSavedSuccess(true);
    } catch (err) {
      console.warn("Backend save failed, saved locally:", err);
      // Fallback save locally
      try {
        localStorage.setItem('dhruva_camera_wellness_latest', JSON.stringify(sessionSummary));
      } catch {}
      setSavedSuccess(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" className="text-[10px] font-bold uppercase tracking-wider">
              Computer Vision Awareness
            </Badge>
            <span className="text-xs text-slate-500 font-medium">In-Browser Local Processing</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            AI Camera-Based Eye Wellness Check
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Observe your natural blinking habits and workstation framing using on-device browser vision.
            Calculations run 100% inside your browser. No photos, videos, or recordings are ever taken or stored.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs hover:bg-slate-50 transition-all self-start md:self-auto"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Mandatory Medical Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-amber-950 block mb-0.5">Educational Wellness Notice</span>
          {MEDICAL_DISCLAIMER}
        </div>
      </div>

      {/* Privacy Guarantee Card */}
      <Card className="p-5 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/40 to-white">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>100% Private, Client-Side Architecture</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Zero Cloud Uploads
              </span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Camera frames are evaluated in real-time in your device's memory using MediaPipe Face Mesh.
              No video streams, photographs, facial templates, or biometric identifiers are ever uploaded,
              transmitted, or written to disk. Microphone access is strictly disabled.
            </p>
          </div>
        </div>
      </Card>

      {/* Error Alert if any */}
      {cameraError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-1">Camera Notice:</span>
            <span>{cameraError}</span>
          </div>
        </div>
      )}

      {/* Main Interactive Stage */}
      {!isCameraActive && !sessionCompleted && (
        <Card className="p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto border border-primary-100 shadow-xs">
            <Camera className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Ready to Begin Your Wellness Check?</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              We recommend conducting a 1-to-2 minute session while reading or doing regular work.
              The tool will observe approximate blink pacing and relative screen positioning.
            </p>
          </div>

          {/* Consent Checkbox */}
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left select-none">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={(e) => setHasConsented(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I agree to enable my webcam for this local in-browser session. I understand this is for basic wellness awareness and is not a clinical eye exam.
              </span>
            </label>
          </div>

          {/* Start Button */}
          <div className="pt-2">
            <button
              onClick={startCamera}
              disabled={!hasConsented || cameraLoading || modelLoading}
              className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all ${
                hasConsented && !cameraLoading && !modelLoading
                  ? 'bg-primary-600 hover:bg-primary-700 text-white hover:shadow-lg active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {cameraLoading || modelLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{modelLoading ? 'Loading AI Model...' : 'Accessing Camera...'}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Camera Wellness Check</span>
                </>
              )}
            </button>
            {!hasConsented && (
              <p className="text-[11px] text-slate-500 mt-2">
                Check the consent box above to activate the camera.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Active Camera Viewport */}
      {isCameraActive && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Preview Box */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-video border-2 border-slate-200 shadow-lg flex items-center justify-center">
              {/* HTML5 Video element */}
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100" // Mirrored for natural user view
              />

              {/* Hidden off-screen canvas for frame pixel analysis */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Live Overlay Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-full bg-rose-600/90 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span>Camera Active (Local Only)</span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-slate-900/80 text-white text-[11px] font-mono shadow-md backdrop-blur-xs">
                  {Math.floor(sessionSeconds / 60)}:{String(sessionSeconds % 60).padStart(2, '0')}
                </div>
              </div>

              {/* Real-time Framing Guide Box */}
              <div className="absolute inset-8 pointer-events-none border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                  Ergonomic Framing Guide
                </span>
              </div>

              {/* Face Status Pill */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md shadow-md ${
                  faceDetected ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/30' : 'bg-amber-900/80 text-amber-200 border border-amber-500/30'
                }`}>
                  {faceDetected ? '✓ Face Detected' : '⚠️ Move into camera frame'}
                </div>

                <div className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-900/80 text-primary-300 border border-slate-700/50 backdrop-blur-md shadow-md">
                  Approx Blinks: {blinkCount}
                </div>
              </div>
            </div>

            {/* Stop / Finish Controls */}
            <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs text-slate-500">
                Maintain your natural posture. Complete the check whenever you are ready.
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => stopCamera(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1.5"
                >
                  <VideoOff className="w-4 h-4 text-slate-500" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={() => stopCamera(true)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Finish & View Results</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Diagnostics Sidebar */}
          <div className="space-y-4">
            {/* Real-time Blink Tally */}
            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Approximate Blinks</span>
                <Eye className="w-4 h-4 text-primary-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">{blinkCount}</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Estimated rate: {sessionSeconds > 5 ? Math.round((blinkCount / sessionSeconds) * 60) : 0} blinks/min
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 text-[10px] text-slate-500 leading-relaxed border border-slate-100">
                Note: Blink counts are approximate estimates. Lighting, eyeglasses, and head angle may affect accuracy.
              </div>
            </Card>

            {/* Relative Positioning Observation */}
            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Framing Observation</span>
                <Maximize2 className="w-4 h-4 text-primary-600" />
              </div>
              <div className="text-xs font-bold text-slate-900">
                {positionStatus === "OPTIMAL" && <span className="text-emerald-700">Comfortable Framing</span>}
                {positionStatus === "CLOSE" && <span className="text-amber-700">Relatively Close to Camera</span>}
                {positionStatus === "FAR" && <span className="text-amber-700">Relatively Distant</span>}
                {positionStatus === "OFF_CENTER" && <span className="text-slate-700">Off-Center</span>}
                {positionStatus === "NOT_DETECTED" && <span className="text-slate-500">Waiting for face...</span>}
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                {positionFeedback}
              </p>
              <div className="mt-3 text-[10px] text-slate-500 italic">
                *Apparent camera framing only. Not a physical centimetre measurement.
              </div>
            </Card>

            {/* Ambient Lighting Observation */}
            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ambient Illumination</span>
                <Sun className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xs font-bold text-slate-800">{lightingCondition}</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Balanced workstation lighting prevents glare and ocular muscle fatigue.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Completed Session Results */}
      {sessionCompleted && sessionSummary && (
        <div className="space-y-6">
          <Card className="p-6 md:p-8 space-y-6 border-2 border-primary-100 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <Badge variant="emerald" className="text-[10px] font-bold uppercase mb-1">
                  Check Completed
                </Badge>
                <h3 className="text-xl font-black text-slate-900">Your Eye Wellness Observations</h3>
                <span className="text-xs text-slate-500">
                  Session Duration: {sessionSummary.session_duration_seconds} seconds
                </span>
              </div>

              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Start Another Check</span>
              </button>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Approximate Blink Count */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Approximate Blinks
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {sessionSummary.approximate_blink_count}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  ~{sessionSummary.blinks_per_minute} blinks/min
                </span>
              </div>

              {/* Face Visibility */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Face Visibility
                </span>
                <span className="text-sm font-bold text-slate-800 block leading-tight">
                  {sessionSummary.face_visibility_summary}
                </span>
                <span className="text-[11px] text-emerald-600 block mt-1">
                  ✓ In-Frame Detection
                </span>
              </div>

              {/* Relative Position */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Relative Positioning
                </span>
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  {sessionSummary.relative_position_summary}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Non-calibrated estimate
                </span>
              </div>

              {/* Lighting */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Lighting Condition
                </span>
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  {sessionSummary.lighting_summary}
                </span>
                <span className="text-[10px] text-amber-600 block mt-1">
                  Ambient observation
                </span>
              </div>
            </div>

            {/* Evidence-Based Educational Comfort Tips */}
            <div className="p-5 rounded-2xl bg-primary-50/50 border border-primary-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span>Screen-Comfort Recommendations for Your Next Work Block</span>
              </h4>
              <ul className="space-y-2">
                {sessionSummary.educational_tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0"></span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Save Non-Image Summary Section */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-900">
                    Save non-image wellness summary to my profile
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6">
                  Only non-image metrics (approximate blink count and framing note) will be stored. Zero images or videos are ever uploaded or saved.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {savedSuccess ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Summary Saved</span>
                  </span>
                ) : (
                  <button
                    onClick={handleSaveSummary}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-xs disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save to Profile'}
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
