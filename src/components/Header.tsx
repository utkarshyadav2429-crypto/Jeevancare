import React, { useState } from 'react';
import {
  Shield,
  Bell,
  User,
  HeartPulse,
  AlertTriangle,
  Lock,
  Search,
  CheckCircle2,
  Stethoscope,
  KeyRound,
  LogOut,
  ChevronDown,
  Wifi,
  WifiOff,
  HelpCircle,
  FileText,
  Settings,
  Sun,
  Moon,
  Laptop,
  FlaskConical,
  X,
  HeartHandshake
} from 'lucide-react';
import { UserProfile, UserRole, AppNotification, RoleType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  userProfile?: UserProfile;
  profile?: UserProfile;
  setProfile?: React.Dispatch<React.SetStateAction<UserProfile>>;
  activeRole?: RoleType;
  onRoleChange?: (role: RoleType) => void;
  onOpenAuth?: () => void;
  onOpenEmergency?: () => void;
  onOpenOnboarding?: () => void;
  notifications?: AppNotification[];
  onOpenNotifications?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  isOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  userProfile,
  profile,
  setProfile,
  activeRole,
  onRoleChange,
  onOpenAuth = () => {},
  onOpenEmergency = () => {},
  onOpenOnboarding = () => {},
  notifications = [],
  onOpenNotifications = () => {},
  searchQuery = '',
  setSearchQuery = (_q: string) => {},
  activeTab = 'dashboard',
  setActiveTab = (_tab: string) => {},
  isOnline = true,
}) => {
  const { signOut, isDemoMode, exitDemoMode, authMode } = useAuth();
  const { theme, resolvedTheme, setTheme, solarInfo } = useTheme();

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

  const currentRole = activeRole || (currentProfile.role === 'doctor' ? 'Doctor' : 'Patient');

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const safeNotifications = notifications || [];
  const unreadCount = safeNotifications.filter((n) => !n.read).length;

  const handleRoleChange = (newRole: RoleType) => {
    if (onRoleChange) {
      onRoleChange(newRole);
    } else if (setProfile) {
      setProfile((prev) => ({ ...prev, role: newRole === 'Doctor' ? 'doctor' : 'patient' }));
    }
    setShowRoleMenu(false);
  };

  const handleSignOut = async () => {
    setShowUserMenu(false);
    if (isDemoMode) {
      exitDemoMode();
    } else {
      await signOut();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#fcfaf6]/90 dark:bg-[#121e17]/90 backdrop-blur-md border-b border-[#e6dfd3] dark:border-[#233529] transition-colors">
      
      {/* Demo Mode Global Indicator Ribbon (if in Demo Mode) */}
      {isDemoMode && (
        <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-2xl">
            <FlaskConical className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="font-semibold">
              Demo Simulation Mode: Operating on sample health records.
            </span>
          </div>
          <button
            onClick={exitDemoMode}
            className="font-bold text-[11px] underline hover:text-amber-950 dark:hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <span>Exit Demo</span>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-[#1b3b2b] flex items-center justify-center text-white shadow-md">
            <HeartPulse className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-editorial font-bold text-xl tracking-tight text-[#1b3b2b] dark:text-[#f2f0e8]">
                Jevan Care
              </span>
              {isDemoMode ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Demo
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#e8eee5] dark:bg-[#1f3328] text-[#2b503b] dark:text-[#a3d4b6] border border-[#d3decf] dark:border-[#2a4535]">
                  Lifelong
                </span>
              )}
            </div>
            <p className="text-xs text-[#5c5647] dark:text-[#a8a192] font-medium hidden sm:block">
              {isDemoMode ? 'Simulated Interactive Sandbox' : 'Encrypted Digital Health Network'}
            </p>
          </div>
        </div>

        {/* Global Quick Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#827b6c]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicines, doctors, vault records, or symptoms..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#f6f2e9] dark:bg-[#1c2c23] border border-[#e6dfd3] dark:border-[#2a3f32] rounded-full focus:outline-none focus:ring-2 focus:ring-[#1b3b2b] text-[#1b3b2b] dark:text-[#f2f0e8] placeholder-[#827b6c] transition-all"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2.5">

          {/* Online/Offline Network Status Pill */}
          <div
            className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all border shrink-0 ${
              isOnline
                ? 'bg-[#e8eee5] dark:bg-[#1a2d22] text-[#2b503b] dark:text-[#a3d4b6] border-[#d3decf] dark:border-[#2a4535]'
                : 'bg-[#f8ebea] dark:bg-[#331c1e] text-[#8a484c] dark:text-[#e0a8aa] border-[#eed8d7] dark:border-[#522c2f] animate-pulse'
            }`}
            title={isOnline ? 'Network Connected' : 'Offline Mode Active'}
            aria-live="polite"
            aria-label={isOnline ? 'Network status: Online' : 'Network status: Offline'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-[#2b503b] dark:text-[#88cba3]" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-[#8a484c]" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Role Switcher Pill */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              aria-expanded={showRoleMenu}
              aria-haspopup="true"
              aria-label={`Switch role view. Current role is ${currentRole}`}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-3 rounded-full text-xs font-semibold bg-[#f6f2e9] hover:bg-[#eae4d7] dark:bg-[#1c2c23] dark:hover:bg-[#25382d] text-[#1b3b2b] dark:text-[#f2f0e8] border border-[#e6dfd3] dark:border-[#2a3f32] transition-all cursor-pointer"
              title="Switch user view role"
            >
              <Shield className="w-3.5 h-3.5 text-[#2b503b] dark:text-[#88cba3]" />
              <span className="capitalize hidden sm:inline">{currentRole} Mode</span>
              <ChevronDown className="w-3 h-3 text-[#827b6c]" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#18281f] rounded-2xl shadow-xl border border-[#e6dfd3] dark:border-[#2a3f32] py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-[#827b6c] uppercase tracking-wider">
                  Switch Role View
                </div>
                <button
                  onClick={() => handleRoleChange('Patient')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#e8eee5] dark:hover:bg-[#23382c] ${
                    currentRole === 'Patient' ? 'text-[#1b3b2b] font-bold dark:text-[#a3d4b6] bg-[#e8eee5]/60' : 'text-[#5c5647] dark:text-[#d5cfc2]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Patient
                  </span>
                  {currentRole === 'Patient' && <CheckCircle2 className="w-3.5 h-3.5 text-[#2b503b]" />}
                </button>
                <button
                  onClick={() => handleRoleChange('Doctor')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#e8eee5] dark:hover:bg-[#23382c] ${
                    currentRole === 'Doctor' ? 'text-[#1b3b2b] font-bold dark:text-[#a3d4b6] bg-[#e8eee5]/60' : 'text-[#5c5647] dark:text-[#d5cfc2]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Stethoscope className="w-3.5 h-3.5" /> Doctor
                  </span>
                  {currentRole === 'Doctor' && <CheckCircle2 className="w-3.5 h-3.5 text-[#2b503b]" />}
                </button>
                <button
                  onClick={() => handleRoleChange('MedBuddy')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#e8eee5] dark:hover:bg-[#23382c] ${
                    currentRole === 'MedBuddy' ? 'text-[#1b3b2b] font-bold dark:text-[#a3d4b6] bg-[#e8eee5]/60' : 'text-[#5c5647] dark:text-[#d5cfc2]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <HeartHandshake className="w-3.5 h-3.5" /> MedBuddy Companion
                  </span>
                  {currentRole === 'MedBuddy' && <CheckCircle2 className="w-3.5 h-3.5 text-[#2b503b]" />}
                </button>
              </div>
            )}
          </div>

          {/* Emergency SOS Quick Button */}
          <button
            onClick={onOpenEmergency}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
            aria-label="Emergency SOS Assistant"
          >
            <AlertTriangle className="w-3.5 h-3.5 fill-white text-rose-600" />
            <span>SOS</span>
          </button>

          {/* Help & Feature Guide Button */}
          <button
            onClick={onOpenOnboarding}
            className="hidden sm:flex p-2 rounded-full text-[#5c5647] hover:text-[#1b3b2b] dark:text-[#a8a192] dark:hover:text-white hover:bg-[#f6f2e9] dark:hover:bg-[#1c2c23] transition-colors"
            title="App Guide & Capabilities"
          >
            <HelpCircle className="w-5 h-5 text-[#2b503b] dark:text-[#88cba3]" />
          </button>

          {/* Theme Selector Pill & Dropdown */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              aria-expanded={showThemeMenu}
              aria-haspopup="true"
              aria-label={`Current theme is ${theme}. Click to switch theme.`}
              className="p-2 rounded-full text-[#5c5647] hover:text-[#1b3b2b] dark:text-[#a8a192] dark:hover:text-white hover:bg-[#f6f2e9] dark:hover:bg-[#1c2c23] transition-colors cursor-pointer"
              title={`Theme: ${theme.toUpperCase()} (${resolvedTheme} active)`}
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-5 h-5 text-amber-300" />
              ) : (
                <Sun className="w-5 h-5 text-amber-600" />
              )}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#18281f] rounded-2xl shadow-xl border border-[#e6dfd3] dark:border-[#2a3f32] py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 pb-1.5 text-[10px] font-bold text-[#827b6c] dark:text-[#9e9788] uppercase tracking-wider flex items-center justify-between">
                  <span>Theme Appearance</span>
                  <span className="text-[9px] font-normal px-1.5 py-0.5 rounded bg-stone-100 dark:bg-[#23382c] text-[#5c5647] dark:text-[#a3d4b6]">
                    {solarInfo.isDaytime ? '☀️ Day' : '🌙 Night'}
                  </span>
                </div>
                <button
                  onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-[#e8eee5] dark:hover:bg-[#23382c] ${
                    theme === 'light' ? 'font-bold text-[#1b3b2b] dark:text-[#a3d4b6] bg-[#e8eee5]/60 dark:bg-[#23382c]/80' : 'text-[#5c5647] dark:text-[#d5cfc2]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> Light Mode
                  </span>
                  {theme === 'light' && <CheckCircle2 className="w-3.5 h-3.5 text-[#2b503b] dark:text-[#a3d4b6]" />}
                </button>
                <button
                  onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-[#e8eee5] dark:hover:bg-[#23382c] ${
                    theme === 'dark' ? 'font-bold text-[#1b3b2b] dark:text-[#a3d4b6] bg-[#e8eee5]/60 dark:bg-[#23382c]/80' : 'text-[#5c5647] dark:text-[#d5cfc2]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 text-amber-300" /> Dark Mode
                  </span>
                  {theme === 'dark' && <CheckCircle2 className="w-3.5 h-3.5 text-[#2b503b] dark:text-[#a3d4b6]" />}
                </button>
                <button
                  onClick={() => { setTheme('system'); setShowThemeMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-[#e8eee5] dark:hover:bg-[#23382c] ${
                    theme === 'system' ? 'font-bold text-[#1b3b2b] dark:text-[#a3d4b6] bg-[#e8eee5]/60 dark:bg-[#23382c]/80' : 'text-[#5c5647] dark:text-[#d5cfc2]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Laptop className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Auto Day/Night
                  </span>
                  {theme === 'system' && <CheckCircle2 className="w-3.5 h-3.5 text-[#2b503b] dark:text-[#a3d4b6]" />}
                </button>

                {/* Day/Night Schedule & Solar Info Details */}
                <div className="mt-1.5 pt-1.5 border-t border-[#e6dfd3] dark:border-[#2a3f32] px-3 pb-0.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#1b3b2b] dark:text-[#a3d4b6]">
                    <span className="flex items-center gap-1.5">
                      {solarInfo.isDaytime ? (
                        <Sun className="w-3 h-3 text-amber-500" />
                      ) : (
                        <Moon className="w-3 h-3 text-amber-300" />
                      )}
                      <span>{solarInfo.isDaytime ? 'Day Mode' : 'Night Mode'} Active</span>
                    </span>
                    <span className="text-[9px] font-mono opacity-80">
                      {solarInfo.source === 'geolocation' ? 'GPS Solar' : 'System Clock'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#827b6c] dark:text-[#9e9788]">
                    {solarInfo.nextTransition}
                  </p>
                  {solarInfo.sunriseTime && solarInfo.sunsetTime && (
                    <div className="flex items-center justify-between text-[9px] text-[#827b6c] dark:text-[#9e9788] pt-0.5 border-t border-dashed border-[#e6dfd3] dark:border-[#2a3f32]">
                      <span>Sunrise: {solarInfo.sunriseTime}</span>
                      <span>Sunset: {solarInfo.sunsetTime}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-full text-[#5c5647] hover:text-[#1b3b2b] dark:text-[#a8a192] dark:hover:text-white hover:bg-[#f6f2e9] dark:hover:bg-[#1c2c23] transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#8a484c] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Auth Profile Trigger & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-full bg-[#f6f2e9] dark:bg-[#1c2c23] hover:bg-[#eae4d7] dark:hover:bg-[#25382d] text-[#1b3b2b] dark:text-[#f2f0e8] transition-all border border-[#e6dfd3] dark:border-[#2a3f32] cursor-pointer"
              title="Account & Auth Options"
            >
              <div className="w-7 h-7 rounded-full bg-[#1b3b2b] text-white font-bold flex items-center justify-center text-xs">
                {currentProfile.name ? currentProfile.name.charAt(0) : 'J'}
              </div>
              <span className="text-xs font-medium pr-1 hidden lg:inline-block">
                {currentProfile.name}
              </span>
              <ChevronDown className="w-3 h-3 text-[#827b6c]" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#18281f] rounded-2xl shadow-xl border border-[#e6dfd3] dark:border-[#2a3f32] p-2 z-50 animate-in fade-in zoom-in-95 space-y-2">
                <div className="px-3 py-2 bg-[#faf8f5] dark:bg-[#121e17] rounded-xl border border-[#e6dfd3] dark:border-[#233529]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8] truncate">{currentProfile.name}</p>
                    {isDemoMode && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-900">DEMO</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#827b6c] truncate">{currentProfile.email}</p>
                  {currentProfile.abhaNumber && (
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#e8eee5] text-[#2b503b] text-[10px] font-mono font-bold">
                      ABHA: {currentProfile.abhaNumber}
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#5c5647] dark:text-[#d5cfc2] hover:bg-[#e8eee5] dark:hover:bg-[#23382c] hover:text-[#1b3b2b] rounded-xl transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#2b503b]" />
                    <span>My Health Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('vault');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#5c5647] dark:text-[#d5cfc2] hover:bg-[#e8eee5] dark:hover:bg-[#23382c] hover:text-[#1b3b2b] rounded-xl transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#2b503b]" />
                    <span>Medical Vault</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenAuth();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#5c5647] dark:text-[#d5cfc2] hover:bg-[#e8eee5] dark:hover:bg-[#23382c] hover:text-[#1b3b2b] rounded-xl transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#2b503b]" />
                    <span>Account & Security</span>
                  </button>
                </div>

                <div className="border-t border-[#e6dfd3] dark:border-[#2a3f32] pt-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#a83b3b] hover:bg-[#f8ebea] dark:hover:bg-[#3d1e20] rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[#a83b3b]" />
                    <span>{isDemoMode ? 'Exit Demo Mode' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
});

