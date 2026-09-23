import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  Award,
  Clock,
  ArrowRight,
  Flame,
  UserCheck,
  Activity,
  Check,
  ChevronDown,
  Info,
  Maximize2,
  X
} from 'lucide-react';
import {
  YogaExercisePose,
  NormalizedLandmark,
  PostureEvaluationResult,
  YogaSessionSummaryData,
  BodyPartAlignmentStatus
} from './types';
import { YOGA_EXERCISE_POSES, getPoseById } from './poseRules';
import { poseDetector } from './poseDetector';
import { PoseEvaluator } from './poseEvaluator';
import { PoseCanvasOverlay } from './PoseCanvasOverlay';
import { JevanCareLoader } from '../../common/JevanCareLoader';

interface AIYogaCoachProps {
  initialExerciseId?: string;
  onClose?: () => void;
  onSessionComplete?: (summary: YogaSessionSummaryData) => void;
}

export const AIYogaCoach: React.FC<AIYogaCoachProps> = ({
  initialExerciseId = 'yr_1',
  onClose,
  onSessionComplete,
}) => {
  // Exercise Selection
  const [selectedPose, setSelectedPose] = useState<YogaExercisePose>(() =>
    getPoseById(initialExerciseId)
  );

  // Session State
  const [sessionState, setSessionState] = useState<'idle' | 'preparing' | 'active' | 'paused' | 'completed'>('idle');
  const [isBeginnerMode, setIsBeginnerMode] = useState<boolean>(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);

  // Camera & Device State
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 640, height: 480 });
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);

  // Live Metric Tracking
  const [completedReps, setCompletedReps] = useState<number>(0);
  const [holdTimeSeconds, setHoldTimeSeconds] = useState<number>(0);
  const [breathingCycles, setBreathingCycles] = useState<number>(0);
  const [elapsedSessionSeconds, setElapsedSessionSeconds] = useState<number>(0);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [evaluation, setEvaluation] = useState<PostureEvaluationResult | null>(null);
  const [sessionSummary, setSessionSummary] = useState<YogaSessionSummaryData | null>(null);

  // Mobile orientation detection
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastInferenceTimeRef = useRef<number>(0);
  const evaluatorRef = useRef<PoseEvaluator>(new PoseEvaluator());
  const landmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const lastSpokenFeedbackRef = useRef<string>('');
  const lastSpokenTimeRef = useRef<number>(0);

  // Check orientation for landscape recommendation
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth <= 768;
        const isPortrait = window.innerHeight > window.innerWidth;
        setIsPortraitMobile(isMobile && isPortrait);
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Update selected pose if prop changes
  useEffect(() => {
    if (initialExerciseId) {
      setSelectedPose(getPoseById(initialExerciseId));
    }
  }, [initialExerciseId]);

  // Voice Guidance synthesizer
  const speakFeedback = useCallback((text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const now = Date.now();
    // Throttle spoken messages to once every 4.5 seconds and only when text changes
    if (text === lastSpokenFeedbackRef.current && now - lastSpokenTimeRef.current < 6000) return;
    if (now - lastSpokenTimeRef.current < 4500) return;

    try {
      window.speechSynthesis.cancel(); // Cancel lingering utterance
      const cleanText = text.replace(/^[✦•\s]+/, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95; // Calm, steady pace
      utterance.pitch = 1.0;
      utterance.volume = 0.75;
      window.speechSynthesis.speak(utterance);
      lastSpokenFeedbackRef.current = text;
      lastSpokenTimeRef.current = now;
    } catch (e) {
      console.warn('Speech synthesis warning:', e);
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
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopCameraStream]);

  // Start Camera Stream
  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    setCameraError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or platform.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraFacing(facing);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const { videoWidth, videoHeight } = videoRef.current;
        if (videoWidth && videoHeight) {
          setVideoDimensions({ width: videoWidth, height: videoHeight });
        }
      }
      return true;
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied. Please allow camera permissions in your browser to use the AI Yoga Coach.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera was detected on this device.');
      } else {
        setCameraError(err.message || 'Unable to access camera.');
      }
      return false;
    }
  };

  // Launch Full AI Yoga Session
  const handleStartSession = async () => {
    setSessionState('preparing');
    setIsModelLoading(true);
    setCameraError(null);

    // 1. Initialize Pose Estimation Model
    const modelReady = await poseDetector.initialize();
    setIsModelLoading(false);
    if (!modelReady) {
      const err = poseDetector.getError();
      setCameraError(err || 'Failed to initialize AI pose detector.');
      setSessionState('idle');
      return;
    }

    // 2. Start Camera
    const cameraReady = await startCamera();
    if (!cameraReady) {
      setSessionState('idle');
      return;
    }

    // 3. Reset Session Counters
    setCompletedReps(0);
    setHoldTimeSeconds(0);
    setBreathingCycles(0);
    setElapsedSessionSeconds(0);
    setScoreHistory([]);
    evaluatorRef.current.reset();

    setSessionState('active');
    speakFeedback(`Starting ${selectedPose.name}. Step into the camera frame.`);
  };

  // Switch Front / Back Camera
  const handleToggleCamera = async () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    await startCamera(nextFacing);
  };

  // Finish Session & Compute Summary
  const handleFinishSession = useCallback(() => {
    stopCameraStream();
    setSessionState('completed');

    const avgScore =
      scoreHistory.length > 0
        ? Math.round(scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length)
        : 85;

    const consistency: 'Excellent' | 'Great' | 'Good' | 'Fair' =
      avgScore >= 88 ? 'Excellent' : avgScore >= 76 ? 'Great' : avgScore >= 65 ? 'Good' : 'Fair';

    const summary: YogaSessionSummaryData = {
      exerciseId: selectedPose.id,
      exerciseTitle: selectedPose.name,
      sanskritName: selectedPose.sanskritName,
      durationSeconds: elapsedSessionSeconds,
      averageScore: avgScore,
      repsCompleted: completedReps,
      targetReps: selectedPose.targetCount,
      holdTimeSeconds,
      breathingCycles,
      bestAlignment: avgScore >= 80 ? 'Spinal Verticality & Hip Stability' : 'Postural Intent',
      needsImprovement: avgScore < 85 ? 'Shoulder Relaxation & Knee Flexion' : 'Minimal - Maintained Strong Form',
      consistencyRating: consistency,
      completedAt: new Date().toISOString(),
    };

    setSessionSummary(summary);
    if (onSessionComplete) {
      onSessionComplete(summary);
    }
  }, [
    scoreHistory,
    selectedPose,
    elapsedSessionSeconds,
    completedReps,
    holdTimeSeconds,
    breathingCycles,
    onSessionComplete,
    stopCameraStream,
  ]);

  // Main Inference & Tracking Loop (15-30 FPS)
  useEffect(() => {
    if (sessionState !== 'active') return;

    let isRunning = true;

    const runInferenceLoop = (timestamp: number) => {
      if (!isRunning) return;

      // Throttle to ~24 FPS (every ~42ms) to maintain smooth UI and low battery/CPU usage
      if (timestamp - lastInferenceTimeRef.current >= 42) {
        lastInferenceTimeRef.current = timestamp;

        if (videoRef.current && videoRef.current.readyState >= 2) {
          const landmarks = poseDetector.detectPose(videoRef.current, timestamp);
          landmarksRef.current = landmarks;

          // Update video dimension if changed
          if (
            videoRef.current.videoWidth &&
            videoRef.current.videoWidth !== videoDimensions.width
          ) {
            setVideoDimensions({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });
          }

          // Evaluate posture against selected pose rules
          const evalResult = evaluatorRef.current.evaluate(
            landmarks,
            selectedPose,
            isBeginnerMode
          );
          setEvaluation(evalResult);

          if (evalResult.isBodyVisible) {
            // Track score
            setScoreHistory((prev) => [...prev.slice(-150), evalResult.overallScore]);

            // Voice feedback for key corrections
            if (evalResult.prioritizedFeedback) {
              speakFeedback(evalResult.prioritizedFeedback);
            }

            // Tracking progress
            if (selectedPose.trackingType === 'repetition' && evalResult.isRepetitionCompleted) {
              setCompletedReps((prev) => {
                const next = prev + 1;
                speakFeedback(`Repetition ${next} complete. Great work.`);
                if (next >= selectedPose.targetCount) {
                  handleFinishSession();
                }
                return next;
              });
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(runInferenceLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(runInferenceLoop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    sessionState,
    selectedPose,
    isBeginnerMode,
    videoDimensions.width,
    speakFeedback,
    handleFinishSession,
  ]);

  // Session Duration & Hold Timer Interval
  useEffect(() => {
    let interval: any = null;
    if (sessionState === 'active') {
      interval = setInterval(() => {
        setElapsedSessionSeconds((prev) => prev + 1);

        // For hold poses: increment hold time when posture is well aligned (score >= 70)
        if (selectedPose.trackingType === 'hold_time' && (evaluation?.overallScore || 0) >= 70) {
          setHoldTimeSeconds((prev) => {
            const next = prev + 1;
            if (next >= selectedPose.targetCount) {
              handleFinishSession();
            }
            return next;
          });
        }

        // For breathing cycles: increment every 6 seconds of steady breathing
        if (selectedPose.trackingType === 'breathing_cycles' && (evaluation?.overallScore || 0) >= 65) {
          setBreathingCycles((prev) => {
            if (elapsedSessionSeconds > 0 && elapsedSessionSeconds % 8 === 0) {
              const next = prev + 1;
              speakFeedback(`Breathing cycle ${next} complete.`);
              if (next >= selectedPose.targetCount) {
                handleFinishSession();
              }
              return next;
            }
            return prev;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionState, selectedPose, evaluation?.overallScore, elapsedSessionSeconds, handleFinishSession]);

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-stone-50 dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-700 shadow-xl overflow-hidden min-w-0 max-w-full">
      {/* 1. Header Banner & Safety Notification */}
      <div className="bg-gradient-to-r from-teal-950 via-emerald-950 to-slate-950 text-white p-5 sm:p-6 border-b border-teal-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center shrink-0 shadow-lg">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[10px] font-extrabold tracking-wider uppercase border border-teal-400/30">
                  AI Optical Guidance
                </span>
                <span className="text-[10px] text-teal-300/80 font-mono">100% Local Device Vision</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif-editorial italic text-white mt-0.5">
                AI Yoga Coach
              </h2>
              <p className="text-xs text-teal-100/80">
                Perform your yoga with real-time AI posture guidance and personalized alignment feedback.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                className="p-2 text-teal-200 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-all text-xs font-bold flex items-center gap-1"
                aria-label="Close AI Yoga Coach"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            )}
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="mt-4 p-2.5 rounded-xl bg-teal-900/40 border border-teal-600/30 text-[11px] text-teal-100 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-white">Wellness Notice:</strong> AI posture guidance is for general wellness and exercise support. It does not replace professional medical or yoga instruction. Stop exercising if you experience pain, dizziness, or discomfort.
          </p>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* =========================================================================
            STATE: IDLE / PRE-SESSION (Exercise Selection & Instructions)
            ========================================================================= */}
        {sessionState === 'idle' && (
          <div className="space-y-6">
            {/* Pose Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Select Yoga or Pranayama Exercise:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {YOGA_EXERCISE_POSES.map((pose) => {
                  const isSelected = selectedPose.id === pose.id;
                  return (
                    <button
                      key={pose.id}
                      type="button"
                      onClick={() => setSelectedPose(pose)}
                      className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden ${
                        isSelected
                          ? 'bg-teal-900 text-white border-teal-500 shadow-md ring-2 ring-teal-500/50'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-stone-200 dark:border-slate-700 hover:border-teal-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isSelected ? 'bg-teal-700 text-teal-100' : 'bg-stone-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {pose.category}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-300" />}
                      </div>
                      <h4 className="font-bold text-sm mt-2">{pose.name}</h4>
                      <p className={`text-xs font-serif-editorial italic mt-0.5 ${isSelected ? 'text-teal-200' : 'text-slate-500'}`}>
                        {pose.sanskritName}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-[11px]">
                        <Clock className="w-3.5 h-3.5 opacity-70" />
                        <span>
                          {pose.trackingType === 'repetition'
                            ? `${pose.targetCount} Reps`
                            : pose.trackingType === 'hold_time'
                            ? `${pose.targetCount}s Hold`
                            : `${pose.targetCount} Breath Cycles`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Exercise Detail & Guidance Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-stone-200 dark:border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-slate-700 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedPose.name}</span>
                    <span className="text-xs font-serif-editorial text-teal-600 dark:text-teal-400 font-normal">
                      ({selectedPose.sanskritName})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedPose.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Beginner Mode</span>
                  <button
                    type="button"
                    onClick={() => setIsBeginnerMode(!isBeginnerMode)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      isBeginnerMode ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    aria-label="Toggle Beginner Mode"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        isBeginnerMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Instructions & Alignment Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>How to Perform:</span>
                  </h5>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                    {selectedPose.keyInstructions.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>AI Posture Checkpoints:</span>
                  </h5>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                    {selectedPose.angleRules.map((rule, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                        <span><strong>{rule.name}:</strong> Target ~{rule.idealAngle}°</span>
                      </li>
                    ))}
                    {selectedPose.alignmentRules.map((rule, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                        <span><strong>{rule.name}:</strong> Level {rule.axis} plane</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Camera Error Message if any */}
              {cameraError && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{cameraError}</p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      Camera access is required for AI posture guidance. You can still use the normal yoga instructions without camera-based coaching.
                    </p>
                  </div>
                </div>
              )}

              {/* Start Session Action Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-between">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Camera preview will open only after clicking Start. Zero video data is saved.</span>
                </div>

                <button
                  type="button"
                  onClick={handleStartSession}
                  className="w-full sm:w-auto px-7 py-3.5 bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-teal-900/20 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 text-amber-300" />
                  <span>Start AI Yoga Session</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE: PREPARING (Model & Camera Initializing)
            ========================================================================= */}
        {sessionState === 'preparing' && (
          <div className="py-16 text-center space-y-4 bg-slate-950 rounded-2xl text-white p-8">
            <JevanCareLoader size="lg" color="emerald" label="Initializing AI Vision & Camera Sensor..." />
            <p className="text-xs text-slate-400 font-mono">
              Loading local MediaPipe pose estimation model • No video leaves your device
            </p>
          </div>
        )}

        {/* =========================================================================
            STATE: ACTIVE / PAUSED (Live Camera & AI Posture Feedback)
            ========================================================================= */}
        {(sessionState === 'active' || sessionState === 'paused') && (
          <div className="space-y-4">
            {/* Mobile Landscape Recommendation Banner */}
            {isPortraitMobile && selectedPose.recommendedView === 'full_body' && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
                <span>📱 For better full-body tracking, rotate your phone to landscape.</span>
                <button
                  type="button"
                  onClick={() => setIsPortraitMobile(false)}
                  className="text-amber-700 dark:text-amber-400 font-bold ml-2 text-[10px]"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Viewport Area: Video + Jevan Care Skeleton Canvas + HUD */}
            <div className="relative w-full aspect-4/3 sm:aspect-16/10 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border-2 border-teal-500/40 select-none">
              {/* 1. Live Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* 2. Jevan Care Aesthetic Pose Skeleton Canvas Overlay */}
              <PoseCanvasOverlay
                landmarks={landmarksRef.current}
                evaluation={evaluation}
                width={videoDimensions.width}
                height={videoDimensions.height}
                showSkeleton={showSkeleton}
              />

              {/* 3. Matrix & HUD Ambient Grid */}
              <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-teal-950/15 to-black/60" />

              {/* 4. Top HUD Overlay (Score Dial, Exercise Title, Voice/Skeleton toggles) */}
              <div className="absolute top-3 inset-x-3 sm:inset-x-5 flex items-start justify-between z-20 pointer-events-none">
                {/* Exercise Badge */}
                <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-teal-500/40 shadow-lg pointer-events-auto">
                  <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{selectedPose.name}</span>
                  </h4>
                  <span className="text-[10px] text-teal-300 font-serif-editorial italic">
                    {selectedPose.sanskritName}
                  </span>
                </div>

                {/* Live Posture Score Gauge */}
                <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-teal-500/50 shadow-xl flex items-center gap-3 pointer-events-auto">
                  <div className="text-right">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-teal-300 block">
                      Posture Score
                    </span>
                    <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                      {evaluation?.isBodyVisible ? `${evaluation.overallScore}%` : '--'}
                    </span>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 rounded-full shadow-md ${
                      !evaluation?.isBodyVisible
                        ? 'bg-slate-600'
                        : evaluation.overallScore >= 85
                        ? 'bg-emerald-400 shadow-emerald-400/50 animate-pulse'
                        : evaluation.overallScore >= 70
                        ? 'bg-amber-400 shadow-amber-400/50'
                        : 'bg-rose-500 shadow-rose-500/50'
                    }`}
                  />
                </div>
              </div>

              {/* 5. Center Guidance / Correction Banner (Single Prioritized Actionable Tip) */}
              <div className="absolute top-16 sm:top-20 inset-x-4 flex justify-center z-20 pointer-events-none">
                {evaluation?.prioritizedFeedback && (
                  <div
                    className={`px-4 py-2.5 rounded-xl backdrop-blur-md border shadow-2xl text-xs sm:text-sm font-bold tracking-wide transition-all max-w-md text-center ${
                      evaluation.feedbackType === 'success'
                        ? 'bg-emerald-950/85 text-emerald-200 border-emerald-500/60'
                        : evaluation.feedbackType === 'correction'
                        ? 'bg-amber-950/85 text-amber-200 border-amber-500/60'
                        : evaluation.feedbackType === 'warning'
                        ? 'bg-rose-950/85 text-rose-200 border-rose-500/60'
                        : 'bg-slate-900/85 text-teal-200 border-teal-500/50'
                    }`}
                  >
                    {evaluation.prioritizedFeedback}
                  </div>
                )}
              </div>

              {/* 6. Alignment Breakdown Cards (Spine, Shoulders, Arms, Hips/Knees) */}
              {evaluation?.isBodyVisible && (
                <div className="absolute bottom-16 sm:bottom-20 inset-x-3 sm:inset-x-5 flex flex-wrap gap-1.5 sm:gap-2 z-20 pointer-events-none">
                  {(Object.entries(evaluation.alignmentSummary) as [string, BodyPartAlignmentStatus][]).map(([part, statusObj]) => {
                    if (statusObj.status === 'not_visible') return null;
                    const isGood = statusObj.status === 'excellent' || statusObj.status === 'good';
                    return (
                      <div
                        key={part}
                        className={`px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] sm:text-xs font-semibold capitalize flex items-center gap-1.5 border shadow-md ${
                          isGood
                            ? 'bg-slate-900/80 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-950/85 text-rose-200 border-rose-500/50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isGood ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span>
                          {part}: <strong className="font-bold">{statusObj.status === 'excellent' ? 'Excellent' : statusObj.status === 'good' ? 'Good' : 'Needs Adjustment'}</strong>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 7. Bottom Action & Telemetry Control Bar */}
              <div className="absolute bottom-3 inset-x-3 sm:inset-x-5 flex items-center justify-between z-30 pointer-events-auto bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-teal-500/40 shadow-2xl">
                {/* Left: Rep / Time Metrics */}
                <div className="flex items-center gap-3 text-xs font-mono text-white">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-300" />
                    <span>{formatSeconds(elapsedSessionSeconds)}</span>
                  </div>

                  {selectedPose.trackingType === 'repetition' ? (
                    <span className="px-2 py-0.5 rounded-md bg-teal-900/80 text-teal-200 font-bold text-[11px]">
                      Reps: {completedReps} / {selectedPose.targetCount}
                    </span>
                  ) : selectedPose.trackingType === 'hold_time' ? (
                    <span className="px-2 py-0.5 rounded-md bg-teal-900/80 text-teal-200 font-bold text-[11px]">
                      Hold: {holdTimeSeconds}s / {selectedPose.targetCount}s
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-teal-900/80 text-teal-200 font-bold text-[11px]">
                      Cycles: {breathingCycles} / {selectedPose.targetCount}
                    </span>
                  )}
                </div>

                {/* Center: Pause / Finish Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSessionState(sessionState === 'active' ? 'paused' : 'active')}
                    className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-all text-xs font-bold flex items-center gap-1"
                    title={sessionState === 'active' ? 'Pause session' : 'Resume session'}
                  >
                    {sessionState === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleFinishSession}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Finish Session</span>
                  </button>
                </div>

                {/* Right: Audio & Camera Flip Toggles */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={`p-2 rounded-lg transition-all text-xs ${
                      isVoiceEnabled ? 'text-teal-300 hover:bg-teal-950' : 'text-slate-500 hover:bg-slate-800'
                    }`}
                    title={isVoiceEnabled ? 'Mute AI voice guidance' : 'Enable AI voice guidance'}
                  >
                    {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSkeleton(!showSkeleton)}
                    className={`p-2 rounded-lg transition-all text-xs ${
                      showSkeleton ? 'text-teal-300 hover:bg-teal-950' : 'text-slate-500 hover:bg-slate-800'
                    }`}
                    title="Toggle skeleton overlay"
                  >
                    <Activity className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-all text-xs"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE: COMPLETED (Comprehensive Session Summary)
            ========================================================================= */}
        {sessionState === 'completed' && sessionSummary && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-slate-700 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center mx-auto shadow-lg">
                <Award className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-serif-editorial italic">
                AI Yoga Session Complete
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {sessionSummary.exerciseTitle} • {sessionSummary.sanskritName}
              </p>
            </div>

            {/* Performance Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-stone-50 dark:bg-slate-900 p-4 rounded-2xl border border-stone-200 dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Duration</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white font-mono">
                  {formatSeconds(sessionSummary.durationSeconds)}
                </span>
              </div>

              <div className="bg-stone-50 dark:bg-slate-900 p-4 rounded-2xl border border-stone-200 dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Posture Score</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {sessionSummary.averageScore}%
                </span>
              </div>

              <div className="bg-stone-50 dark:bg-slate-900 p-4 rounded-2xl border border-stone-200 dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Activity Count</span>
                <span className="text-xl font-bold text-teal-600 dark:text-teal-400 font-mono">
                  {sessionSummary.repsCompleted > 0
                    ? `${sessionSummary.repsCompleted} Reps`
                    : sessionSummary.holdTimeSeconds > 0
                    ? `${sessionSummary.holdTimeSeconds}s Hold`
                    : `${sessionSummary.breathingCycles} Cycles`}
                </span>
              </div>

              <div className="bg-stone-50 dark:bg-slate-900 p-4 rounded-2xl border border-stone-200 dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Consistency</span>
                <span className="text-xl font-bold text-amber-500 font-serif-editorial italic">
                  {sessionSummary.consistencyRating}
                </span>
              </div>
            </div>

            {/* Posture Insights Breakdown */}
            <div className="bg-stone-50 dark:bg-slate-900 p-5 rounded-2xl border border-stone-200 dark:border-slate-700 space-y-3 text-xs">
              <h5 className="font-bold text-slate-800 dark:text-white">AI Postural Insights:</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">Best Alignment:</strong>
                    <p className="text-slate-500 dark:text-slate-400">{sessionSummary.bestAlignment}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">Areas to Refine:</strong>
                    <p className="text-slate-500 dark:text-slate-400">{sessionSummary.needsImprovement}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleStartSession}
                className="w-full sm:w-auto px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Again</span>
              </button>

              <button
                type="button"
                onClick={() => setSessionState('idle')}
                className="w-full sm:w-auto px-6 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition-all"
              >
                Select Another Exercise
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 border border-stone-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 font-bold text-xs rounded-xl transition-all"
                >
                  Back to Wellness & Home Care
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
