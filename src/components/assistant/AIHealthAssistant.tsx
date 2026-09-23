import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  AlertTriangle,
  Sparkles,
  Info,
  User,
  X,
  Square,
  Play,
  Radio,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  Globe,
  Sliders,
  HeartHandshake,
  HelpCircle,
} from 'lucide-react';
import { UserProfile, HealthAssistantMessage, VaultItem, ActiveMedicine } from '../../types';
import { JevanCareLoader } from '../common/JevanCareLoader';
import { API_ROUTES } from '../../services/apiRoutes';
import { supabaseAssistantMessages } from '../../services/supabaseService';
import {
  normalizeAssistantResponse,
  generateVoiceOptimizedText,
  detectUserLanguage,
} from '../../utils/responseNormalizer';
import {
  voiceAssistant,
  VoicePersonality,
  AppLanguage,
} from '../../services/voiceAssistantService';
import { useToast } from '../../context/ToastContext';

interface AIHealthAssistantProps {
  userProfile?: UserProfile;
  profile?: UserProfile;
  vaultItems?: VaultItem[];
  activeMedicines?: ActiveMedicine[];
  onOpenEmergency?: () => void;
}

interface QuickPrompt {
  id: string;
  label: string;
  query: string;
  lang: 'en' | 'hi' | 'hinglish';
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'qp_1',
    label: 'Swelling in neck',
    query: 'What could cause swelling on the right side of the neck for a few weeks?',
    lang: 'en',
  },
  {
    id: 'qp_2',
    label: 'Medicine on empty stomach',
    query: 'Can I take paracetamol on an empty stomach?',
    lang: 'en',
  },
  {
    id: 'qp_3',
    label: 'Gale me swelling (Hinglish)',
    query: 'Mere gale ke right side me swelling hai, kya karna chahiye?',
    lang: 'hinglish',
  },
  {
    id: 'qp_4',
    label: 'High BP kya karein (Hinglish)',
    query: 'BP suddenly high ho gaya hai, immediate steps kya lene chahiye?',
    lang: 'hinglish',
  },
  {
    id: 'qp_5',
    label: 'गले में सूजन (हिंदी)',
    query: 'गले में सूजन होने के क्या कारण हो सकते हैं और कब डॉक्टर को दिखाना चाहिए?',
    lang: 'hi',
  },
  {
    id: 'qp_6',
    label: 'दवा के नियम (हिंदी)',
    query: 'क्या खाली पेट दर्द निवारक दवा ले सकते हैं?',
    lang: 'hi',
  },
];

