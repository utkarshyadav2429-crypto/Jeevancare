import { NormalizedLandmark } from '../services/poseLandmarkerService';

export const LANDMARK = {
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

export interface YogaPostureResult {
  score: number;
  smoothedScore: number;
  feedback: string;
  feedbackType: 'good' | 'correcting' | 'searching' | 'positioning';
  alignment: {
    spine: number;
    shoulders: number;
    knees: number;
  };
  corrections: string[];
  isValidPose: boolean;
  isBodyVisible: boolean;
  visibilityMessage?: string;
}

export interface YogaPoseDefinition {
  id: string;
  name: string;
  sanskritName: string;
  category: 'Standing' | 'Balancing' | 'Chair / Seated' | 'Inversion' | 'Flow';
  instructions: string[];
  tips: string[];
  targetHoldSeconds?: number;
}

export const SUPPORTED_YOGA_POSES: YogaPoseDefinition[] = [
  {
    id: 'mountain_pose',
    name: 'Mountain Pose',
    sanskritName: 'Tadasana (ताड़ासन)',
    category: 'Standing',
    instructions: [
      'Stand tall with feet together or hip-width apart.',
      'Distribute weight evenly across both soles.',
      'Engage thighs, draw belly gently inward, and roll shoulders down.',
      'Let arms rest naturally at your sides with palms facing forward.',
    ],
    tips: [
      'Imagine a gentle cord lifting the crown of your head.',
      'Keep your chin parallel to the floor.',
    ],
    targetHoldSeconds: 30,
  },
  {
    id: 'tree_pose',
    name: 'Tree Pose',
    sanskritName: 'Vrikshasana (वृक्षासन)',
    category: 'Balancing',
    instructions: [
      'Shift weight onto one standing foot and ground down firmly.',
      'Place opposite sole on inner thigh or calf (avoid the knee joint).',
      'Bring hands to prayer at chest center or extend overhead.',
      'Fix your gaze (Drishti) on an unmoving point in front of you.',
    ],
    tips: [
      'Keep your hips level and standing knee unlocked.',
      'Use a wall lightly if finding balance today.',
    ],
    targetHoldSeconds: 30,
  },
  {
    id: 'warrior_1',
    name: 'Warrior I',
    sanskritName: 'Virabhadrasana I (वीरभद्रासन १)',
    category: 'Standing',
    instructions: [
      'Step one foot back ~3.5 feet, angled outward at 45 degrees.',
      'Bend front knee over front ankle toward a 90-degree angle.',
      'Square hips and chest forward toward the front of your mat.',
      'Reach arms straight overhead with shoulders relaxed.',
    ],
    tips: [
      'Press firmly into the outer edge of your back heel.',
      'Elongate through the sides of your waist.',
    ],
    targetHoldSeconds: 30,
  },
  {
    id: 'warrior_2',
    name: 'Warrior II',
    sanskritName: 'Virabhadrasana II (वीरभद्रासन २)',
    category: 'Standing',
    instructions: [
      'Step feet wide apart. Turn front toes forward, back foot parallel to mat edge.',
      'Bend front knee directly over ankle; keep back leg straight.',
      'Extend arms parallel to the floor in opposite directions.',
      'Gaze softly over your front middle finger.',
    ],
    tips: [
      'Stack your torso vertically over hips without leaning forward.',
      'Keep both arms buoyant at shoulder height.',
    ],
    targetHoldSeconds: 30,
  },
  {
    id: 'chair_pose',
    name: 'Chair Pose',
    sanskritName: 'Utkatasana (उत्कटासन)',
    category: 'Standing',
    instructions: [
      'Stand with feet together or hip-width apart.',
      'Inhale and raise arms overhead.',
      'Exhale and bend knees as if sitting down into an imaginary chair.',
      'Shift weight slightly back into heels and keep spine lengthened.',
    ],
    tips: [
      'Keep knees tracking straight ahead without caving inward.',
      'Draw lower abdomen in to support the lower back.',
    ],
    targetHoldSeconds: 30,
  },
  {
    id: 'downward_dog',
    name: 'Downward Dog',
    sanskritName: 'Adho Mukha Svanasana (अधोमुख श्वानासन)',
    category: 'Inversion',
    instructions: [
      'Form an inverted V-shape with hands shoulder-width and feet hip-width.',
      'Press firmly through palms and lengthen spine toward the sky.',
      'Gently work heels toward the ground and relax your neck.',
    ],
    tips: [
      'Micro-bend knees if hamstrings or lower back feel tight.',
      'Keep ears inline with upper arms.',
    ],
    targetHoldSeconds: 30,
  },
];

/**
 * Normalizes any incoming exercise identifier to a known pose definition.
 */
export function resolveYogaPose(exerciseTypeOrId?: string): YogaPoseDefinition {
  if (!exerciseTypeOrId) return SUPPORTED_YOGA_POSES[0];
  const normalized = exerciseTypeOrId.toLowerCase().trim();

  if (normalized.includes('tree') || normalized === 'yr_5' || normalized.includes('vriksha')) {
    return SUPPORTED_YOGA_POSES[1]; // Tree Pose
  }
  if (normalized.includes('warrior_1') || normalized.includes('warrior 1') || normalized.includes('virabhadrasana i')) {
    return SUPPORTED_YOGA_POSES[2]; // Warrior I
  }
  if (normalized.includes('warrior') || normalized === 'yr_6' || normalized.includes('virabhadrasana')) {
    return SUPPORTED_YOGA_POSES[3]; // Warrior II
  }
  if (normalized.includes('chair') || normalized === 'yr_3' || normalized.includes('utkata') || normalized.includes('cervical')) {
    return SUPPORTED_YOGA_POSES[4]; // Chair Pose
  }
  if (normalized.includes('downward') || normalized.includes('dog') || normalized.includes('adho')) {
    return SUPPORTED_YOGA_POSES[5]; // Downward Dog
  }
  if (normalized === 'yr_1' || normalized.includes('surya') || normalized.includes('mountain') || normalized.includes('tadasana')) {
    return SUPPORTED_YOGA_POSES[0]; // Mountain Pose / Surya Namaskar flow
  }

  // Fallback to closest match or default Mountain Pose
  const found = SUPPORTED_YOGA_POSES.find(p => p.id === normalized);
  return found || SUPPORTED_YOGA_POSES[0];
}

/**
 * Calculates angle ABC (where B is vertex) in degrees.
 */
function calculateAngle(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}

/**
 * Main Yoga Posture Engine with smoothing and feedback hysteresis.
 */
export class YogaPostureEngine {
  private smoothedScore: number = 80;
  private currentFeedback: string = 'Step into the frame to begin';
  private currentFeedbackType: 'good' | 'correcting' | 'searching' | 'positioning' = 'searching';
  private lastFeedbackChangeTime: number = 0;
  private consecutiveGoodFrames: number = 0;

  /**
   * Evaluates posture landmarks against the selected yoga pose.
   */
  public analyzePose(
    landmarks: NormalizedLandmark[] | null,
    poseType: string = 'mountain_pose'
  ): YogaPostureResult {
    const poseDef = resolveYogaPose(poseType);
    const now = Date.now();

    // 1. Check if landmarks are present
    if (!landmarks || landmarks.length < 33) {
      this.updateFeedback('I can\'t see you yet. Step into the frame.', 'searching', now, 500);
      return {
        score: 0,
        smoothedScore: 0,
        feedback: this.currentFeedback,
        feedbackType: this.currentFeedbackType,
        alignment: { spine: 0, shoulders: 0, knees: 0 },
        corrections: ['Step into the camera frame'],
        isValidPose: false,
        isBodyVisible: false,
        visibilityMessage: 'I can\'t see you yet. Step into the frame.',
      };
    }

    const nose = landmarks[LANDMARK.NOSE];
    const leftShoulder = landmarks[LANDMARK.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARK.RIGHT_SHOULDER];
    const leftHip = landmarks[LANDMARK.LEFT_HIP];
    const rightHip = landmarks[LANDMARK.RIGHT_HIP];
    const leftKnee = landmarks[LANDMARK.LEFT_KNEE];
    const rightKnee = landmarks[LANDMARK.RIGHT_KNEE];
    const leftAnkle = landmarks[LANDMARK.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARK.RIGHT_ANKLE];
    const leftElbow = landmarks[LANDMARK.LEFT_ELBOW];
    const rightElbow = landmarks[LANDMARK.RIGHT_ELBOW];
    const leftWrist = landmarks[LANDMARK.LEFT_WRIST];
    const rightWrist = landmarks[LANDMARK.RIGHT_WRIST];

    // 2. Check essential visibility
    const isUpperVisible =
      (leftShoulder?.visibility ?? 1) > 0.35 &&
      (rightShoulder?.visibility ?? 1) > 0.35 &&
      (leftHip?.visibility ?? 1) > 0.35 &&
      (rightHip?.visibility ?? 1) > 0.35;

    const isLowerVisible =
      (leftKnee?.visibility ?? 1) > 0.35 &&
      (rightKnee?.visibility ?? 1) > 0.35 &&
      (leftAnkle?.visibility ?? 1) > 0.35 &&
      (rightAnkle?.visibility ?? 1) > 0.35;

    if (!isUpperVisible) {
      const msg = 'Make sure your head and shoulders are clearly visible';
      this.updateFeedback(msg, 'positioning', now, 1000);
      return {
        score: 40,
        smoothedScore: Math.round(this.smoothedScore * 0.8),
        feedback: this.currentFeedback,
        feedbackType: this.currentFeedbackType,
        alignment: { spine: 40, shoulders: 40, knees: 40 },
        corrections: [msg],
        isValidPose: false,
        isBodyVisible: false,
        visibilityMessage: msg,
      };
    }

    // If standing/balancing pose and legs are cut off
    if (poseDef.category === 'Standing' || poseDef.category === 'Balancing') {
      if (!isLowerVisible) {
        const msg = 'Step back a little so your full body is visible';
        this.updateFeedback(msg, 'positioning', now, 1200);
        return {
          score: 55,
          smoothedScore: Math.round(this.smoothedScore * 0.7 + 55 * 0.3),
          feedback: this.currentFeedback,
          feedbackType: this.currentFeedbackType,
          alignment: { spine: 70, shoulders: 70, knees: 40 },
          corrections: [msg],
          isValidPose: false,
          isBodyVisible: false,
          visibilityMessage: msg,
        };
      }
    }

    // 3. Geometric Alignment Analysis
    const correctionsWithPriority: { text: string; priority: number; bodyPart: string }[] = [];
    let spineScore = 90;
    let shoulderScore = 90;
    let kneeScore = 90;

    // Midpoints
    const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
    const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const midHipX = (leftHip.x + rightHip.x) / 2;
    const midHipY = (leftHip.y + rightHip.y) / 2;

    // A. Shoulders Analysis: Levelness and Symmetry
    const shoulderDeltaY = Math.abs(leftShoulder.y - rightShoulder.y);
    const shoulderWidth = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
    const shoulderTiltRatio = shoulderWidth > 0 ? shoulderDeltaY / shoulderWidth : 0;

    if (shoulderTiltRatio > 0.16) {
      shoulderScore = Math.max(50, Math.round(100 - shoulderTiltRatio * 180));
      correctionsWithPriority.push({
        text: 'Relax and level your shoulders',
        priority: 7,
        bodyPart: 'shoulders',
      });
    } else {
      shoulderScore = 95;
    }

    // B. Spine Analysis: Vertical stack & Torso lean
    const torsoDeltaX = Math.abs(midShoulderX - midHipX);
    const torsoHeight = Math.abs(midHipY - midShoulderY);
    const torsoLeanRatio = torsoHeight > 0 ? torsoDeltaX / torsoHeight : 0;

    if (poseDef.id === 'downward_dog') {
      // Downward dog expects diagonal back
      spineScore = 90;
    } else if (torsoLeanRatio > 0.22) {
      spineScore = Math.max(50, Math.round(100 - torsoLeanRatio * 160));
      correctionsWithPriority.push({
        text: 'Keep your torso upright and centered',
        priority: 9,
        bodyPart: 'spine',
      });
    } else {
      spineScore = 95;
    }

    // C. Pose-Specific Rules
    if (poseDef.id === 'mountain_pose') {
      // Mountain: upright legs & spine
      if (isLowerVisible) {
        const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
        const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
        if (leftKneeAngle < 155 || rightKneeAngle < 155) {
          kneeScore = 70;
          correctionsWithPriority.push({
            text: 'Straighten your legs with knees soft',
            priority: 5,
            bodyPart: 'knees',
          });
        }
      }
    } else if (poseDef.id === 'tree_pose') {
      // Tree: one standing straight leg, one lifted knee
      if (isLowerVisible) {
        const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
        const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
        const hasBentKnee = leftKneeAngle < 145 || rightKneeAngle < 145;
        if (!hasBentKnee) {
          kneeScore = 65;
          correctionsWithPriority.push({
            text: 'Rest one foot on your inner calf or thigh',
            priority: 8,
            bodyPart: 'knees',
          });
        } else {
          kneeScore = 92;
        }
      }
    } else if (poseDef.id === 'warrior_2') {
      // Warrior II: arms parallel and wide stance
      if (leftWrist && rightWrist && leftShoulder && rightShoulder) {
        const armDeltaY = Math.abs(leftWrist.y - rightWrist.y);
        if (armDeltaY > 0.18) {
          correctionsWithPriority.push({
            text: 'Extend arms parallel to the ground',
            priority: 6,
            bodyPart: 'arms',
          });
        }
      }
      if (isLowerVisible) {
        const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
        const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
        const minKneeAngle = Math.min(leftKneeAngle, rightKneeAngle);
        if (minKneeAngle > 140) {
          kneeScore = 70;
          correctionsWithPriority.push({
            text: 'Bend your front knee a little deeper',
            priority: 8,
            bodyPart: 'knees',
          });
        } else {
          kneeScore = 90;
        }
      }
    } else if (poseDef.id === 'chair_pose') {
      // Chair: both knees bent ~110-140 deg
      if (isLowerVisible) {
        const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
        const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
        const avgKnee = (leftKneeAngle + rightKneeAngle) / 2;
        if (avgKnee > 155) {
          kneeScore = 65;
          correctionsWithPriority.push({
            text: 'Bend your knees a bit deeper into chair',
            priority: 8,
            bodyPart: 'knees',
          });
        } else {
          kneeScore = 92;
        }
      }
    } else if (poseDef.id === 'warrior_1') {
      // Warrior 1: front knee bent, arms reaching up
      if (leftWrist && rightWrist && midShoulderY) {
        const armsUp = leftWrist.y < midShoulderY && rightWrist.y < midShoulderY;
        if (!armsUp) {
          correctionsWithPriority.push({
            text: 'Reach your arms straight overhead',
            priority: 7,
            bodyPart: 'arms',
          });
        }
      }
    }

    // 4. Compute Raw Score and Smoothed Score (Forgiving model)
    const rawScore = Math.round((spineScore * 0.4) + (shoulderScore * 0.3) + (kneeScore * 0.3));
    this.smoothedScore = Math.round(this.smoothedScore * 0.7 + rawScore * 0.3);

    // 5. Select Smart Prioritized Feedback with Hysteresis
    let targetFeedback = '✨ Great alignment! Keep holding...';
    let targetType: 'good' | 'correcting' | 'searching' | 'positioning' = 'good';

    if (correctionsWithPriority.length > 0) {
      // Sort descending by priority
      correctionsWithPriority.sort((a, b) => b.priority - a.priority);
      targetFeedback = correctionsWithPriority[0].text;
      targetType = 'correcting';
      this.consecutiveGoodFrames = 0;
    } else {
      this.consecutiveGoodFrames++;
      if (this.smoothedScore >= 88) {
        targetFeedback = '✨ Excellent posture! Hold steady.';
      } else {
        targetFeedback = '✓ Good posture! Breathe smoothly.';
      }
      targetType = 'good';
    }

    // Update with stability threshold (prevent rapid flashing)
    this.updateFeedback(targetFeedback, targetType, now, 1800);

    return {
      score: rawScore,
      smoothedScore: Math.min(100, Math.max(20, this.smoothedScore)),
      feedback: this.currentFeedback,
      feedbackType: this.currentFeedbackType,
      alignment: {
        spine: spineScore,
        shoulders: shoulderScore,
        knees: kneeScore,
      },
      corrections: correctionsWithPriority.map(c => c.text),
      isValidPose: true,
      isBodyVisible: true,
    };
  }

  private updateFeedback(
    newFeedback: string,
    newType: 'good' | 'correcting' | 'searching' | 'positioning',
    currentTime: number,
    minHoldMs: number = 1800
  ): void {
    // If feedback is the same, no change needed
    if (this.currentFeedback === newFeedback) return;

    // Fast-track transition from searching/positioning to good/correcting
    const isStateTransition =
      (this.currentFeedbackType === 'searching' || this.currentFeedbackType === 'positioning') &&
      (newType === 'good' || newType === 'correcting');

    if (isStateTransition || currentTime - this.lastFeedbackChangeTime > minHoldMs) {
      this.currentFeedback = newFeedback;
      this.currentFeedbackType = newType;
      this.lastFeedbackChangeTime = currentTime;
    }
  }

  /**
   * Resets internal score histories and feedback states.
   */
  public reset(): void {
    this.smoothedScore = 80;
    this.currentFeedback = 'Find your position...';
    this.currentFeedbackType = 'positioning';
    this.lastFeedbackChangeTime = 0;
    this.consecutiveGoodFrames = 0;
  }
}
