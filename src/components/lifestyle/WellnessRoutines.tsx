import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  Zap,
  Info,
  Award,
  HeartHandshake,
  Camera,
  ArrowRight
} from 'lucide-react';
import { AIYogaCoach } from '../AIYogaCoach';

export interface YogaRoutineItem {
  id: string;
  timeOfDay: 'Morning' | 'Midday' | 'Evening' | 'Night';
  title: string;
  sanskritName: string;
  type: 'Asana' | 'Pranayama' | 'Meditation' | 'Restorative';
  durationMins: number;
  stressTarget: 'High' | 'Moderate' | 'All';
  exerciseType: string;
  description: string;
  steps: string[];
  benefits: string[];
  precautions?: string;
  indianHabitContext: string;
}

export const WellnessRoutines: React.FC = () => {
  const [selectedGoal, setSelectedGoal] = useState<'all' | 'desk' | 'respiratory' | 'stress'>('all');
  const [stressLevel, setStressLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [activeRoutine, setActiveRoutine] = useState<YogaRoutineItem | null>(null);
  
  // AI Yoga Coach State
  const [isAICoachOpen, setIsAICoachOpen] = useState<boolean>(false);
  const [aiCoachExerciseId, setAiCoachExerciseId] = useState<string>('mountain_pose');

  // Guided Routine Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [completedRoutineIds, setCompletedRoutineIds] = useState<string[]>([]);

  const routines: YogaRoutineItem[] = [
    {
      id: 'yr_1',
      timeOfDay: 'Morning',
      title: 'Surya Namaskar & Mountain Pose Flow',
      sanskritName: 'सूर्य नमस्कार एवं ताड़ासन',
      type: 'Asana',
      durationMins: 15,
      stressTarget: 'All',
      exerciseType: 'mountain_pose',
      description: 'A foundational sequence centered around Tadasana (Mountain Pose) and sun salutations to align the vertebral column, ground energy, and improve full-body posture.',
      steps: [
        'Pranamasana (Prayer pose) grounding both feet evenly into the earth.',
        'Inhale into Urdhva Hastasana (Upward Salute) extending through fingertips.',
        'Transition through full spinal extension maintaining active core engagement.'
      ],
      benefits: [
        'Boosts cardiovascular stamina & spinal posture alignment',
        'Enhances pulmonary oxygen exchange for lung health',
        'Regulates glucose metabolism for active Indian daily routines'
      ],
      precautions: 'Avoid forceful backward bends if experiencing acute lumbar discomfort.',
      indianHabitContext: 'Best practiced at Brahma Muhurta (around sunrise) after drinking warm water.'
    },
    {
      id: 'yr_tree',
      timeOfDay: 'Morning',
      title: 'Tree Pose Balance & Stability',
      sanskritName: 'वृक्षासन (Vrikshasana)',
      type: 'Asana',
      durationMins: 10,
      stressTarget: 'Moderate',
      exerciseType: 'tree_pose',
      description: 'A classic balancing asana that cultivates mental equilibrium, strengthens ankles and thighs, and corrects pelvic asymmetry.',
      steps: [
        'Root firmly through standing foot with knee soft and micro-bent.',
        'Place opposite sole on inner thigh or calf (avoiding the knee joint).',
        'Bring hands to prayer at heart center (Anjali Mudra) or extend overhead.'
      ],
      benefits: [
        'Improves neuromuscular balance and focus (Drishti)',
        'Strengthens hip abductors, calves, and stabilizing tendons',
        'Promotes calm centeredness during stressful workdays'
      ],
      precautions: 'Use a chair or wall for light touch balance support if feeling unsteady.',
      indianHabitContext: 'Ideal for training mental equilibrium before entering high-stress work meetings.'
    },
    {
      id: 'yr_warrior2',
      timeOfDay: 'Midday',
      title: 'Warrior II Stamina & Core Stance',
      sanskritName: 'वीरभद्रासन २ (Virabhadrasana II)',
      type: 'Asana',
      durationMins: 12,
      stressTarget: 'Moderate',
      exerciseType: 'warrior_2',
      description: 'A powerful standing posture that opens hips and chest, builds stamina in the quadriceps, and fosters warrior-like resilience.',
      steps: [
        'Step feet ~4 feet apart, front toes facing forward, back foot angled.',
        'Bend front knee directly over ankle at 90 degrees.',
        'Extend arms parallel to the floor in opposite directions, gazing over front fingertips.'
      ],
      benefits: [
        'Strengthens legs, ankles, and core muscles',
        'Opens groins, chest, and shoulder girdles',
        'Increases stamina and concentration'
      ],
      precautions: 'Avoid dropping the front knee inward past the big toe line.',
      indianHabitContext: 'Great midday energy booster to counter sedentary lethargy.'
    },
    {
      id: 'yr_warrior1',
      timeOfDay: 'Morning',
      title: 'Warrior I Chest Opening & Grounding',
      sanskritName: 'वीरभद्रासन १ (Virabhadrasana I)',
      type: 'Asana',
      durationMins: 10,
      stressTarget: 'All',
      exerciseType: 'warrior_1',
      description: 'A dynamic lunging posture that squares the hips, lengthens the psoas muscle, and expands respiratory capacity.',
      steps: [
        'Step one foot back ~3.5 feet, back heel anchored at 45 degrees.',
        'Square hips forward while bending front knee over ankle.',
        'Reach arms overhead with shoulders relaxed and scapulae retracted.'
      ],
      benefits: [
        'Stretches chest, lungs, shoulders, and psoas',
        'Strengthens thighs, calves, and back muscles',
        'Boosts confidence and grounding'
      ],
      precautions: 'If shoulders feel tight, keep hands shoulder-distance apart.',
      indianHabitContext: 'Energizing morning asana to establish intentional posture for the day.'
    },
    {
      id: 'yr_3',
      timeOfDay: 'Midday',
      title: 'IT & Desk Worker Chair Pose & Cervical Care',
      sanskritName: 'उत्कटासन एवं ग्रीवा संचालन (Chair Pose)',
      type: 'Asana',
      durationMins: 8,
      stressTarget: 'Moderate',
      exerciseType: 'chair_pose',
      description: 'Quick micro-break routine tailored for screen-heavy professionals to strengthen spinal erectors, thighs, and release neck stiffness.',
      steps: [
        'Stand with feet hip-width, inhale arms overhead.',
        'Exhale and bend knees as if sitting back into an imaginary chair.',
        'Draw belly in and keep chest lifted with spine lengthened.'
      ],
      benefits: [
        'Relieves posture fatigue from extended 8+ hour screen exposure',
        'Prevents lumbar disc compression and neck stiffness',
        'Restores blood circulation during afternoon slumps'
      ],
      indianHabitContext: 'Designed to be performed right near your desk without needing a full gym mat.'
    },
    {
      id: 'yr_dog',
      timeOfDay: 'Evening',
      title: 'Downward Dog Spine Decompression',
      sanskritName: 'अधोमुख श्वानासन (Adho Mukha Svanasana)',
      type: 'Asana',
      durationMins: 10,
      stressTarget: 'All',
      exerciseType: 'downward_dog',
      description: 'An inverted V-shape posture that gently stretches hamstrings, decompresses spinal vertebrae, and enhances blood flow to the brain.',
      steps: [
        'Start on hands and knees, hands shoulder-width and feet hip-width.',
        'Press into palms, lift knees and send hips up and back.',
        'Lengthen through spine, relaxing neck between upper arms.'
      ],
      benefits: [
        'Decompresses lumbar spine and lengthens tight posterior chain',
        'Calms the nervous system and relieves mild depression',
        'Strengthens arms, shoulders, and wrists'
      ],
      precautions: 'Micro-bend knees if hamstrings or lower back feel overly tight.',
      indianHabitContext: 'Excellent evening transition after commute to release back tightness.'
    },
    {
      id: 'yr_2',
      timeOfDay: 'Morning',
      title: 'Anulom Vilom & Nadi Shodhana',
      sanskritName: 'अनुलोम विलोम एवं नाड़ी शोधन',
      type: 'Pranayama',
      durationMins: 10,
      stressTarget: 'High',
      exerciseType: 'mountain_pose',
      description: 'Alternate nostril breathing technique that balances the sympathetic and parasympathetic nervous systems, reducing morning anxiety and blood pressure spikes.',
      steps: [
        'Sit comfortably in Sukhasana or Padmasana with spinal column upright.',
        'Close right nostril with thumb, inhale gently through left nostril for 4 seconds.',
        'Close left nostril, exhale through right nostril for 4 seconds. Repeat in reverse.'
      ],
      benefits: [
        'Calms autonomic nervous system within 5 minutes',
        'Purifies energetic channels (Nadis) and reduces mental chatter',
        'Improves concentration for busy work schedules'
      ],
      indianHabitContext: 'Ideal for countering morning commute stress or pre-work tension in Indian urban environments.'
    },
    {
      id: 'yr_4',
      timeOfDay: 'Evening',
      title: 'Bhramari & Sunset Vagus Nerve Calmer',
      sanskritName: 'भ्रामरी प्राणायाम',
      type: 'Pranayama',
      durationMins: 10,
      stressTarget: 'High',
      exerciseType: 'mountain_pose',
      description: 'Humming bee breath that produces nitric oxide in nasal passages and triggers instant vagal nerve stimulation to dissipate evening mental exhaustion.',
      steps: [
        'Place thumbs over ear tragus and gently cover eyes with fingers (Shanmukhi Mudra).',
        'Inhale deeply through nose, then emit a smooth, continuous humming sound like a bee while exhaling.',
        'Feel the sound resonance vibrate throughout your brain and facial sinus passages.'
      ],
      benefits: [
        'Lowers cortisol levels after high-stress work calls',
        'Relieves tension headaches and sinus congestion',
        'Prepares the mind for peaceful family interactions'
      ],
      indianHabitContext: 'Perfect transition exercise after returning home from work before dinner.'
    },
    {
      id: 'yr_5',
      timeOfDay: 'Night',
      title: 'Viparita Karani & Deep Yoga Nidra',
      sanskritName: 'विपरीत करणी एवं योग निद्रा',
      type: 'Restorative',
      durationMins: 15,
      stressTarget: 'All',
      exerciseType: 'mountain_pose',
      description: 'Restorative legs-up-the-wall posture followed by systematic body scanning to alleviate insomnia, restless leg feelings, and chronic hyperarousal.',
      steps: [
        'Lie flat on back with legs resting vertically against a wall for 5 minutes.',
        'Transition to Shavasana with a light blanket over the abdomen.',
        'Follow a 10-minute guided mental body scan, consciously releasing tension from toes to crown.'
      ],
      benefits: [
        'Enhances venous lymphatic drainage from lower extremities',
        'Deepens Delta wave non-REM restorative sleep duration',
        'Reduces nighttime blood pressure and heart rate'
      ],
      precautions: 'If suffering from severe glaucoma or heart conditions, keep legs elevated on a pillow instead of high wall inversion.',
      indianHabitContext: 'Best practiced 1 hour after a light dinner and warm golden milk (Haldi Doodh).'
    }
  ];

  const filteredRoutines = routines.filter((r) => {
    if (selectedGoal === 'desk' && !r.title.toLowerCase().includes('desk') && !r.title.toLowerCase().includes('cervical')) return false;
    if (selectedGoal === 'respiratory' && !r.benefits.some(b => b.toLowerCase().includes('pulmonary') || b.toLowerCase().includes('lung') || b.toLowerCase().includes('sinus'))) return false;
    if (selectedGoal === 'stress' && r.stressTarget !== 'High' && r.type !== 'Pranayama') return false;
    return true;
  });

  const toggleComplete = (id: string) => {
    setCompletedRoutineIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const startGuidedTimer = (routine: YogaRoutineItem) => {
    setActiveRoutine(routine);
    setTimerSeconds(routine.durationMins * 60);
    setIsTimerRunning(true);
  };

  React.useEffect(() => {
    let timer: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      timer = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (activeRoutine) {
        toggleComplete(activeRoutine.id);
      }
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timerSeconds, activeRoutine]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-teal-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Personalized Yogic Dinacharya</span>
            </span>
            <span className="text-[10px] text-teal-200/80 font-medium">Adapted for Indian Routines</span>
          </div>
          <h3 className="text-2xl font-bold font-serif-editorial italic text-white">
            Daily Yoga & Pranayama Wellness Engine
          </h3>
          <p className="text-xs text-teal-100/90 leading-relaxed">
            Authentic, evidence-based yogic schedules designed to combat workday burnout, desk posture fatigue, and respiratory stress in urban Indian lifestyles.
          </p>
        </div>

        {/* Stress Customization Widget */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0 space-y-2 text-xs w-full md:w-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200 block">Current Daily Stress Perception</span>
          <div className="flex gap-1.5">
            {(['low', 'moderate', 'high'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setStressLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  stressLevel === lvl
                    ? lvl === 'high' ? 'bg-rose-500 text-white' : lvl === 'moderate' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                    : 'bg-black/30 text-teal-200 hover:bg-black/40'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Yoga Coach Interactive Banner */}
      {!isAICoachOpen && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 border-2 border-teal-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center shrink-0 shadow-lg mt-0.5">
              <Camera className="w-6 h-6 text-amber-300" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-400/30">
                  New Interactive Feature
                </span>
                <span className="text-[10px] text-teal-200/80 font-mono">100% On-Device AI Vision</span>
              </div>
              <h4 className="text-xl font-bold font-serif-editorial italic text-white">
                AI Yoga Coach
              </h4>
              <p className="text-xs text-teal-100/90 leading-relaxed max-w-xl">
                Perform your yoga with real-time AI posture guidance. The AI analyzes joint angles and spinal alignment in real-time through your camera with zero video uploads.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setAiCoachExerciseId('yr_1');
              setIsAICoachOpen(true);
            }}
            className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Camera className="w-4 h-4 text-slate-950" />
            <span>Start AI Yoga Session</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      )}

      {/* Active AI Yoga Coach View */}
      {isAICoachOpen && (
        <AIYogaCoach
          exerciseType={aiCoachExerciseId}
          onClose={() => setIsAICoachOpen(false)}
        />
      )}

      {/* Goal Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Focus Target:</span>
        <button
          onClick={() => setSelectedGoal('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedGoal === 'all'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          All Full-Day Schedule
        </button>
        <button
          onClick={() => setSelectedGoal('desk')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedGoal === 'desk'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Desk & Cervical Posture Relief
        </button>
        <button
          onClick={() => setSelectedGoal('respiratory')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedGoal === 'respiratory'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Lung Capacity & Air Quality Care
        </button>
        <button
          onClick={() => setSelectedGoal('stress')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedGoal === 'stress'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Anxiety & Cortisol Lowering
        </button>
      </div>

      {/* Active Guided Timer Modal/Banner */}
      {activeRoutine && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-700 text-white shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">Active Practice Session</span>
                <h4 className="text-base font-bold text-white">{activeRoutine.title} ({activeRoutine.sanskritName})</h4>
              </div>
            </div>

            <div className="text-right">
              <span className="text-3xl font-black font-mono text-teal-300 block">{formatTimer(timerSeconds)}</span>
              <span className="text-[10px] text-slate-400">Remaining</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 italic bg-white/5 p-3 rounded-xl border border-white/10">
            "{activeRoutine.description}"
          </p>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-xs"
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTimerRunning ? 'Pause Session' : 'Resume Session'}</span>
              </button>

              <button
                onClick={() => setTimerSeconds(activeRoutine.durationMins * 60)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setIsTimerRunning(false);
                setActiveRoutine(null);
              }}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* Routine Cards Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRoutines.map((routine) => {
          const isCompleted = completedRoutineIds.includes(routine.id);
          const isMorning = routine.timeOfDay === 'Morning';
          const isMidday = routine.timeOfDay === 'Midday';
          const isEvening = routine.timeOfDay === 'Evening';

          const headerColor = isMorning
            ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
            : isMidday
            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'
            : isEvening
            ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800'
            : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800';

          return (
            <div
              key={routine.id}
              className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border shadow-xs transition-all space-y-4 ${
                isCompleted
                  ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${headerColor} flex items-center gap-1`}>
                      {isMorning ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                      <span>{routine.timeOfDay} • {routine.durationMins} Mins</span>
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                      {routine.type}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
                    <span>{routine.title}</span>
                  </h4>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-serif italic">
                    {routine.sanskritName}
                  </p>
                </div>

                <button
                  onClick={() => toggleComplete(routine.id)}
                  className={`p-2 rounded-xl transition-all shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-emerald-600'
                  }`}
                  title={isCompleted ? 'Completed' : 'Mark as completed'}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {routine.description}
              </p>

              {/* Steps List */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/80 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Step-by-Step Execution</span>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {routine.steps.map((step, idx) => (
                    <li key={idx} className="leading-snug">{step}</li>
                  ))}
                </ol>
              </div>

              {/* Benefits & Precautions */}
              <div className="space-y-2 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {routine.benefits.map((benefit, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3 text-teal-600 shrink-0" />
                      <span>{benefit}</span>
                    </span>
                  ))}
                </div>

                {routine.precautions && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400/90 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Precaution:</strong> {routine.precautions}</span>
                  </p>
                )}
              </div>

              {/* Indian Context Footer & Start Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 italic min-w-0 flex-1 break-words">
                  💡 {routine.indianHabitContext}
                </span>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAiCoachExerciseId(routine.exerciseType || routine.id);
                      setIsAICoachOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
                    title={`Practice ${routine.title} with AI posture coach`}
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-100" />
                    <span>Practice with AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startGuidedTimer(routine)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all hover:scale-102 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Timer Guide</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Ayurvedic Dinacharya & Lifestyle Tips Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-3xl p-6 border border-amber-200 dark:border-amber-800/60 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
          <HeartHandshake className="w-5 h-5 text-amber-600" />
          <h4 className="text-sm font-extrabold uppercase tracking-wider">Holistic Indian Dinacharya (Daily Routine) Guidelines</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-amber-900/90 dark:text-amber-200/90">
          <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 space-y-1">
            <span className="font-bold text-amber-800 dark:text-amber-300 block">🌅 Ushapan (Morning Water)</span>
            <p>Drink 2 glasses of lukewarm copper vessel water immediately upon waking to flush toxins and activate gastrointestinal peristalsis.</p>
          </div>
          <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 space-y-1">
            <span className="font-bold text-amber-800 dark:text-amber-300 block">🥗 Ahara (Sattvic Nutrition)</span>
            <p>Prioritize fresh, home-cooked, spiced meals (curcumin, cumin, coriander) and avoid heavy fried evening snacks before practice.</p>
          </div>
          <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 space-y-1">
            <span className="font-bold text-amber-800 dark:text-amber-300 block">🥛 Golden Milk (Haldi Doodh)</span>
            <p>Consume warm milk with pure turmeric and pinch of black pepper 30 minutes before bed to reduce systemic muscular inflammation.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
