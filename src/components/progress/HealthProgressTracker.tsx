import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Activity,
  Plus,
  TrendingUp,
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
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { HealthMetricLog, HealthProgressAnalysisResult, UserProfile } from '../../types';
import { auditLogger } from '../../services/AuditLogger';
import { JevanCareLoader } from '../common/JevanCareLoader';
import { useTheme } from '../../context/ThemeContext';

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

  // CSV Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

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
    const sorted = [...safeMetrics].sort((a, b) => new Date(a.timestamp).getTime() - new Date(a.timestamp).getTime());

    const now = new Date();
    if (timeRange === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return sorted.filter((m) => new Date(m.timestamp) >= sevenDaysAgo);
    } else if (timeRange === 'month') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return sorted.filter((m) => new Date(m.timestamp) >= thirtyDaysAgo);
    }
    return sorted;
  }, [safeMetrics, timeRange]);

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

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1b3b2b] text-white p-3 rounded-2xl shadow-xl border border-[#3b604a] text-xs space-y-1.5 animate-in fade-in">
          <p className="font-bold text-amber-200 border-b border-white/10 pb-1 flex items-center justify-between gap-3">
            <span>Date: {label}</span>
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-extrabold text-white">{entry.value}</span>
            </div>
          ))}
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
              {/* Blood Pressure Time-Series Line Chart */}
              <div className="bg-white dark:bg-[#18261e] rounded-3xl p-5 sm:p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e6dfd3] dark:border-[#23382b]">
                  <h2 className="font-bold text-sm text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-[#8b263e]" />
                    <span>Blood Pressure Trend (mmHg)</span>
                  </h2>
                  <span className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0] font-medium">
                    Benchmark: &lt;120/80 mmHg
                  </span>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
                      <XAxis dataKey="timestamp" stroke={axisColor} fontSize={11} tickLine={false} />
                      <YAxis stroke={axisColor} fontSize={11} domain={[50, 180]} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: axisColor }} />
                      <Line
                        type="monotone"
                        dataKey="systolicBp"
                        stroke={isDark ? '#e27d8e' : '#8b263e'}
                        name="Systolic BP"
                        strokeWidth={2.5}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="diastolicBp"
                        stroke={isDark ? '#a3d4b6' : '#2b503b'}
                        name="Diastolic BP"
                        strokeWidth={2.5}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Blood Glucose & Sleep Hours Bar/Line Chart */}
              <div className="bg-white dark:bg-[#18261e] rounded-3xl p-5 sm:p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e6dfd3] dark:border-[#23382b]">
                  <h2 className="font-bold text-sm text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Blood Sugar (mg/dL) & Sleep Duration (Hrs)</span>
                  </h2>
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

        {/* Log Vitals Form Column */}
        <div className="bg-white dark:bg-[#18261e] rounded-3xl p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-4 h-fit">
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

      </div>

    </div>
  );
};
