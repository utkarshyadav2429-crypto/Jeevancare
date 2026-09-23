/**
 * JevanCare Multilingual Voice Assistant Service
 * Provides natural speech synthesis with language detection, custom female/conversational voices,
 * Hinglish support, personality pacing, and interruptible speech playback.
 */

export type VoicePersonality = 'calm' | 'clear' | 'friendly';
export type AppLanguage = 'en' | 'hi' | 'hinglish' | 'auto';

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  gender: 'female' | 'male' | 'neutral';
  isIndianLocale: boolean;
  isHindiLocale: boolean;
}

export class VoiceAssistantService {
  private static instance: VoiceAssistantService;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private onStateChangeListeners: Array<(isSpeaking: boolean) => void> = [];

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', () => this.loadVoices());
    }
  }

  public static getInstance(): VoiceAssistantService {
    if (!VoiceAssistantService.instance) {
      VoiceAssistantService.instance = new VoiceAssistantService();
    }
    return VoiceAssistantService.instance;
  }

  private loadVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
    return this.voices;
  }

  /**
   * Find the most natural voice for the target language (English, Hindi, or Hinglish).
   */
  public getBestVoice(
    targetLanguage: 'en' | 'hi' | 'hinglish',
    preferredGender: 'female' | 'male' = 'female'
  ): SpeechSynthesisVoice | null {
    const allVoices = this.getAvailableVoices();
    if (!allVoices || allVoices.length === 0) return null;

    const femaleKeywords = [
      'female', 'samantha', 'victoria', 'karen', 'zira', 'fiona',
      'veena', 'google us english', 'google uk english female', 'moira',
      'jenny', 'aria', 'natasha', 'sonia', 'swara', 'kalpana', 'neerja',
      'en-us-x-sfg', 'natural', 'online'
    ];

    // 1. Hindi Target ('hi')
    if (targetLanguage === 'hi') {
      const nativeHindi = allVoices.find((v) => {
        const lang = v.lang.toLowerCase();
        const name = v.name.toLowerCase();
        return (lang.startsWith('hi') || lang === 'hi-in' || name.includes('hindi') || name.includes('हिन्दी')) &&
          (preferredGender === 'female' ? femaleKeywords.some((k) => name.includes(k)) || !name.includes('male') : true);
      });
      if (nativeHindi) return nativeHindi;

      const anyHindi = allVoices.find((v) => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (anyHindi) return anyHindi;
    }

    // 2. Hinglish Target ('hinglish') - Prefer Indian English (en-IN) or Hindi bilingual
    if (targetLanguage === 'hinglish') {
      const indianEnglishFemale = allVoices.find((v) => {
        const lang = v.lang.toLowerCase();
        const name = v.name.toLowerCase();
        return (lang === 'en-in' || lang.startsWith('en_in') || name.includes('india') || name.includes('neerja') || name.includes('veena')) &&
          (preferredGender === 'female' ? femaleKeywords.some((k) => name.includes(k)) || !name.includes('male') : true);
      });
      if (indianEnglishFemale) return indianEnglishFemale;

      const anyIndianEnglish = allVoices.find((v) => v.lang.toLowerCase() === 'en-in' || v.name.toLowerCase().includes('india'));
      if (anyIndianEnglish) return anyIndianEnglish;
    }

    // 3. English Target ('en') - Prefer high quality natural female voice
    const femaleEn = allVoices.find((v) => {
      const name = v.name.toLowerCase();
      const isEn = v.lang.toLowerCase().startsWith('en');
      return isEn && femaleKeywords.some((k) => name.includes(k));
    });
    if (femaleEn) return femaleEn;

    const anyEn = allVoices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (anyEn) return anyEn;

    return allVoices[0] || null;
  }

  /**
   * Speak optimized voice text with given personality and language.
   */
  public speak(
    voiceText: string,
    options: {
      language?: 'en' | 'hi' | 'hinglish';
      personality?: VoicePersonality;
      customVoice?: SpeechSynthesisVoice | null;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options.onError?.('Speech synthesis not supported');
      return;
    }

    // Interrupt any active speech immediately
    this.stop();

    if (!voiceText || !voiceText.trim()) {
      options.onEnd?.();
      return;
    }

    const lang = options.language || 'en';
    const personality = options.personality || 'friendly';
    const voiceToUse = options.customVoice || this.getBestVoice(lang, 'female');

    const utterance = new SpeechSynthesisUtterance(voiceText);

    // Apply personality pitch & rate parameters
    switch (personality) {
      case 'calm':
        utterance.rate = 0.92;
        utterance.pitch = 0.98;
        break;
      case 'clear':
        utterance.rate = 1.0;
        utterance.pitch = 1.02;
        break;
      case 'friendly':
      default:
        utterance.rate = 1.02;
        utterance.pitch = 1.06;
        break;
    }

    if (voiceToUse) {
      utterance.voice = voiceToUse;
      utterance.lang = voiceToUse.lang || (lang === 'hi' ? 'hi-IN' : lang === 'hinglish' ? 'en-IN' : 'en-US');
    } else {
      utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'hinglish' ? 'en-IN' : 'en-US';
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.notifyStateChange(true);
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.notifyStateChange(false);
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.warn('[VoiceAssistantService] Speech synthesis error:', event);
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.notifyStateChange(false);
      options.onError?.(event);
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Immediately stops any speech output (interruption).
   */
  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.notifyStateChange(false);
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public addStateListener(listener: (isSpeaking: boolean) => void): () => void {
    this.onStateChangeListeners.push(listener);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== listener);
    };
  }

  private notifyStateChange(isSpeaking: boolean): void {
    this.onStateChangeListeners.forEach((l) => l(isSpeaking));
  }
}

export const voiceAssistant = VoiceAssistantService.getInstance();
