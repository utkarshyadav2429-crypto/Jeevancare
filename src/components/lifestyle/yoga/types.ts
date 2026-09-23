export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export type LandmarkName =
  | 'nose'
  | 'left_eye_inner'
  | 'left_eye'
  | 'left_eye_outer'
  | 'right_eye_inner'
  | 'right_eye'
  | 'right_eye_outer'
  | 'left_ear'
  | 'right_ear'
  | 'mouth_left'
  | 'mouth_right'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_elbow'
  | 'right_elbow'
  | 'left_wrist'
  | 'right_wrist'
  | 'left_pinky'
  | 'right_pinky'
  | 'left_index'
  | 'right_index'
  | 'left_thumb'
  | 'right_thumb'
  | 'left_hip'
  | 'right_hip'
  | 'left_knee'
  | 'right_knee'
  | 'left_ankle'
  | 'right_ankle'
  | 'left_heel'
  | 'right_heel'
  | 'left_foot_index'
  | 'right_foot_index';

// MediaPipe 33 Landmark Indices
export const LANDMARK_INDICES = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

export type ExerciseTrackingType = 'repetition' | 'hold_time' | 'breathing_cycles';

export interface PostureAngleRule {
  name: string;
  pointA: number;
  pointB: number; // Vertex
  pointC: number;
  idealAngle: number;
  tolerance: number;
  weight: number;
  correctionLowMsg: string; // e.g. "Straighten your back"
  correctionHighMsg: string; // e.g. "Bend your knees slightly"
  bodyPart: 'spine' | 'shoulders' | 'arms' | 'hips' | 'knees' | 'head';
}

export interface PostureAlignmentRule {
  name: string;
  point1: number;
  point2: number;
  axis: 'horizontal' | 'vertical';
  maxDeviationDegrees: number;
  weight: number;
  correctionMsg: string;
  bodyPart: 'spine' | 'shoulders' | 'arms' | 'hips' | 'knees' | 'head';
}

export interface YogaExercisePose {
  id: string;
  name: string;
  sanskritName: string;
  category: 'Asana' | 'Pranayama' | 'Restorative' | 'Flow';
  trackingType: ExerciseTrackingType;
  targetCount: number; // e.g. 12 reps, 45 seconds hold, 10 breath cycles
  targetHoldSecondsPerRep?: number;
  recommendedView: 'full_body' | 'upper_body' | 'seated';
  targetStressFocus: 'All' | 'Desk' | 'Respiratory' | 'Stress';
  description: string;
  keyInstructions: string[];
  beginnerTips: string[];
  precautions: string;
  angleRules: PostureAngleRule[];
  alignmentRules: PostureAlignmentRule[];
}

export interface BodyPartAlignmentStatus {
  status: 'excellent' | 'good' | 'needs_correction' | 'not_visible';
  score: number; // 0-100
  feedback?: string;
}

export interface BodyAlignmentSummary {
  spine: BodyPartAlignmentStatus;
  shoulders: BodyPartAlignmentStatus;
  arms: BodyPartAlignmentStatus;
  hips: BodyPartAlignmentStatus;
  knees: BodyPartAlignmentStatus;
  head: BodyPartAlignmentStatus;
}

export interface PostureEvaluationResult {
  isBodyVisible: boolean;
  visibilityMessage?: string;
  overallScore: number; // 0-100
  isPostureCorrect: boolean;
  prioritizedFeedback: string;
  feedbackType: 'success' | 'correction' | 'info' | 'warning';
  activeCorrectionBodyPart?: 'spine' | 'shoulders' | 'arms' | 'hips' | 'knees' | 'head';
  alignmentSummary: BodyAlignmentSummary;
  detectedAngles: Record<string, number>;
  isRepetitionCompleted?: boolean;
}

export interface YogaSessionSummaryData {
  exerciseId: string;
  exerciseTitle: string;
  sanskritName: string;
  durationSeconds: number;
  averageScore: number;
  repsCompleted: number;
  targetReps: number;
  holdTimeSeconds: number;
  breathingCycles: number;
  bestAlignment: string;
  needsImprovement: string;
  consistencyRating: 'Excellent' | 'Great' | 'Good' | 'Fair';
  completedAt: string;
}
