import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { NormalizedLandmark } from './types';
import { smoothLandmarks } from './poseMath';

class PoseDetectorEngine {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitializing: boolean = false;
  private initializationError: string | null = null;
  private previousLandmarks: NormalizedLandmark[] | null = null;
  private lastProcessedTimestamp: number = 0;

  public async initialize(): Promise<boolean> {
    if (this.poseLandmarker) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    this.initializationError = null;

    try {
      // Load wasm from CDN for MediaPipe Tasks Vision
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      // Load lightweight, fast pose landmarker task
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.45,
        minPosePresenceConfidence: 0.45,
        minTrackingConfidence: 0.45,
      });

      this.isInitializing = false;
      return true;
    } catch (err: any) {
      console.warn('Primary GPU PoseLandmarker init failed, attempting CPU fallback:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.4,
          minPosePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
        this.isInitializing = false;
        return true;
      } catch (fallbackErr: any) {
        console.error('All MediaPipe PoseLandmarker initializations failed:', fallbackErr);
        this.initializationError = fallbackErr.message || 'Failed to load pose estimation model';
        this.isInitializing = false;
        return false;
      }
    }
  }

  public detectPose(
    videoElement: HTMLVideoElement,
    timestamp: number
  ): NormalizedLandmark[] | null {
    if (!this.poseLandmarker) return null;
    if (videoElement.readyState < 2) return null; // HAVE_CURRENT_DATA

    // Guarantee monotonically increasing timestamps for MediaPipe VIDEO mode
    const currentTimestamp = Math.max(timestamp, this.lastProcessedTimestamp + 1);
    this.lastProcessedTimestamp = currentTimestamp;

    try {
      const result: PoseLandmarkerResult = this.poseLandmarker.detectForVideo(
        videoElement,
        currentTimestamp
      );

      if (result.landmarks && result.landmarks.length > 0 && result.landmarks[0].length > 0) {
        const rawLandmarks = result.landmarks[0].map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        }));

        // Apply EMA smoothing to reduce camera noise/jitter
        const smoothed = smoothLandmarks(rawLandmarks, this.previousLandmarks, 0.65);
        this.previousLandmarks = smoothed;
        return smoothed;
      }

      return null;
    } catch (err) {
      console.warn('Frame detection warning:', err);
      return null;
    }
  }

  public getError(): string | null {
    return this.initializationError;
  }

  public isReady(): boolean {
    return !!this.poseLandmarker;
  }

  public close(): void {
    if (this.poseLandmarker) {
      try {
        this.poseLandmarker.close();
      } catch (e) {
        console.warn('Error closing landmarker:', e);
      }
      this.poseLandmarker = null;
    }
    this.previousLandmarks = null;
    this.isInitializing = false;
  }
}

export const poseDetector = new PoseDetectorEngine();
