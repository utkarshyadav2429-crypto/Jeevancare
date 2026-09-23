import {
  NormalizedLandmark,
  YogaExercisePose,
  PostureEvaluationResult,
  BodyAlignmentSummary,
  BodyPartAlignmentStatus,
  LANDMARK_INDICES
} from './types';
import { calculateAngle, calculateAxisDeviation, areLandmarksVisible } from './poseMath';

const L = LANDMARK_INDICES;

export class PoseEvaluator {
  private lastFeedbackChangeTime: number = 0;
  private currentFeedback: string = 'Position yourself comfortably in frame.';
  private currentFeedbackType: 'success' | 'correction' | 'info' | 'warning' = 'info';
  
  // Repetition detection state machine
  private repState: 'idle' | 'inflection' | 'returning' = 'idle';
  private repScoreHistory: number[] = [];

  public evaluate(
    landmarks: NormalizedLandmark[] | null,
    exercise: YogaExercisePose,
    isBeginnerMode: boolean = false
  ): PostureEvaluationResult {
    const emptyAlignmentSummary: BodyAlignmentSummary = {
      spine: { status: 'not_visible', score: 0 },
      shoulders: { status: 'not_visible', score: 0 },
      arms: { status: 'not_visible', score: 0 },
      hips: { status: 'not_visible', score: 0 },
      knees: { status: 'not_visible', score: 0 },
      head: { status: 'not_visible', score: 0 },
    };

    if (!landmarks || landmarks.length < 33) {
      return {
        isBodyVisible: false,
        visibilityMessage: 'Please step into the camera frame so AI can track your posture.',
        overallScore: 0,
        isPostureCorrect: false,
        prioritizedFeedback: 'Move into the camera frame to begin posture tracking.',
        feedbackType: 'info',
        alignmentSummary: emptyAlignmentSummary,
        detectedAngles: {},
      };
    }

    // 1. Check Visibility of Essential Landmarks based on Exercise Requirements
    let requiredIndices: number[] = [L.NOSE, L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_HIP, L.RIGHT_HIP];
    if (exercise.recommendedView === 'full_body') {
      requiredIndices = [
        L.NOSE,
        L.LEFT_SHOULDER,
        L.RIGHT_SHOULDER,
        L.LEFT_HIP,
        L.RIGHT_HIP,
        L.LEFT_KNEE,
        L.RIGHT_KNEE,
        L.LEFT_ANKLE,
        L.RIGHT_ANKLE,
      ];
    }

    const isVisible = areLandmarksVisible(landmarks, requiredIndices, 0.4);
    if (!isVisible) {
      const isLegsMissing = !areLandmarksVisible(landmarks, [L.LEFT_KNEE, L.RIGHT_KNEE, L.LEFT_ANKLE], 0.35);
      const isUpperMissing = !areLandmarksVisible(landmarks, [L.LEFT_SHOULDER, L.RIGHT_SHOULDER], 0.35);

      const visibilityMsg = isLegsMissing && exercise.recommendedView === 'full_body'
        ? 'Step back slightly so your legs and feet are visible.'
        : isUpperMissing
        ? 'Adjust your camera angle to capture your head and shoulders.'
        : 'Ensure adequate lighting and position your full posture in frame.';

      return {
        isBodyVisible: false,
        visibilityMessage: visibilityMsg,
        overallScore: 0,
        isPostureCorrect: false,
        prioritizedFeedback: visibilityMsg,
        feedbackType: 'warning',
        alignmentSummary: emptyAlignmentSummary,
        detectedAngles: {},
      };
    }

    // 2. Evaluate Angle Rules
    const detectedAngles: Record<string, number> = {};
    const corrections: { msg: string; weight: number; bodyPart: any; severity: number }[] = [];
    const partScores: Record<string, { totalScore: number; count: number; feedback?: string }> = {
      spine: { totalScore: 0, count: 0 },
      shoulders: { totalScore: 0, count: 0 },
      arms: { totalScore: 0, count: 0 },
      hips: { totalScore: 0, count: 0 },
      knees: { totalScore: 0, count: 0 },
      head: { totalScore: 0, count: 0 },
    };

    let totalWeightedScore = 0;
    let totalWeight = 0;

    // Tolerance multiplier for beginner mode (more forgiving)
    const toleranceMultiplier = isBeginnerMode ? 1.35 : 1.0;

    for (const rule of exercise.angleRules) {
      const pA = landmarks[rule.pointA];
      const pB = landmarks[rule.pointB];
      const pC = landmarks[rule.pointC];

      if (!pA || !pB || !pC) continue;

      const angle = calculateAngle(pA, pB, pC);
      detectedAngles[rule.name] = angle;

      const diff = Math.abs(angle - rule.idealAngle);
      const allowedTol = rule.tolerance * toleranceMultiplier;
      
      let ruleScore = Math.max(0, 100 - (diff / allowedTol) * 45);
      if (diff <= allowedTol * 0.4) {
        ruleScore = 100;
      }

      totalWeightedScore += ruleScore * rule.weight;
      totalWeight += rule.weight;

      // Track by body part
      if (partScores[rule.bodyPart]) {
        partScores[rule.bodyPart].totalScore += ruleScore;
        partScores[rule.bodyPart].count += 1;
      }

      if (diff > allowedTol) {
        const msg = angle < rule.idealAngle ? rule.correctionLowMsg : rule.correctionHighMsg;
        const severity = diff / allowedTol;
        corrections.push({ msg, weight: rule.weight, bodyPart: rule.bodyPart, severity });
        if (partScores[rule.bodyPart]) {
          partScores[rule.bodyPart].feedback = msg;
        }
      }
    }

    // 3. Evaluate Alignment Rules (Horizontal / Vertical axis level)
    for (const rule of exercise.alignmentRules) {
      const p1 = landmarks[rule.point1];
      const p2 = landmarks[rule.point2];

      if (!p1 || !p2) continue;

      const dev = calculateAxisDeviation(p1, p2, rule.axis);
      detectedAngles[rule.name] = dev;

      const allowedDev = rule.maxDeviationDegrees * toleranceMultiplier;
      let ruleScore = Math.max(0, 100 - (dev / allowedDev) * 50);
      if (dev <= allowedDev * 0.4) {
        ruleScore = 100;
      }

      totalWeightedScore += ruleScore * rule.weight;
      totalWeight += rule.weight;

      if (partScores[rule.bodyPart]) {
        partScores[rule.bodyPart].totalScore += ruleScore;
        partScores[rule.bodyPart].count += 1;
      }

      if (dev > allowedDev) {
        const severity = dev / allowedDev;
        corrections.push({ msg: rule.correctionMsg, weight: rule.weight, bodyPart: rule.bodyPart, severity });
        if (partScores[rule.bodyPart]) {
          partScores[rule.bodyPart].feedback = rule.correctionMsg;
        }
      }
    }

    // 4. Calculate Final Aggregate Score
    const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 85;
    const isPostureCorrect = overallScore >= (isBeginnerMode ? 70 : 80);

    // 5. Build Alignment Summary Breakdown
    const buildPartStatus = (partName: string): BodyPartAlignmentStatus => {
      const item = partScores[partName];
      if (!item || item.count === 0) {
        return { status: 'good', score: 90 };
      }
      const avg = Math.round(item.totalScore / item.count);
      if (avg >= 85) return { status: 'excellent', score: avg };
      if (avg >= 68) return { status: 'good', score: avg, feedback: item.feedback };
      return { status: 'needs_correction', score: avg, feedback: item.feedback };
    };

    const alignmentSummary: BodyAlignmentSummary = {
      spine: buildPartStatus('spine'),
      shoulders: buildPartStatus('shoulders'),
      arms: buildPartStatus('arms'),
      hips: buildPartStatus('hips'),
      knees: buildPartStatus('knees'),
      head: buildPartStatus('head'),
    };

    // 6. Prioritize Single #1 Actionable Feedback Item with Hysteresis (Avoid rapid flickering)
    let candidateFeedback = '';
    let candidateType: 'success' | 'correction' | 'info' | 'warning' = 'success';
    let activeCorrectionBodyPart: any = undefined;

    if (corrections.length > 0) {
      // Sort by weighted severity
      corrections.sort((a, b) => b.weight * b.severity - a.weight * a.severity);
      const topCorrection = corrections[0];
      candidateFeedback = topCorrection.msg;
      candidateType = 'correction';
      activeCorrectionBodyPart = topCorrection.bodyPart;
    } else if (overallScore >= 90) {
      candidateFeedback = '✦ Excellent alignment! Hold this posture steady.';
      candidateType = 'success';
    } else {
      candidateFeedback = 'Good form. Maintain smooth, steady breathing.';
      candidateType = 'success';
    }

    const now = Date.now();
    if (now - this.lastFeedbackChangeTime > 1600 || this.currentFeedbackType !== candidateType) {
      this.currentFeedback = candidateFeedback;
      this.currentFeedbackType = candidateType;
      this.lastFeedbackChangeTime = now;
    }

    // 7. Repetition / Movement Detection
    let isRepetitionCompleted = false;
    if (exercise.trackingType === 'repetition') {
      const spineAngle = detectedAngles['Spine & Hip Extension'] || 170;
      if (this.repState === 'idle' && spineAngle < 130 && overallScore >= 60) {
        this.repState = 'inflection';
      } else if (this.repState === 'inflection' && spineAngle > 160) {
        this.repState = 'idle';
        isRepetitionCompleted = true;
      }
    }

    return {
      isBodyVisible: true,
      overallScore,
      isPostureCorrect,
      prioritizedFeedback: this.currentFeedback,
      feedbackType: this.currentFeedbackType,
      activeCorrectionBodyPart,
      alignmentSummary,
      detectedAngles,
      isRepetitionCompleted,
    };
  }

  public reset(): void {
    this.repState = 'idle';
    this.repScoreHistory = [];
    this.currentFeedback = 'Position yourself comfortably in frame.';
    this.currentFeedbackType = 'info';
    this.lastFeedbackChangeTime = 0;
  }
}
