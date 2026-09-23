import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  UserPlus
} from 'lucide-react';
import {
  getSavedGoogleAccounts,
  saveGoogleAccount,
  removeSavedGoogleAccount
} from '../../services/supabaseService';
import { JevanCareLoader } from '../common/JevanCareLoader';

interface GoogleAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  lastUsed?: string;
}

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: { id?: string; email: string; name?: string }) => Promise<void>;
  isLoading?: boolean;
}

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

export const GoogleAccountChooserModal: React.FC<GoogleAccountChooserModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  isLoading = false,
}) => {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authenticatingEmail, setAuthenticatingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      setErrorMessage(null);
      setIsAddingNew(false);
      setNewEmail('');
      setNewName('');
      setAuthenticatingEmail(null);
    }
  }, [isOpen]);

  const loadAccounts = () => {
    const saved = getSavedGoogleAccounts();
    if (saved && saved.length > 0) {
      setAccounts(saved);
    } else {
      // Seed initial recognizable test accounts for easy multi-account switching
      const defaultAccounts: GoogleAccount[] = [
        {
          id: 'usr_google_aarav_sharma',
          email: 'aarav.sharma@health.in',
          name: 'Aarav Sharma',
          lastUsed: 'Yesterday',
        },
        {
          id: 'usr_google_dr_sen',
          email: 'dr.sen@jeevancare.in',
          name: 'Dr. Vikramaditya Sen',
          lastUsed: '3 days ago',
        },
      ];
      defaultAccounts.forEach((acc) => saveGoogleAccount(acc));
      setAccounts(defaultAccounts);
    }
  };

  if (!isOpen) return null;

  const handlePickAccount = async (account: GoogleAccount) => {
    setAuthenticatingEmail(account.email);
    setErrorMessage(null);
    try {
      await onSelectAccount({
        id: account.id,
        email: account.email,
        name: account.name,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not authenticate with this Google account.');
      setAuthenticatingEmail(null);
    }
  };

  const handleAddNewAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setErrorMessage('Please enter a valid Google email address.');
      return;
    }

    const emailClean = newEmail.trim().toLowerCase();
    const nameClean = newName.trim() || emailClean.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const generatedId = `usr_google_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const newAcc: GoogleAccount = {
      id: generatedId,
      email: emailClean,
      name: nameClean,
      lastUsed: 'Just now',
    };

    saveGoogleAccount(newAcc);
    setAuthenticatingEmail(emailClean);
    setErrorMessage(null);

    try {
      await onSelectAccount({
        id: generatedId,
        email: emailClean,
        name: nameClean,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate new Google account.');
      setAuthenticatingEmail(null);
    }
  };

  const handleRemoveAccount = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeSavedGoogleAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div
      id="google-account-chooser-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading && !authenticatingEmail) {
          onClose();
        }
      }}
    >
      <div
        id="google-account-chooser-card"
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col max-h-[90vh]"
      >
        {/* Top Google OAuth Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GoogleLogoSvg />
              <span className="font-semibold text-slate-800 text-sm">Sign in with Google</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {isAddingNew ? 'Add Google Account' : 'Choose an account'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              to continue to <strong className="text-slate-800 font-semibold">Jevan Care Health Network</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading || !!authenticatingEmail}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
            aria-label="Close account chooser"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <X className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isAddingNew ? (
            <div className="space-y-2">
              {/* Account list */}
              {accounts.map((acc) => {
                const isThisAuthenticating = authenticatingEmail === acc.email;
                const initials = acc.name
                  ? acc.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : acc.email[0].toUpperCase();

                return (
                  <div
                    key={acc.id}
                    className="w-full p-2.5 sm:p-3 rounded-2xl border border-slate-200 hover:border-blue-500/80 hover:bg-blue-50/30 transition-all flex items-center justify-between group"
                  >
                    <button
                      type="button"
                      onClick={() => handlePickAccount(acc)}
                      disabled={isLoading || !!authenticatingEmail}
                      className="flex-1 text-left flex items-center gap-3.5 min-w-0 cursor-pointer disabled:opacity-60 focus:outline-none"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                          {acc.name}
                        </div>
                        <div className="text-xs text-slate-500 font-medium truncate">
                          {acc.email}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {isThisAuthenticating ? (
                        <JevanCareLoader size="sm" color="forest" />
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveAccount(e, acc.id)}
                          title="Remove account from device"
                          aria-label={`Remove account ${acc.email}`}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Action: Use another account */}
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(true);
                  setErrorMessage(null);
                }}
                disabled={isLoading || !!authenticatingEmail}
                className="w-full p-3.5 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center gap-3.5 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-800">Use another account</div>
                  <div className="text-[11px] text-slate-500">Sign in with a different Google account</div>
                </div>
              </button>
            </div>
          ) : (
            /* Add New Google Account Form */
            <form onSubmit={handleAddNewAccountSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="new-google-email">
                  Google Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="new-google-email"
                    type="email"
                    required
                    autoFocus
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. priya.patel@gmail.com"
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="new-google-name">
                  Full Display Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="new-google-name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Priya Patel"
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quick Presets for Convenient Testing */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Or select a clinical profile preset:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewEmail('priya.patel@health.in');
                      setNewName('Priya Patel');
                    }}
                    className="p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-[11px] font-semibold text-slate-700 transition-all cursor-pointer"
                  >
                    <div className="font-bold text-slate-900">Priya Patel</div>
                    <div className="text-[10px] text-slate-500 truncate">priya.patel@health.in</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewEmail('dr.ananya@jeevancare.in');
                      setNewName('Dr. Ananya Roy');
                    }}
                    className="p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-[11px] font-semibold text-slate-700 transition-all cursor-pointer"
                  >
                    <div className="font-bold text-slate-900">Dr. Ananya Roy</div>
                    <div className="text-[10px] text-slate-500 truncate">dr.ananya@jeevancare.in</div>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setErrorMessage(null);
                  }}
                  className="flex-1 min-h-[44px] py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !!authenticatingEmail}
                  className="flex-1 min-h-[44px] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {authenticatingEmail ? (
                    <JevanCareLoader size="sm" color="white" label="Connecting..." />
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Security Notice */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Isolated E2E health session</span>
          </div>
          <span className="text-slate-400">OAuth 2.0 / Supabase</span>
        </div>
      </div>
    </div>
  );
};
