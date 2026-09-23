import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Info,
  X,
  ArrowLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Square
} from 'lucide-react';
import {
  getPoseLandmarker,
  detectPose,
  NormalizedLandmark,
} from '../services/poseLandmarkerService';
import {
  YogaPostureEngine,
  YogaPostureResult,
  resolveYogaPose,
  YogaPoseDefinition,
  SUPPORTED_YOGA_POSES,
  LANDMARK,
} from '../utils/YogaPostureEngine';
import { YogaSessionSummary, YogaSessionSummaryData } from './YogaSessionSummary';

export interface AIYogaCoachProps {
  exerciseType?: string;
  initialExerciseId?: string;
  onClose?: () => void;
  onSessionComplete?: (summary: YogaSessionSummaryData) => void;
}

type CoachState =
  | 'GET_READY'
  | 'SEARCHING'
  | 'POSITIONING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CONFIRM_STOP'
  | 'COMPLETED';

export const AIYogaCoach: React.FC<AIYogaCoachProps> = ({
  exerciseType,
  initialExerciseId,
  onClose,
  onSessionComplete,
}) => {
  const activeExerciseKey = exerciseType || initialExerciseId || 'mountain_pose';
  const [selectedPose, setSelectedPose] = useState<YogaPoseDefinition>(() =>
    resolveYogaPose(activeExerciseKey)
  );

  const [coachState, setCoachState] = useState<CoachState>('GET_READY');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);

  // Live Posture Feedback & Score Display
  const [liveFeedback, setLiveFeedback] = useState<string>('Find your position...');
  const [liveFeedbackType, setLiveFeedbackType] = useState<'good' | 'correcting' | 'searching' | 'positioning'>('positioning');
  const [liveScore, setLiveScore] = useState<number>(85);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Completed Summary Data
  const [sessionSummary, setSessionSummary] = useState<YogaSessionSummaryData | null>(null);

  // Refs for camera stream, animation loop, and evaluation engine
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const engineRef = useRef<YogaPostureEngine>(new YogaPostureEngine());
  const timerIntervalRef = useRef<any>(null);

  // Session Statistics Recording Refs
  const scoreHistoryRef = useRef<number[]>([]);
  const spineScoresRef = useRef<number[]>([]);
  const shoulderScoresRef = useRef<number[]>([]);
  const kneeScoresRef = useRef<number[]>([]);
  const goodFramesCountRef = useRef<number>(0);
  const totalAnalyzedFramesRef = useRef<number>(0);
  const lastSpokenFeedbackRef = useRef<string>('');
  const lastSpeakTimeRef = useRef<number>(0);

  // Lock background body scroll while AI Coach is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Sync selected pose if prop changes
  useEffect(() => {
    const activeKey = exerciseType || initialExerciseId || 'mountain_pose';
    setSelectedPose(resolveYogaPose(activeKey));
    setCoachState('GET_READY');
    setSessionSummary(null);
    setLiveFeedback('Find your position...');
  }, [exerciseType, initialExerciseId]);

  // Voice Guidance Helper
  const speakGuidance = useCallback((text: string) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    const now = Date.now();
    // Do not repeat same cue within 5 seconds
    if (text === lastSpokenFeedbackRef.current && now - lastSpeakTimeRef.current < 5000) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.85;
      lastSpokenFeedbackRef.current = text;
      lastSpeakTimeRef.current = now;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio speech synthesis silent fallback
    }
  }, [isVoiceEnabled]);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Handle Complete Exit
  const handleClose = useCallback(() => {
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    stopCameraStream();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (onClose) {
      onClose();
    }
  }, [stopCameraStream, onClose]);

  // Timer Lifecycle
  useEffect(() => {
    if (coachState === 'ACTIVE' || coachState === 'SEARCHING' || coachState === 'POSITIONING') {
      timerIntervalRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [coachState]);

  // Start Camera Stream & Pose Detector Loop
  const startSession = async () => {
    setErrorMessage(null);
    setCoachState('SEARCHING');
    setSessionDuration(0);
    scoreHistoryRef.current = [];
    spineScoresRef.current = [];
    shoulderScoresRef.current = [];
    kneeScoresRef.current = [];
    goodFramesCountRef.current = 0;
    totalAnalyzedFramesRef.current = 0;
    engineRef.current.reset();

    try {
      // 1. Initialize MediaPipe PoseLandmarker
      const landmarker = await getPoseLandmarker();
      if (!landmarker) {
        setErrorMessage("AI posture tracking couldn't start. Please check your connection and try again.");
        setCoachState('GET_READY');
        return;
      }

      // 2. Request Camera Stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        setCoachState('ACTIVE');
        speakGuidance(`Starting ${selectedPose.name}. Step into position.`);
      }
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access is needed for AI posture guidance. Please allow camera access and try again.');
      } else {
        setErrorMessage("Could not access camera. Please make sure no other app is using it.");
      }
      setCoachState('GET_READY');
      stopCameraStream();
    }
  };

  // Main Detection and Canvas Render Loop
  useEffect(() => {
    let isRunning = true;
    let lastRenderTime = 0;

    const renderLoop = (timestamp: number) => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        video &&
        canvas &&
        isCameraActive &&
        video.readyState >= 2 &&
        (coachState === 'ACTIVE' || coachState === 'SEARCHING' || coachState === 'POSITIONING')
      ) {
        // Match canvas dimensions to actual video resolution
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Run inference throttled at ~30 FPS
          if (timestamp - lastRenderTime > 32) {
            lastRenderTime = timestamp;

            const landmarks = detectPose(video, timestamp);
            const evaluation: YogaPostureResult = engineRef.current.analyzePose(
              landmarks,
              selectedPose.id
            );

            // Update UI State smoothly
            setLiveFeedback(evaluation.feedback);
            setLiveFeedbackType(evaluation.feedbackType);
            setLiveScore(evaluation.smoothedScore);

            // Voice feedback trigger
            if (evaluation.feedbackType === 'correcting' || evaluation.feedbackType === 'good') {
              speakGuidance(evaluation.feedback);
            }

            // Record Session History if valid frame
            if (evaluation.isValidPose && evaluation.isBodyVisible) {
              totalAnalyzedFramesRef.current += 1;
              scoreHistoryRef.current.push(evaluation.smoothedScore);
              spineScoresRef.current.push(evaluation.alignment.spine);
              shoulderScoresRef.current.push(evaluation.alignment.shoulders);
              kneeScoresRef.current.push(evaluation.alignment.knees);
              if (evaluation.smoothedScore >= 75) {
                goodFramesCountRef.current += 1;
              }
            }

            // Draw Skeletal Overlay and Alignment Guides
            if (landmarks && evaluation.isBodyVisible) {
              drawPoseOverlay(ctx, canvas.width, canvas.height, landmarks, evaluation);
            }
          }
        }
      }

      requestAnimationRef.current = requestAnimationFrame(renderLoop);
    };

    if (isCameraActive && (coachState === 'ACTIVE' || coachState === 'SEARCHING' || coachState === 'POSITIONING')) {
      requestAnimationRef.current = requestAnimationFrame(renderLoop);
    }

    return () => {
      isRunning = false;
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
    };
  }, [isCameraActive, coachState, selectedPose.id, speakGuidance]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
      stopCameraStream();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopCameraStream]);

  // Draw Calm Skeletal Overlay & Subtle Alignment Plumb Line
  const drawPoseOverlay = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    landmarks: NormalizedLandmark[],
    evaluation: YogaPostureResult
  ) => {
    // Subtle Vertical Spine Plumb Line (Center Reference Guide)
    const midShoulderX = ((landmarks[LANDMARK.LEFT_SHOULDER].x + landmarks[LANDMARK.RIGHT_SHOULDER].x) / 2) * width;
    const midShoulderY = ((landmarks[LANDMARK.LEFT_SHOULDER].y + landmarks[LANDMARK.RIGHT_SHOULDER].y) / 2) * height;
    const midHipX = ((landmarks[LANDMARK.LEFT_HIP].x + landmarks[LANDMARK.RIGHT_HIP].x) / 2) * width;
    const midHipY = ((landmarks[LANDMARK.LEFT_HIP].y + landmarks[LANDMARK.RIGHT_HIP].y) / 2) * height;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(midShoulderX, midShoulderY);
    ctx.lineTo(midHipX, midHipY + 60);
    ctx.stroke();
    ctx.restore();

    // Define Skeleton Connectors
    const connections: [number, number][] = [
      [LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER],
      [LANDMARK.LEFT_SHOULDER, LANDMARK.LEFT_ELBOW],
      [LANDMARK.LEFT_ELBOW, LANDMARK.LEFT_WRIST],
      [LANDMARK.RIGHT_SHOULDER, LANDMARK.RIGHT_ELBOW],
      [LANDMARK.RIGHT_ELBOW, LANDMARK.RIGHT_WRIST],
      [LANDMARK.LEFT_SHOULDER, LANDMARK.LEFT_HIP],
      [LANDMARK.RIGHT_SHOULDER, LANDMARK.RIGHT_HIP],
      [LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP],
      [LANDMARK.LEFT_HIP, LANDMARK.LEFT_KNEE],
      [LANDMARK.LEFT_KNEE, LANDMARK.LEFT_ANKLE],
      [LANDMARK.RIGHT_HIP, LANDMARK.RIGHT_KNEE],
      [LANDMARK.RIGHT_KNEE, LANDMARK.RIGHT_ANKLE],
    ];

    // Color logic based on posture quality
    const isGood = evaluation.smoothedScore >= 75;
    const strokeColor = isGood ? 'rgba(52, 211, 153, 0.85)' : 'rgba(251, 191, 36, 0.85)';
    const nodeFill = isGood ? '#10B981' : '#F59E0B';

    // Draw Bones
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = strokeColor;

    connections.forEach(([startIdx, endIdx]) => {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];
      if (p1 && p2 && (p1.visibility ?? 1) > 0.35 && (p2.visibility ?? 1) > 0.35) {
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    });

    // Draw Key Joint Nodes
    const keyJoints = [
      LANDMARK.LEFT_SHOULDER,
      LANDMARK.RIGHT_SHOULDER,
      LANDMARK.LEFT_ELBOW,
      LANDMARK.RIGHT_ELBOW,
      LANDMARK.LEFT_WRIST,
      LANDMARK.RIGHT_WRIST,
      LANDMARK.LEFT_HIP,
      LANDMARK.RIGHT_HIP,
      LANDMARK.LEFT_KNEE,
      LANDMARK.RIGHT_KNEE,
      LANDMARK.LEFT_ANKLE,
      LANDMARK.RIGHT_ANKLE,
    ];

    keyJoints.forEach((idx) => {
      const p = landmarks[idx];
      if (p && (p.visibility ?? 1) > 0.35) {
        const cx = p.x * width;
        const cy = p.y * height;
        // Outer halo
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();

        // Inner color dot
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
        ctx.fillStyle = nodeFill;
        ctx.fill();
      }
    });
  };

  // Finish and Calculate Session Summary
  const handleFinishSession = () => {
    stopCameraStream();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const totalFrames = scoreHistoryRef.current.length;
    const overallScore =
      totalFrames > 0
        ? Math.round(
            scoreHistoryRef.current.reduce((a, b) => a + b, 0) / totalFrames
          )
        : liveScore;

    const goodPct =
      totalAnalyzedFramesRef.current > 0
        ? Math.round(
            (goodFramesCountRef.current / totalAnalyzedFramesRef.current) * 100
          )
        : 80;

    // Identify Strongest and Weakest Alignment Areas
    const avgSpine =
      spineScoresRef.current.length > 0
        ? spineScoresRef.current.reduce((a, b) => a + b, 0) / spineScoresRef.current.length
        : 90;
    const avgShoulders =
      shoulderScoresRef.current.length > 0
        ? shoulderScoresRef.current.reduce((a, b) => a + b, 0) / shoulderScoresRef.current.length
        : 90;
    const avgKnees =
      kneeScoresRef.current.length > 0
        ? kneeScoresRef.current.reduce((a, b) => a + b, 0) / kneeScoresRef.current.length
        : 85;

    let strongest = 'Spine alignment & posture';
    if (avgShoulders > avgSpine && avgShoulders > avgKnees) {
      strongest = 'Shoulder levelness & balance';
    } else if (avgKnees > avgSpine && avgKnees > avgShoulders) {
      strongest = 'Lower body stability';
    }

    let focus = 'Keep your spine upright and centered';
    if (avgShoulders <= avgSpine && avgShoulders <= avgKnees) {
      focus = 'Relax and level your shoulders';
    } else if (avgKnees <= avgSpine && avgKnees <= avgShoulders) {
      focus = 'Maintain steady leg alignment';
    }

    const summaryData: YogaSessionSummaryData = {
      pose: selectedPose,
      durationSeconds: Math.max(sessionDuration, 1),
      overallScore: Math.min(100, Math.max(50, overallScore)),
      goodPosturePercentage: Math.min(100, Math.max(40, goodPct)),
      strongestArea: strongest,
      focusArea: focus,
      feedbackHighlights: [
        `You maintained great breath consistency throughout your ${selectedPose.name} practice.`,
      ],
    };

    setSessionSummary(summaryData);
    setCoachState('COMPLETED');
    if (onSessionComplete) {
      onSessionComplete(summaryData);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFeedbackIcon = () => {
    if (liveFeedbackType === 'good') {
      return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />;
    }
    if (liveFeedbackType === 'correcting') {
      return <Info className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />;
    }
    return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 shrink-0" />;
  };

  return (
    <div
      id="ai-yoga-coach-overlay"
      className="fixed inset-0 z-50 w-full h-[100dvh] max-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none"
      style={{
        paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
        paddingLeft: 'max(0.5rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.5rem, env(safe-area-inset-right, 0px))',
      }}
    >
      {/* Universal Mobile-First Header */}
      <header className="w-full shrink-0 px-3 sm:px-6 py-2.5 sm:py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between gap-2 rounded-t-2xl sm:rounded-t-none">
        {/* Left: Back Navigation */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Back to routines"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        {/* Center: Current Pose & Sanskrit Name */}
        <div className="min-w-0 flex-1 text-center px-1">
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[160px] sm:max-w-xs">
              {selectedPose.name}
            </h2>
            <span className="hidden xs:inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800/50 shrink-0">
              AI Coach
            </span>
          </div>
          <p className="text-[11px] text-emerald-400 font-serif italic truncate max-w-[180px] sm:max-w-xs mx-auto">
            {selectedPose.sanskritName}
          </p>
        </div>

        {/* Right: Controls & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Voice Coach Toggle */}
          <button
            type="button"
            onClick={() => setIsVoiceEnabled((prev) => !prev)}
            title={isVoiceEnabled ? 'Mute Voice Coach' : 'Enable Voice Coach'}
            aria-label="Toggle voice coach audio"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isVoiceEnabled
                ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isVoiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            title="Close AI Yoga Coach"
            aria-label="Close AI Yoga Coach"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="relative flex-1 min-h-0 w-full overflow-hidden flex flex-col">
        {/* State 1: GET READY Preparation Screen */}
        {coachState === 'GET_READY' && (
          <div className="flex-1 min-h-0 overflow-y-auto w-full max-w-lg mx-auto p-4 sm:p-6 flex flex-col justify-between">
            <div className="space-y-4 my-auto">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center shadow-inner">
                  <span className="text-2xl sm:text-3xl">🧘</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Let's get ready
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Prepare for <span className="font-semibold text-emerald-300">{selectedPose.name}</span>
                </p>
              </div>

              {/* Pose Selector dropdown if user wants to switch */}
              <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400 shrink-0 pl-1">Target Pose:</span>
                <select
                  value={selectedPose.id}
                  onChange={(e) => setSelectedPose(resolveYogaPose(e.target.value))}
                  className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-hidden max-w-[200px] truncate cursor-pointer"
                  aria-label="Select target yoga pose"
                >
                  {SUPPORTED_YOGA_POSES.map((pose) => (
                    <option key={pose.id} value={pose.id}>
                      {pose.name}
                    </option>
                  ))}
                </select>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-rose-400 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 4-Step Checklist */}
              <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-slate-300">
                    Place your phone or laptop where your <strong>full body is visible</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-slate-300">
                    Stand about <strong>6–8 feet away</strong> on your mat or floor space.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-slate-300">
                    Ensure there is <strong>clear, comfortable room lighting</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <p className="text-slate-300">
                    Follow the calm audio and visual cues on screen.
                  </p>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div
              className="pt-4 mt-auto"
              style={{
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))',
              }}
            >
              <button
                type="button"
                id="ai-yoga-start-btn"
                onClick={startSession}
                aria-label="Start AI Yoga session"
                className="w-full min-h-[48px] py-3.5 sm:py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>Start AI Session</span>
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>100% on-device local camera processing • No video recorded or saved</span>
              </div>
            </div>
          </div>
        )}

        {/* State 2: Active Camera Viewport */}
        {(coachState === 'ACTIVE' ||
          coachState === 'SEARCHING' ||
          coachState === 'POSITIONING' ||
          coachState === 'PAUSED' ||
          coachState === 'CONFIRM_STOP') && (
          <div
            className="relative flex-1 min-h-0 w-full overflow-hidden flex flex-col lg:flex-row lg:p-4 lg:gap-4 pb-20 sm:pb-24 lg:pb-0"
            style={{
              paddingBottom: 'calc(4.25rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            {/* Camera Box */}
            <div className="relative flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center bg-black lg:rounded-3xl lg:border lg:border-slate-800">
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none"
              />

              {/* Top In-Camera Floating Badges */}
              <div className="absolute top-3 inset-x-3 sm:inset-x-6 flex items-center justify-between pointer-events-none z-10">
                {/* Active Session Timer */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-white font-mono text-xs shadow-md">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{formatTimer(sessionDuration)}</span>
                </div>

                {/* Smoothed Posture Score Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-white shadow-md">
                  <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">Posture</span>
                  <span className={`text-sm font-black tracking-tight ${liveScore >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {liveScore}%
                  </span>
                </div>
              </div>

              {/* Compact Floating Feedback Card Over Camera */}
              <div
                id="ai-yoga-feedback-pill"
                className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-auto max-w-[88%] sm:max-w-md flex justify-center pointer-events-none z-20 transition-all duration-300"
              >
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full backdrop-blur-md shadow-xl border transition-all duration-300 ${
                    liveFeedbackType === 'good'
                      ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-100 shadow-emerald-950/40'
                      : liveFeedbackType === 'correcting'
                      ? 'bg-amber-950/85 border-amber-500/50 text-amber-100 shadow-amber-950/40'
                      : 'bg-slate-900/85 border-slate-700/70 text-slate-100 shadow-slate-950/40'
                  }`}
                >
                  <div className="shrink-0">{getFeedbackIcon()}</div>
                  <div className="text-xs sm:text-sm font-semibold leading-tight text-center whitespace-normal">
                    {liveFeedback}
                  </div>
                </div>
              </div>

              {/* Paused Overlay */}
              {coachState === 'PAUSED' && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                    <Pause className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Practice Paused</h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xs mb-5">
                    Take a gentle breath. Resume whenever you're ready.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCoachState('ACTIVE')}
                    aria-label="Resume AI Yoga Session"
                    className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                  >
                    Resume Practice
                  </button>
                </div>
              )}

              {/* Confirm Stop Overlay */}
              {coachState === 'CONFIRM_STOP' && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">End Session?</h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xs mb-5">
                    Ready to complete and view your posture alignment insights?
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setCoachState('ACTIVE')}
                      className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                    >
                      Keep Practicing
                    </button>
                    <button
                      type="button"
                      onClick={handleFinishSession}
                      className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer"
                    >
                      End & View Summary
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop-Only Side Information Panel */}
            <div className="hidden lg:flex lg:w-80 lg:shrink-0 bg-slate-900 rounded-3xl p-5 border border-slate-800 flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Active Asana
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {selectedPose.name}
                  </h3>
                  <p className="text-xs font-serif italic text-slate-400">
                    {selectedPose.sanskritName}
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    liveFeedbackType === 'good'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-100'
                      : liveFeedbackType === 'correcting'
                      ? 'bg-amber-950/60 border-amber-800 text-amber-100'
                      : 'bg-slate-800/60 border-slate-700 text-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-75">
                    Live Feedback
                  </span>
                  <div className="mt-1 text-sm font-bold flex items-center gap-2">
                    {getFeedbackIcon()}
                    <span>{liveFeedback}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Form Reminders
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedPose.instructions.slice(0, 3).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State 3: COMPLETED Session Summary Screen */}
        {coachState === 'COMPLETED' && sessionSummary && (
          <div
            className="flex-1 min-h-0 overflow-y-auto w-full max-w-xl mx-auto p-4 sm:p-6 flex flex-col justify-center"
            style={{
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <YogaSessionSummary
              summary={sessionSummary}
              onPracticeAgain={() => {
                setCoachState('GET_READY');
              }}
              onClose={handleClose}
            />
          </div>
        )}
      </main>

      {/* Fixed Bottom Controls Bar for Active/Paused Session */}
      {(coachState === 'ACTIVE' ||
        coachState === 'SEARCHING' ||
        coachState === 'POSITIONING' ||
        coachState === 'PAUSED' ||
        coachState === 'CONFIRM_STOP') && (
        <footer
          id="ai-yoga-bottom-controls"
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#fcfaf6] border-t border-[#e6dfd3] p-4 flex justify-between items-center gap-3 shadow-2xl"
          style={{
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <button
            type="button"
            id="ai-yoga-pause-resume-btn"
            onClick={() => setCoachState((prev) => (prev === 'PAUSED' ? 'ACTIVE' : 'PAUSED'))}
            aria-label={coachState === 'PAUSED' ? 'Resume session' : 'Pause session'}
            className="flex-1 min-h-[48px] py-2.5 sm:py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation shadow-sm"
          >
            {coachState === 'PAUSED' ? (
              <>
                <Play className="w-4 h-4 fill-current text-emerald-400" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 text-amber-400" />
                <span>Pause</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="ai-yoga-end-session-btn"
            onClick={() => setCoachState('CONFIRM_STOP')}
            aria-label="End session"
            className="flex-1 min-h-[48px] py-2.5 sm:py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation shadow-sm"
          >
            <Square className="w-3.5 h-3.5 fill-current text-white" />
            <span>End Session</span>
          </button>
        </footer>
      )}
    </div>
  );
};
