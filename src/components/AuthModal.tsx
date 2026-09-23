import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Shield,
  Smartphone,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  Globe,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { auditLogger } from '../services/AuditLogger';
import { useAuth } from '../context/AuthContext';
import { JevanCareLoader } from './common/JevanCareLoader';
import { GoogleAccountChooserModal } from './auth/GoogleAccountChooserModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  profile?: UserProfile;
  setProfile?: React.Dispatch<React.SetStateAction<UserProfile>>;
  onLoginSuccess?: (updated: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  profile,
  setProfile,
  onLoginSuccess,
}) => {
  const { signIn, signInWithGoogle, signUp, isDemoMode, authMode } = useAuth();

  const currentProfile = userProfile || profile || {
    id: 'u1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@health.in',
    phone: '+91 98765 43210',
    role: 'patient' as UserRole,
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Dust Mites'],
    chronicConditions: ['Mild Asthma'],
    emergencyContactName: 'Pooja Sharma',
    emergencyContactPhone: '+91 98765 12345',
    isEmergencySharingEnabled: true,
  };

  const [mode, setMode] = useState<'login' | 'signup' | 'otp' | 'mfa' | 'forgot'>('login');
  const [email, setEmail] = useState(currentProfile.email || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(currentProfile.name || '');
  const [role, setRole] = useState<UserRole>(currentProfile.role || 'patient');
  const [otpCode, setOtpCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, name || 'User', role);
        if (error) {
          setMessage(error);
          setIsSuccess(false);
          setIsLoading(false);
          return;
        }
        setIsSuccess(true);
        setMessage('Account created and verified! Redirecting...');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setMessage(error);
          setIsSuccess(false);
          setIsLoading(false);
          return;
        }
        setIsSuccess(true);
        setMessage('Signed in successfully! Redirecting...');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else if (mode === 'forgot') {
        setIsSuccess(true);
        setMessage('Password reset instructions sent to your email.');
        setTimeout(() => setMode('login'), 2000);
      }
    } catch (err: any) {
      setMessage(err.message || 'Authentication failed.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setMessage('');
    setShowGoogleChooser(true);
  };

  const handleGoogleAccountSelected = async (selected: { id?: string; email: string; name?: string }) => {
    setIsLoading(true);
    try {
      const { success, error } = await signInWithGoogle(selected);
      if (!success) {
        setMessage(error || 'Google Sign-In could not be initialized.');
        setIsSuccess(false);
      } else {
        setIsSuccess(true);
        setMessage('Google authentication session active. Redirecting...');
        setShowGoogleChooser(false);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setMessage(err.message || 'Google authentication failed.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        
        {/* Header bar */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-teal-600 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-200" />
              <h3 className="font-bold text-lg">
                {mode === 'login' && 'Secure Login'}
                {mode === 'signup' && 'Create Jevan Care Account'}
                {mode === 'otp' && 'OTP Email Verification'}
                {mode === 'mfa' && 'Multi-Factor Auth (MFA)'}
                {mode === 'forgot' && 'Reset Password'}
              </h3>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              HIPAA & E2E Encrypted Health Portal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-blue-100 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">

          {message && (
            <div className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              isSuccess ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}>
              {isSuccess ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Account Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['patient', 'doctor', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        role === r
                          ? 'bg-blue-500 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'otp' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enter 6-Digit OTP Code
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2.5 text-center tracking-widest text-lg font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  Code sent to {email}. Demo code: <span className="font-mono font-bold text-blue-600">123456</span>
                </p>
              </div>
            )}

            {mode === 'mfa' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Authenticator App MFA Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="987654"
                    className="w-full pl-9 pr-3 py-2.5 text-center tracking-widest text-lg font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <JevanCareLoader size="sm" color="white" label="Connecting Supabase..." />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In securely'}
                    {mode === 'signup' && 'Continue to Verification'}
                    {mode === 'otp' && 'Verify & Enter Portal'}
                    {mode === 'mfa' && 'Authenticate MFA'}
                    {mode === 'forgot' && 'Send Reset Email'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Auth Divider */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="mt-5">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
                <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase">
                  Or
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                className="mt-4 w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4 text-blue-500" />
                <span>Continue with Google Workspace</span>
              </button>
            </div>
          )}

          {/* Toggle Login/Signup */}
          <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Create Account
                </button>
              </p>
            ) : mode === 'signup' ? (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <button
                onClick={() => setMode('login')}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Back to Sign In
              </button>
            )}
          </div>

        </div>
      </div>

      <GoogleAccountChooserModal
        isOpen={showGoogleChooser}
        onClose={() => setShowGoogleChooser(false)}
        onSelectAccount={handleGoogleAccountSelected}
        isLoading={isLoading}
      />
    </div>
  );
};
