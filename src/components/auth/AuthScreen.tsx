import React, { useState } from 'react';
import {
  HeartPulse,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  KeyRound,
  Stethoscope,
  Sparkles,
  LockKeyhole,
  Check,
  FlaskConical,
  ChevronLeft,
  Info,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { JevanCareLoader } from '../common/JevanCareLoader';
import { UserRole } from '../../types';
import { GoogleAccountChooserModal } from './GoogleAccountChooserModal';

const GoogleLogoSvg = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const AuthScreen: React.FC = () => {
  const { signIn, signInWithGoogle, signUp, resetPassword, enterDemoMode, authError, clearAuthError } = useAuth();

  // Screen level view: 'welcome' | 'account' | 'demo'
  const [activeView, setActiveView] = useState<'welcome' | 'account' | 'demo'>('welcome');
  
  // Account Mode sub-states
  const [accountTab, setAccountTab] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-[#a83b3b]' };
    if (score === 2 || score === 3) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-600' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Primary Google Fast-Login Handler: Opens Account Chooser
  const handleGoogleAuth = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    clearAuthError();
    setShowGoogleChooser(true);
  };

  const handleGoogleAccountSelected = async (selected: { id?: string; email: string; name?: string }) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    clearAuthError();
    setIsGoogleLoading(true);

    try {
      const res = await signInWithGoogle(selected);
      if (!res.success) {
        setErrorMessage(res.error || 'Google Sign-In could not be completed.');
      } else {
        setShowGoogleChooser(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during Google authentication.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    clearAuthError();

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email address and password.');
      return;
    }

    setIsLoading(true);
    const res = await signIn(email.trim(), password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Invalid login credentials. Please check your email and password.');
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    clearAuthError();

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password entry.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('You must accept the Terms of Care & ABHA Privacy Protocols to create an account.');
      return;
    }

    setIsLoading(true);
    const res = await signUp(email.trim(), password, fullName.trim(), role);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Could not create account. Please try again or sign in.');
    } else {
      setSuccessMessage('Account created successfully! Redirecting to your encrypted dashboard...');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    clearAuthError();

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    const res = await resetPassword(email.trim());
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(res.message || `Password reset link dispatched to ${email}`);
    } else {
      setErrorMessage(res.error || 'Failed to request password reset.');
    }
  };

  const displayError = errorMessage || authError;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1b3b2b] flex flex-col justify-between font-sans selection:bg-[#1b3b2b] selection:text-white">
      
      {/* Top Brand Header */}
      <header className="px-6 py-4 sm:py-5 border-b border-[#e6dfd3] bg-[#fcfaf6]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveView('welcome'); clearAuthError(); }}>
            <div className="w-10 h-10 rounded-2xl bg-[#1b3b2b] flex items-center justify-center text-white shadow-md">
              <HeartPulse className="w-6 h-6 text-[#a3d4b6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-editorial text-2xl tracking-tight font-bold text-[#1b3b2b]">
                  Jevan Care
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#e8eee5] text-[#2b503b] border border-[#d3decf]">
                  Health Network
                </span>
              </div>
              <p className="text-xs text-[#5c5647] font-medium hidden sm:block">
                Lifelong Encrypted Digital Health Record & Clinical AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeView !== 'welcome' && (
              <button
                onClick={() => {
                  setActiveView('welcome');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  clearAuthError();
                }}
                className="px-3 py-2 text-xs font-bold rounded-xl text-[#5c5647] hover:text-[#1b3b2b] hover:bg-[#e8eee5] transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>All Options</span>
              </button>
            )}

            {activeView !== 'demo' && (
              <button
                onClick={() => {
                  setActiveView('demo');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  clearAuthError();
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#e8eee5] hover:bg-[#d8e4d3] text-[#1b3b2b] transition-all flex items-center gap-1.5 border border-[#c5d8c0] cursor-pointer"
                title="Instant test mode with simulated data"
              >
                <FlaskConical className="w-3.5 h-3.5 text-[#2b503b]" />
                <span>Explore Demo</span>
              </button>
            )}

            {activeView !== 'account' && (
              <button
                onClick={() => {
                  setActiveView('account');
                  setAccountTab('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  clearAuthError();
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#1b3b2b] hover:bg-[#244836] text-[#fcfaf6] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-[#a3d4b6]" />
                <span>Email Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Central Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex items-center justify-center">
        
        {/* =========================================================================
            VIEW 1: WELCOME & FINAL AUTH OPTIONS
            [ Continue with Google ]
            [ Continue with Email ]
            [ Explore Demo ]
            ========================================================================= */}
        {activeView === 'welcome' && (
          <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in">
            
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f8ebea] border border-[#eed8d7] text-[#a83b3b] text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-[#a83b3b]" />
                <span>ABDM & ABHA Compliant • AES-256 Encrypted Cloud Vault</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif-editorial font-bold text-[#1b3b2b] tracking-tight leading-tight">
                Welcome to Jevan Care
              </h1>
              <p className="text-sm sm:text-base text-[#5c5647] leading-relaxed">
                Connect to your private lifelong health records, synced ABHA profile, and AI clinical assistant.
              </p>
            </div>

            {/* Error Notification */}
            {displayError && (
              <div className="p-4 rounded-2xl bg-[#f8ebea] border border-[#eed8d7] text-[#a83b3b] text-xs font-semibold flex items-start justify-between gap-3 animate-in fade-in" role="alert">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#a83b3b] shrink-0 mt-0.5" />
                  <span>{displayError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    clearAuthError();
                  }}
                  className="text-[#a83b3b] hover:opacity-70 text-xs p-1"
                  aria-label="Dismiss error"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Central Auth Choice Box */}
            <div className="bg-white rounded-3xl border border-[#e6dfd3] shadow-lg p-6 sm:p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1b3b2b] via-[#2b503b] to-[#4285F4]" />

              <div className="space-y-4">
                
                {/* 1. PRIMARY FAST LOGIN: CONTINUE WITH GOOGLE */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full min-h-[52px] py-3.5 px-6 bg-white hover:bg-[#f6f2e9] active:bg-[#ede8dc] text-[#1b3b2b] text-sm font-bold rounded-2xl border-2 border-[#1b3b2b]/30 hover:border-[#1b3b2b] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 group"
                  >
                    {isGoogleLoading ? (
                      <JevanCareLoader size="sm" color="forest" label="Connecting to Google OAuth..." />
                    ) : (
                      <>
                        <GoogleLogoSvg />
                        <span className="text-sm font-bold text-[#1b3b2b] tracking-tight">
                          Continue with Google
                        </span>
                        <span className="hidden sm:inline text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md ml-auto border border-emerald-200">
                          Fast 1-Click
                        </span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-[#827b6c] text-center">
                    Instant secure login via official Google OAuth & Supabase authentication.
                  </p>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center pt-2 pb-1">
                  <div className="border-t border-[#e6dfd3] w-full" />
                  <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-[#827b6c] absolute">
                    Or choose alternative
                  </span>
                </div>

                {/* 2. SECONDARY OPTIONS: EMAIL & DEMO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Continue with Email */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('account');
                      setAccountTab('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      clearAuthError();
                    }}
                    className="min-h-[50px] p-3.5 bg-[#fcfaf6] hover:bg-[#e8eee5] text-[#1b3b2b] text-xs font-bold rounded-2xl border border-[#e6dfd3] hover:border-[#2b503b]/50 shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-[#2b503b]" />
                    <span>Continue with Email</span>
                  </button>

                  {/* Explore Demo */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('demo');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      clearAuthError();
                    }}
                    className="min-h-[50px] p-3.5 bg-[#fcfaf6] hover:bg-[#f8ebea] text-[#1b3b2b] text-xs font-bold rounded-2xl border border-[#e6dfd3] hover:border-[#a83b3b]/40 shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FlaskConical className="w-4 h-4 text-[#a83b3b]" />
                    <span>Explore Demo</span>
                  </button>

                </div>

              </div>

              {/* Mode Architecture Footnote */}
              <div className="pt-3 border-t border-[#f0ece3] flex items-center justify-between text-[11px] text-[#827b6c]">
                <span className="flex items-center gap-1.5">
                  <LockKeyhole className="w-3.5 h-3.5 text-[#2b503b]" />
                  <strong>Account Mode:</strong> Google or Email
                </span>
                <span className="flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-[#a83b3b]" />
                  <strong>Demo Mode:</strong> Sandbox
                </span>
              </div>

            </div>

            {/* Security Assurance Badges */}
            <div className="pt-1 flex flex-wrap items-center justify-center gap-6 text-xs text-[#827b6c]">
              <span className="flex items-center gap-1.5 font-semibold text-[#1b3b2b]">
                <ShieldCheck className="w-4 h-4 text-[#2b503b]" /> Zero Unsolicited Permissions
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-semibold text-[#1b3b2b]">
                <LockKeyhole className="w-4 h-4 text-[#2b503b]" /> Strict Row Level Security
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-semibold text-[#1b3b2b]">
                <Check className="w-4 h-4 text-[#2b503b]" /> Supabase Google OAuth
              </span>
            </div>

          </div>
        )}

        {/* =========================================================================
            VIEW 2: EMAIL ACCOUNT MODE (Sign In / Sign Up / Forgot Password)
            ========================================================================= */}
        {activeView === 'account' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center animate-in fade-in">
            
            {/* Left Column: Account Benefits */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <button
                type="button"
                onClick={() => {
                  setActiveView('welcome');
                  clearAuthError();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2b503b] hover:underline"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Login Options</span>
              </button>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8eee5] border border-[#d3decf] text-[#2b503b] text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-[#2b503b]" />
                <span>Account Mode • Encrypted Supabase Auth</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif-editorial font-bold text-[#1b3b2b] leading-[1.15] tracking-tight">
                Your lifelong health records, <br />
                <span className="italic font-normal text-[#2b503b]">privately encrypted.</span>
              </h1>

              <p className="text-sm sm:text-base text-[#5c5647] leading-relaxed max-w-xl font-normal">
                Signing in with your account connects you to your private, persistent health vault. All records are guarded by strict Row Level Security (RLS).
              </p>

              {/* Value Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white border border-[#e6dfd3] shadow-2xs space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-[#e8eee5] flex items-center justify-center text-[#1b3b2b]">
                    <LockKeyhole className="w-4 h-4 text-[#2b503b]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1b3b2b]">256-Bit Vault Storage</h3>
                  <p className="text-xs text-[#827b6c]">Private storage with granular doctor sharing permissions.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#e6dfd3] shadow-2xs space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-[#f8ebea] flex items-center justify-center text-[#a83b3b]">
                    <Sparkles className="w-4 h-4 text-[#a83b3b]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1b3b2b]">Prescription Intelligence</h3>
                  <p className="text-xs text-[#827b6c]">AI interaction cross-checks against your allergies.</p>
                </div>
              </div>
            </div>

            {/* Right Column: Authentication Card */}
            <div className="lg:col-span-6 w-full max-w-md mx-auto">
              <div className="bg-white rounded-3xl border border-[#e6dfd3] shadow-xl p-6 sm:p-8 space-y-5 relative overflow-hidden">
                
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1b3b2b] via-[#2b503b] to-[#4285F4]" />

                {/* Quick Google Sign-In button inside card as well */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-[#fcfaf6] hover:bg-[#f6f2e9] text-[#1b3b2b] text-xs font-bold rounded-xl border border-[#e6dfd3] hover:border-[#1b3b2b]/40 shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <JevanCareLoader size="sm" color="forest" label="Connecting..." />
                  ) : (
                    <>
                      <GoogleLogoSvg />
                      <span>Fast Sign-In with Google</span>
                    </>
                  )}
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-[#e6dfd3] w-full" />
                  <span className="bg-white px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#827b6c] absolute">
                    Or with Email
                  </span>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center justify-between p-1 bg-[#f6f2e9] rounded-2xl border border-[#e6dfd3]">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountTab('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      clearAuthError();
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      accountTab === 'login'
                        ? 'bg-white text-[#1b3b2b] shadow-xs'
                        : 'text-[#827b6c] hover:text-[#1b3b2b]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountTab('signup');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      clearAuthError();
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      accountTab === 'signup'
                        ? 'bg-white text-[#1b3b2b] shadow-xs'
                        : 'text-[#827b6c] hover:text-[#1b3b2b]'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Headlines */}
                <div>
                  <h2 className="text-xl font-bold text-[#1b3b2b]">
                    {accountTab === 'login' && 'Sign In with Email'}
                    {accountTab === 'signup' && 'Create Your Health Account'}
                    {accountTab === 'forgot' && 'Reset Password'}
                  </h2>
                  <p className="text-xs text-[#827b6c] mt-1">
                    {accountTab === 'login' && 'Enter your registered credentials to access your private health vault.'}
                    {accountTab === 'signup' && 'Register your verified account for encrypted health tracking.'}
                    {accountTab === 'forgot' && 'Enter your registered email to receive a password reset link.'}
                  </p>
                </div>

                {/* Error Banner */}
                {displayError && (
                  <div className="p-3.5 rounded-2xl bg-[#f8ebea] border border-[#eed8d7] text-[#a83b3b] text-xs font-semibold flex items-start justify-between gap-2 animate-in fade-in" role="alert">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-[#a83b3b] shrink-0 mt-0.5" />
                      <span>{displayError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        clearAuthError();
                      }}
                      className="text-[#a83b3b] hover:opacity-70 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Success Banner */}
                {successMessage && (
                  <div className="p-3.5 rounded-2xl bg-[#e8eee5] border border-[#d3decf] text-[#2b503b] text-xs font-semibold flex items-start gap-2.5 animate-in fade-in" role="status">
                    <CheckCircle2 className="w-4 h-4 text-[#2b503b] shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* SIGN IN FORM */}
                {accountTab === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1b3b2b]" htmlFor="login-email">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#827b6c]" />
                        <input
                          id="login-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. aarav.sharma@health.in"
                          className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-[#fcfaf6] border border-[#e6dfd3] rounded-xl text-xs font-medium text-[#1b3b2b] placeholder-[#a8a192] focus:outline-none focus:ring-2 focus:ring-[#1b3b2b]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#1b3b2b]" htmlFor="login-password">Password</label>
                        <button
                          type="button"
                          onClick={() => {
                            setAccountTab('forgot');
                            setErrorMessage(null);
                            setSuccessMessage(null);
                            clearAuthError();
                          }}
                          className="text-[11px] font-bold text-[#2b503b] hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#827b6c]" />
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-[#fcfaf6] border border-[#e6dfd3] rounded-xl text-xs font-medium text-[#1b3b2b] placeholder-[#a8a192] focus:outline-none focus:ring-2 focus:ring-[#1b3b2b]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#827b6c] hover:text-[#1b3b2b] p-1 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-[#5c5647]">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-[#e6dfd3] text-[#1b3b2b] focus:ring-[#1b3b2b]"
                        />
                        <span>Remember my session</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full min-h-[48px] py-3 bg-[#1b3b2b] hover:bg-[#244836] disabled:opacity-50 text-[#fcfaf6] text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#1b3b2b]"
                    >
                      {isLoading ? (
                        <JevanCareLoader size="sm" color="white" label="Authenticating session..." />
                      ) : (
                        <>
                          <span>Sign In to Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* CREATE ACCOUNT FORM */}
                {accountTab === 'signup' && (
                  <form onSubmit={handleSignUpSubmit} className="space-y-4" noValidate>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1b3b2b]" htmlFor="signup-name">Full Legal Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#827b6c]" />
                        <input
                          id="signup-name"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Aarav Sharma"
                          className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-[#fcfaf6] border border-[#e6dfd3] rounded-xl text-xs font-medium text-[#1b3b2b] placeholder-[#a8a192] focus:outline-none focus:ring-2 focus:ring-[#1b3b2b]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1b3b2b]" htmlFor="signup-email">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#827b6c]" />
                        <input
                          id="signup-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="aarav.sharma@health.in"
                          className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-[#fcfaf6] border border-[#e6dfd3] rounded-xl text-xs font-medium text-[#1b3b2b] placeholder-[#a8a192] focus:outline-none focus:ring-2 focus:ring-[#1b3b2b]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#1b3b2b]" htmlFor="signup-password">Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#827b6c]" />
                          <input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 chars"
                            className="w-full min-h-[44px] pl-9 pr-3 py-2.5 bg-[#fcfaf6] border border-[#e6dfd3] rounded-xl text-xs font-medium text-[#1b3b2b] placeholder-[#a8a192] focus:outline-none focus:ring-2 focus:ring-[#1b3b2b]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#1b3b2b]" htmlFor="signup-confirm">Confirm</label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#827b6c]" />
                          <input
                            id="signup-confirm"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat"
                            className="w-full min-h-[44px] pl-9 pr-3 py-2.5 bg-[#fcfaf6] border border-[#e6dfd3] rounded-xl text-xs font-medium text-[#1b3b2b] placeholder-[#a8a192] focus:outline-none focus:ring-2 focus:ring-[#1b3b2b]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password Strength */}
                    {password && (
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#827b6c]">
                          <span>Strength:</span>
                          <span className={`font-bold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-[#e6dfd3] rounded-full overflow-hidden flex gap-1">
                          <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'}`} />
                          <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`} />
                          <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`} />
                        </div>
                      </div>
                    )}

                    {/* Role Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1b3b2b]">Account Role</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRole('patient')}
                          className={`min-h-[44px] py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            role === 'patient'
                              ? 'bg-[#1b3b2b] text-white border-[#1b3b2b]'
                              : 'bg-[#fcfaf6] text-[#5c5647] border-[#e6dfd3] hover:bg-[#f6f2e9]'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Patient</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRole('doctor')}
                          className={`min-h-[44px] py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            role === 'doctor'
                              ? 'bg-[#1b3b2b] text-white border-[#1b3b2b]'
                              : 'bg-[#fcfaf6] text-[#5c5647] border-[#e6dfd3] hover:bg-[#f6f2e9]'
                          }`}
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Doctor</span>
                        </button>
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <label className="flex items-start gap-2.5 text-xs text-[#5c5647] pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 rounded border-[#e6dfd3] text-[#1b3b2b] focus:ring-[#1b3b2b]"
                      />
                      <span className="leading-tight">
                        I agree to the <strong>Terms of Care</strong> & <strong>ABHA Privacy Protocols</strong>. My health records remain end-to-end encrypted under my control.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full min-h-[48px] py-3 bg-[#1b3b2b] hover:bg-[#244836] disabled:opacity-50 text-[#fcfaf6] text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#1b3b2b]"
                    >
                      {isLoading ? (
                        <JevanCareLoader size="sm" color="white" label="Registering Supabase account..." />
                      ) : (
                        <>
                          <span>Create Health Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* FORGOT PASSWORD FORM */}
                {accountTab === 'forgot' && (
                  <form onSubmit={handleForgotSubmit} className="space-y-4" noValidate>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1b3b2b]" htmlFor="forgot-email">Registered Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#827b6c]" />
                        <input
                          id="forgot-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="aarav.sharma@health.in"
                          className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-[#fcfaf6] border border-[#e6dfd3] rounded-xl text-xs font-medium text-[#1b3b2b] placeholder-[#a8a192] focus:outline-none focus:ring-2 focus:ring-[#1b3b2b]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full min-h-[48px] py-3 bg-[#1b3b2b] hover:bg-[#244836] disabled:opacity-50 text-[#fcfaf6] text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#1b3b2b]"
                    >
                      {isLoading ? (
                        <JevanCareLoader size="sm" color="white" label="Sending reset link..." />
                      ) : (
                        <>
                          <span>Send Password Reset Email</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAccountTab('login');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        clearAuthError();
                      }}
                      className="w-full text-center text-xs font-bold text-[#2b503b] hover:underline pt-2 cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </form>
                )}

              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            VIEW 3: DEMO MODE (Explicit Disclosure & Simulated Identity Choice)
            ========================================================================= */}
        {activeView === 'demo' && (
          <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in">
            
            <button
              type="button"
              onClick={() => {
                setActiveView('welcome');
                clearAuthError();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2b503b] hover:underline"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Login Options</span>
            </button>

            {/* Disclosure Banner */}
            <div className="bg-amber-50 dark:bg-[#2a2214] border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-bold text-amber-950 dark:text-amber-200">
                    Demo Mode Disclosure & Simulated Environment
                  </h2>
                  <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    You are about to explore Jevan Care in <strong>Demo Mode</strong>. In this mode, the platform operates on isolated sample datasets. No real account is created, and no personal medical records are collected or saved to cloud servers.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-amber-900 dark:text-amber-200/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Simulated Health Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No Account Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Exit Anytime to Real Account</span>
                </div>
              </div>
            </div>

            {/* Demo Persona Options */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#827b6c]">
                Select Demo Role Experience:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Persona 1: Demo Patient */}
                <div className="bg-white rounded-2xl border-2 border-[#1b3b2b]/20 hover:border-[#1b3b2b] p-5 space-y-4 shadow-xs transition-all flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#e8eee5] text-[#1b3b2b] flex items-center justify-center">
                      <User className="w-5 h-5 text-[#2b503b]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#1b3b2b]">Demo Patient Experience</h4>
                      <p className="text-xs text-[#5c5647] mt-0.5">
                        Simulate the patient portal as <strong>Aarav Sharma</strong> (34 yrs, Mild Asthma, active prescription schedule, AES vault records).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => enterDemoMode('patient')}
                    className="w-full min-h-[44px] py-2.5 bg-[#1b3b2b] hover:bg-[#244836] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Launch Demo Patient</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Persona 2: Demo Doctor */}
                <div className="bg-white rounded-2xl border-2 border-[#1b3b2b]/20 hover:border-[#1b3b2b] p-5 space-y-4 shadow-xs transition-all flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#f8ebea] text-[#a83b3b] flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-[#a83b3b]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#1b3b2b]">Demo Doctor Workspace</h4>
                      <p className="text-xs text-[#5c5647] mt-0.5">
                        Simulate the clinical doctor portal as <strong>Dr. Vikramaditya Sen</strong> (Cardiologist, appointments queue, prescription generator).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => enterDemoMode('doctor')}
                    className="w-full min-h-[44px] py-2.5 bg-[#1b3b2b] hover:bg-[#244836] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Launch Demo Doctor</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[#e6dfd3] bg-[#fcfaf6] text-center text-xs text-[#827b6c]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Jevan Care Ecosystem • Encrypted Digital Health Network</span>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-[#5c5647]">
            <span>Privacy Protocols</span>
            <span>ABHA Integration</span>
            <span>Security Architecture</span>
          </div>
        </div>
      </footer>

      {/* Google Account Chooser & Switcher Modal */}
      <GoogleAccountChooserModal
        isOpen={showGoogleChooser}
        onClose={() => setShowGoogleChooser(false)}
        onSelectAccount={handleGoogleAccountSelected}
        isLoading={isGoogleLoading}
      />

    </div>
  );
};
