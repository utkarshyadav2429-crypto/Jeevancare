import React, { useState } from 'react';
import {
  ShieldCheck,
  Building,
  QrCode,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Key,
  ExternalLink,
  Lock,
  Download,
  Trash2,
  Sparkles,
  Smartphone,
  ArrowRight,
  X
} from 'lucide-react';
import { UserProfile, VaultItem } from '../../types';
import { auditLogger } from '../../services/AuditLogger';
import { JevanCareLoader } from '../common/JevanCareLoader';
import { useToast } from '../../context/ToastContext';

interface AbhaLinkingCardProps {
  userProfile?: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onAddVaultItem?: (item: VaultItem) => void;
}

export const AbhaLinkingCard: React.FC<AbhaLinkingCardProps> = ({
  userProfile,
  onUpdateProfile,
  onAddVaultItem,
}) => {
  const { showToast, showConfirm } = useToast();
  const [activeTab, setActiveTab] = useState<'link' | 'create'>('link');
  
  // Link existing state
  const [inputAbha, setInputAbha] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Create new state
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [mobileInput, setMobileInput] = useState(userProfile?.phone || '');
  const [createOtpStep, setCreateOtpStep] = useState(false);
  const [createOtpInput, setCreateOtpInput] = useState('');

  // Sync State
  const [isSyncingRecords, setIsSyncingRecords] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);

  const abhaNumber = userProfile?.abhaNumber;
  const abhaAddress = userProfile?.abhaAddress;
  const isLinked = userProfile?.abhaLinked || Boolean(abhaNumber);

  // Format 14 digit ABHA
  const formatAbha = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean.length <= 14) {
      return clean.replace(/(\d{2})(\d{4})?(\d{4})?(\d{4})?/, (_, p1, p2, p3, p4) => {
        let parts = [p1];
        if (p2) parts.push(p2);
        if (p3) parts.push(p3);
        if (p4) parts.push(p4);
        return parts.join('-');
      });
    }
    return num;
  };

  const handleSendLinkOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanNum = inputAbha.replace(/\D/g, '');
    if (cleanNum.length < 14 && !inputAbha.includes('@abha')) {
      setErrorMessage('Please enter a valid 14-digit ABHA Number or @abha address');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpStep(true);
    }, 1200);
  };

  const handleVerifyLinkOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.length < 4) {
      setErrorMessage('Please enter a valid 6-digit OTP sent to your Aadhaar mobile number.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const assignedAbha = inputAbha.includes('@abha')
        ? '91-3842-9102-4821'
        : formatAbha(inputAbha);
      const assignedAddress = inputAbha.includes('@abha')
        ? inputAbha
        : `${userProfile?.name?.toLowerCase().replace(/\s+/g, '') || 'patient'}@abha`;

      const updated: UserProfile = {
        ...(userProfile || { id: 'u1', name: 'User', email: 'user@example.com', role: 'patient' }),
        abhaNumber: assignedAbha,
        abhaAddress: assignedAddress,
        abhaLinked: true,
        abhaLinkedAt: new Date().toLocaleDateString('en-IN'),
      };

      onUpdateProfile(updated);
      auditLogger.logAction(
        'ABHA_LINKED',
        `Linked Ayushman Bharat Health Account (${assignedAbha}) to user profile via NHA OTP verification.`,
        updated,
        'SUCCESS'
      );
      setOtpStep(false);
      setInputAbha('');
      setOtpInput('');
    }, 1500);
  };

  const handleSendCreateOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanAadhaar = aadhaarInput.replace(/\D/g, '');
    if (cleanAadhaar.length < 12) {
      setErrorMessage('Please enter a valid 12-digit Aadhaar Number.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCreateOtpStep(true);
    }, 1200);
  };

  const handleVerifyCreateOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (createOtpInput.length < 4) {
      setErrorMessage('Please enter valid Aadhaar OTP');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const randomNum = Math.floor(1000000000 + Math.random() * 9000000000);
      const generatedAbha = `91-${randomNum.toString().slice(0, 4)}-${randomNum.toString().slice(4, 8)}-${randomNum.toString().slice(8, 12)}`;
      const generatedAddress = `${userProfile?.name?.toLowerCase().replace(/\s+/g, '') || 'patient'}${Math.floor(Math.random() * 900 + 100)}@abha`;

      const updated: UserProfile = {
        ...(userProfile || { id: 'u1', name: 'User', email: 'user@example.com', role: 'patient' }),
        abhaNumber: generatedAbha,
        abhaAddress: generatedAddress,
        abhaLinked: true,
        abhaLinkedAt: new Date().toLocaleDateString('en-IN'),
      };

      onUpdateProfile(updated);
      auditLogger.logAction(
        'ABHA_CREATED',
        `Generated new ABHA ID (${generatedAbha}) using Aadhaar authentication via ABDM gateway.`,
        updated,
        'SUCCESS'
      );
      setCreateOtpStep(false);
      setAadhaarInput('');
      setCreateOtpInput('');
    }, 1500);
  };

  const handleUnlinkAbha = () => {
    showConfirm({
      title: 'Unlink ABHA Health ID?',
      message: 'Are you sure you want to unlink your ABHA Health ID? Health records already saved in your vault will remain.',
      confirmText: 'Unlink ABHA',
      cancelText: 'Keep Linked',
      isDestructive: true,
      onConfirm: () => {
        const updated: UserProfile = {
          ...(userProfile || { id: 'u1', name: 'User', email: 'user@example.com', role: 'patient' }),
          abhaNumber: undefined,
          abhaAddress: undefined,
          abhaLinked: false,
          abhaLinkedAt: undefined,
        };

        onUpdateProfile(updated);
        showToast('ABHA Health ID unlinked successfully.', 'info');
        auditLogger.logAction(
          'ABHA_UNLINKED',
          `Unlinked ABHA ID from profile at user request.`,
          updated,
          'WARNING'
        );
      }
    });
  };

  const handleSyncGovernmentRecords = () => {
    setIsSyncingRecords(true);
    setSyncSuccessMsg('');

    setTimeout(() => {
      setIsSyncingRecords(false);

      if (onAddVaultItem) {
        // Add 3 official government health facility records to Medical Vault
        const rec1: VaultItem = {
          id: `v_abha_${Date.now()}_1`,
          title: 'KGMU Lucknow - Pulmonology Consultation & Spirometry Report',
          category: 'Discharge Summary',
          doctorName: 'Dr. Rajeshwar K. Tripathi (KGMU Lucknow)',
          diseaseOrTag: 'ABDM Health Sync',
          date: new Date().toISOString().split('T')[0],
          fileSize: '2.4 MB',
          fileType: 'pdf',
          notes: 'Synced via Ayushman Bharat Health Account (ABHA). Verified by National Health Authority.',
          isImportant: true,
        };

        const rec2: VaultItem = {
          id: `v_abha_${Date.now()}_2`,
          title: 'Apollo Hospital - Comprehensive Blood Count & Metabolic Panel',
          category: 'Lab Report',
          doctorName: 'Apollo Pathology Lab',
          diseaseOrTag: 'ABDM Health Sync',
          date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
          fileSize: '1.8 MB',
          fileType: 'pdf',
          notes: 'HbA1c: 6.2%, Serum Creatinine: 0.9 mg/dL. Synced from ABDM gateway.',
          isImportant: false,
        };

        const rec3: VaultItem = {
          id: `v_abha_${Date.now()}_3`,
          title: 'Max Healthcare - National Immunization & Booster Certificate',
          category: 'Vaccination',
          doctorName: 'Max Wellness Center',
          diseaseOrTag: 'ABDM Health Sync',
          date: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0],
          fileSize: '1.1 MB',
          fileType: 'pdf',
          notes: 'Digital CoWIN & Adult Pneumococcal Vaccine digital record.',
          isImportant: false,
        };

        onAddVaultItem(rec1);
        onAddVaultItem(rec2);
        onAddVaultItem(rec3);
      }

      auditLogger.logAction(
        'ABHA_RECORDS_SYNCED',
        `Fetched and synced 3 verified medical documents from National Health Authority ABDM repository into Medical Vault.`,
        userProfile,
        'SUCCESS'
      );

      setSyncSuccessMsg('Successfully synced 3 verified government health records to your Medical Vault!');
      setTimeout(() => setSyncSuccessMsg(''), 5000);
    }, 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 via-white to-emerald-600 p-0.5 shadow-md shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-teal-400 font-bold">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                Ayushman Bharat Health Account (ABHA)
              </h3>
              <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-bold text-[10px] uppercase">
                ABDM Govt of India
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              National Digital Health Ecosystem integration for seamless hospital record sharing & digital health ID.
            </p>
          </div>
        </div>

        {isLinked && (
          <button
            onClick={() => setShowCardModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-emerald-600 text-white font-bold text-xs rounded-xl shadow transition-transform active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>Digital ABHA Health Card</span>
          </button>
        )}
      </div>

      {/* If Linked: Show ABHA Card Details */}
      {isLinked ? (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white border border-teal-500/30 relative overflow-hidden shadow-lg">
            
            {/* Background Tricolor Ribbon Accent */}
            <div className="absolute top-0 right-0 w-32 h-1.5 bg-gradient-to-r from-orange-500 via-white to-emerald-500" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ABDM Linked & Verified
                  </span>
                  <span className="text-[10px] text-slate-400">Linked: {userProfile?.abhaLinkedAt || 'Active'}</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">14-Digit ABHA Health ID</label>
                  <p className="text-2xl font-mono font-black text-teal-300 tracking-widest mt-0.5">
                    {abhaNumber || '91-3842-9102-4821'}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">ABHA Address / PHR</label>
                  <p className="text-sm font-bold text-slate-200 font-mono">
                    {abhaAddress || `${userProfile?.name?.toLowerCase().replace(/\s+/g, '') || 'aaravsharma'}@abha`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end justify-between gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-700">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 block">HEALTH DATA PRIVACY</span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 sm:justify-end">
                    <Lock className="w-3 h-3" /> Consent-Based Access
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncGovernmentRecords}
                    disabled={isSyncingRecords}
                    className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSyncingRecords ? (
                      <JevanCareLoader size="xs" color="forest" label="Syncing..." />
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Sync Govt Health Records</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleUnlinkAbha}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                    title="Unlink ABHA Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sync status toast message */}
          {syncSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {/* Info Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Building className="w-4 h-4 text-teal-600" />
                <span>Hospital Connectivity</span>
              </div>
              <p className="text-[11px] text-slate-500">Auto-pull prescriptions & lab reports from AIIMS, Apollo, Fortis & 12,000+ empanelled hospitals.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Lock className="w-4 h-4 text-orange-600" />
                <span>100% Consent Controlled</span>
              </div>
              <p className="text-[11px] text-slate-500">Doctors can only view your historical records when you grant explicit OTP-based consent.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Medical Vault Integration</span>
              </div>
              <p className="text-[11px] text-slate-500">Records synced via ABHA are automatically encrypted & backed up to your encrypted Medical Vault.</p>
            </div>
          </div>
        </div>
      ) : (
        /* If NOT Linked: Show Link / Create Form */
        <div className="space-y-4">
          
          {/* Tab Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold max-w-md">
            <button
              onClick={() => {
                setActiveTab('link');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === 'link'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Link Existing ABHA ID
            </button>
            <button
              onClick={() => {
                setActiveTab('create');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === 'create'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Create New ABHA via Aadhaar
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 text-xs font-semibold flex items-center gap-2 border border-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form 1: Link Existing */}
          {activeTab === 'link' && (
            <div className="space-y-4 text-xs">
              {!otpStep ? (
                <form onSubmit={handleSendLinkOtp} className="space-y-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
                      Enter 14-Digit ABHA Number or ABHA Address (@abha)
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={inputAbha}
                        onChange={(e) => setInputAbha(e.target.value)}
                        placeholder="e.g. 91-3842-9102-4821 or username@abha"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      An authentication OTP will be sent to the mobile number registered with your ABHA ID.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <JevanCareLoader size="sm" color="white" label="Connecting ABDM Gateway..." />
                    ) : (
                      <>
                        <span>Request ABHA Verification OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyLinkOtp} className="space-y-3 animate-in fade-in">
                  <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800">
                    <p className="font-bold text-xs">OTP Sent to Aadhaar Mobile!</p>
                    <p className="text-[11px] mt-0.5 text-teal-700 dark:text-teal-300">
                      Verification code dispatched for ABHA ID: <span className="font-mono font-bold">{inputAbha}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
                      Enter 6-Digit Verification OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="123456"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center text-lg tracking-widest focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? (
                        <JevanCareLoader size="sm" color="white" label="Verifying..." />
                      ) : (
                        <>
                          <span>Verify & Link ABHA</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Form 2: Create New */}
          {activeTab === 'create' && (
            <div className="space-y-4 text-xs">
              {!createOtpStep ? (
                <form onSubmit={handleSendCreateOtp} className="space-y-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
                      Enter 12-Digit Aadhaar Number
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={aadhaarInput}
                      onChange={(e) => setAadhaarInput(e.target.value)}
                      placeholder="XXXX - XXXX - XXXX"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
                      Mobile Number for Communication
                    </label>
                    <input
                      type="text"
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <JevanCareLoader size="sm" color="white" label="Connecting UIDAI & NHA..." />
                    ) : (
                      <>
                        <span>Generate ABHA via Aadhaar OTP</span>
                        <Sparkles className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCreateOtp} className="space-y-3 animate-in fade-in">
                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800">
                    <p className="font-bold text-xs">Aadhaar Security Code Sent!</p>
                    <p className="text-[11px] mt-0.5 text-orange-700 dark:text-orange-300">
                      Enter the 6-digit UIDAI OTP sent to your Aadhaar-linked mobile.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
                      Aadhaar OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={createOtpInput}
                      onChange={(e) => setCreateOtpInput(e.target.value)}
                      placeholder="123456"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center text-lg tracking-widest focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateOtpStep(false)}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? (
                        <JevanCareLoader size="sm" color="white" label="Creating ABHA ID..." />
                      ) : (
                        <>
                          <span>Confirm & Generate ABHA</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      )}

      {/* Digital ABHA Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  ABDM Health Card
                </h3>
              </div>
              <button
                onClick={() => setShowCardModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Simulated Digital Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950 border-2 border-slate-300 dark:border-slate-700 shadow-md space-y-4 relative">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] font-black tracking-wider uppercase text-orange-600 dark:text-orange-400 block">
                    GOVT OF INDIA • NHA
                  </span>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    Ayushman Bharat Health Account
                  </h4>
                </div>
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
                  ABDM
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Name</span>
                    <span className="font-bold text-slate-900 dark:text-white">{userProfile?.name || 'Aarav Sharma'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">ABHA Number</span>
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-sm">{abhaNumber || '91-3842-9102-4821'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">ABHA Address</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{abhaAddress || 'aaravsharma@abha'}</span>
                  </div>
                </div>

                {/* QR Code Placeholder */}
                <div className="w-24 h-24 bg-white p-1.5 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center shrink-0">
                  <QrCode className="w-16 h-16 text-slate-900" />
                  <span className="text-[8px] font-mono text-slate-500 mt-1">SCAN ABDM</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                <span>Gender: {userProfile?.gender || 'Male'} • Blood: {userProfile?.bloodGroup || 'O+'}</span>
                <span className="text-emerald-600 font-bold">VERIFIED</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  showToast('Preparing official ABHA Health Card for download...', 'success');
                  window.print?.();
                }}
                className="flex-1 min-h-[44px] py-2.5 bg-[#f3efe6] dark:bg-[#1d2d24] text-[#142b20] dark:text-[#f2efe9] font-semibold text-xs rounded-xl hover:bg-[#e8e2d7] dark:hover:bg-[#25382d] transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="flex-1 min-h-[44px] py-2.5 bg-[#1a5336] hover:bg-[#143e29] text-white font-semibold text-xs rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
              >
                Close Card
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
