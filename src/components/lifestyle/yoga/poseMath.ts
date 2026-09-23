import { NormalizedLandmark } from './types';

/**
 * Calculates angle ABC in degrees where B is the vertex.
 */
export function calculateAngle(
  pointA: NormalizedLandmark,
  pointB: NormalizedLandmark,
  pointC: NormalizedLandmark
): number {
  const radians =
    Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
    Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle * 10) / 10;
}

/**
 * Calculates inclination angle of a line relative to the horizontal (0 deg = flat) or vertical (0 deg = straight up/down).
 */
export function calculateAxisDeviation(
  point1: NormalizedLandmark,
  point2: NormalizedLandmark,
  axis: 'horizontal' | 'vertical'
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  
  if (axis === 'horizontal') {
    // 0 degrees when dy = 0 (horizontal line)
    const angleRad = Math.atan2(Math.abs(dy), Math.abs(dx));
    return Math.round(((angleRad * 180) / Math.PI) * 10) / 10;
  } else {
    // 0 degrees when dx = 0 (vertical line)
    const angleRad = Math.atan2(Math.abs(dx), Math.abs(dy));
    return Math.round(((angleRad * 180) / Math.PI) * 10) / 10;
  }
}

/**
 * Calculates Euclidean distance between 2 normalized points.
 */
export function calculateDistance(
  p1: NormalizedLandmark,
  p2: NormalizedLandmark
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Checks if a set of landmark indices have sufficient visibility (confidence > 0.45).
 */
export function areLandmarksVisible(
  landmarks: NormalizedLandmark[],
  indices: number[],
  minConfidence = 0.45
): boolean {
  if (!landmarks || landmarks.length === 0) return false;
  for (const idx of indices) {
    const lm = landmarks[idx];
    if (!lm) return false;
    if (typeof lm.visibility === 'number' && lm.visibility < minConfidence) {
      return false;
    }
  }
  return true;
}

/**
 * Exponential Moving Average (EMA) smoothing for landmark coordinates to prevent jitter.
 */
export function smoothLandmarks(
  current: NormalizedLandmark[],
  previous: NormalizedLandmark[] | null,
  alpha = 0.65
): NormalizedLandmark[] {
  if (!previous || previous.length !== current.length) {
    return current;
  }
  return current.map((lm, i) => {
    const prev = previous[i];
    if (!prev) return lm;
    return {
      x: alpha * lm.x + (1 - alpha) * prev.x,
      y: alpha * lm.y + (1 - alpha) * prev.y,
      z: lm.z !== undefined && prev.z !== undefined ? alpha * lm.z + (1 - alpha) * prev.z : lm.z,
      visibility: lm.visibility,
    };
  });
}
