import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FolderLock,
  FileText,
  FilePlus,
  Activity,
  MessageSquare,
  Bot,
  BadgeCheck,
  ShieldAlert
} from 'lucide-react';
import { HorizontalScrollContainer } from '../common/HorizontalScrollContainer';

interface DoctorNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
}

export const DoctorNavigation: React.FC<DoctorNavigationProps> = ({
  activeTab,
  setActiveTab,
  verificationStatus = 'verified',
}) => {
  const tabs = [
    { id: 'doctor-dashboard', label: 'Clinical Dashboard', icon: LayoutDashboard },
    { id: 'doctor-patients', label: 'Patients Roster', icon: Users },
    { id: 'doctor-appointments', label: 'Appointments Queue', icon: Calendar },
    { id: 'doctor-records', label: 'Patient Records', icon: FolderLock },
    { id: 'doctor-notes', label: 'Clinical SOAP Notes', icon: FileText },
    { id: 'doctor-prescriptions', label: 'e-Prescription Pad', icon: FilePlus, highlight: true },
    { id: 'doctor-reports', label: 'Diagnostics & Reports', icon: Activity },
    { id: 'doctor-ai', label: 'Clinical AI Assistant', icon: Bot, aiHighlight: true },
    { id: 'doctor-messages', label: 'Patient Consult Chat', icon: MessageSquare },
    { id: 'doctor-profile', label: 'Verification & Credentials', icon: BadgeCheck },
  ];

  return (
    <nav aria-label="Doctor Portal Navigation Tabs" className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-16 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        
        {/* Verification Alert Banner if Pending or Rejected */}
        {verificationStatus !== 'verified' && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 py-1.5 px-4 text-xs text-amber-300 flex items-center justify-between my-1 rounded-lg">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Account Verification Pending:</strong> Medical Council registration verification is in progress. Some active prescribing capabilities remain restricted until verified.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('doctor-profile')}
              className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer shrink-0 ml-2"
            >
              Check Credentials →
            </button>
          </div>
        )}

        <HorizontalScrollContainer activeKey={activeTab} theme="doctor">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-active={isActive ? 'true' : 'false'}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm font-bold ring-1 ring-emerald-400/40'
                    : tab.aiHighlight
                    ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-900'
                    : tab.highlight
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.aiHighlight ? 'text-indigo-400' : 'text-emerald-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </HorizontalScrollContainer>
      </div>
    </nav>
  );
};

