import React, { useState, useMemo } from 'react';
import {
  Scale,
  Activity,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowRight,
  RefreshCw,
  Sliders,
  Sparkles
} from 'lucide-react';

export interface BmiCalculatorModuleProps {
  initialWeightKg?: number;
  initialHeightCm?: number;
  onApplyWeight?: (weightKg: number) => void;
  className?: string;
}

type UnitSystem = 'metric' | 'imperial';
type GuidelineType = 'who' | 'icmr'; // WHO Universal vs ICMR/Asian Standard

interface BmiCategory {
  label: string;
  min: number;
  max: number;
  status: 'underweight' | 'normal' | 'overweight' | 'obese';
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
  healthAdvice: string;
}

export const BmiCalculatorModule: React.FC<BmiCalculatorModuleProps> = ({
  initialWeightKg = 68.5,
  initialHeightCm = 170,
  onApplyWeight,
  className = '',
}) => {
  // Unit & Guideline State
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [guideline, setGuideline] = useState<GuidelineType>('who');

  // Metric raw values
  const [heightCm, setHeightCm] = useState<number>(initialHeightCm);
  const [weightKg, setWeightKg] = useState<number>(initialWeightKg);

  // Imperial raw inputs (kept in sync when toggling or editing)
  const [feet, setFeet] = useState<number>(Math.floor(initialHeightCm / 30.48) || 5);
  const [inches, setInches] = useState<number>(Math.round((initialHeightCm % 30.48) / 2.54) || 7);
  const [weightLbs, setWeightLbs] = useState<number>(Math.round(initialWeightKg * 2.20462) || 151);

  // Handler for metric height change
  const handleHeightCmChange = (val: number) => {
    const clamped = Math.max(80, Math.min(240, val));
    setHeightCm(clamped);
    const totalInches = clamped / 2.54;
    setFeet(Math.floor(totalInches / 12));
    setInches(Math.round(totalInches % 12));
  };

  // Handler for imperial height change
  const handleImperialHeightChange = (newFeet: number, newInches: number) => {
    setFeet(newFeet);
    setInches(newInches);
    const totalInches = newFeet * 12 + newInches;
    const cm = Math.round(totalInches * 2.54);
    setHeightCm(Math.max(80, Math.min(240, cm)));
  };

  // Handler for metric weight change
  const handleWeightKgChange = (val: number) => {
    const clamped = Math.max(25, Math.min(250, Math.round(val * 10) / 10));
    setWeightKg(clamped);
    setWeightLbs(Math.round(clamped * 2.20462 * 10) / 10);
  };

  // Handler for imperial weight change
  const handleWeightLbsChange = (val: number) => {
    const clamped = Math.max(55, Math.min(550, Math.round(val * 10) / 10));
    setWeightLbs(clamped);
    const kg = Math.round((clamped / 2.20462) * 10) / 10;
    setWeightKg(kg);
  };

  // Calculate BMI
  const bmiResult = useMemo(() => {
    if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) {
      return null;
    }
    const heightInMeters = heightCm / 100;
    const bmiValue = weightKg / (heightInMeters * heightInMeters);
    const roundedBmi = Math.round(bmiValue * 10) / 10;

    // Normal weight range for this height (WHO: 18.5 - 24.9)
    const minHealthyKg = Math.round(18.5 * heightInMeters * heightInMeters * 10) / 10;
    const maxHealthyKg = Math.round(24.9 * heightInMeters * heightInMeters * 10) / 10;
    const minHealthyLbs = Math.round(minHealthyKg * 2.20462 * 10) / 10;
    const maxHealthyLbs = Math.round(maxHealthyKg * 2.20462 * 10) / 10;

    // Difference from healthy range
    let weightDiffKg = 0;
    let weightStatusNote = '';

    if (roundedBmi < 18.5) {
      weightDiffKg = Math.round((minHealthyKg - weightKg) * 10) / 10;
      weightStatusNote = `${weightDiffKg} kg (${Math.round(weightDiffKg * 2.20462 * 10) / 10} lbs) below healthy minimum`;
    } else if (roundedBmi > 24.9) {
      weightDiffKg = Math.round((weightKg - maxHealthyKg) * 10) / 10;
      weightStatusNote = `${weightDiffKg} kg (${Math.round(weightDiffKg * 2.20462 * 10) / 10} lbs) above healthy maximum`;
    } else {
      weightStatusNote = 'Currently inside recommended optimal range';
    }

    return {
      bmi: roundedBmi,
      minHealthyKg,
      maxHealthyKg,
      minHealthyLbs,
      maxHealthyLbs,
      weightDiffKg,
      weightStatusNote,
    };
  }, [heightCm, weightKg]);

  // Categories definitions based on selected guideline
  const categories: BmiCategory[] = useMemo(() => {
    if (guideline === 'icmr') {
      // Asian Indian ICMR/WHO guidelines
      return [
        {
          label: 'Underweight',
          min: 0,
          max: 18.4,
          status: 'underweight',
          color: '#38bdf8', // sky-400
          badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
          badgeText: 'text-sky-800 dark:text-sky-300',
          badgeBorder: 'border-sky-300 dark:border-sky-800',
          description: 'BMI below 18.5 (Asian-Indian Standard)',
          healthAdvice: 'Focus on nutrient-dense meals, protein intake, and consult a nutritionist to safely achieve healthy muscle mass.',
        },
        {
          label: 'Normal',
          min: 18.5,
          max: 22.9,
          status: 'normal',
          color: '#10b981', // emerald-500
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
          badgeText: 'text-emerald-800 dark:text-emerald-300',
          badgeBorder: 'border-emerald-300 dark:border-emerald-800',
          description: 'BMI 18.5 – 22.9 (Healthy Range)',
          healthAdvice: 'Great job! Maintain consistent physical activity, balanced whole-food meals, and routine vitals checks.',
        },
        {
          label: 'Overweight',
          min: 23.0,
          max: 24.9,
          status: 'overweight',
          color: '#f59e0b', // amber-500
          badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
          badgeText: 'text-amber-800 dark:text-amber-300',
          badgeBorder: 'border-amber-300 dark:border-amber-800',
          description: 'BMI 23.0 – 24.9 (Elevated Risk for South Asians)',
          healthAdvice: 'Slightly elevated metabolic risk. Adopt brisk walking (30 min/day) and reduce refined carbs and saturated oils.',
        },
        {
          label: 'Obese',
          min: 25.0,
          max: 50,
          status: 'obese',
          color: '#f43f5e', // rose-500
          badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
          badgeText: 'text-rose-800 dark:text-rose-300',
          badgeBorder: 'border-rose-300 dark:border-rose-800',
          description: 'BMI ≥ 25.0 (Clinical Obesity in Asian population)',
          healthAdvice: 'Higher risk of cardiometabolic conditions. We recommend reviewing with a doctor to design a structured lifestyle plan.',
        },
      ];
    }

    // Universal WHO Standard
    return [
      {
        label: 'Underweight',
        min: 0,
        max: 18.4,
        status: 'underweight',
        color: '#38bdf8', // sky-400
        badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
        badgeText: 'text-sky-800 dark:text-sky-300',
        badgeBorder: 'border-sky-300 dark:border-sky-800',
        description: 'BMI < 18.5 (Below standard weight)',
        healthAdvice: 'Increased risk of nutritional deficiency or lowered immunity. Consider calorie-dense whole foods and strength conditioning.',
      },
      {
        label: 'Normal',
        min: 18.5,
        max: 24.9,
        status: 'normal',
        color: '#10b981', // emerald-500
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        badgeText: 'text-emerald-800 dark:text-emerald-300',
        badgeBorder: 'border-emerald-300 dark:border-emerald-800',
        description: 'BMI 18.5 – 24.9 (Healthy Standard Weight)',
        healthAdvice: 'Optimal body mass index associated with lowest risks of cardiovascular and metabolic complications. Keep up your active lifestyle!',
      },
      {
        label: 'Overweight',
        min: 25.0,
        max: 29.9,
        status: 'overweight',
        color: '#f59e0b', // amber-500
        badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
        badgeText: 'text-amber-800 dark:text-amber-300',
        badgeBorder: 'border-amber-300 dark:border-amber-800',
        description: 'BMI 25.0 – 29.9 (Pre-obesity range)',
        healthAdvice: 'Moderate risk of hypertension and insulin resistance. Caloric moderation and regular aerobic exercise can bring vitals into normal range.',
      },
      {
        label: 'Obese',
        min: 30.0,
        max: 50,
        status: 'obese',
        color: '#f43f5e', // rose-500
        badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
        badgeText: 'text-rose-800 dark:text-rose-300',
        badgeBorder: 'border-rose-300 dark:border-rose-800',
        description: 'BMI ≥ 30.0 (High Health Risk)',
        healthAdvice: 'Elevated risk of cardiovascular disease, fatty liver, and diabetes. Schedule an evaluation with a healthcare provider.',
      },
    ];
  }, [guideline]);

  // Current category match
  const currentCategory = useMemo(() => {
    if (!bmiResult) return categories[1];
    const { bmi } = bmiResult;
    for (const cat of categories) {
      if (bmi <= cat.max) {
        return cat;
      }
    }
    return categories[categories.length - 1];
  }, [bmiResult, categories]);

  // Gauge pointer calculation (scale mapped from BMI 14 to 38 = 0% to 100%)
  const gaugePercent = useMemo(() => {
    if (!bmiResult) return 50;
    const minScale = 14;
    const maxScale = 38;
    const raw = ((bmiResult.bmi - minScale) / (maxScale - minScale)) * 100;
    return Math.max(3, Math.min(97, Math.round(raw)));
  }, [bmiResult]);

  // Reset to default
  const handleReset = () => {
    handleHeightCmChange(initialHeightCm);
    handleWeightKgChange(initialWeightKg);
  };

  return (
    <div
      className={`bg-white dark:bg-[#18261e] rounded-3xl p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-5 ${className}`}
    >
      {/* Header with Title and Unit/Standard Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#e6dfd3] dark:border-[#23382b] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1b3b2b] text-[#a3d4b6] flex items-center justify-center shrink-0 shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-2">
              <span>BMI Health Calculator</span>
            </h2>
            <p className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0]">
              Evaluate body composition status with clinical range analysis.
            </p>
          </div>
        </div>

        {/* Unit and Standard Switchers */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Unit Toggle */}
          <div className="inline-flex p-0.5 rounded-xl bg-[#f6f2e9] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#23382b] text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setUnitSystem('metric')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                unitSystem === 'metric'
                  ? 'bg-[#1b3b2b] text-white shadow-xs'
                  : 'text-[#5c5647] dark:text-[#b0aaa0] hover:text-[#1b3b2b] dark:hover:text-white'
              }`}
            >
              Metric (cm/kg)
            </button>
            <button
              type="button"
              onClick={() => setUnitSystem('imperial')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                unitSystem === 'imperial'
                  ? 'bg-[#1b3b2b] text-white shadow-xs'
                  : 'text-[#5c5647] dark:text-[#b0aaa0] hover:text-[#1b3b2b] dark:hover:text-white'
              }`}
            >
              Imperial (ft/lbs)
            </button>
          </div>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset to initial values"
            className="p-1.5 rounded-xl text-[#5c5647] dark:text-[#b0aaa0] hover:text-[#1b3b2b] dark:hover:text-white hover:bg-[#f6f2e9] dark:hover:bg-[#23382b] border border-[#e6dfd3] dark:border-[#23382b] transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inputs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Height Input Card */}
        <div className="p-4 rounded-2xl bg-[#fbf9f5] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#1b3b2b] dark:text-[#d3e3d8]">
              Height
            </label>
            <span className="text-xs font-extrabold text-[#1b3b2b] dark:text-[#a3d4b6]">
              {unitSystem === 'metric' ? `${heightCm} cm` : `${feet} ft ${inches} in`}
            </span>
          </div>

          {unitSystem === 'metric' ? (
            <div className="space-y-2">
              <input
                type="range"
                min={100}
                max={225}
                step={1}
                value={heightCm}
                onChange={(e) => handleHeightCmChange(Number(e.target.value))}
                className="w-full accent-[#1b3b2b] dark:accent-[#a3d4b6] cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={80}
                  max={240}
                  value={heightCm}
                  onChange={(e) => handleHeightCmChange(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#18261e] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                  placeholder="170"
                />
                <span className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0] font-medium shrink-0">
                  cm
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[#5c5647] dark:text-[#b0aaa0] font-semibold block mb-0.5">
                    Feet (ft)
                  </span>
                  <input
                    type="number"
                    min={3}
                    max={7}
                    value={feet}
                    onChange={(e) => handleImperialHeightChange(Number(e.target.value), inches)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#18261e] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#5c5647] dark:text-[#b0aaa0] font-semibold block mb-0.5">
                    Inches (in)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={11}
                    value={inches}
                    onChange={(e) => handleImperialHeightChange(feet, Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#18261e] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                  />
                </div>
              </div>
              <p className="text-[10px] text-[#5c5647] dark:text-[#b0aaa0]">
                Equivalent: {heightCm} cm
              </p>
            </div>
          )}
        </div>

        {/* Weight Input Card */}
        <div className="p-4 rounded-2xl bg-[#fbf9f5] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#1b3b2b] dark:text-[#d3e3d8]">
              Weight
            </label>
            <span className="text-xs font-extrabold text-[#1b3b2b] dark:text-[#a3d4b6]">
              {unitSystem === 'metric' ? `${weightKg} kg` : `${weightLbs} lbs`}
            </span>
          </div>

          {unitSystem === 'metric' ? (
            <div className="space-y-2">
              <input
                type="range"
                min={30}
                max={160}
                step={0.5}
                value={weightKg}
                onChange={(e) => handleWeightKgChange(Number(e.target.value))}
                className="w-full accent-[#1b3b2b] dark:accent-[#a3d4b6] cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={25}
                  max={250}
                  step={0.1}
                  value={weightKg}
                  onChange={(e) => handleWeightKgChange(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#18261e] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                  placeholder="68.5"
                />
                <span className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0] font-medium shrink-0">
                  kg
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="range"
                min={66}
                max={350}
                step={1}
                value={weightLbs}
                onChange={(e) => handleWeightLbsChange(Number(e.target.value))}
                className="w-full accent-[#1b3b2b] dark:accent-[#a3d4b6] cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={55}
                  max={550}
                  step={0.5}
                  value={weightLbs}
                  onChange={(e) => handleWeightLbsChange(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#18261e] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                  placeholder="151"
                />
                <span className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0] font-medium shrink-0">
                  lbs
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Status Indicator & BMI Readout */}
      {bmiResult && (
        <div className="space-y-4">
          {/* Main Visual Status Card */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${currentCategory.badgeBg} ${currentCategory.badgeBorder}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5c5647] dark:text-[#b0aaa0]">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Calculated Body Mass Index</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#1b3b2b] dark:text-[#f2f0e8] tracking-tight">
                    {bmiResult.bmi}
                  </span>
                  <span className="text-xs font-semibold text-[#5c5647] dark:text-[#b0aaa0]">
                    kg/m²
                  </span>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${currentCategory.badgeBg} ${currentCategory.badgeText} ${currentCategory.badgeBorder}`}
                  >
                    {currentCategory.status === 'normal' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{currentCategory.label}</span>
                  </div>
                </div>
              </div>

              {/* Apply to Vitals Action */}
              {onApplyWeight && (
                <button
                  type="button"
                  onClick={() => onApplyWeight(weightKg)}
                  className="px-3.5 py-2 rounded-xl bg-[#1b3b2b] hover:bg-[#284f3b] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  title="Apply calculated weight into today's vitals log form"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#a3d4b6]" />
                  <span>Sync to Vitals Form</span>
                </button>
              )}
            </div>

            {/* Visual Gauge Bar */}
            <div className="mt-5 pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#5c5647] dark:text-[#b0aaa0] mb-1">
                <span>Standard Health Range Gauge</span>
                <span className="font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                  {currentCategory.description}
                </span>
              </div>

              {/* Spectrum Track with Dynamic Pointer */}
              <div className="relative pt-6 pb-2">
                {/* Floating Pointer Indicator */}
                <div
                  className="absolute top-0 transform -translate-x-1/2 transition-all duration-300 ease-out flex flex-col items-center z-10"
                  style={{ left: `${gaugePercent}%` }}
                >
                  <span className="bg-[#1b3b2b] text-white dark:bg-white dark:text-[#1b3b2b] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-md whitespace-nowrap">
                    {bmiResult.bmi}
                  </span>
                  <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1b3b2b] dark:border-t-white" />
                </div>

                {/* 4 Multi-Segment Track */}
                <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 shadow-inner">
                  {/* Underweight: < 18.5 */}
                  <div
                    className={`h-full transition-opacity ${
                      currentCategory.status === 'underweight' ? 'opacity-100' : 'opacity-50'
                    }`}
                    style={{ width: '22%', backgroundColor: '#38bdf8' }}
                    title="Underweight (< 18.5)"
                  />
                  {/* Normal: 18.5 - 24.9 */}
                  <div
                    className={`h-full transition-opacity ${
                      currentCategory.status === 'normal' ? 'opacity-100' : 'opacity-50'
                    }`}
                    style={{ width: '30%', backgroundColor: '#10b981' }}
                    title="Normal (18.5 - 24.9)"
                  />
                  {/* Overweight: 25 - 29.9 */}
                  <div
                    className={`h-full transition-opacity ${
                      currentCategory.status === 'overweight' ? 'opacity-100' : 'opacity-50'
                    }`}
                    style={{ width: '24%', backgroundColor: '#f59e0b' }}
                    title="Overweight (25.0 - 29.9)"
                  />
                  {/* Obese: >= 30 */}
                  <div
                    className={`h-full transition-opacity ${
                      currentCategory.status === 'obese' ? 'opacity-100' : 'opacity-50'
                    }`}
                    style={{ width: '24%', backgroundColor: '#f43f5e' }}
                    title="Obese (≥ 30.0)"
                  />
                </div>
              </div>

              {/* Segment Labels */}
              <div className="grid grid-cols-4 text-center text-[10px] font-semibold text-[#5c5647] dark:text-[#b0aaa0] pt-0.5">
                <div className="flex flex-col items-center">
                  <span className="text-sky-700 dark:text-sky-400 font-bold">Underweight</span>
                  <span className="text-[9px] text-[#827b6c] dark:text-[#969082]">&lt; 18.5</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Normal</span>
                  <span className="text-[9px] text-[#827b6c] dark:text-[#969082]">18.5 – 24.9</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-amber-700 dark:text-amber-400 font-bold">Overweight</span>
                  <span className="text-[9px] text-[#827b6c] dark:text-[#969082]">25 – 29.9</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-rose-700 dark:text-rose-400 font-bold">Obese</span>
                  <span className="text-[9px] text-[#827b6c] dark:text-[#969082]">≥ 30.0</span>
                </div>
              </div>
            </div>

            {/* Clinical Health Guidance Details */}
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 space-y-2 text-xs">
              <p className="leading-relaxed text-[#1b3b2b] dark:text-[#f2f0e8]">
                {currentCategory.healthAdvice}
              </p>
            </div>
          </div>

          {/* Target Weight Window & Reference Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#f8f5ee] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] space-y-1">
              <span className="font-bold text-[#1b3b2b] dark:text-[#d3e3d8] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#2b503b] dark:text-[#a3d4b6]" />
                <span>Healthy Weight Target Range</span>
              </span>
              <p className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0]">
                For height {heightCm} cm ({feet} ft {inches} in):
              </p>
              <p className="font-extrabold text-[#1b3b2b] dark:text-[#a3d4b6] text-xs">
                {bmiResult.minHealthyKg} kg – {bmiResult.maxHealthyKg} kg
                <span className="font-normal text-[11px] text-[#5c5647] dark:text-[#b0aaa0] ml-1.5">
                  ({bmiResult.minHealthyLbs} – {bmiResult.maxHealthyLbs} lbs)
                </span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8f5ee] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] space-y-1">
              <span className="font-bold text-[#1b3b2b] dark:text-[#d3e3d8] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Weight Balance Assessment</span>
              </span>
              <p className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0]">
                Status relative to healthy window:
              </p>
              <p
                className={`font-bold text-xs ${
                  currentCategory.status === 'normal'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-[#8b263e] dark:text-rose-400'
                }`}
              >
                {bmiResult.weightStatusNote}
              </p>
            </div>
          </div>

          {/* Guideline Classification Selector (WHO vs ICMR Asian Standard) */}
          <div className="flex items-center justify-between text-[11px] pt-1 px-1">
            <span className="text-[#5c5647] dark:text-[#b0aaa0] flex items-center gap-1">
              <Sliders className="w-3 h-3" />
              <span>Diagnostic Guideline Standard:</span>
            </span>
            <div className="inline-flex gap-2">
              <button
                type="button"
                onClick={() => setGuideline('who')}
                className={`font-semibold transition-colors cursor-pointer ${
                  guideline === 'who'
                    ? 'text-[#1b3b2b] dark:text-[#a3d4b6] underline'
                    : 'text-[#827b6c] dark:text-[#969082] hover:text-[#1b3b2b]'
                }`}
              >
                WHO Global
              </button>
              <span className="text-[#827b6c] dark:text-[#969082]">·</span>
              <button
                type="button"
                onClick={() => setGuideline('icmr')}
                className={`font-semibold transition-colors cursor-pointer ${
                  guideline === 'icmr'
                    ? 'text-[#1b3b2b] dark:text-[#a3d4b6] underline'
                    : 'text-[#827b6c] dark:text-[#969082] hover:text-[#1b3b2b]'
                }`}
              >
                ICMR Asian-Indian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BmiCalculatorModule;
