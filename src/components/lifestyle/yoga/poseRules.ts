import { YogaExercisePose, LANDMARK_INDICES } from './types';

const L = LANDMARK_INDICES;

export const YOGA_EXERCISE_POSES: YogaExercisePose[] = [
  {
    id: 'yr_1',
    name: 'Surya Namaskar & Kapalbhati Flow',
    sanskritName: 'सूर्य नमस्कार एवं कपालभाति',
    category: 'Flow',
    trackingType: 'repetition',
    targetCount: 12,
    recommendedView: 'full_body',
    targetStressFocus: 'All',
    description: 'Dynamic 12-stage solar vinyasa sequence followed by seated diaphragmatic skull-shining breathwork.',
    keyInstructions: [
      'Begin in Pranamasana with hands in prayer at chest center, feet parallel.',
      'Inhale: Raise arms overhead into Hastauttanasana arching back gently.',
      'Exhale: Hinge from hips down into Padahastasana, keeping spine lengthened.',
      'Maintain strong core stability and rhythmic synchronized breathing throughout.'
    ],
    beginnerTips: [
      'Micro-bend your knees in forward fold if hamstrings are tight.',
      'Keep your gaze steady on the camera or a focal point (Drishti).',
      'Move deliberately with breath; speed is not the goal.'
    ],
    precautions: 'Avoid rapid forceful extensions if dealing with severe lumbar disc injury or vertigo.',
    angleRules: [
      {
        name: 'Spine & Hip Extension',
        pointA: L.LEFT_SHOULDER,
        pointB: L.LEFT_HIP,
        pointC: L.LEFT_KNEE,
        idealAngle: 175,
        tolerance: 20,
        weight: 1.5,
        correctionLowMsg: 'Straighten your torso and align your spine upright.',
        correctionHighMsg: 'Avoid excessive lower back hyperextension.',
        bodyPart: 'spine'
      },
      {
        name: 'Left Knee Alignment',
        pointA: L.LEFT_HIP,
        pointB: L.LEFT_KNEE,
        pointC: L.LEFT_ANKLE,
        idealAngle: 175,
        tolerance: 25,
        weight: 1.0,
        correctionLowMsg: 'Straighten your standing leg slightly.',
        correctionHighMsg: 'Keep knees soft and unlocked.',
        bodyPart: 'knees'
      },
      {
        name: 'Arm Elevation & Reach',
        pointA: L.LEFT_HIP,
        pointB: L.LEFT_SHOULDER,
        pointC: L.LEFT_ELBOW,
        idealAngle: 165,
        tolerance: 30,
        weight: 1.2,
        correctionLowMsg: 'Raise your arms higher overhead.',
        correctionHighMsg: 'Relax upper trapezius and shoulders away from ears.',
        bodyPart: 'arms'
      }
    ],
    alignmentRules: [
      {
        name: 'Shoulder Level Balance',
        point1: L.LEFT_SHOULDER,
        point2: L.RIGHT_SHOULDER,
        axis: 'horizontal',
        maxDeviationDegrees: 12,
        weight: 1.3,
        correctionMsg: 'Level your shoulders evenly across the horizontal axis.',
        bodyPart: 'shoulders'
      },
      {
        name: 'Spinal Verticality',
        point1: L.NOSE,
        point2: L.LEFT_HIP,
        axis: 'vertical',
        maxDeviationDegrees: 15,
        weight: 1.4,
        correctionMsg: 'Keep your head stacked centrally over your pelvis.',
        bodyPart: 'spine'
      }
    ]
  },
  {
    id: 'yr_2',
    name: 'Anulom Vilom & Nadi Shodhana',
    sanskritName: 'अनुलोम विलोम एवं नाड़ी शोधन',
    category: 'Pranayama',
    trackingType: 'breathing_cycles',
    targetCount: 10,
    recommendedView: 'upper_body',
    targetStressFocus: 'Stress',
    description: 'Rhythmic alternate-nostril breathing cultivating autonomic vagal balance and mental clarity.',
    keyInstructions: [
      'Sit comfortably in Sukhasana or on a chair with an erect, neutral spine.',
      'Rest left hand on knee in Chin/Jnana Mudra.',
      'Raise right hand to face in Vishnu Mudra (thumb and ring finger alternate nostrils).',
      'Keep shoulders dropped and chest open without leaning.'
    ],
    beginnerTips: [
      'Sit against a backrest if maintaining an erect spine feels fatiguing.',
      'Close your eyes to focus on the cooling inhalation sensations.',
      'Do not strain; keep the breath silent, slow, and rhythmic.'
    ],
    precautions: 'Never force retention (Kumbhaka) if experiencing high blood pressure or anxiety.',
    angleRules: [
      {
        name: 'Seated Spine Angle',
        pointA: L.NOSE,
        pointB: L.LEFT_SHOULDER,
        pointC: L.LEFT_HIP,
        idealAngle: 172,
        tolerance: 15,
        weight: 1.6,
        correctionLowMsg: 'Sit tall and lengthen your spine upward from the base.',
        correctionHighMsg: 'Avoid overarching your lower back.',
        bodyPart: 'spine'
      },
      {
        name: 'Pranayama Hand Lift',
        pointA: L.RIGHT_SHOULDER,
        pointB: L.RIGHT_ELBOW,
        pointC: L.RIGHT_WRIST,
        idealAngle: 65,
        tolerance: 35,
        weight: 1.1,
        correctionLowMsg: 'Bring your right hand up closer to your face for nostril control.',
        correctionHighMsg: 'Keep right elbow relaxed close to your ribcage.',
        bodyPart: 'arms'
      }
    ],
    alignmentRules: [
      {
        name: 'Shoulder Drop & Relaxation',
        point1: L.LEFT_SHOULDER,
        point2: L.RIGHT_SHOULDER,
        axis: 'horizontal',
        maxDeviationDegrees: 10,
        weight: 1.4,
        correctionMsg: 'Relax your shoulders down; keep them level while raising your hand.',
        bodyPart: 'shoulders'
      },
      {
        name: 'Head Neutrality',
        point1: L.NOSE,
        point2: L.LEFT_SHOULDER,
        axis: 'vertical',
        maxDeviationDegrees: 12,
        weight: 1.2,
        correctionMsg: 'Keep your chin parallel to the floor without tilting sideways.',
        bodyPart: 'head'
      }
    ]
  },
  {
    id: 'yr_3',
    name: 'Desk & Cervical Chair Stretches',
    sanskritName: 'ग्रीवा संचालन एवं कुर्सी आसन',
    category: 'Asana',
    trackingType: 'hold_time',
    targetCount: 45, // seconds hold
    recommendedView: 'upper_body',
    targetStressFocus: 'Desk',
    description: 'Targeted cervical decompression and thoracic mobilization designed specifically for screen workers.',
    keyInstructions: [
      'Sit forward on chair with both feet planted flat on floor.',
      'Gently tilt right ear toward right shoulder, feeling the left trapezius release.',
      'Draw shoulder blades down and back, opening the collarbones.',
      'Breathe deeply into the side of the neck for 3-5 breaths before switching.'
    ],
    beginnerTips: [
      'Never force the neck; let gravity gently provide the lateral stretch.',
      'Keep your jaw unclenched and facial muscles relaxed.'
    ],
    precautions: 'Avoid rapid circular neck snapping if diagnosed with acute cervical spondylosis.',
    angleRules: [
      {
        name: 'Thoracic Posture',
        pointA: L.LEFT_EAR,
        pointB: L.LEFT_SHOULDER,
        pointC: L.LEFT_HIP,
        idealAngle: 170,
        tolerance: 18,
        weight: 1.5,
        correctionLowMsg: 'Open your chest and pull shoulders back from slouching.',
        correctionHighMsg: 'Neutralize spine without thrusting ribs forward.',
        bodyPart: 'spine'
      }
    ],
    alignmentRules: [
      {
        name: 'Neck Stretch Angle',
        point1: L.LEFT_EAR,
        point2: L.RIGHT_EAR,
        axis: 'horizontal',
        maxDeviationDegrees: 30,
        weight: 1.3,
        correctionMsg: 'Tilt head smoothly to deepen the lateral cervical release.',
        bodyPart: 'head'
      },
      {
        name: 'Shoulder Relaxation',
        point1: L.LEFT_SHOULDER,
        point2: L.RIGHT_SHOULDER,
        axis: 'horizontal',
        maxDeviationDegrees: 15,
        weight: 1.2,
        correctionMsg: 'Keep both shoulders anchored down away from your neck.',
        bodyPart: 'shoulders'
      }
    ]
  },
  {
    id: 'yr_4',
    name: 'Bhramari & Shanmukhi Mudra',
    sanskritName: 'भ्रामरी प्राणायाम',
    category: 'Pranayama',
    trackingType: 'breathing_cycles',
    targetCount: 8,
    recommendedView: 'upper_body',
    targetStressFocus: 'Stress',
    description: 'Vagus nerve humming vibration utilizing gentle sensory closure to dissipate mental exhaustion.',
    keyInstructions: [
      'Sit with straight spine; place thumbs gently closing ear cartilages (tragus).',
      'Rest index and middle fingers lightly over eyelids and nose.',
      'Inhale deeply through nose; exhale with a resonant low humming "Mmm" sound.',
      'Feel the soothing vibrations resonating through skull bones and frontal sinuses.'
    ],
    beginnerTips: [
      'Do not press into the eyeballs; fingertips should rest with feather-light touch.',
      'Lengthen the humming exhalation as long as comfortably possible.'
    ],
    precautions: 'Do not perform lying down; practice in an upright seated position.',
    angleRules: [
      {
        name: 'Upright Spinal Axis',
        pointA: L.NOSE,
        pointB: L.LEFT_SHOULDER,
        pointC: L.LEFT_HIP,
        idealAngle: 175,
        tolerance: 15,
        weight: 1.5,
        correctionLowMsg: 'Sit tall and elongate your neck upward.',
        correctionHighMsg: 'Relax lower back naturally.',
        bodyPart: 'spine'
      }
    ],
    alignmentRules: [
      {
        name: 'Elbow Elevation',
        point1: L.LEFT_ELBOW,
        point2: L.RIGHT_ELBOW,
        axis: 'horizontal',
        maxDeviationDegrees: 15,
        weight: 1.2,
        correctionMsg: 'Keep both elbows elevated horizontally to expand the lung cavities.',
        bodyPart: 'arms'
      }
    ]
  },
  {
    id: 'yr_5',
    name: 'Vrikshasana (Tree Pose Balance)',
    sanskritName: 'वृक्षासन',
    category: 'Asana',
    trackingType: 'hold_time',
    targetCount: 30, // seconds hold
    recommendedView: 'full_body',
    targetStressFocus: 'All',
    description: 'Foundational single-leg balance pose improving neuro-muscular focus, pelvic stabilization, and core posture.',
    keyInstructions: [
      'Shift weight onto left foot; place right sole on inner left thigh or calf (avoid knee joint).',
      'Bring hands to prayer position (Anjali Mudra) at heart center or extended overhead.',
      'Fix your gaze on an unmoving point straight ahead.',
      'Engage standing glute and core for steady balance.'
    ],
    beginnerTips: [
      'Place your foot on the inner calf or keep toes touching the floor as a kickstand.',
      'Keep a light finger on a wall or chair for stability if needed.'
    ],
    precautions: 'Avoid placing the foot directly on the side of the knee joint.',
    angleRules: [
      {
        name: 'Standing Leg Lock',
        pointA: L.LEFT_HIP,
        pointB: L.LEFT_KNEE,
        pointC: L.LEFT_ANKLE,
        idealAngle: 175,
        tolerance: 15,
        weight: 1.6,
        correctionLowMsg: 'Straighten and ground firmly through your standing leg.',
        correctionHighMsg: 'Keep standing knee stable without hyperextending.',
        bodyPart: 'knees'
      },
      {
        name: 'Torso Alignment',
        pointA: L.LEFT_SHOULDER,
        pointB: L.LEFT_HIP,
        pointC: L.LEFT_KNEE,
        idealAngle: 175,
        tolerance: 15,
        weight: 1.5,
        correctionLowMsg: 'Avoid leaning your torso to the side; stay centered.',
        correctionHighMsg: 'Square your hips forward.',
        bodyPart: 'spine'
      }
    ],
    alignmentRules: [
      {
        name: 'Pelvic Level Balance',
        point1: L.LEFT_HIP,
        point2: L.RIGHT_HIP,
        axis: 'horizontal',
        maxDeviationDegrees: 12,
        weight: 1.4,
        correctionMsg: 'Level your hips; avoid dropping the lifted hip.',
        bodyPart: 'hips'
      },
      {
        name: 'Shoulder Level',
        point1: L.LEFT_SHOULDER,
        point2: L.RIGHT_SHOULDER,
        axis: 'horizontal',
        maxDeviationDegrees: 10,
        weight: 1.2,
        correctionMsg: 'Keep shoulders square and relaxed.',
        bodyPart: 'shoulders'
      }
    ]
  },
  {
    id: 'yr_6',
    name: 'Virabhadrasana II (Warrior II)',
    sanskritName: 'वीरभद्रासन २',
    category: 'Asana',
    trackingType: 'hold_time',
    targetCount: 30, // seconds hold
    recommendedView: 'full_body',
    targetStressFocus: 'All',
    description: 'Empowering standing posture strengthening quadriceps, opening hips, and improving stamina.',
    keyInstructions: [
      'Step feet wide apart (~3.5 to 4 feet). Turn right foot out 90°, left foot in slightly.',
      'Bend right knee directly over right ankle (aiming for a 90° angle).',
      'Extend arms parallel to the floor, reaching actively in opposite directions.',
      'Gaze softly over right fingertips while maintaining torso centered between hips.'
    ],
    beginnerTips: [
      'Shorten your stance slightly if your front hip or knee feels strained.',
      'Check that your front knee does not collapse inward.'
    ],
    precautions: 'Do not let the front knee overshoot the front toes.',
    angleRules: [
      {
        name: 'Front Knee Bend',
        pointA: L.RIGHT_HIP,
        pointB: L.RIGHT_KNEE,
        pointC: L.RIGHT_ANKLE,
        idealAngle: 105,
        tolerance: 25,
        weight: 1.6,
        correctionLowMsg: 'Deepen your front knee bend toward 90 degrees.',
        correctionHighMsg: 'Bend your front knee over ankle; avoid standing too straight.',
        bodyPart: 'knees'
      },
      {
        name: 'Back Leg Extension',
        pointA: L.LEFT_HIP,
        pointB: L.LEFT_KNEE,
        pointC: L.LEFT_ANKLE,
        idealAngle: 175,
        tolerance: 15,
        weight: 1.4,
        correctionLowMsg: 'Straighten your back leg and press into the outer edge of the back foot.',
        correctionHighMsg: 'Keep back leg engaged and firm.',
        bodyPart: 'knees'
      }
    ],
    alignmentRules: [
      {
        name: 'Arm Parallel Horizon',
        point1: L.LEFT_WRIST,
        point2: L.RIGHT_WRIST,
        axis: 'horizontal',
        maxDeviationDegrees: 12,
        weight: 1.5,
        correctionMsg: 'Elevate your arms parallel to the floor at shoulder level.',
        bodyPart: 'arms'
      },
      {
        name: 'Torso Verticality',
        point1: L.NOSE,
        point2: L.LEFT_HIP,
        axis: 'vertical',
        maxDeviationDegrees: 15,
        weight: 1.3,
        correctionMsg: 'Stack your torso vertically over hips without leaning forward.',
        bodyPart: 'spine'
      }
    ]
  }
];

export function getPoseById(id: string): YogaExercisePose {
  const match = YOGA_EXERCISE_POSES.find((p) => p.id === id);
  return match || YOGA_EXERCISE_POSES[0];
}
