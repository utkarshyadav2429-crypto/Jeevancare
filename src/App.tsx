import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { AuraiHero } from './components/AuraiHero';
import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { Dashboard } from './components/dashboard/Dashboard';
import { OfflineNetworkBanner } from './components/common/OfflineNetworkBanner';
import { JevanCareLoader } from './components/common/JevanCareLoader';
import { SEOHeadManager } from './components/common/SEOHeadManager';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useAuth } from './context/AuthContext';

// Dynamic Lazy Loading of heavy feature modules for optimized bundle splitting & faster TTI
const AuthModal = lazy(() =>
  import('./components/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const AuthScreen = lazy(() =>
  import('./components/auth/AuthScreen').then((m) => ({ default: m.AuthScreen }))
);
const OnboardingModal = lazy(() =>
  import('./components/common/OnboardingModal').then((m) => ({ default: m.OnboardingModal }))
);
const PrescriptionScanner = lazy(() =>
  import('./components/scanner/PrescriptionScanner').then((m) => ({ default: m.PrescriptionScanner }))
);
const MedicineIntelligence = lazy(() =>
  import('./components/medicine/MedicineIntelligence').then((m) => ({ default: m.MedicineIntelligence }))
);
const DoctorConsultation = lazy(() =>
  import('./components/doctors/DoctorConsultation').then((m) => ({ default: m.DoctorConsultation }))
);
const NearbyHealthcareMap = lazy(() =>
  import('./components/map/NearbyHealthcareMap').then((m) => ({ default: m.NearbyHealthcareMap }))
);
const FactCheckCenter = lazy(() =>
  import('./components/rumor/FactCheckCenter').then((m) => ({ default: m.FactCheckCenter }))
);
const AIHealthAssistant = lazy(() =>
  import('./components/assistant/AIHealthAssistant').then((m) => ({ default: m.AIHealthAssistant }))
);
const HealthProgressTracker = lazy(() =>
  import('./components/progress/HealthProgressTracker').then((m) => ({ default: m.HealthProgressTracker }))
);
const LifestyleAndHomeCare = lazy(() =>
  import('./components/lifestyle/LifestyleAndHomeCare').then((m) => ({ default: m.LifestyleAndHomeCare }))
);
const MedicalVault = lazy(() =>
  import('./components/vault/MedicalVault').then((m) => ({ default: m.MedicalVault }))
);
const UserProfileCenter = lazy(() =>
  import('./components/profile/UserProfileCenter').then((m) => ({ default: m.UserProfileCenter }))
);
const DoctorWorkspacePortal = lazy(() =>
  import('./components/doctorportal/DoctorWorkspacePortal').then((m) => ({ default: m.DoctorWorkspacePortal }))
);
const AdminAuditPanel = lazy(() =>
  import('./components/admin/AdminAuditPanel').then((m) => ({ default: m.AdminAuditPanel }))
);
const BloodDonationNetwork = lazy(() =>
  import('./components/blood/BloodDonationNetwork').then((m) => ({ default: m.BloodDonationNetwork }))
);
const HealthcareAccessibilityCenter = lazy(() =>
  import('./components/accessibility/HealthcareAccessibilityCenter').then((m) => ({ default: m.HealthcareAccessibilityCenter }))
);
const EmergencyHubModal = lazy(() =>
  import('./components/emergency/EmergencyHubModal').then((m) => ({ default: m.EmergencyHubModal }))
);
const MedBuddyLandingView = lazy(() =>
  import('./components/medbuddy/MedBuddyLandingView').then((m) => ({ default: m.MedBuddyLandingView }))
);

import {
  initialProfile,
  initialActiveMedicines,
  initialAppointments,
  initialVaultItems,
  initialRiskAlerts,
  initialReminders,
  initialMetricLogs
} from './data/initialData';

import {
  UserProfile,
  ActiveMedicine,
  Appointment,
  VaultItem,
  HealthMetricLog,
  Reminder,
  RoleType,
  EconomicProfile
} from './types';

import { accessibilityIntelligenceService } from './services/accessibilityIntelligenceService';

import {
  supabaseAuth,
  supabaseProfile,
  supabaseMedicines,
  supabaseVault,
  supabaseAppointments,
  supabaseHealthMetrics,
  supabaseReminders
} from './services/supabaseService';

export function App() {
  const {
    authMode,
    isAccountMode,
    isDemoMode,
    isAuthenticated,
    isLoading,
    profile: authProfile,
    user,
    exitDemoMode
  } = useAuth();

  const {
    isOnline,
    offlineQueue,
    enqueueRequest,
    syncPendingRequests,
    clearQueue,
    isSyncing,
    lastSyncedAt,
  } = useOnlineStatus();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeRole, setActiveRole] = useState<RoleType>('Patient');

  // Core State - Isolated between Demo & Account
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    return authProfile || initialProfile;
  });
  const [economicProfile, setEconomicProfile] = useState<EconomicProfile | null>(() => {
    return accessibilityIntelligenceService.getStoredEconomicProfile(initialProfile.id);
  });
  const [activeMedicines, setActiveMedicines] = useState<ActiveMedicine[]>(() => {
    return isDemoMode ? initialActiveMedicines : [];
  });
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    return isDemoMode ? initialAppointments : [];
  });
  const [vaultItems, setVaultItems] = useState<VaultItem[]>(() => {
    return isDemoMode ? initialVaultItems : [];
  });
  const [metricLogs, setMetricLogs] = useState<HealthMetricLog[]>(() => {
    return isDemoMode ? initialMetricLogs : [];
  });
  const [riskAlerts, setRiskAlerts] = useState(() => {
    return isDemoMode ? initialRiskAlerts : [];
  });
  const [reminders, setReminders] = useState(() => {
    return isDemoMode ? initialReminders : [];
  });

  const handleRoleChange = useCallback((newRole: RoleType) => {
    setActiveRole(newRole);
    if (newRole === 'Doctor') {
      setActiveTab((prev) => (prev.startsWith('doctor-') ? prev : 'doctor-dashboard'));
    } else {
      setActiveTab((prev) => (prev.startsWith('doctor-') ? 'dashboard' : prev));
    }
  }, []);

  // Sync profile when auth profile changes
  useEffect(() => {
    if (authProfile) {
      setUserProfile(authProfile);
      if (authProfile.role === 'doctor') {
        setActiveRole('Doctor');
        setActiveTab((prev) => (prev.startsWith('doctor-') ? prev : 'doctor-dashboard'));
      } else {
        setActiveRole('Patient');
        setActiveTab((prev) => (prev.startsWith('doctor-') ? 'dashboard' : prev));
      }
    } else if (isDemoMode) {
      setUserProfile(initialProfile);
      setActiveMedicines(initialActiveMedicines);
      setAppointments(initialAppointments);
      setVaultItems(initialVaultItems);
      setMetricLogs(initialMetricLogs);
      setRiskAlerts(initialRiskAlerts);
      setReminders(initialReminders);
    }
  }, [authProfile, isDemoMode]);

  // Modals state - Only trigger automatic onboarding for real Account mode users who haven't completed it
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    if (isDemoMode) return false;
    return !localStorage.getItem('jeevancare_onboarding_completed');
  });

  // Supabase Data Sync Effect ONLY when in Real Account Mode
  useEffect(() => {
    if (!isAccountMode || !user?.id) return;

    let isMounted = true;

    async function loadSupabaseData() {
      try {
        const userId = user.id;

        const [dbProfile, dbMeds, dbVault, dbApps, dbMetrics, dbReminders] = await Promise.all([
          supabaseProfile.fetchProfile(userId),
          supabaseMedicines.fetchActiveMedicines(userId),
          supabaseVault.fetchVaultItems(userId),
          supabaseAppointments.fetchAppointments(userId),
          supabaseHealthMetrics.fetchMetricLogs(userId),
          supabaseReminders.fetchReminders(userId),
        ]);

        if (isMounted) {
          if (dbProfile) {
            setUserProfile(dbProfile);
          } else if (authProfile) {
            setUserProfile(authProfile);
          }
          // Real user data isolation: if user has 0 items, keep array empty ([]) so no demo data leaks
          setActiveMedicines(dbMeds || []);
          setVaultItems(dbVault || []);
          setAppointments(dbApps || []);
          setMetricLogs(dbMetrics || []);
          setReminders(dbReminders || []);
          setRiskAlerts([]);
        }
      } catch (err) {
        console.warn('Supabase sync error, operating in offline fallback mode:', err);
      }
    }

    loadSupabaseData();

    return () => {
      isMounted = false;
    };
  }, [isAccountMode, user?.id, authProfile]);

  // Handlers (Strictly separate Real DB writes from Demo Mode local writes)
  const handleMarkDoseTaken = useCallback((medId: string) => {
    let newDoses = 0;
    setActiveMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          newDoses = Math.max(0, m.remainingDoses - 1);
          return { ...m, remainingDoses: newDoses };
        }
        return m;
      })
    );
    if (isAccountMode && user?.id) {
      supabaseMedicines.updateMedicineDose(user.id, medId, newDoses);
    }
  }, [isAccountMode, user?.id]);

  const handleAddActiveMedicine = useCallback((newMed: ActiveMedicine) => {
    setActiveMedicines((prev) => [newMed, ...prev]);
    if (isAccountMode && user?.id) {
      supabaseMedicines.addMedicine(user.id, newMed);
    }
  }, [isAccountMode, user?.id]);

  const handleAddReminder = useCallback((newRem: Reminder) => {
    setReminders((prev) => [...prev, newRem]);
    if (isAccountMode && user?.id) {
      supabaseReminders.createReminder(user.id, newRem);
    }
  }, [isAccountMode, user?.id]);

  const handleToggleReminder = useCallback((remId: string, active: boolean) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === remId ? { ...r, isActive: active } : r))
    );
    if (isAccountMode && user?.id) {
      supabaseReminders.toggleReminderStatus(user.id, remId, active);
    }
  }, [isAccountMode, user?.id]);

  const handleDeleteReminder = useCallback((remId: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== remId));
    if (isAccountMode && user?.id) {
      supabaseReminders.deleteReminder(user.id, remId);
    }
  }, [isAccountMode, user?.id]);

  const handleAddVaultItem = useCallback((newItem: VaultItem) => {
    setVaultItems((prev) => [newItem, ...prev]);
    if (isAccountMode && user?.id) {
      supabaseVault.addVaultItem(user.id, newItem);
    }
  }, [isAccountMode, user?.id]);

  const handleDeleteVaultItem = useCallback((id: string) => {
    setVaultItems((prev) => prev.filter((i) => i.id !== id));
    if (isAccountMode && user?.id) {
      supabaseVault.deleteVaultItem(user.id, id);
    }
  }, [isAccountMode, user?.id]);

  const handleBookAppointment = useCallback((newApp: Appointment) => {
    setAppointments((prev) => [newApp, ...prev]);
    if (isAccountMode && user?.id) {
      supabaseAppointments.createAppointment(user.id, newApp);
    }
  }, [isAccountMode, user?.id]);

  const handleAddMetricLog = useCallback((newLog: HealthMetricLog) => {
    setMetricLogs((prev) => [newLog, ...prev]);
    if (isAccountMode && user?.id) {
      supabaseHealthMetrics.addMetricLog(user.id, newLog);
    }
  }, [isAccountMode, user?.id]);

  const handleOpenEmergency = useCallback(() => setIsEmergencyOpen(true), []);
  const handleCloseEmergency = useCallback(() => setIsEmergencyOpen(false), []);
  const handleOpenAuth = useCallback(() => setIsAuthOpen(true), []);
  const handleCloseAuth = useCallback(() => setIsAuthOpen(false), []);
  const handleCloseOnboarding = useCallback(() => {
    localStorage.setItem('jeevancare_onboarding_completed', 'true');
    setIsOnboardingOpen(false);
  }, []);

  // If initial auth state is loading, show full-screen pulse loader
  if (isLoading || authMode === 'LOADING') {
    return (
      <div className="min-h-screen bg-[#faf8f5] dark:bg-[#121e17] flex flex-col items-center justify-center p-6 text-[#1b3b2b] dark:text-[#f2f0e8]">
        <JevanCareLoader size="lg" color="forest" label="Verifying secure Jevan Care session..." />
      </div>
    );
  }

  // If unauthenticated / signed out, show standalone welcome & auth page
  if (authMode === 'SIGNED_OUT' || !isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen w-full max-w-full min-w-0 bg-[#fcfaf6] dark:bg-[#121e17] text-[#1b3b2b] dark:text-[#f2f0e8] font-sans selection:bg-[#1b3b2b] selection:text-white transition-colors duration-200">
      
      {/* Dynamic SEO Head Title, Meta Description & Indexing Protections */}
      <SEOHeadManager
        activeTab={activeTab}
        activeRole={activeRole}
        isAuthenticated={isAuthenticated}
      />

      {/* Jevan Care Always-On AI Wellness Companion Hero Landing */}
      {activeTab === 'dashboard' && (
        <AuraiHero
          onExploreEcosystem={() => {
            const el = document.getElementById('jeevancare-app-header');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenEmergency={handleOpenEmergency}
          onOpenAuth={handleOpenAuth}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'dashboard') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      )}

      {/* Top Application Header */}
      <div id="jeevancare-app-header" className="w-full min-w-0">
        <Header
          activeRole={activeRole}
          onRoleChange={handleRoleChange}
          userProfile={userProfile}
          onOpenEmergency={handleOpenEmergency}
          onOpenAuth={handleOpenAuth}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          isOnline={isOnline}
        />
      </div>

      {/* Main Container */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 min-w-0">
        
        {/* Navigation Tabs Bar */}
        <NavigationTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeRole={activeRole}
        />

        {/* View Switcher based on activeRole & activeTab with Code-Split Suspense Fallback */}
        <div className="min-h-[600px]">
          <Suspense
            fallback={
              <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
                <JevanCareLoader size="lg" color="forest" label="Loading Jevan Care module..." />
              </div>
            }
          >
            {activeRole === 'Doctor' ? (
              <DoctorWorkspacePortal
                doctorProfile={userProfile}
                appointments={appointments}
                activeMedicines={activeMedicines}
                vaultItems={vaultItems}
                metricLogs={metricLogs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onAddActiveMedicine={handleAddActiveMedicine}
                onAddVaultItem={handleAddVaultItem}
                onUpdateDoctorProfile={(updated) =>
                  setUserProfile((prev) => ({ ...prev, ...updated }))
                }
              />
            ) : activeRole === 'MedBuddy' ? (
              <MedBuddyLandingView
                userProfile={userProfile}
                activeRole="medbuddy"
                onOpenEmergency={handleOpenEmergency}
              />
            ) : (
              <>
                {(activeTab === 'dashboard' || activeTab === 'home' || !['scanner', 'medicine', 'care', 'doctors', 'map', 'rumor', 'assistant', 'ai', 'progress', 'lifestyle', 'vault', 'records', 'profile', 'blood-donation', 'admin', 'intelligence', 'accessibility', 'schemes', 'medbuddy'].includes(activeTab)) && (
                  <Dashboard
                    profile={userProfile}
                    activeMedicines={activeMedicines}
                    appointments={appointments}
                    vaultItems={vaultItems}
                    riskAlerts={riskAlerts}
                    reminders={reminders}
                    metricLogs={metricLogs}
                    economicProfile={economicProfile}
                    setActiveTab={setActiveTab}
                    onOpenEmergency={handleOpenEmergency}
                    onMarkDoseTaken={handleMarkDoseTaken}
                  />
                )}

                {activeTab === 'medbuddy' && (
                  <MedBuddyLandingView
                    userProfile={userProfile}
                    activeRole="patient"
                    onOpenEmergency={handleOpenEmergency}
                  />
                )}

                {(activeTab === 'intelligence' || activeTab === 'accessibility' || activeTab === 'schemes') && (
                  <HealthcareAccessibilityCenter
                    userProfile={userProfile}
                    activeMedicines={activeMedicines}
                    appointments={appointments}
                    vaultItems={vaultItems}
                    economicProfile={economicProfile}
                    onUpdateEconomicProfile={setEconomicProfile}
                    onNavigateTab={setActiveTab}
                  />
                )}

                {activeTab === 'scanner' && (
                  <PrescriptionScanner
                    onAddActiveMedicine={handleAddActiveMedicine}
                    onAddVaultItem={handleAddVaultItem}
                    setActiveTab={setActiveTab}
                  />
                )}

                {(activeTab === 'medicine' || activeTab === 'care') && (
                  <MedicineIntelligence
                    activeMedicines={activeMedicines}
                    onAddActiveMedicine={handleAddActiveMedicine}
                    setActiveTab={setActiveTab}
                  />
                )}

                {activeTab === 'doctors' && (
                  <DoctorConsultation
                    appointments={appointments}
                    vaultItems={vaultItems}
                    onBookAppointment={handleBookAppointment}
                    setActiveTab={setActiveTab}
                  />
                )}

                {activeTab === 'map' && (
                  <NearbyHealthcareMap
                    onOpenEmergency={handleOpenEmergency}
                  />
                )}

                {activeTab === 'rumor' && <FactCheckCenter />}

                {(activeTab === 'assistant' || activeTab === 'ai') && (
                  <AIHealthAssistant
                    profile={userProfile}
                    vaultItems={vaultItems}
                    activeMedicines={activeMedicines}
                    onOpenEmergency={handleOpenEmergency}
                  />
                )}

                {activeTab === 'progress' && (
                  <HealthProgressTracker
                    metrics={metricLogs}
                    onAddMetricLog={handleAddMetricLog}
                    userProfile={userProfile}
                    setActiveTab={setActiveTab}
                  />
                )}

                {activeTab === 'lifestyle' && (
                  <LifestyleAndHomeCare
                    setActiveTab={setActiveTab}
                    onOpenEmergency={handleOpenEmergency}
                  />
                )}

                {(activeTab === 'vault' || activeTab === 'records') && (
                  <MedicalVault
                    vaultItems={vaultItems}
                    profile={userProfile}
                    onAddVaultItem={handleAddVaultItem}
                    onDeleteVaultItem={handleDeleteVaultItem}
                  />
                )}

                {activeTab === 'profile' && (
                  <UserProfileCenter
                    profile={userProfile}
                    onUpdateProfile={setUserProfile}
                    activeRole={activeRole}
                    onRoleChange={setActiveRole}
                    onAddVaultItem={handleAddVaultItem}
                  />
                )}

                {activeTab === 'blood-donation' && (
                  <BloodDonationNetwork
                    userProfile={userProfile}
                    onOpenEmergency={handleOpenEmergency}
                  />
                )}

                {activeTab === 'admin' && (
                  <AdminAuditPanel userProfile={userProfile} />
                )}
              </>
            )}
          </Suspense>
        </div>

      </main>

      {/* Modals wrapped in Suspense and conditionally rendered */}
      <Suspense fallback={null}>
        {isEmergencyOpen && (
          <EmergencyHubModal
            isOpen={isEmergencyOpen}
            onClose={handleCloseEmergency}
            userProfile={userProfile}
          />
        )}
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={handleCloseAuth}
            userProfile={userProfile}
            onLoginSuccess={(updated) => setUserProfile(updated)}
          />
        )}
        {isOnboardingOpen && (
          <OnboardingModal
            isOpen={isOnboardingOpen}
            onClose={handleCloseOnboarding}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
      </Suspense>

      {/* Global Offline Banner & Queue Banner */}
      <OfflineNetworkBanner
        isOnline={isOnline}
        offlineQueue={offlineQueue}
        syncPendingRequests={syncPendingRequests}
        clearQueue={clearQueue}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
      />

    </div>
  );
}

export default App;
