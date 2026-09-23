import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';

export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

let poseLandmarkerInstance: PoseLandmarker | null = null;
let isInitializing = false;
let initPromise: Promise<PoseLandmarker | null> | null = null;
let lastTimestamp = 0;

/**
 * Loads and returns the singleton MediaPipe PoseLandmarker instance.
 * Avoids redundant re-initialization and handles GPU/CPU fallbacks gracefully.
 */
export async function getPoseLandmarker(): Promise<PoseLandmarker | null> {
  if (poseLandmarkerInstance) {
    return poseLandmarkerInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      // Resolve WebAssembly runtime
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      // Attempt fast GPU delegate first
      try {
        poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.4,
          minPosePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
        isInitializing = false;
        return poseLandmarkerInstance;
      } catch (gpuError) {
        console.warn('PoseLandmarker GPU delegate init failed, falling back to CPU:', gpuError);
        poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.35,
          minPosePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
        isInitializing = false;
        return poseLandmarkerInstance;
      }
    } catch (err) {
      console.error('Failed to initialize MediaPipe PoseLandmarker:', err);
      isInitializing = false;
      initPromise = null;
      return null;
    }
  })();

  return initPromise;
}

/**
 * Runs pose detection on a video element frame.
 * Ensures strictly increasing monotonic timestamps for MediaPipe VIDEO mode.
 */
export function detectPose(
  videoElement: HTMLVideoElement,
  timestampMs: number
): NormalizedLandmark[] | null {
  if (!poseLandmarkerInstance || videoElement.readyState < 2) {
    return null;
  }

  // Ensure monotonically increasing timestamp required by MediaPipe
  const currentTimestamp = Math.max(timestampMs, lastTimestamp + 1);
  lastTimestamp = currentTimestamp;

  try {
    const result: PoseLandmarkerResult = poseLandmarkerInstance.detectForVideo(
      videoElement,
      currentTimestamp
    );

    if (result.landmarks && result.landmarks.length > 0 && result.landmarks[0].length > 0) {
      return result.landmarks[0].map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));
    }
    return null;
  } catch (err) {
    console.warn('Pose detection frame skipped:', err);
    return null;
  }
}

/**
 * Check if the model is currently ready for inference.
 */
export function isLandmarkerReady(): boolean {
  return poseLandmarkerInstance !== null;
}

/**
 * Releases references and frees MediaPipe resources when no longer needed.
 */
export function cleanupPoseLandmarker(): void {
  if (poseLandmarkerInstance) {
    try {
      poseLandmarkerInstance.close();
    } catch (err) {
      console.warn('Error during PoseLandmarker close:', err);
    }
    poseLandmarkerInstance = null;
  }
  initPromise = null;
  isInitializing = false;
  lastTimestamp = 0;
}
