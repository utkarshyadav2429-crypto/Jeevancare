import React, { useEffect, useRef } from 'react';
import { NormalizedLandmark, LANDMARK_INDICES, PostureEvaluationResult } from './types';

const L = LANDMARK_INDICES;

// Key anatomical connections for yoga skeleton visualization
const SKELETON_CONNECTIONS = [
  // Head / Face
  [L.NOSE, L.LEFT_EYE],
  [L.NOSE, L.RIGHT_EYE],
  [L.LEFT_EYE, L.LEFT_EAR],
  [L.RIGHT_EYE, L.RIGHT_EAR],
  // Shoulders & Torso
  [L.LEFT_SHOULDER, L.RIGHT_SHOULDER],
  [L.LEFT_SHOULDER, L.LEFT_HIP],
  [L.RIGHT_SHOULDER, L.RIGHT_HIP],
  [L.LEFT_HIP, L.RIGHT_HIP],
  // Left Arm
  [L.LEFT_SHOULDER, L.LEFT_ELBOW],
  [L.LEFT_ELBOW, L.LEFT_WRIST],
  // Right Arm
  [L.RIGHT_SHOULDER, L.RIGHT_ELBOW],
  [L.RIGHT_ELBOW, L.RIGHT_WRIST],
  // Left Leg
  [L.LEFT_HIP, L.LEFT_KNEE],
  [L.LEFT_KNEE, L.LEFT_ANKLE],
  // Right Leg
  [L.RIGHT_HIP, L.RIGHT_KNEE],
  [L.RIGHT_KNEE, L.RIGHT_ANKLE],
];

interface PoseCanvasOverlayProps {
  landmarks: NormalizedLandmark[] | null;
  evaluation: PostureEvaluationResult | null;
  width: number;
  height: number;
  showSkeleton?: boolean;
}

export const PoseCanvasOverlay: React.FC<PoseCanvasOverlayProps> = ({
  landmarks,
  evaluation,
  width,
  height,
  showSkeleton = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!landmarks || landmarks.length < 33 || !showSkeleton) {
      return;
    }

    // Determine colors based on posture evaluation
    const isExcellent = (evaluation?.overallScore || 0) >= 85;
    const isGood = (evaluation?.overallScore || 0) >= 70;
    const primaryLineColor = isExcellent ? '#10b981' : isGood ? '#34d399' : '#fbbf24';
    const secondaryLineColor = isExcellent ? '#059669' : '#047857';

    // 1. Draw Skeleton Bones / Connections
    ctx.lineWidth = Math.max(3, Math.min(6, width * 0.007));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [idxA, idxB] of SKELETON_CONNECTIONS) {
      const pA = landmarks[idxA];
      const pB = landmarks[idxB];
      if (!pA || !pB) continue;
      if ((pA.visibility ?? 1) < 0.35 || (pB.visibility ?? 1) < 0.35) continue;

      const xA = pA.x * width;
      const yA = pA.y * height;
      const xB = pB.x * width;
      const yB = pB.y * height;

      // Glow shadow for high-contrast visibility against all room lighting
      ctx.shadowColor = 'rgba(6, 78, 59, 0.7)';
      ctx.shadowBlur = 8;

      const gradient = ctx.createLinearGradient(xA, yA, xB, yB);
      gradient.addColorStop(0, primaryLineColor);
      gradient.addColorStop(1, secondaryLineColor);

      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(xA, yA);
      ctx.lineTo(xB, yB);
      ctx.stroke();
    }

    // 2. Draw Spine Alignment Guide Line (Nose to Hip Midpoint)
    const nose = landmarks[L.NOSE];
    const leftHip = landmarks[L.LEFT_HIP];
    const rightHip = landmarks[L.RIGHT_HIP];
    if (nose && leftHip && rightHip && (nose.visibility ?? 1) > 0.4) {
      const midHipX = ((leftHip.x + rightHip.x) / 2) * width;
      const midHipY = ((leftHip.y + rightHip.y) / 2) * height;
      const noseX = nose.x * width;
      const noseY = nose.y * height;

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(245, 245, 244, 0.7)'; // Soft beige plumb line
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(noseX, noseY);
      ctx.lineTo(midHipX, midHipY);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Joint Nodes with Jevan Care Color Logic
    for (let i = 0; i < landmarks.length; i++) {
      // Skip auxiliary face landmarks to keep UI clean and calm
      if (i > 0 && i < 11 && i !== L.LEFT_EAR && i !== L.RIGHT_EAR) continue;
      if (i >= 17 && i <= 22) continue; // Skip finger tips
      if (i >= 29 && i <= 32) continue; // Skip toe tips

      const lm = landmarks[i];
      if (!lm || (lm.visibility ?? 1) < 0.35) continue;

      const px = lm.x * width;
      const py = lm.y * height;
      const radius = Math.max(4, Math.min(8, width * 0.009));

      // Determine joint node color
      let fillColor = '#10b981'; // Emerald
      let strokeColor = '#f5f5f4'; // Soft beige outer ring

      // Highlight active correction body parts
      const activePart = evaluation?.activeCorrectionBodyPart;
      const isShoulder = i === L.LEFT_SHOULDER || i === L.RIGHT_SHOULDER;
      const isArm = i === L.LEFT_ELBOW || i === L.RIGHT_ELBOW || i === L.LEFT_WRIST || i === L.RIGHT_WRIST;
      const isKnee = i === L.LEFT_KNEE || i === L.RIGHT_KNEE;
      const isHip = i === L.LEFT_HIP || i === L.RIGHT_HIP;

      if (
        (activePart === 'shoulders' && isShoulder) ||
        (activePart === 'arms' && isArm) ||
        (activePart === 'knees' && isKnee) ||
        (activePart === 'hips' && isHip)
      ) {
        fillColor = '#f43f5e'; // Soft pink/rose alert accent
        strokeColor = '#ffe4e6';
      }

      ctx.save();
      ctx.shadowColor = fillColor;
      ctx.shadowBlur = 12;

      // Outer Ring
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(px, py, radius + 2, 0, 2 * Math.PI);
      ctx.fill();

      // Inner Joint Dot
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.restore();
    }
  }, [landmarks, evaluation, width, height, showSkeleton]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
};
