import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  Pill,
  Stethoscope,
  MapPin,
  ShieldCheck,
  Bot,
  Activity,
  Heart,
  FolderLock,
  User,
  Sparkles
} from 'lucide-react';

interface PatientNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const PatientNavigation: React.FC<PatientNavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'My Wellness Home', icon: LayoutDashboard },
    { id: 'assistant', label: 'AI Health Assistant', icon: Bot, highlight: true },
    { id: 'vault', label: 'Medical Vault ⭐', icon: FolderLock, highlight: true },
    { id: 'scanner', label: 'Prescription Scanner', icon: ScanLine },
    { id: 'medicine', label: 'Medicines & Prices', icon: Pill },
    { id: 'doctors', label: 'Consult Doctors', icon: Stethoscope },
    { id: 'map', label: 'Nearby Healthcare', icon: MapPin },
    { id: 'lifestyle', label: 'Wellness & Home Care', icon: Heart },
    { id: 'progress', label: 'Health Vitals', icon: Activity },
    { id: 'rumor', label: 'Health Fact-Checker', icon: ShieldCheck },
    { id: 'profile', label: 'Health Card & ABHA', icon: User },
  ];

  return (
    <div className="bg-[#fcfaf6] dark:bg-[#121e17] border-b border-[#e6dfd3] dark:border-[#233529] overflow-x-auto scrollbar-none sticky top-16 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 py-2.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#1b3b2b] text-[#faf8f5] shadow-sm font-bold'
                    : tab.highlight
                    ? 'bg-[#e8eee5] dark:bg-[#1c2c23] text-[#1b3b2b] dark:text-[#a3d4b6] border border-[#d3decf] dark:border-[#2a4535] hover:bg-[#d8e4d3]'
                    : 'text-[#5c5647] dark:text-[#c4beb2] hover:bg-[#f6f2e9] dark:hover:bg-[#1c2c23]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#a3d4b6]' : 'text-[#2b503b] dark:text-[#88cba3]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