export const AIHealthAssistant: React.FC<AIHealthAssistantProps> = ({
  userProfile,
  profile,
  vaultItems = [],
  activeMedicines = [],
  onOpenEmergency = () => {},
}) => {
  const { showToast, showConfirm } = useToast();
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

  // Language Preference & Voice Personality State
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jeevancare_assistant_lang');
      if (saved === 'en' || saved === 'hi' || saved === 'hinglish' || saved === 'auto') {
        return saved as AppLanguage;
      }
    }
    return 'auto';
  });

  const [voicePersonality, setVoicePersonality] = useState<VoicePersonality>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jeevancare_assistant_personality');
      if (saved === 'calm' || saved === 'clear' || saved === 'friendly') {
        return saved as VoicePersonality;
      }
    }
    return 'calm';
  });

  const [showSettings, setShowSettings] = useState(false);

  // Generate initial welcome message according to selected language
  const getWelcomeText = (lang: AppLanguage, name: string) => {
    if (lang === 'hi') {
      return `नमस्ते ${name}! मैं आपका जीवन केयर स्वास्थ्य साथी हूँ। आप मुझसे दवाओं के साइड इफेक्ट, लक्षणों की समझ, प्राथमिक उपचार, या किसी भी स्वास्थ्य विषय पर सीधे बातचीत कर सकते हैं।`;
    }
    if (lang === 'hinglish') {
      return `Hello ${name}! Main aapka JeevanCare Health Companion hoon. Aap mujhse medicine guidance, symptoms, ya kisi bhi health concern ke baare me naturally baat kar sakte hain.`;
    }
    return `Hello ${name}! I am your JeevanCare Health Companion. Feel free to ask me anything about your symptoms, medicines, lifestyle wellness, or medical reports in natural, simple language.`;
  };

  const welcomeMessage: HealthAssistantMessage = {
    id: 'm_welcome',
    sender: 'assistant',
    text: getWelcomeText(selectedLanguage, currentProfile.name || 'Friend'),
    voiceText: getWelcomeText(selectedLanguage, currentProfile.name || 'Friend'),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    detectedLanguage: selectedLanguage === 'auto' ? 'en' : selectedLanguage,
  };

  const [messages, setMessages] = useState<HealthAssistantMessage[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Voice recognition and synthesis states
  const [isListening, setIsListening] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTtsActive, setIsTtsActive] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Sync state with VoiceAssistantService
  useEffect(() => {
    isMountedRef.current = true;
    const unsubscribe = voiceAssistant.addStateListener((speaking) => {
      if (isMountedRef.current) {
        setIsSpeaking(speaking);
        if (!speaking) {
          setCurrentlySpeakingId(null);
        }
      }
    });
    return () => {
      isMountedRef.current = false;
      unsubscribe();
      voiceAssistant.stop();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Persist language preference
  const handleSelectLanguage = (lang: AppLanguage) => {
    setSelectedLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jeevancare_assistant_lang', lang);
    }
  };

  // Persist voice personality
  const handleSelectPersonality = (p: VoicePersonality) => {
    setVoicePersonality(p);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jeevancare_assistant_personality', p);
    }
  };

  // Load chat history from Supabase if user has a profile ID
  useEffect(() => {
    if (!currentProfile.id) return;
    let isMounted = true;
    supabaseAssistantMessages.fetchMessages(currentProfile.id).then((savedMsgs) => {
      if (isMounted && savedMsgs.length > 0) {
        setMessages(savedMsgs);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentProfile.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const handleClearHistory = () => {
    showConfirm({
      title: 'Clear Conversation History?',
      message: 'Are you sure you want to clear your conversation with the Health Companion? Previous messages will be removed.',
      confirmText: 'Clear Chat',
      cancelText: 'Keep Chat',
      isDestructive: true,
      onConfirm: async () => {
        if (currentProfile.id) {
          await supabaseAssistantMessages.clearMessages(currentProfile.id);
        }
        voiceAssistant.stop();
        setMessages([
          {
            ...welcomeMessage,
            text: getWelcomeText(selectedLanguage, currentProfile.name || 'Friend'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        showToast('Chat history cleared.', 'info');
      }
    });
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Stop assistant speech immediately (Interruptibility)
  const stopSpeaking = useCallback(() => {
    voiceAssistant.stop();
    setIsSpeaking(false);
    setCurrentlySpeakingId(null);
  }, []);

  // Voice Output Execution using VoiceAssistantService
  const speakMessage = useCallback(
    (msg: HealthAssistantMessage) => {
      if (!isTtsActive) return;

      const langToUse: 'en' | 'hi' | 'hinglish' =
        msg.detectedLanguage ||
        (selectedLanguage === 'auto' ? detectUserLanguage(msg.text) : selectedLanguage);

      const textToSpeak = msg.voiceText || generateVoiceOptimizedText(msg.text, langToUse);

      setCurrentlySpeakingId(msg.id);
      voiceAssistant.speak(textToSpeak, {
        language: langToUse,
        personality: voicePersonality,
        onStart: () => {
          setIsSpeaking(true);
          setCurrentlySpeakingId(msg.id);
        },
        onEnd: () => {
          setIsSpeaking(false);
          setCurrentlySpeakingId(null);
        },
        onError: (err) => {
          console.warn('Speech synthesis error:', err);
          setIsSpeaking(false);
          setCurrentlySpeakingId(null);
        },
      });
    },
    [isTtsActive, selectedLanguage, voicePersonality]
  );

  // Stop Voice Recognition
  const stopVoiceRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore if already inactive
      }
    }
    setIsListening(false);
  }, []);

  // Voice Input - Web Speech API Recognition with Multilingual Support
  const startVoiceRecording = () => {
    setSpeechError(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Web Speech Recognition is not supported in this browser. You can type your message.');
      return;
    }

    // Interrupt any ongoing assistant speech immediately
    stopSpeaking();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Select speech recognition language model
      if (selectedLanguage === 'hi') {
        recognition.lang = 'hi-IN';
      } else if (selectedLanguage === 'hinglish') {
        recognition.lang = 'en-IN'; // Indian English recognition excels at Hinglish
      } else if (selectedLanguage === 'en') {
        recognition.lang = 'en-US';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsListening(true);
        setTranscriptPreview('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscriptPreview(currentTranscript);
        setInput(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser.');
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech detected. Please tap the microphone and speak again.');
        } else {
          setSpeechError(`Speech recognition notice: ${event.error}. Please try again or type your question.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setSpeechError('Failed to access microphone. Please check browser permissions.');
    }
  };

  const toggleVoiceRecording = useCallback(() => {
    if (isListening) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  }, [isListening, stopVoiceRecording]);

  const handleImageUpload = useCallback((file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setSelectedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const sendQueryText = async (textToSend: string, imgToSend?: string | null) => {
    if (!textToSend.trim() && !imgToSend) return;

    // Interrupt any active voice immediately
    if (isListening) stopVoiceRecording();
    stopSpeaking();

    const detectedLang = detectUserLanguage(textToSend);
    const effectiveLang = selectedLanguage === 'auto' ? detectedLang : selectedLanguage;

    const newUserMsg: HealthAssistantMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      imageUrl: imgToSend || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      detectedLanguage: effectiveLang,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    if (currentProfile.id) {
      supabaseAssistantMessages.saveMessage(currentProfile.id, newUserMsg);
    }
    setInput('');
    setTranscriptPreview('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch(API_ROUTES.GEMINI.HEALTH_ASSISTANT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newUserMsg],
          languagePreference: selectedLanguage,
          userProfile: currentProfile,
          vaultItems,
          activeMedicines,
        }),
      });

      const json = await response.json();
      if (!isMountedRef.current) return;

      if (!json.success) {
        throw new Error(json.error?.message || json.error || 'AI response failed.');
      }

      const rawReply = json.reply || json.data?.reply || 'I am here to support your health journey.';
      const cleanReply = normalizeAssistantResponse(rawReply, effectiveLang);

      const rawVoice = json.voiceText || json.data?.voiceText || cleanReply;
      const cleanVoice = generateVoiceOptimizedText(rawVoice, effectiveLang);

      const hasRedFlags = Boolean(json.hasRedFlags || json.data?.hasRedFlags);
      const isEmergency = Boolean(json.isEmergency || json.data?.isEmergency);
      const resLang = (json.detectedLanguage || json.data?.detectedLanguage || effectiveLang) as 'en' | 'hi' | 'hinglish';
      const emotionDetected = json.emotionDetected || json.data?.emotionDetected || 'neutral';
      const followUpQuestion = json.followUpQuestion || json.data?.followUpQuestion;

      const botReplyId = `bot_${Date.now()}`;
      const botReply: HealthAssistantMessage = {
        id: botReplyId,
        sender: 'assistant',
        text: cleanReply,
        voiceText: cleanVoice,
        hasRedFlags,
        isEmergency,
        detectedLanguage: resLang,
        emotionDetected,
        followUpQuestion,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
      if (currentProfile.id) {
        supabaseAssistantMessages.saveMessage(currentProfile.id, botReply);
      }

      // Read aloud automatically if TTS is active
      if (isTtsActive) {
        speakMessage(botReply);
      }
    } catch (err: any) {
      console.error('Assistant error:', err);
      const fallbackText =
        effectiveLang === 'hi'
          ? 'माफ़ कीजिए, मुझे उत्तर देने में कुछ रुकावट आई। कृपया दोबारा प्रयास करें या स्वास्थ्य पेशेवर से संपर्क करें।'
          : effectiveLang === 'hinglish'
          ? 'Sorry, network issue ki wajah se response generate nahi ho paya. Please dobara try karein ya doctor se consult karein.'
          : 'I am experiencing connection difficulty. Please try again in a moment or consult your healthcare provider.';

      const errMsg: HealthAssistantMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        voiceText: fallbackText,
        detectedLanguage: effectiveLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
      if (currentProfile.id) {
        supabaseAssistantMessages.saveMessage(currentProfile.id, errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sendQueryText(input, selectedImage);
  };

  const handleQuickPromptClick = (prompt: QuickPrompt) => {
    sendQueryText(prompt.query);
  };

  // Filter quick prompts based on selected language
  const visiblePrompts = QUICK_PROMPTS.filter((qp) => {
    if (selectedLanguage === 'auto') return true;
    if (selectedLanguage === 'en') return qp.lang === 'en';
    if (selectedLanguage === 'hi') return qp.lang === 'hi';
    if (selectedLanguage === 'hinglish') return qp.lang === 'hinglish';
    return true;
  });

  return (
    <div id="ai-health-assistant-container" className="space-y-4 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div
        id="assistant-header"
        className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                JeevanCare AI Health Companion
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Natural Multilingual Voice
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conversational healthcare guidance in English, हिंदी, and Hinglish.
            </p>
          </div>
        </div>

        {/* Action Controls & Preferences */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
          {/* Active Speaking Indicator with Instant Stop */}
          {isSpeaking && (
            <button
              id="btn-stop-speaking-top"
              onClick={stopSpeaking}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center gap-1.5 transition-all animate-pulse shrink-0 cursor-pointer"
              title="Interrupt and stop voice output immediately"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Voice 🔇</span>
            </button>
          )}

          {/* Voice Personality / Language Settings Dropdown Toggle */}
          <button
            id="btn-assistant-settings-toggle"
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              showSettings
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-200'
            }`}
            title="Voice and Language Options"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Voice & Language</span>
          </button>

          {/* Master TTS Toggle */}
          <button
            id="btn-assistant-tts-toggle"
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setIsTtsActive(!isTtsActive);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              isTtsActive
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
            title="Toggle Voice Speech Output"
          >
            {isTtsActive ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4" />}
            <span>{isTtsActive ? 'Voice ON' : 'Muted'}</span>
          </button>

          {/* Clear History Button */}
          {messages.length > 1 && (
            <button
              id="btn-clear-chat-history"
              onClick={handleClearHistory}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-800 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              title="Clear Conversation History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Voice & Language Settings Tray (Collapsible) */}
      {showSettings && (
        <div
          id="assistant-settings-tray"
          className="p-5 bg-white dark:bg-[#16241c] rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-4 animate-fadeIn"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* 1. Language Preference Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#142b20] dark:text-[#f2f0e8] flex items-center gap-1.5 uppercase tracking-wider">
                <Globe className="w-4 h-4 text-[#1a5336] dark:text-[#a3d4b6]" />
                Response Language
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: 'auto', label: '🌐 Auto-Detect' },
                  { id: 'en', label: 'English' },
                  { id: 'hinglish', label: 'Hinglish (Roman Hindi)' },
                  { id: 'hi', label: 'हिंदी (Hindi)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectLanguage(item.id as AppLanguage)}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] ${
                      selectedLanguage === item.id
                        ? 'bg-[#1a5336] text-white border-[#1a5336] shadow-2xs'
                        : 'bg-[#fcfaf6] dark:bg-[#1d2e23] text-[#5c5647] dark:text-[#c0b9ad] border-[#e6dfd3] dark:border-[#283c2e] hover:bg-[#f6f2e9]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Voice Personality Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#142b20] dark:text-[#f2f0e8] flex items-center gap-1.5 uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4 text-[#1a5336] dark:text-[#a3d4b6]" />
                Voice Companion Cadence
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: 'calm', label: 'Calm & Gentle', desc: 'Soothing, empathetic clinical tone' },
                  { id: 'clear', label: 'Clear & Concise', desc: 'Direct, neutral clinical pacing' },
                  { id: 'friendly', label: 'Warm & Helpful', desc: 'Supportive, conversational tone' },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => handleSelectPersonality(tone.id as VoicePersonality)}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] ${
                      voicePersonality === tone.id
                        ? 'bg-[#1a5336] text-white border-[#1a5336] shadow-2xs'
                        : 'bg-[#fcfaf6] dark:bg-[#1d2e23] text-[#5c5647] dark:text-[#c0b9ad] border-[#e6dfd3] dark:border-[#283c2e] hover:bg-[#f6f2e9]'
                    }`}
                    title={tone.desc}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Speaking Audio Waveform Banner */}
      {isSpeaking && (
        <div
          id="assistant-speaking-banner"
          className="p-4 bg-[#142b20] text-[#f2f0e8] rounded-2xl border border-[#283c2e] shadow-md flex items-center justify-between gap-3 animate-fadeIn"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-300 shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-white">JeevanCare Voice Companion Speaking</span>
                {/* Audio Waveform visualization */}
                <div className="flex items-center gap-1 h-3">
                  <span className="w-1 bg-emerald-400 rounded-full h-full animate-pulse" />
                  <span className="w-1 bg-emerald-300 rounded-full h-2 animate-pulse delay-75" />
                  <span className="w-1 bg-emerald-500 rounded-full h-3 animate-pulse delay-150" />
                  <span className="w-1 bg-emerald-400 rounded-full h-1.5 animate-pulse delay-200" />
                </div>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Playing spoken guidance. Click Stop Speech anytime to pause playback.
              </p>
            </div>
          </div>

          <button
            id="btn-stop-speaking-banner"
            onClick={stopSpeaking}
            className="min-h-[44px] px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Speech</span>
          </button>
        </div>
      )}

      {/* Live Voice Listening Banner */}
      {isListening && (
        <div
          id="assistant-listening-banner"
          className="p-4 bg-rose-950 text-white rounded-2xl border border-rose-800 shadow-md flex items-center justify-between gap-3 animate-fadeIn"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-rose-900 border border-rose-700 flex items-center justify-center text-rose-300 animate-pulse shrink-0">
              <Mic className="w-4 h-4 text-rose-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-rose-100">Listening to your speech...</span>
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              </div>
              <p className="text-xs font-medium text-white truncate italic mt-0.5">
                "{transcriptPreview || 'Speak your symptoms or health query clearly...'}"
              </p>
            </div>
          </div>

          <button
            id="btn-stop-mic-banner"
            onClick={stopVoiceRecording}
            className="min-h-[44px] px-4 py-2 bg-white text-rose-900 hover:bg-rose-100 font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Mic</span>
          </button>
        </div>
      )}

      {/* Speech Error Banner */}
      {speechError && (
        <div
          id="assistant-speech-error-toast"
          className="p-3 bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-2xl text-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button
            onClick={() => setSpeechError(null)}
            className="p-1 hover:bg-amber-200 dark:hover:bg-amber-900 rounded-lg shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Chat Container */}
      <div
        id="assistant-chat-window"
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden flex flex-col h-[calc(100dvh-14rem)] min-h-[420px] max-h-[620px]"
      >
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isThisMsgSpeaking = currentlySpeakingId === m.id && isSpeaking;

            return (
              <div
                key={m.id}
                id={`message-row-${m.id}`}
                className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-xs'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble Card */}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 relative group ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 rounded-tl-none shadow-2xs'
                  }`}
                >
                  {/* Attached Image if present */}
                  {m.imageUrl && (
                    <img
                      src={m.imageUrl}
                      alt="Uploaded medical attachment"
                      className="max-h-48 rounded-xl object-contain border border-white/20 mb-2"
                    />
                  )}

                  {/* Clean Conversational Text */}
                  <div className="space-y-2 whitespace-pre-wrap font-normal text-[13px] leading-6">
                    {m.text}
                  </div>

                  {/* Follow-up question badge if provided */}
                  {m.followUpQuestion && m.sender === 'assistant' && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block mb-0.5">Gentle Follow-Up:</span>
                        <span className="opacity-95">{m.followUpQuestion}</span>
                      </div>
                    </div>
                  )}

                  {/* Critical Emergency Banner if Red Flags Detected */}
                  {m.hasRedFlags && (
                    <div
                      id={`emergency-notice-${m.id}`}
                      className="p-3 rounded-xl bg-rose-600 text-white text-xs font-bold space-y-2 mt-2 shadow-md"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                        <span>IMPORTANT MEDICAL NOTICE</span>
                      </div>
                      <p className="text-[11px] font-normal opacity-95">
                        These symptoms may require immediate clinical attention. If you or someone around you is in severe distress, please call emergency medical services (108 / 112 / 911) or visit the nearest ER immediately.
                      </p>
                      <button
                        onClick={onOpenEmergency}
                        className="w-full py-1.5 bg-white text-rose-700 hover:bg-rose-50 font-extrabold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                      >
                        Open Emergency Response Hub
                      </button>
                    </div>
                  )}

                  {/* Message Bottom Metadata & Controls */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                    {/* Controls for Assistant Messages */}
                    {m.sender === 'assistant' ? (
                      <div className="flex items-center gap-1.5">
                        {/* Listen / Stop Audio */}
                        <button
                          onClick={() => {
                            if (isThisMsgSpeaking) {
                              stopSpeaking();
                            } else {
                              speakMessage(m);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isThisMsgSpeaking
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-200/90 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 text-slate-700 dark:text-slate-300'
                          }`}
                          title={isThisMsgSpeaking ? 'Stop speaking' : 'Listen to response'}
                        >
                          {isThisMsgSpeaking ? (
                            <>
                              <Square className="w-3 h-3 fill-current text-white animate-pulse" />
                              <span>Stop 🔇</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Listen 🔊</span>
                            </>
                          )}
                        </button>

                        {/* Copy Response */}
                        <button
                          onClick={() => handleCopyMessage(m.text, m.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="Copy response text"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Detected Language Tag */}
                        {m.detectedLanguage && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {m.detectedLanguage === 'hi'
                              ? 'हिंदी'
                              : m.detectedLanguage === 'hinglish'
                              ? 'Hinglish'
                              : 'English'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] opacity-75">
                        {m.detectedLanguage === 'hi'
                          ? 'हिंदी संवाद'
                          : m.detectedLanguage === 'hinglish'
                          ? 'Hinglish Voice/Text'
                          : 'Voice/Text Input'}
                      </span>
                    )}

                    <span
                      className={`text-[9px] block text-right opacity-70 ${
                        m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 w-fit shadow-2xs">
              <JevanCareLoader size="sm" color="forest" label="JeevanCare is preparing guidance..." />
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Conversational Starters Chips */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Try asking:
            </span>
            {visiblePrompts.slice(0, 4).map((qp) => (
              <button
                key={qp.id}
                onClick={() => handleQuickPromptClick(qp)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-lg whitespace-nowrap transition-all text-[11px] font-medium shrink-0 cursor-pointer"
              >
                {qp.label}
              </button>
            ))}
          </div>
        )}

        {/* Selected Image Thumbnail preview */}
        {selectedImage && (
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>Attached medical photo or document</span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Form Controls */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2"
        >
          <input
            id="assistant-image-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
            }}
          />

          {/* Attach Image Button */}
          <button
            type="button"
            onClick={() => document.getElementById('assistant-image-input')?.click()}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors shrink-0 cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
            title="Attach Prescription or Symptom Photo"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 font-bold text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] ${
              isListening
                ? 'bg-rose-600 text-white border-rose-700 shadow-md animate-pulse'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={isListening ? 'Stop Voice Recording' : 'Speak Your Health Query'}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Voice Input</span>
              </>
            )}
          </button>

          {/* Text Input Field */}
          <input
            id="assistant-chat-text-input"
            type="text"
            value={input}
            onChange={(e) => {
              // When user starts typing, cancel assistant speech if talking
              if (isSpeaking) stopSpeaking();
              setInput(e.target.value);
            }}
            placeholder={
              isListening
                ? 'Listening to your speech...'
                : selectedLanguage === 'hi'
                ? 'लक्षण, दवा या स्वास्थ्य सलाह के बारे में पूछें...'
                : selectedLanguage === 'hinglish'
                ? 'Symptoms, medicine ya health guidance ke baare me puchiye...'
                : 'Ask symptoms, medicine questions, or lifestyle guidance...'
            }
            className="flex-1 min-h-[44px] px-4 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] text-slate-800 dark:text-slate-100"
          />

          {/* Stop Speaking Form Control if Active */}
          {isSpeaking && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="min-h-[44px] min-w-[44px] p-2.5 bg-rose-600 text-white font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              title="Stop Voice Output"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          )}

          {/* Send Button */}
          <button
            id="btn-assistant-send-message"
            type="submit"
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className="min-h-[44px] min-w-[44px] px-4 py-2.5 bg-[#1a5336] hover:bg-[#143e29] text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-40 shrink-0 cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
            title="Send Message"
          >
            {isLoading ? <JevanCareLoader size="xs" color="white" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Medical Disclaimer Note */}
      <div
        id="assistant-medical-disclaimer"
        className="p-3 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400 flex items-start gap-2"
      >
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <p>
          <span className="font-bold">Medical Guidance Notice:</span> JeevanCare provides informational guidance only and is not a substitute for clinical examination or diagnosis. In case of acute or worsening symptoms, please consult a licensed healthcare practitioner or contact emergency services immediately.
        </p>
      </div>
    </div>
  );
};
