import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Activity,
  Plus,
  TrendingUp,
  TrendingDown,
  HeartPulse,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Loader2,
  FileSpreadsheet,
  Download,
  Filter,
  Moon,
  Info,
  ChevronRight,
  Smile,
  Mic,
  MicOff,
  X,
  Scale,
  FileDown,
  FileText,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts';
import jsPDF from 'jspdf';
import { HealthMetricLog, HealthProgressAnalysisResult, UserProfile } from '../../types';
import { auditLogger } from '../../services/AuditLogger';
import { JevanCareLoader } from '../common/JevanCareLoader';
import { useTheme } from '../../context/ThemeContext';
import { BmiCalculatorModule } from './BmiCalculatorModule';

interface HealthProgressTrackerProps {
  metrics?: HealthMetricLog[];
  onAddMetricLog?: (log: HealthMetricLog) => void;
  userProfile?: UserProfile;
  profile?: UserProfile;
  setActiveTab?: (tab: string) => void;
}

type TimeRangeFilter = 'week' | 'month' | 'all';

export const HealthProgressTracker: React.FC<HealthProgressTrackerProps> = ({
  metrics = [],
  onAddMetricLog = (_log: HealthMetricLog) => {},
  userProfile,
  profile,
  setActiveTab = (_tab: string) => {},
}) => {
  const currentProfile = userProfile || profile || {
    id: 'u1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@health.in',
    phone: '+91 98765 43210',
    role: 'patient',
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Dust Mites'],
    chronicConditions: ['Mild Asthma'],
    emergencyContactName: 'Pooja Sharma',
    emergencyContactPhone: '+91 98765 12345',
    isEmergencySharingEnabled: true,
  };

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? '#283c2e' : '#e6dfd3';
  const axisColor = isDark ? '#969082' : '#827b6c';

  const safeMetrics = useMemo(() => metrics || [], [metrics]);

  // Range Filter State
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('month');

  // Form State
  const [systolic, setSystolic] = useState('118');
  const [diastolic, setDiastolic] = useState('78');
  const [bloodSugar, setBloodSugar] = useState('105');
  const [weight, setWeight] = useState('68.5');
  const [temp, setTemp] = useState('98.4');
  const [sleep, setSleep] = useState('7.5');
  const [pain, setPain] = useState(2);
  const [mood, setMood] = useState<'Great' | 'Good' | 'Neutral' | 'Poor' | 'Severe'>('Good');
  const [symptomText, setSymptomText] = useState('');

  // AI Progress Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<HealthProgressAnalysisResult | null>(null);

  // Export & Report State
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Chart View Mode State ('combined' | 'weight' | 'bp')
  const [chartViewMode, setChartViewMode] = useState<'combined' | 'weight' | 'bp'>('combined');

  // 7-Day Trend Indicator Icons Toggle on Chart Data Points
  const [showTrendIndicators, setShowTrendIndicators] = useState<boolean>(true);

  // Speech Recognition / Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [parsedSummary, setParsedSummary] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up SpeechRecognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  // Natural Language Voice Parser
  const parseAndFillVitals = useCallback((text: string) => {
    if (!text || !text.trim()) return;
    const lower = text.toLowerCase();
    const detected: string[] = [];

    // 1. Blood Pressure: e.g. "120 over 80", "bp 118 78", "120 by 80"
    const bpMatch = lower.match(/(?:bp|blood pressure)?\s*(\d{2,3})\s*(?:over|\/|by)\s*(\d{2,3})/i) ||
                    lower.match(/(?:bp|blood pressure)\s*(\d{2,3})\s+(\d{2,3})/i);
    if (bpMatch) {
      setSystolic(bpMatch[1]);
      setDiastolic(bpMatch[2]);
      detected.push(`BP: ${bpMatch[1]}/${bpMatch[2]}`);
    } else {
      const sysMatch = lower.match(/systolic\s*(?:is|of)?\s*(\d{2,3})/i);
      if (sysMatch) {
        setSystolic(sysMatch[1]);
        detected.push(`Systolic: ${sysMatch[1]}`);
      }
      const diaMatch = lower.match(/diastolic\s*(?:is|of)?\s*(\d{2,3})/i);
      if (diaMatch) {
        setDiastolic(diaMatch[1]);
        detected.push(`Diastolic: ${diaMatch[1]}`);
      }
    }

    // 2. Blood Sugar: e.g. "blood sugar 105", "sugar 110", "glucose 95"
    const sugarMatch = lower.match(/(?:blood sugar|sugar|glucose)\s*(?:is|of)?\s*(\d{2,3})/i) ||
                       lower.match(/(\d{2,3})\s*(?:mg\/dl|sugar|glucose)/i);
    if (sugarMatch) {
      setBloodSugar(sugarMatch[1]);
      detected.push(`Sugar: ${sugarMatch[1]} mg/dL`);
    }

    // 3. Weight: e.g. "weight 68.5", "weigh 70 kilos"
    const weightMatch = lower.match(/(?:weight|weigh|kilos|kg)\s*(?:is|of)?\s*(\d+(?:\.\d+)?)/i);
    if (weightMatch) {
      setWeight(weightMatch[1]);
      detected.push(`Weight: ${weightMatch[1]} kg`);
    }

    // 4. Temperature: e.g. "temp 98.4", "temperature 99"
    const tempMatch = lower.match(/(?:temp|temperature|fever)\s*(?:is|of)?\s*(\d{2,3}(?:\.\d+)?)/i);
    if (tempMatch) {
      setTemp(tempMatch[1]);
      detected.push(`Temp: ${tempMatch[1]}°F`);
    }

    // 5. Sleep: e.g. "sleep 7.5", "slept 8 hours"
    const sleepMatch = lower.match(/(?:sleep|slept)\s*(?:for)?\s*(\d+(?:\.\d+)?)/i);
    if (sleepMatch) {
      setSleep(sleepMatch[1]);
      detected.push(`Sleep: ${sleepMatch[1]} hrs`);
    }

    // 6. Pain index: e.g. "pain level 2", "pain 3"
    const painMatch = lower.match(/(?:pain|pain level|pain index)\s*(?:is|of)?\s*(\d{1,2})/i);
    if (painMatch) {
      const pVal = Math.min(10, Math.max(1, parseInt(painMatch[1])));
      setPain(pVal);
      detected.push(`Pain: ${pVal}/10`);
    }

    // 7. Mood: e.g. "feeling great", "good mood", "poor mood"
    if (lower.includes('great') || lower.includes('excellent')) {
      setMood('Great');
      detected.push('Mood: Great');
    } else if (lower.includes('good')) {
      setMood('Good');
      detected.push('Mood: Good');
    } else if (lower.includes('poor') || lower.includes('bad')) {
      setMood('Poor');
      detected.push('Mood: Poor');
    } else if (lower.includes('severe')) {
      setMood('Severe');
      detected.push('Mood: Severe');
    } else if (lower.includes('neutral') || lower.includes('okay')) {
      setMood('Neutral');
      detected.push('Mood: Neutral');
    }

    // 8. Symptoms: capture explicit phrase or symptom words
    const symptomMatch = lower.match(/(?:symptom|symptoms|notes?|feeling)\s*(?:are|is|like)?\s*(.+)/i);
    if (symptomMatch) {
      const cleanSymptom = symptomMatch[1].trim();
      setSymptomText(cleanSymptom);
      detected.push(`Symptoms: "${cleanSymptom}"`);
    } else {
      const keywords = ['headache', 'fever', 'cough', 'fatigue', 'nausea', 'dizziness', 'chest pain', 'back pain'];
      const found = keywords.filter((kw) => lower.includes(kw));
      if (found.length > 0) {
        setSymptomText(found.join(', '));
        detected.push(`Symptoms: ${found.join(', ')}`);
      }
    }

    if (detected.length > 0) {
      setParsedSummary(detected.join(' • '));
    }
  }, []);

  // Toggle Speech Recognition
  const toggleSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechNotice('Speech recognition is not supported in this browser window. Please type manually or try Chrome/Edge.');
      setTimeout(() => setSpeechNotice(null), 5000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Error stopping speech recognition:', e);
        }
      }
      setIsListening(false);
      setSpeechNotice(null);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setSpeechNotice('Voice Assistant Listening... Speak e.g., "BP 120 over 80, sugar 105, weight 68.5, sleep 7.5 hours, pain level 2"');
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setTranscript(currentTranscript);
            parseAndFillVitals(currentTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          setSpeechNotice(`Microphone note: ${event.error}. Click button to retry.`);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setIsListening(false);
        setSpeechNotice('Could not access microphone. Please verify browser permissions.');
      }
    }
  }, [isListening, parseAndFillVitals]);

  // Filter and sort metrics chronologically
  const filteredMetrics = useMemo(() => {
    if (safeMetrics.length === 0) return [];

    // Sort chronologically (oldest to newest for time-series charts)
    const sorted = [...safeMetrics].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const now = new Date();
    const latestDate = new Date(sorted[sorted.length - 1].timestamp);
    const referenceTime = Math.max(now.getTime(), latestDate.getTime());

    if (timeRange === 'week') {
      const sevenDaysAgo = new Date(referenceTime - 7 * 24 * 60 * 60 * 1000);
      const filtered = sorted.filter((m) => new Date(m.timestamp) >= sevenDaysAgo);
      return filtered.length > 0 ? filtered : sorted.slice(-7);
    } else if (timeRange === 'month') {
      const thirtyDaysAgo = new Date(referenceTime - 30 * 24 * 60 * 60 * 1000);
      const filtered = sorted.filter((m) => new Date(m.timestamp) >= thirtyDaysAgo);
      return filtered.length > 0 ? filtered : sorted.slice(-30);
    }
    return sorted;
  }, [safeMetrics, timeRange]);

  // Comprehensive summary statistics for Weight, BP, and Vitals
  const metricsStats = useMemo(() => {
    if (filteredMetrics.length === 0) return null;
    const latest = filteredMetrics[filteredMetrics.length - 1];
    const baseline = filteredMetrics[0];

    const weights = filteredMetrics.map((m) => m.weight).filter((w): w is number => typeof w === 'number' && !isNaN(w));
    const systolics = filteredMetrics.map((m) => m.systolicBp).filter((s): s is number => typeof s === 'number' && !isNaN(s));
    const diastolics = filteredMetrics.map((m) => m.diastolicBp).filter((d): d is number => typeof d === 'number' && !isNaN(d));
    const sugars = filteredMetrics.map((m) => m.bloodSugar).filter((s): s is number => typeof s === 'number' && !isNaN(s));
    const sleeps = filteredMetrics.map((m) => m.sleepHours).filter((s): s is number => typeof s === 'number' && !isNaN(s));
    const pains = filteredMetrics.map((m) => m.painLevel).filter((p): p is number => typeof p === 'number' && !isNaN(p));

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const latestWeight = latest.weight ?? 70;
    const baselineWeight = baseline.weight ?? 70;
    const weightChange = Number((latestWeight - baselineWeight).toFixed(1));

    const avgSys = Math.round(avg(systolics));
    const avgDia = Math.round(avg(diastolics));
    const avgWeight = Number(avg(weights).toFixed(1));
    const minWeight = weights.length ? Math.min(...weights) : latestWeight;
    const maxWeight = weights.length ? Math.max(...weights) : latestWeight;
    const avgSugar = Math.round(avg(sugars));
    const avgSleep = Number(avg(sleeps).toFixed(1));
    const avgPain = Number(avg(pains).toFixed(1));

    // Blood Pressure Clinical Category based on AHA guidelines
    let bpCategory = 'Optimal / Normal';
    let bpBadgeColor = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
    if (latest.systolicBp >= 140 || latest.diastolicBp >= 90) {
      bpCategory = 'Stage 2 Hypertension';
      bpBadgeColor = 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
    } else if (latest.systolicBp >= 130 || latest.diastolicBp >= 80) {
      bpCategory = 'Stage 1 Hypertension';
      bpBadgeColor = 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    } else if (latest.systolicBp >= 120 && latest.diastolicBp < 80) {
      bpCategory = 'Elevated Systolic';
      bpBadgeColor = 'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    }

    return {
      count: filteredMetrics.length,
      latest,
      baseline,
      latestWeight,
      baselineWeight,
      weightChange,
      avgWeight,
      minWeight,
      maxWeight,
      avgSys,
      avgDia,
      bpCategory,
      bpBadgeColor,
      avgSugar,
      avgSleep,
      avgPain
    };
  }, [filteredMetrics]);

  // 7-Day Movement Trend Calculation for Vitals Metrics
  // Calculates trailing delta and evaluates clinical health valence (positive vs negative trend)
  const get7DayTrend = useCallback((
    logDate: string,
    metricKey: string
  ): {
    delta: number;
    direction: 'up' | 'down' | 'neutral';
    isPositive: boolean;
    isNegative: boolean;
    isNeutral: boolean;
    color: string;
    badgeBg: string;
    label: string;
    unit: string;
    summaryText: string;
  } | null => {
    const curLog = safeMetrics.find((m) => m.timestamp === logDate);
    if (!curLog) return null;
    const curVal = (curLog as any)[metricKey];
    if (curVal === undefined || curVal === null || isNaN(Number(curVal))) return null;

    const curTime = new Date(logDate).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const targetTime = curTime - sevenDaysMs;

    // Search in chronological safeMetrics for prior reading nearest to 7 days ago
    let bestPrior: HealthMetricLog | null = null;
    let minDistance = Infinity;

    for (const m of safeMetrics) {
      if (m.timestamp === logDate) continue;
      const mTime = new Date(m.timestamp).getTime();
      if (mTime >= curTime) continue; // must be strictly in the past

      const val = (m as any)[metricKey];
      if (val === undefined || val === null || isNaN(Number(val))) continue;

      const dist = Math.abs(mTime - targetTime);
      if (dist < minDistance) {
        minDistance = dist;
        bestPrior = m;
      }
    }

    // If no reading in ~7-14 day window, fallback to the nearest preceding reading
    if (!bestPrior) {
      const earlierLogs = safeMetrics
        .filter((m) => new Date(m.timestamp).getTime() < curTime && (m as any)[metricKey] != null && !isNaN(Number((m as any)[metricKey])))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      if (earlierLogs.length > 0) {
        bestPrior = earlierLogs[0];
      }
    }

    if (!bestPrior) return null;

    const priorNum = Number((bestPrior as any)[metricKey]);
    const curNum = Number(curVal);
    const delta = Number((curNum - priorNum).toFixed(1));

    // Sensitivities
    const threshold = metricKey === 'weight' ? 0.2 : metricKey === 'sleepHours' ? 0.3 : 1;
    const direction: 'up' | 'down' | 'neutral' =
      delta > threshold ? 'up' : delta < -threshold ? 'down' : 'neutral';

    let isPositive = false;
    let isNegative = false;
    const isNeutral = direction === 'neutral';

    if (isNeutral) {
      isPositive = true; // stable readings are favorable in vitals monitoring
    } else if (metricKey === 'systolicBp' || metricKey === 'diastolicBp') {
      // Blood Pressure: Downward movement toward normal is positive, upward increase is negative
      if (direction === 'down') {
        isPositive = true;
      } else {
        isNegative = true;
      }
    } else if (metricKey === 'weight') {
      // Weight management: Downward control is positive, sudden gain is negative
      if (direction === 'down') {
        isPositive = true;
      } else {
        isNegative = true;
      }
    } else if (metricKey === 'bloodSugar') {
      // Blood Sugar: Lower glycemic values toward normal range is positive
      if (direction === 'down') {
        isPositive = true;
      } else {
        isNegative = true;
      }
    } else if (metricKey === 'sleepHours') {
      // Sleep: Increased restful sleep (towards 7-8h) is positive, drop is negative
      if (direction === 'up') {
        isPositive = true;
      } else {
        isNegative = true;
      }
    }

    const unit =
      metricKey === 'weight'
        ? 'kg'
        : metricKey === 'systolicBp' || metricKey === 'diastolicBp'
        ? 'mmHg'
        : metricKey === 'bloodSugar'
        ? 'mg/dL'
        : metricKey === 'sleepHours'
        ? 'hrs'
        : '';

    const sign = delta > 0 ? `+${delta}` : `${delta}`;
    const arrowSymbol = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '—';
    const label = `${arrowSymbol} ${sign} ${unit}`;
    const summaryText = isNeutral
      ? 'Stable (7d)'
      : isPositive
      ? `Positive Trend (${direction === 'down' ? 'Reduced' : 'Increased'} ${sign} ${unit} in 7d)`
      : `Negative Trend (${direction === 'up' ? 'Increased' : 'Reduced'} ${sign} ${unit} in 7d)`;

    const color = isNeutral ? '#94a3b8' : isPositive ? '#10b981' : '#f43f5e';
    const badgeBg = isNeutral ? '#f1f5f9' : isPositive ? '#ecfdf5' : '#fff1f2';

    return {
      delta,
      direction,
      isPositive,
      isNegative,
      isNeutral,
      color,
      badgeBg,
      label,
      unit,
      summaryText,
    };
  }, [safeMetrics]);

  // Handle Form Submit
  const handleLogVitals = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newLog: HealthMetricLog = {
      id: `m_${Date.now()}`,
      timestamp: new Date().toISOString().split('T')[0],
      systolicBp: parseInt(systolic) || 120,
      diastolicBp: parseInt(diastolic) || 80,
      bloodSugar: parseInt(bloodSugar) || 100,
      weight: parseFloat(weight) || 70,
      temperature: parseFloat(temp) || 98.6,
      sleepHours: parseFloat(sleep) || 7,
      painLevel: pain,
      mood: mood,
      symptoms: symptomText ? [symptomText] : [],
    };

    onAddMetricLog(newLog);
    setSymptomText('');
    setExportNotice('New vitals log recorded successfully!');
    setTimeout(() => setExportNotice(null), 3000);
  }, [systolic, diastolic, bloodSugar, weight, temp, sleep, pain, mood, symptomText, onAddMetricLog]);

  // AI Analysis Handler
  const handleRunAiAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/gemini/analyze-health-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricLogs: filteredMetrics,
          userProfile: currentProfile,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Analysis failed');
      setAnalysisResult(json.data);
    } catch (err: any) {
      console.error(err);
      setExportNotice('Failed to generate AI analysis. Please check your data connection.');
      setTimeout(() => setExportNotice(null), 4000);
    } finally {
      setIsAnalyzing(false);
    }
  }, [filteredMetrics, currentProfile]);

  // Secure CSV Export Handler
  const handleExportCSV = useCallback(() => {
    if (filteredMetrics.length === 0) {
      setExportNotice('No vitals data available to export.');
      setTimeout(() => setExportNotice(null), 3000);
      return;
    }

    setIsExporting(true);

    try {
      // Helper function to sanitize CSV values & prevent formula injection
      const escapeCSV = (val: any) => {
        if (val === undefined || val === null) return '""';
        let str = String(val).trim();
        // Prevent formula injection: prepend single quote if starts with =, +, -, @, \t, \r
        if (/^[=+\-@\t\r]/.test(str)) {
          str = `'${str}`;
        }
        return `"${str.replace(/"/g, '""')}"`;
      };

      const headers = [
        'Date/Time',
        'Systolic BP (mmHg)',
        'Diastolic BP (mmHg)',
        'Blood Sugar (mg/dL)',
        'Weight (kg)',
        'Temperature (°F)',
        'Sleep (Hours)',
        'Pain Level (1-10)',
        'Mood',
        'Symptoms'
      ];

      const csvRows = [headers.map(escapeCSV).join(',')];

      filteredMetrics.forEach((m) => {
        const row = [
          m.timestamp,
          m.systolicBp ?? '',
          m.diastolicBp ?? '',
          m.bloodSugar ?? '',
          m.weight ?? '',
          m.temperature ?? '',
          m.sleepHours ?? '',
          m.painLevel ?? '',
          m.mood ?? '',
          m.symptoms ? m.symptoms.join('; ') : ''
        ];
        csvRows.push(row.map(escapeCSV).join(','));
      });

      const csvString = csvRows.join('\r\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `jevancare_vitals_report_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Audit Log
      auditLogger.logAction(
        'EXPORT_HEALTH_METRICS_CSV',
        `Exported ${filteredMetrics.length} health metric logs in CSV format (Range: ${timeRange})`,
        currentProfile
      );

      setExportNotice(`Successfully exported ${filteredMetrics.length} health metric log(s) to CSV.`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error('CSV Export Error:', err);
      setExportNotice('An error occurred during CSV export.');
      setTimeout(() => setExportNotice(null), 4000);
    } finally {
      setIsExporting(false);
    }
  }, [filteredMetrics, currentProfile.id, timeRange]);

  // Render High-DPI Visual Trends Chart onto off-screen canvas for PDF Report
  const generateTrendChartImage = useCallback((data: HealthMetricLog[]): string => {
    if (typeof document === 'undefined' || data.length === 0) return '';
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 460;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Crisp white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Padding dimensions
    const padLeft = 70;
    const padRight = 75;
    const padTop = 50;
    const padBottom = 55;
    const plotW = canvas.width - padLeft - padRight;
    const plotH = canvas.height - padTop - padBottom;

    // Outer subtle border
    ctx.strokeStyle = '#e6dfd3';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    // Header Title
    ctx.fillStyle = '#1b3b2b';
    ctx.font = 'bold 17px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HEALTH METRICS TRAJECTORY (WEIGHT & BLOOD PRESSURE OVER TIME)', padLeft, 32);

    // Legends
    ctx.font = '11px Helvetica, Arial, sans-serif';

    // Systolic BP Legend
    ctx.fillStyle = '#8b263e';
    ctx.beginPath();
    ctx.arc(padLeft + 570, 27, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333333';
    ctx.fillText('Systolic BP (mmHg)', padLeft + 580, 31);

    // Diastolic BP Legend
    ctx.fillStyle = '#2b503b';
    ctx.beginPath();
    ctx.arc(padLeft + 715, 27, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333333';
    ctx.fillText('Diastolic BP (mmHg)', padLeft + 725, 31);

    // Weight Legend
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(padLeft + 865, 27, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333333';
    ctx.fillText('Body Weight (kg)', padLeft + 875, 31);

    // BP Range: 60 - 160 mmHg
    const bpMin = 60;
    const bpMax = 160;

    // Weight dynamic range
    const weights = data.map((d) => d.weight || 70);
    const minW = Math.floor(Math.min(...weights) - 1);
    const maxW = Math.ceil(Math.max(...weights) + 1);
    const weightSpan = Math.max(1, maxW - minW);

    // Background threshold zone for Normal BP (80 to 120 mmHg)
    const y120 = padTop + plotH - ((120 - bpMin) / (bpMax - bpMin)) * plotH;
    const y80 = padTop + plotH - ((80 - bpMin) / (bpMax - bpMin)) * plotH;
    ctx.fillStyle = 'rgba(163, 212, 182, 0.12)';
    ctx.fillRect(padLeft, y120, plotW, y80 - y120);

    // Horizontal Grid Lines & BP Axis Labels (Left Axis)
    const bpTicks = [60, 80, 100, 120, 140, 160];
    bpTicks.forEach((bp) => {
      const y = padTop + plotH - ((bp - bpMin) / (bpMax - bpMin)) * plotH;

      ctx.beginPath();
      ctx.strokeStyle = bp === 120 ? '#fda4af' : bp === 80 ? '#86efac' : '#f0ece1';
      ctx.lineWidth = bp === 120 || bp === 80 ? 1.5 : 1;
      if (bp === 120 || bp === 80) {
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Left axis label
      ctx.fillStyle = bp === 120 ? '#be123c' : bp === 80 ? '#15803d' : '#737373';
      ctx.font = '10px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${bp} mmHg`, padLeft - 8, y + 3.5);
    });

    // Right Axis Labels for Weight (Right Axis)
    for (let i = 0; i <= 4; i++) {
      const wVal = minW + (weightSpan * i) / 4;
      const y = padTop + plotH - (i / 4) * plotH;
      ctx.fillStyle = '#0284c7';
      ctx.font = '10px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${wVal.toFixed(1)} kg`, padLeft + plotW + 8, y + 3.5);
    }

    // Compute coordinate points
    const points = data.map((d, idx) => {
      const x = padLeft + (data.length === 1 ? plotW / 2 : (idx / (data.length - 1)) * plotW);
      const rawSys = d.systolicBp ?? 120;
      const rawDia = d.diastolicBp ?? 80;
      const rawW = d.weight ?? minW;

      const ySys = padTop + plotH - ((Math.min(bpMax, Math.max(bpMin, rawSys)) - bpMin) / (bpMax - bpMin)) * plotH;
      const yDia = padTop + plotH - ((Math.min(bpMax, Math.max(bpMin, rawDia)) - bpMin) / (bpMax - bpMin)) * plotH;
      const yWeight = padTop + plotH - ((rawW - minW) / weightSpan) * plotH;

      return { x, ySys, yDia, yWeight, data: d, rawSys, rawDia, rawW };
    });

    // Draw Systolic Line
    ctx.strokeStyle = '#8b263e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.ySys);
      else ctx.lineTo(pt.x, pt.ySys);
    });
    ctx.stroke();

    // Draw Diastolic Line
    ctx.strokeStyle = '#2b503b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.yDia);
      else ctx.lineTo(pt.x, pt.yDia);
    });
    ctx.stroke();

    // Draw Weight Line (Dashed)
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.yWeight);
      else ctx.lineTo(pt.x, pt.yWeight);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw point markers and text annotations
    points.forEach((pt) => {
      // Systolic point & label
      ctx.fillStyle = '#8b263e';
      ctx.beginPath();
      ctx.arc(pt.x, pt.ySys, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 9.5px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pt.rawSys}`, pt.x, pt.ySys - 7);

      // Systolic 7d Trend Indicator Arrow
      const sysTrend = get7DayTrend(pt.data.timestamp, 'systolicBp');
      if (sysTrend && sysTrend.direction !== 'neutral') {
        ctx.fillStyle = sysTrend.isPositive ? '#16a34a' : '#dc2626';
        ctx.beginPath();
        if (sysTrend.direction === 'up') {
          ctx.moveTo(pt.x + 8, pt.ySys - 13);
          ctx.lineTo(pt.x + 5, pt.ySys - 7);
          ctx.lineTo(pt.x + 11, pt.ySys - 7);
        } else {
          ctx.moveTo(pt.x + 8, pt.ySys - 7);
          ctx.lineTo(pt.x + 5, pt.ySys - 13);
          ctx.lineTo(pt.x + 11, pt.ySys - 13);
        }
        ctx.fill();
      }

      // Diastolic point & label
      ctx.fillStyle = '#2b503b';
      ctx.beginPath();
      ctx.arc(pt.x, pt.yDia, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`${pt.rawDia}`, pt.x, pt.yDia + 14);

      // Diastolic 7d Trend Indicator Arrow
      const diaTrend = get7DayTrend(pt.data.timestamp, 'diastolicBp');
      if (diaTrend && diaTrend.direction !== 'neutral') {
        ctx.fillStyle = diaTrend.isPositive ? '#16a34a' : '#dc2626';
        ctx.beginPath();
        if (diaTrend.direction === 'up') {
          ctx.moveTo(pt.x + 8, pt.yDia + 16);
          ctx.lineTo(pt.x + 5, pt.yDia + 22);
          ctx.lineTo(pt.x + 11, pt.yDia + 22);
        } else {
          ctx.moveTo(pt.x + 8, pt.yDia + 22);
          ctx.lineTo(pt.x + 5, pt.yDia + 16);
          ctx.lineTo(pt.x + 11, pt.yDia + 16);
        }
        ctx.fill();
      }

      // Weight point & label
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(pt.x, pt.yWeight, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 9px Helvetica, Arial, sans-serif';
      ctx.fillText(`${pt.rawW}kg`, pt.x, pt.yWeight - 7);

      // Weight 7d Trend Indicator Arrow
      const wTrend = get7DayTrend(pt.data.timestamp, 'weight');
      if (wTrend && wTrend.direction !== 'neutral') {
        ctx.fillStyle = wTrend.isPositive ? '#16a34a' : '#dc2626';
        ctx.beginPath();
        if (wTrend.direction === 'up') {
          ctx.moveTo(pt.x + 16, pt.yWeight - 12);
          ctx.lineTo(pt.x + 13, pt.yWeight - 6);
          ctx.lineTo(pt.x + 19, pt.yWeight - 6);
        } else {
          ctx.moveTo(pt.x + 16, pt.yWeight - 6);
          ctx.lineTo(pt.x + 13, pt.yWeight - 12);
          ctx.lineTo(pt.x + 19, pt.yWeight - 12);
        }
        ctx.fill();
      }

      // Bottom date label
      ctx.fillStyle = '#525252';
      ctx.font = '9.5px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      const parts = pt.data.timestamp.split('-');
      const formattedDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : pt.data.timestamp;
      ctx.fillText(formattedDate, pt.x, padTop + plotH + 18);
    });

    return canvas.toDataURL('image/png');
  }, [get7DayTrend]);

  // Secure Comprehensive PDF Report Generation with jsPDF
  const handleDownloadReportPdf = useCallback(async () => {
    if (filteredMetrics.length === 0) {
      setExportNotice('No vitals data available to generate a PDF report.');
      setTimeout(() => setExportNotice(null), 3000);
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;

      const patientName = currentProfile.name || 'Aarav Sharma';
      const abhaNumber = currentProfile.abhaNumber || '91-3842-9102-4821';
      const generatedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Generate the visual trend chart image from canvas
      const chartImg = generateTrendChartImage(filteredMetrics);

      // Header and Footer generator
      const addHeaderAndFooter = (pageNumber: number, totalPages: number) => {
        // Top Header Banner
        doc.setFillColor(27, 59, 43); // #1b3b2b Forest Green
        doc.rect(0, 0, pageWidth, 52, 'F');

        doc.setTextColor(250, 248, 245);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('JEVAN CARE', margin, 32);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(252, 211, 77); // Amber-300
        doc.text('HEALTH PROGRESS & CLINICAL VITALS REPORT', margin + 115, 32);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(230, 240, 235);
        doc.text(`ABHA: ${abhaNumber}`, pageWidth - margin, 24, { align: 'right' });
        doc.text(`CONFIDENTIAL MEDICAL RECORD`, pageWidth - margin, 36, { align: 'right' });

        // Bottom Footer Bar
        doc.setDrawColor(230, 223, 211);
        doc.setLineWidth(0.75);
        doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(92, 86, 71);
        doc.text(
          'Jevan Care Ecosystem • Encrypted Health Progress Analysis • ISO 27001 Certified Clinical Tracking',
          margin,
          pageHeight - 22
        );

        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 22, {
          align: 'right',
        });
      };

      let currentY = 66;

      // Patient Demographics & Report Scope Box
      doc.setFillColor(246, 242, 233);
      doc.setDrawColor(230, 223, 211);
      doc.roundedRect(margin, currentY, contentWidth, 68, 5, 5, 'FD');

      doc.setTextColor(27, 59, 43);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('PATIENT PROFILE & REPORT PARAMETERS', margin + 12, currentY + 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(92, 86, 71);

      doc.text(`Patient Name: ${patientName}`, margin + 12, currentY + 34);
      doc.text(`ABHA Health ID: ${abhaNumber}`, margin + 12, currentY + 48);
      doc.text(`Blood Group: ${currentProfile.bloodGroup || 'O+'}`, margin + 12, currentY + 60);

      const timeRangeLabel = timeRange === 'week' ? 'Last 7 Days (Week)' : timeRange === 'month' ? 'Last 30 Days (Month)' : 'All Recorded Logs';
      doc.text(`Report Window: ${timeRangeLabel}`, margin + 260, currentY + 34);
      doc.text(`Logs Analyzed: ${filteredMetrics.length} chronological entries`, margin + 260, currentY + 48);
      doc.text(`Generated At: ${generatedDate}`, margin + 260, currentY + 60);

      currentY += 78;

      // Executive Health Metrics Summary Cards (3 horizontal cards)
      const cardWidth = (contentWidth - 16) / 3;
      const cardHeight = 70;

      // Card 1: Weight Dynamics
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(230, 223, 211);
      doc.roundedRect(margin, currentY, cardWidth, cardHeight, 4, 4, 'FD');
      doc.setFillColor(2, 132, 199); // Ocean Blue stripe
      doc.rect(margin, currentY, 3, cardHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(2, 132, 199);
      doc.text('WEIGHT DYNAMICS', margin + 10, currentY + 16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(27, 59, 43);
      doc.text(`${metricsStats?.latestWeight ?? 70} kg`, margin + 10, currentY + 34);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(92, 86, 71);
      const deltaSign = (metricsStats?.weightChange ?? 0) > 0 ? '+' : '';
      doc.text(`Change: ${deltaSign}${metricsStats?.weightChange ?? 0} kg from baseline`, margin + 10, currentY + 48);
      doc.text(`Range: ${metricsStats?.minWeight ?? 0} - ${metricsStats?.maxWeight ?? 0} kg (Avg: ${metricsStats?.avgWeight ?? 0})`, margin + 10, currentY + 60);

      // Card 2: Blood Pressure Profile
      const card2X = margin + cardWidth + 8;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(230, 223, 211);
      doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 4, 4, 'FD');
      doc.setFillColor(139, 38, 62); // Crimson stripe
      doc.rect(card2X, currentY, 3, cardHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(139, 38, 62);
      doc.text('BLOOD PRESSURE', card2X + 10, currentY + 16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(27, 59, 43);
      const latestBpStr = `${metricsStats?.latest.systolicBp ?? 120}/${metricsStats?.latest.diastolicBp ?? 80} mmHg`;
      doc.text(latestBpStr, card2X + 10, currentY + 34);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(92, 86, 71);
      doc.text(`Status: ${metricsStats?.bpCategory ?? 'Normal'}`, card2X + 10, currentY + 48);
      doc.text(`Period Mean: ${metricsStats?.avgSys ?? 120}/${metricsStats?.avgDia ?? 80} mmHg`, card2X + 10, currentY + 60);

      // Card 3: Lifestyle & Glycemic
      const card3X = card2X + cardWidth + 8;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(230, 223, 211);
      doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 4, 4, 'FD');
      doc.setFillColor(13, 148, 136); // Teal stripe
      doc.rect(card3X, currentY, 3, cardHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(13, 148, 136);
      doc.text('GLYCEMIC & REST', card3X + 10, currentY + 16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(27, 59, 43);
      doc.text(`${metricsStats?.avgSugar ?? 100} mg/dL`, card3X + 10, currentY + 34);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(92, 86, 71);
      doc.text(`Average Blood Sugar (Fasting)`, card3X + 10, currentY + 48);
      doc.text(`Mean Sleep: ${metricsStats?.avgSleep ?? 7.5} hrs/night`, card3X + 10, currentY + 60);

      currentY += cardHeight + 14;

      // Section: Visual Health Trends (Weight & BP Over Time)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(27, 59, 43);
      doc.text('VISUAL HEALTH TRENDS (WEIGHT & BLOOD PRESSURE OVER TIME)', margin, currentY);

      currentY += 8;
      doc.setDrawColor(27, 59, 43);
      doc.setLineWidth(1);
      doc.line(margin, currentY, pageWidth - margin, currentY);

      currentY += 10;

      // Insert Visual Trend Chart Image
      if (chartImg) {
        const chartHeight = 185;
        doc.addImage(chartImg, 'PNG', margin, currentY, contentWidth, chartHeight);
        currentY += chartHeight + 14;
      }

      // Check if page needs break for table
      if (currentY + 140 > pageHeight - 50) {
        doc.addPage();
        currentY = 66;
      }

      // Section: Chronological Metrics Log Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(27, 59, 43);
      doc.text(`RECORDED HEALTH METRICS LOGS (${filteredMetrics.length})`, margin, currentY);

      currentY += 8;
      doc.setDrawColor(27, 59, 43);
      doc.setLineWidth(1);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;

      // Table Header Row
      const tableRowHeight = 18;
      doc.setFillColor(246, 242, 233);
      doc.rect(margin, currentY, contentWidth, tableRowHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(27, 59, 43);

      doc.text('DATE', margin + 6, currentY + 12);
      doc.text('WEIGHT', margin + 65, currentY + 12);
      doc.text('BLOOD PRESSURE', margin + 125, currentY + 12);
      doc.text('BLOOD SUGAR', margin + 215, currentY + 12);
      doc.text('SLEEP', margin + 295, currentY + 12);
      doc.text('MOOD', margin + 345, currentY + 12);
      doc.text('SYMPTOMS & CLINICAL NOTES', margin + 395, currentY + 12);

      currentY += tableRowHeight;

      // Table Data Rows
      filteredMetrics.forEach((m, idx) => {
        if (currentY + tableRowHeight > pageHeight - 50) {
          doc.addPage();
          currentY = 66;

          // Re-draw table header on new page
          doc.setFillColor(246, 242, 233);
          doc.rect(margin, currentY, contentWidth, tableRowHeight, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(27, 59, 43);
          doc.text('DATE', margin + 6, currentY + 12);
          doc.text('WEIGHT', margin + 65, currentY + 12);
          doc.text('BLOOD PRESSURE', margin + 125, currentY + 12);
          doc.text('BLOOD SUGAR', margin + 215, currentY + 12);
          doc.text('SLEEP', margin + 295, currentY + 12);
          doc.text('MOOD', margin + 345, currentY + 12);
          doc.text('SYMPTOMS & CLINICAL NOTES', margin + 395, currentY + 12);
          currentY += tableRowHeight;
        }

        // Alternating row background
        if (idx % 2 === 1) {
          doc.setFillColor(252, 250, 246);
          doc.rect(margin, currentY, contentWidth, tableRowHeight, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(50, 50, 50);

        doc.text(m.timestamp, margin + 6, currentY + 12);
        doc.text(m.weight ? `${m.weight} kg` : '-', margin + 65, currentY + 12);
        doc.text(`${m.systolicBp}/${m.diastolicBp} mmHg`, margin + 125, currentY + 12);
        doc.text(m.bloodSugar ? `${m.bloodSugar} mg/dL` : '-', margin + 215, currentY + 12);
        doc.text(m.sleepHours ? `${m.sleepHours} hrs` : '-', margin + 295, currentY + 12);
        doc.text(m.mood || '-', margin + 345, currentY + 12);

        const symptomSnippet = m.symptoms && m.symptoms.length > 0 ? m.symptoms.join(', ') : 'None logged';
        const truncatedSymptoms = symptomSnippet.length > 32 ? symptomSnippet.substring(0, 32) + '...' : symptomSnippet;
        doc.text(truncatedSymptoms, margin + 395, currentY + 12);

        currentY += tableRowHeight;
      });

      currentY += 12;

      // Clinical AI Analysis Assessment (if generated)
      if (analysisResult) {
        if (currentY + 80 > pageHeight - 50) {
          doc.addPage();
          currentY = 66;
        }

        doc.setFillColor(243, 247, 244);
        doc.setDrawColor(163, 212, 182);
        doc.roundedRect(margin, currentY, contentWidth, 75, 4, 4, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(27, 59, 43);
        doc.text(`AI CLINICAL RECOVERY ASSESSMENT (Score: ${analysisResult.recoveryScore} / 100)`, margin + 10, currentY + 16);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        const summaryLines = doc.splitTextToSize(analysisResult.healthStatusSummary || '', contentWidth - 20);
        doc.text(summaryLines, margin + 10, currentY + 30);

        if (analysisResult.consultationRecommendation) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(27, 59, 43);
          doc.text(`Consultation Guidance: ${analysisResult.consultationRecommendation.substring(0, 100)}`, margin + 10, currentY + 62);
        }

        currentY += 85;
      }

      // Medical Disclaimer Box
      if (currentY + 45 > pageHeight - 45) {
        doc.addPage();
        currentY = 66;
      }

      doc.setFillColor(248, 235, 234);
      doc.setDrawColor(238, 216, 215);
      doc.roundedRect(margin, currentY, contentWidth, 38, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(139, 38, 62);
      doc.text('OFFICIAL CLINICAL PROGRESS DISCLAIMER', margin + 10, currentY + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(92, 86, 71);
      doc.text(
        'This document is an automated clinical summary of personal biometric vitals and weight/BP trajectories. It is designed to empower consultations with registered healthcare practitioners and does not constitute a diagnostic replacement for primary clinical examination.',
        margin + 10,
        currentY + 26
      );

      // Number of pages stamping
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addHeaderAndFooter(i, totalPages);
      }

      // Save PDF
      const cleanPatient = patientName.replace(/\s+/g, '_');
      const filename = `JevanCare_Health_Progress_Report_${cleanPatient}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      // Audit Log
      auditLogger.logAction(
        'EXPORT_HEALTH_PROGRESS_REPORT_PDF',
        `Generated and downloaded health metrics progress report PDF (${filteredMetrics.length} records, range: ${timeRange})`,
        currentProfile
      );

      setExportNotice(`Health progress PDF report downloaded successfully! (${filteredMetrics.length} records included)`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error('PDF Report Generation Error:', err);
      setExportNotice('Failed to generate PDF report. Please try again.');
      setTimeout(() => setExportNotice(null), 4000);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [filteredMetrics, currentProfile, timeRange, metricsStats, analysisResult, generateTrendChartImage]);

  // Recharts Custom Dot with 7-Day Trend Indicator Icons (green up/down or red up/down)
  const MetricTrendDot: React.FC<any> = ({
    cx,
    cy,
    payload,
    stroke,
    metricKey,
  }) => {
    if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy) || !payload) {
      return null;
    }

    const trend = showTrendIndicators && metricKey ? get7DayTrend(payload.timestamp, metricKey) : null;
    const baseColor = stroke || (isDark ? '#e0ded8' : '#1b3b2b');

    // Default clean dot if indicators are toggled off or no prior data exists
    if (!trend || !showTrendIndicators) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill={baseColor}
          stroke="#ffffff"
          strokeWidth={1.5}
        />
      );
    }

    // Offset positioning per metric so arrows don't collide or hide the line
    let badgeX = cx + 8;
    let badgeY = cy - 8;
    if (metricKey === 'diastolicBp') {
      badgeX = cx + 8;
      badgeY = cy + 9;
    } else if (metricKey === 'weight') {
      badgeX = cx + 9;
      badgeY = cy - 8;
    } else if (metricKey === 'sleepHours') {
      badgeX = cx;
      badgeY = cy - 12;
    }

    const badgeFill = isDark
      ? trend.isNeutral
        ? '#1e293b'
        : trend.isPositive
        ? '#064e3b'
        : '#4c0519'
      : trend.isNeutral
      ? '#f8fafc'
      : trend.isPositive
      ? '#ecfdf5'
      : '#fff1f2';

    return (
      <g className="transition-all select-none cursor-pointer">
        <title>{`${payload.timestamp} · ${metricKey}: ${trend.summaryText}`}</title>
        {/* Core data point marker */}
        <circle
          cx={cx}
          cy={cy}
          r={4.5}
          fill={baseColor}
          stroke="#ffffff"
          strokeWidth={1.8}
        />

        {/* Small 7-Day Trend Indicator Icon Badge */}
        <g transform={`translate(${badgeX}, ${badgeY})`}>
          <circle
            cx={0}
            cy={0}
            r={6}
            fill={badgeFill}
            stroke={trend.color}
            strokeWidth={1.4}
          />
          {trend.direction === 'up' ? (
            <path
              d="M 0,-3.2 L -2.8,0.2 L -1,0.2 L -1,3 L 1,3 L 1,0.2 L 2.8,0.2 Z"
              fill={trend.color}
            />
          ) : trend.direction === 'down' ? (
            <path
              d="M 0,3.2 L -2.8,-0.2 L -1,-0.2 L -1,-3 L 1,-3 L 1,-0.2 L 2.8,-0.2 Z"
              fill={trend.color}
            />
          ) : (
            <line
              x1={-2}
              y1={0}
              x2={2}
              y2={0}
              stroke={trend.color}
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          )}
        </g>
      </g>
    );
  };

  // Custom Recharts Tooltip Component with 7-Day Trend Badges
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentLog = filteredMetrics.find((m) => m.timestamp === label);
      return (
        <div className="bg-[#1b3b2b] text-white p-3.5 rounded-2xl shadow-xl border border-[#3b604a] text-xs space-y-2.5 animate-in fade-in min-w-[230px]">
          <p className="font-bold text-amber-200 border-b border-white/10 pb-1.5 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>Date: {label}</span>
            </span>
            {currentLog?.mood && (
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md text-amber-300">
                Mood: {currentLog.mood}
              </span>
            )}
          </p>

          <div className="space-y-2">
            {payload.map((entry: any, index: number) => {
              const isWeight = entry.dataKey === 'weight';
              const isSys = entry.dataKey === 'systolicBp';
              const isDia = entry.dataKey === 'diastolicBp';
              const trend = entry.dataKey ? get7DayTrend(label, entry.dataKey) : null;

              return (
                <div key={`item-${index}`} className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      {entry.name}:
                    </span>
                    <span className="font-extrabold text-white">
                      {entry.value} {isWeight ? 'kg' : isSys || isDia ? 'mmHg' : ''}
                    </span>
                  </div>

                  {/* 7-Day Movement Indicator with Direction & Health Valence */}
                  {trend && (
                    <div className="flex items-center justify-between gap-2 text-[10px] pl-3.5 pb-0.5">
                      <span className="text-white/60">7-Day Movement:</span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold ${
                          trend.isNeutral
                            ? 'bg-stone-500/25 text-stone-300 border border-stone-500/40'
                            : trend.isPositive
                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {trend.direction === 'up' ? (
                          <span className="text-xs leading-none">▲</span>
                        ) : trend.direction === 'down' ? (
                          <span className="text-xs leading-none">▼</span>
                        ) : (
                          <span className="text-xs leading-none">—</span>
                        )}
                        <span>{trend.delta > 0 ? `+${trend.delta}` : trend.delta}</span>
                        <span className="text-[9px] font-medium opacity-90">
                          ({trend.isNeutral ? 'Stable' : trend.isPositive ? 'Positive Trend' : 'Negative Trend'})
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {currentLog?.symptoms && currentLog.symptoms.length > 0 && (
            <div className="pt-1.5 border-t border-white/10 text-[11px] text-emerald-200">
              <span className="text-white/70 block text-[10px]">Notes:</span>
              <span>{currentLog.symptoms.join(', ')}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Export Notice Pill */}
      {exportNotice && (
        <div className="bg-[#1b3b2b] text-[#faf8f5] p-3.5 rounded-2xl flex items-center justify-between shadow-lg border border-[#3b604a]">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#a3d4b6] shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-[#a3d4b6] hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-white dark:bg-[#18261e] rounded-3xl p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#1b3b2b] text-emerald-300 flex items-center justify-center shadow-md shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
              AI Health Progress & Vitals Tracker
            </h1>
            <p className="text-xs text-[#5c5647] dark:text-[#b0aaa0] mt-0.5">
              Interactive time-series analysis for blood pressure, blood glucose, weight, and recovery metrics.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download Report Button */}
          <button
            onClick={handleDownloadReportPdf}
            disabled={isGeneratingPdf || safeMetrics.length === 0}
            className="px-4 py-2.5 rounded-2xl bg-[#1b3b2b] hover:bg-[#284f3b] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Download comprehensive PDF Health Progress Report"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#a3d4b6]" />
            ) : (
              <Download className="w-4 h-4 text-emerald-300" />
            )}
            <span>Download Report</span>
          </button>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={isExporting || safeMetrics.length === 0}
            className="px-4 py-2.5 rounded-2xl bg-[#f6f2e9] dark:bg-[#23382b] hover:bg-[#e8eee5] dark:hover:bg-[#2e4738] text-[#1b3b2b] dark:text-[#a3d4b6] font-bold text-xs border border-[#e6dfd3] dark:border-[#2f4637] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Download personal health metric records in secure CSV format"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#1b3b2b] dark:text-[#a3d4b6]" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-[#8b263e] dark:text-rose-400" />
            )}
            <span>Export CSV Report</span>
          </button>

          {/* Quick BMI Calculator Anchor */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('bmi-calculator-module');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="px-4 py-2.5 rounded-2xl bg-[#f6f2e9] dark:bg-[#23382b] hover:bg-[#e8eee5] dark:hover:bg-[#2e4738] text-[#1b3b2b] dark:text-[#a3d4b6] font-bold text-xs border border-[#e6dfd3] dark:border-[#2f4637] transition-all flex items-center gap-2 cursor-pointer"
            title="Jump to BMI Health Range Calculator"
          >
            <Scale className="w-4 h-4 text-[#2b503b] dark:text-[#a3d4b6]" />
            <span>BMI Calculator</span>
          </button>

          {/* AI Progress Report Button */}
          <button
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzing}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#1b3b2b] to-[#2b503b] hover:from-[#244836] hover:to-[#38634a] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? (
              <JevanCareLoader size="sm" color="white" label="Analyzing Vitals..." />
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Run AI Clinical Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Clinical Recovery Report Banner */}
      {analysisResult && (
        <div className="bg-white dark:bg-[#18261e] rounded-3xl p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#e6dfd3] dark:border-[#283c2e] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-base text-[#1b3b2b] dark:text-[#f2f0e8]">
                AI Clinical Recovery Assessment
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#5c5647] dark:text-[#b0aaa0]">Recovery Score:</span>
              <span className="font-extrabold text-lg text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-3 py-0.5 rounded-full border border-emerald-300">
                {analysisResult.recoveryScore} / 100
              </span>
            </div>
          </div>

          <p className="text-xs text-[#1b3b2b] dark:text-[#f2f0e8] leading-relaxed bg-[#f8f5ee] dark:bg-[#142018] p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#23382b]">
            {analysisResult.healthStatusSummary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 block">Observed Improvements:</span>
              <ul className="list-disc list-inside space-y-1 text-emerald-800 dark:text-emerald-300/90">
                {analysisResult.improvements?.map((imp, idx) => (
                  <li key={idx}>{imp}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-1">
              <span className="font-bold text-indigo-900 dark:text-indigo-300 block">Consultation Guidance:</span>
              <p className="text-indigo-800 dark:text-indigo-300/90 leading-relaxed">
                {analysisResult.consultationRecommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Time Range Filter Bar */}
      <div className="bg-white dark:bg-[#18261e] rounded-2xl p-4 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#2b503b] dark:text-[#a3d4b6]" />
          <span className="text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">Time Series Window:</span>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-[#f6f2e9] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#23382b] text-xs font-semibold">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              timeRange === 'week'
                ? 'bg-[#1b3b2b] text-white shadow-xs'
                : 'text-[#5c5647] dark:text-[#b0aaa0] hover:text-[#1b3b2b] dark:hover:text-white'
            }`}
          >
            Last 7 Days (Week)
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              timeRange === 'month'
                ? 'bg-[#1b3b2b] text-white shadow-xs'
                : 'text-[#5c5647] dark:text-[#b0aaa0] hover:text-[#1b3b2b] dark:hover:text-white'
            }`}
          >
            Last 30 Days (Month)
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              timeRange === 'all'
                ? 'bg-[#1b3b2b] text-white shadow-xs'
                : 'text-[#5c5647] dark:text-[#b0aaa0] hover:text-[#1b3b2b] dark:hover:text-white'
            }`}
          >
            All Recorded Logs ({safeMetrics.length})
          </button>
        </div>
      </div>

      {/* Main Grid: Recharts Interactive Charts (2 cols) + Log Form (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recharts Column */}
        <div className="lg:col-span-2 space-y-6">

          {filteredMetrics.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-[#18261e] border border-[#e6dfd3] dark:border-[#283c2e] text-center space-y-3">
              <Activity className="w-10 h-10 text-[#2b503b]/60 mx-auto" />
              <h3 className="text-base font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                No Vitals Logged for this Time Window
              </h3>
              <p className="text-xs text-[#5c5647] dark:text-[#b0aaa0] max-w-sm mx-auto">
                No health logs match the selected timeframe ({timeRange}). Log your current vitals on the right to start plotting interactive health progress charts.
              </p>
            </div>
          ) : (
            <>
              {/* Quick Metrics Stat Cards */}
              {metricsStats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Card 1: Weight Progress */}
                  <div className="bg-white dark:bg-[#18261e] p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#5c5647] dark:text-[#b0aaa0] flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-[#0284c7]" />
                        <span>Weight Progression</span>
                      </span>
                      {metricsStats.weightChange !== 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                            metricsStats.weightChange < 0
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {metricsStats.weightChange < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3" />
                          )}
                          <span>
                            {metricsStats.weightChange > 0 ? '+' : ''}
                            {metricsStats.weightChange} kg
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-[#1b3b2b] dark:text-[#f2f0e8]">
                        {metricsStats.latestWeight}
                      </span>
                      <span className="text-xs font-semibold text-[#5c5647] dark:text-[#b0aaa0]">kg</span>
                    </div>
                    <p className="text-[10px] text-[#827b6c] dark:text-[#969082]">
                      Range: {metricsStats.minWeight} – {metricsStats.maxWeight} kg · Avg: {metricsStats.avgWeight} kg
                    </p>
                  </div>

                  {/* Card 2: Blood Pressure Profile */}
                  <div className="bg-white dark:bg-[#18261e] p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#5c5647] dark:text-[#b0aaa0] flex items-center gap-1.5">
                        <HeartPulse className="w-3.5 h-3.5 text-[#8b263e]" />
                        <span>Blood Pressure</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${metricsStats.bpBadgeColor}`}
                      >
                        {metricsStats.bpCategory}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-[#1b3b2b] dark:text-[#f2f0e8]">
                        {metricsStats.latest.systolicBp}/{metricsStats.latest.diastolicBp}
                      </span>
                      <span className="text-xs font-semibold text-[#5c5647] dark:text-[#b0aaa0]">mmHg</span>
                    </div>
                    <p className="text-[10px] text-[#827b6c] dark:text-[#969082]">
                      Period Mean: {metricsStats.avgSys}/{metricsStats.avgDia} mmHg · Pulse: {metricsStats.latest.systolicBp - metricsStats.latest.diastolicBp}
                    </p>
                  </div>

                  {/* Card 3: Glycemic & Rest */}
                  <div className="bg-white dark:bg-[#18261e] p-4 rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#5c5647] dark:text-[#b0aaa0] flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-teal-600" />
                        <span>Glycemic & Rest</span>
                      </span>
                      <span className="text-[10px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded-md font-bold">
                        Avg {metricsStats.avgSugar} mg/dL
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-[#1b3b2b] dark:text-[#f2f0e8]">
                        {metricsStats.avgSleep}
                      </span>
                      <span className="text-xs font-semibold text-[#5c5647] dark:text-[#b0aaa0]">hrs/night avg</span>
                    </div>
                    <p className="text-[10px] text-[#827b6c] dark:text-[#969082]">
                      Latest Sugar: {metricsStats.latest.bloodSugar ?? 100} mg/dL · Pain: {metricsStats.avgPain}/10
                    </p>
                  </div>
                </div>
              )}

              {/* Primary Interactive Chart: Weight & Blood Pressure Trends Over Time */}
              <div className="bg-white dark:bg-[#18261e] rounded-3xl p-5 sm:p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6dfd3] dark:border-[#23382b]">
                  <div>
                    <h2 className="font-bold text-sm text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-[#8b263e]" />
                      <span>Weight & Blood Pressure Trends</span>
                    </h2>
                    <p className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0] mt-0.5">
                      Correlating body mass (kg) against systolic and diastolic pressure (mmHg) over time.
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5 text-[10px]">
                      <span className="font-bold text-[#5c5647] dark:text-[#b0aaa0]">7-Day Movement:</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                        <span className="text-[11px] leading-none">▲/▼</span>
                        <span>Green: Positive Trend (Health Improving)</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shadow-2xs">
                        <span className="text-[11px] leading-none">▲/▼</span>
                        <span>Red: Negative Trend (Elevated / Attention)</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                        <span>—</span>
                        <span>Stable</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Mode Segmented Controls */}
                    <div className="inline-flex p-1 rounded-xl bg-[#f6f2e9] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#23382b] text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setChartViewMode('combined')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          chartViewMode === 'combined'
                            ? 'bg-[#1b3b2b] text-white shadow-2xs'
                            : 'text-[#5c5647] dark:text-[#b0aaa0] hover:text-[#1b3b2b] dark:hover:text-white'
                        }`}
                      >
                        Combined (BP & Weight)
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartViewMode('weight')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          chartViewMode === 'weight'
                            ? 'bg-[#1b3b2b] text-white shadow-2xs'
                            : 'text-[#5c5647] dark:text-[#b0aaa0] hover:text-[#1b3b2b] dark:hover:text-white'
                        }`}
                      >
                        Weight Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartViewMode('bp')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          chartViewMode === 'bp'
                            ? 'bg-[#1b3b2b] text-white shadow-2xs'
                            : 'text-[#5c5647] dark:text-[#b0aaa0] hover:text-[#1b3b2b] dark:hover:text-white'
                        }`}
                      >
                        BP Only
                      </button>
                    </div>

                    {/* 7-Day Indicators Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowTrendIndicators(!showTrendIndicators)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        showTrendIndicators
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-2xs'
                          : 'bg-[#f6f2e9] dark:bg-[#142018] text-[#5c5647] dark:text-[#b0aaa0] border-[#e6dfd3] dark:border-[#23382b]'
                      }`}
                      title="Toggle 7-day movement indicator icons on chart data points"
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>7d Trend Badges: {showTrendIndicators ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Chart Context Download Report Button */}
                    <button
                      type="button"
                      onClick={handleDownloadReportPdf}
                      disabled={isGeneratingPdf || filteredMetrics.length === 0}
                      className="px-3 py-1.5 rounded-xl bg-[#e8eee5] dark:bg-[#23382b] hover:bg-[#d8e2d4] dark:hover:bg-[#2a4435] text-[#1b3b2b] dark:text-[#a3d4b6] font-bold text-xs border border-[#cfdcd0] dark:border-[#2f4637] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Generate and download PDF Health Progress Report"
                    >
                      {isGeneratingPdf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1b3b2b] dark:text-[#a3d4b6]" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-[#2b503b] dark:text-[#a3d4b6]" />
                      )}
                      <span>Download Report</span>
                    </button>
                  </div>
                </div>

                <div className="h-80 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartViewMode === 'combined' ? (
                      <ComposedChart data={filteredMetrics} margin={{ top: 22, right: 25, left: -10, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
                        <XAxis dataKey="timestamp" stroke={axisColor} fontSize={11} tickLine={false} />
                        
                        {/* Left Y-Axis: Blood Pressure */}
                        <YAxis
                          yAxisId="bp"
                          stroke={axisColor}
                          fontSize={11}
                          domain={[60, 160]}
                          tickLine={false}
                          label={{
                            value: 'BP (mmHg)',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fill: axisColor, fontSize: 10 }
                          }}
                        />

                        {/* Right Y-Axis: Weight */}
                        <YAxis
                          yAxisId="weight"
                          orientation="right"
                          stroke="#0284c7"
                          fontSize={11}
                          domain={['dataMin - 1', 'dataMax + 1']}
                          tickLine={false}
                          label={{
                            value: 'Weight (kg)',
                            angle: 90,
                            position: 'insideRight',
                            style: { fill: '#0284c7', fontSize: 10 }
                          }}
                        />

                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: axisColor }} />

                        {/* Reference lines for BP guidelines */}
                        <ReferenceLine
                          yAxisId="bp"
                          y={120}
                          stroke="#e11d48"
                          strokeDasharray="3 3"
                          label={{ value: 'Systolic Limit (120)', position: 'insideTopLeft', fontSize: 9.5, fill: '#e11d48' }}
                        />
                        <ReferenceLine
                          yAxisId="bp"
                          y={80}
                          stroke="#10b981"
                          strokeDasharray="3 3"
                          label={{ value: 'Diastolic Target (80)', position: 'insideBottomLeft', fontSize: 9.5, fill: '#10b981' }}
                        />

                        {/* Systolic BP Line */}
                        <Line
                          yAxisId="bp"
                          type="monotone"
                          dataKey="systolicBp"
                          stroke={isDark ? '#e27d8e' : '#8b263e'}
                          name="Systolic BP (mmHg)"
                          strokeWidth={2.5}
                          dot={(props: any) => <MetricTrendDot {...props} metricKey="systolicBp" />}
                          activeDot={{ r: 6 }}
                        />

                        {/* Diastolic BP Line */}
                        <Line
                          yAxisId="bp"
                          type="monotone"
                          dataKey="diastolicBp"
                          stroke={isDark ? '#a3d4b6' : '#2b503b'}
                          name="Diastolic BP (mmHg)"
                          strokeWidth={2.5}
                          dot={(props: any) => <MetricTrendDot {...props} metricKey="diastolicBp" />}
                          activeDot={{ r: 6 }}
                        />

                        {/* Body Weight Line */}
                        <Line
                          yAxisId="weight"
                          type="monotone"
                          dataKey="weight"
                          stroke={isDark ? '#38bdf8' : '#0284c7'}
                          name="Weight (kg)"
                          strokeWidth={2.5}
                          strokeDasharray="4 4"
                          dot={(props: any) => <MetricTrendDot {...props} metricKey="weight" />}
                          activeDot={{ r: 7 }}
                        />
                      </ComposedChart>
                    ) : chartViewMode === 'weight' ? (
                      <ComposedChart data={filteredMetrics} margin={{ top: 22, right: 25, left: -10, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
                        <XAxis dataKey="timestamp" stroke={axisColor} fontSize={11} tickLine={false} />
                        <YAxis
                          stroke="#0284c7"
                          fontSize={11}
                          domain={['dataMin - 1', 'dataMax + 1']}
                          tickLine={false}
                          label={{
                            value: 'Weight (kg)',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fill: '#0284c7', fontSize: 10 }
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: axisColor }} />
                        {metricsStats?.avgWeight && (
                          <ReferenceLine
                            y={metricsStats.avgWeight}
                            stroke="#0284c7"
                            strokeDasharray="3 3"
                            label={{ value: `Avg (${metricsStats.avgWeight} kg)`, position: 'insideTopLeft', fontSize: 10, fill: '#0284c7' }}
                          />
                        )}
                        <Area
                          type="monotone"
                          dataKey="weight"
                          fill={isDark ? '#0284c730' : '#e0f2fe'}
                          stroke={isDark ? '#38bdf8' : '#0284c7'}
                          strokeWidth={2.5}
                          name="Body Weight (kg)"
                          dot={(props: any) => <MetricTrendDot {...props} metricKey="weight" />}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    ) : (
                      <LineChart data={filteredMetrics} margin={{ top: 22, right: 25, left: -10, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
                        <XAxis dataKey="timestamp" stroke={axisColor} fontSize={11} tickLine={false} />
                        <YAxis
                          stroke={axisColor}
                          fontSize={11}
                          domain={[50, 180]}
                          tickLine={false}
                          label={{
                            value: 'Blood Pressure (mmHg)',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fill: axisColor, fontSize: 10 }
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: axisColor }} />
                        <ReferenceLine
                          y={120}
                          stroke="#e11d48"
                          strokeDasharray="3 3"
                          label={{ value: 'Systolic Limit (120)', position: 'insideTopLeft', fontSize: 10, fill: '#e11d48' }}
                        />
                        <ReferenceLine
                          y={80}
                          stroke="#10b981"
                          strokeDasharray="3 3"
                          label={{ value: 'Diastolic Target (80)', position: 'insideBottomLeft', fontSize: 10, fill: '#10b981' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="systolicBp"
                          stroke={isDark ? '#e27d8e' : '#8b263e'}
                          name="Systolic BP"
                          strokeWidth={2.5}
                          dot={(props: any) => <MetricTrendDot {...props} metricKey="systolicBp" />}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="diastolicBp"
                          stroke={isDark ? '#a3d4b6' : '#2b503b'}
                          name="Diastolic BP"
                          strokeWidth={2.5}
                          dot={(props: any) => <MetricTrendDot {...props} metricKey="diastolicBp" />}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Secondary Chart: Blood Glucose & Sleep Hours Bar/Line Chart */}
              <div className="bg-white dark:bg-[#18261e] rounded-3xl p-5 sm:p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e6dfd3] dark:border-[#23382b]">
                  <h2 className="font-bold text-sm text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Blood Sugar (mg/dL) & Sleep Duration (Hrs)</span>
                  </h2>
                  <span className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0] font-medium">
                    Target: 70–120 mg/dL · 7–9 hrs sleep
                  </span>
                </div>

                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
                      <XAxis dataKey="timestamp" stroke={axisColor} fontSize={11} tickLine={false} />
                      <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: axisColor }} />
                      <Bar dataKey="bloodSugar" fill={isDark ? '#2dd4bf' : '#0d9488'} name="Blood Sugar (mg/dL)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="sleepHours" fill={isDark ? '#818cf8' : '#6366f1'} name="Sleep (Hours)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Right Column: Log Vitals Form & BMI Calculator Module */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#18261e] rounded-3xl p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#e6dfd3] dark:border-[#23382b] flex items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-sm text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#2b503b] dark:text-[#a3d4b6]" />
                <span>Log Today's Health Metrics</span>
              </h2>
              <p className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0] mt-0.5">
                Type values manually or use hands-free voice logging.
              </p>
            </div>

            {/* Hands-free Voice Input Button */}
            <div className="relative shrink-0">
              {isListening && (
                <span className="absolute -inset-1 rounded-2xl bg-rose-500/30 animate-ping pointer-events-none" />
              )}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`relative px-3.5 py-2 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 z-10 ${
                  isListening
                    ? 'bg-rose-600 text-white shadow-lg ring-2 ring-rose-400/80'
                    : 'bg-[#e8eee5] dark:bg-[#23382b] text-[#1b3b2b] dark:text-[#a3d4b6] hover:bg-[#d5e0d1] dark:hover:bg-[#2d4737] border border-[#d3decf] dark:border-[#2f4637]'
                }`}
                title={isListening ? 'Click to Stop Active Voice Recording' : 'Start Hands-Free Voice Vitals Logging'}
              >
                {isListening ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                    <MicOff className="w-4 h-4 text-white" />
                    <span className="hidden sm:inline">Listening</span>

                    {/* Spectral Wave Equalizer Indicator */}
                    <div className="flex items-end gap-0.5 h-4 ml-0.5">
                      <span className="w-0.5 bg-white rounded-full animate-soundwave-1" />
                      <span className="w-0.5 bg-white rounded-full animate-soundwave-2" />
                      <span className="w-0.5 bg-white rounded-full animate-soundwave-3" />
                      <span className="w-0.5 bg-white rounded-full animate-soundwave-4" />
                      <span className="w-0.5 bg-white rounded-full animate-soundwave-5" />
                    </div>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-[#8b263e] dark:text-rose-400" />
                    <span className="hidden sm:inline">Voice Log</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Voice Input Feedback Panel */}
          {(isListening || transcript || speechNotice || parsedSummary) && (
            <div className="bg-[#f6f2e9] dark:bg-[#142018] p-3.5 rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                <span className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    {isListening && (
                      <span className="absolute w-4 h-4 rounded-full bg-rose-500/40 animate-ping" />
                    )}
                    <Mic className={`w-4 h-4 relative z-10 ${isListening ? 'text-rose-600 dark:text-rose-400' : 'text-[#8b263e]'}`} />
                  </div>
                  <span>Hands-Free Voice Assistant</span>

                  {isListening && (
                    <div className="flex items-center gap-1.5 ml-2 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800/80 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                      <span>Recording</span>
                      <div className="flex items-end gap-0.5 h-3 ml-1">
                        <span className="w-0.5 bg-rose-600 dark:bg-rose-400 rounded-full animate-soundwave-1" />
                        <span className="w-0.5 bg-rose-600 dark:bg-rose-400 rounded-full animate-soundwave-2" />
                        <span className="w-0.5 bg-rose-600 dark:bg-rose-400 rounded-full animate-soundwave-3" />
                        <span className="w-0.5 bg-rose-600 dark:bg-rose-400 rounded-full animate-soundwave-4" />
                      </div>
                    </div>
                  )}
                </span>

                {transcript && (
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript('');
                      setParsedSummary(null);
                    }}
                    className="text-[10px] text-[#827b6c] dark:text-[#969082] hover:underline cursor-pointer"
                  >
                    Clear Text
                  </button>
                )}
              </div>

              {speechNotice && (
                <p className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0] italic">
                  {speechNotice}
                </p>
              )}

              {transcript && (
                <div className="bg-white dark:bg-[#18261e] p-2.5 rounded-xl border border-[#e6dfd3] dark:border-[#283c2e]">
                  <span className="text-[10px] uppercase font-bold text-[#827b6c] dark:text-[#969082] block mb-0.5">Spoken Transcript:</span>
                  <p className="text-xs text-[#1b3b2b] dark:text-[#f2f0e8] italic">"{transcript}"</p>
                </div>
              )}

              {parsedSummary && (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span><strong>Extracted Values:</strong> {parsedSummary}</span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleLogVitals} className="space-y-3.5 text-xs">
            
            {/* Blood Pressure */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                  Systolic BP
                </label>
                <input
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  placeholder="118"
                  className="w-full px-3 py-2 bg-[#f8f5ee] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-[#1b3b2b] dark:text-[#f2f0e8] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                  Diastolic BP
                </label>
                <input
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  placeholder="78"
                  className="w-full px-3 py-2 bg-[#f8f5ee] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-[#1b3b2b] dark:text-[#f2f0e8] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                />
              </div>
            </div>

            {/* Blood Sugar & Weight */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                  Blood Sugar (mg/dL)
                </label>
                <input
                  type="number"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  placeholder="105"
                  className="w-full px-3 py-2 bg-[#f8f5ee] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-[#1b3b2b] dark:text-[#f2f0e8] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="68.5"
                  className="w-full px-3 py-2 bg-[#f8f5ee] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-[#1b3b2b] dark:text-[#f2f0e8] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                />
              </div>
            </div>

            {/* Sleep Hours & Temperature */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                  Sleep Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  placeholder="7.5"
                  className="w-full px-3 py-2 bg-[#f8f5ee] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-[#1b3b2b] dark:text-[#f2f0e8] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                  Temp (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  placeholder="98.4"
                  className="w-full px-3 py-2 bg-[#f8f5ee] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-[#1b3b2b] dark:text-[#f2f0e8] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                />
              </div>
            </div>

            {/* Pain Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[#1b3b2b] dark:text-[#d3e3d8]">
                  Pain Index Level (1-10)
                </label>
                <span className="font-bold text-[#8b263e] dark:text-rose-400">{pain} / 10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={pain}
                onChange={(e) => setPain(parseInt(e.target.value))}
                className="w-full accent-[#8b263e] cursor-pointer"
              />
            </div>

            {/* Symptoms */}
            <div>
              <label className="block font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                Active Symptoms / Notes
              </label>
              <input
                type="text"
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                placeholder="e.g. Mild headache after lunch..."
                className="w-full px-3 py-2 bg-[#f8f5ee] dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-[#1b3b2b] dark:text-[#f2f0e8] focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1b3b2b] hover:bg-[#284f3b] text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#a3d4b6]" />
              <span>Save Vitals Log</span>
            </button>
          </form>
        </div>

        {/* BMI Calculator Module */}
        <div id="bmi-calculator-module">
          <BmiCalculatorModule
            initialWeightKg={Number(weight) || 68.5}
            initialHeightCm={170}
            onApplyWeight={(syncedWeightKg) => setWeight(syncedWeightKg.toString())}
          />
        </div>
      </div>

      </div>

    </div>
  );
};

export default HealthProgressTracker;

