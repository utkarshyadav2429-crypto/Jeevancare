import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, UserRole, AuthMode } from '../types';
import { supabaseAuth, supabaseProfile } from '../services/supabaseService';
import { initialProfile } from '../data/initialData';

export interface AuthContextType {
  authMode: AuthMode;
  isAccountMode: boolean;
  isDemoMode: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  session: any | null;
  profile: UserProfile | null;
  authError: string | null;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (selectedAccount?: { email: string; name?: string; id?: string }) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string, name: string, role?: UserRole) => Promise<{ success: boolean; error?: string; user?: any }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  signOut: () => Promise<void>;
  enterDemoMode: (role?: UserRole) => void;
  exitDemoMode: () => void;
  demoLogin: (role?: UserRole) => void;
  updateProfileState: (updated: Partial<UserProfile>) => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_AUTH_KEY = 'jeevancare_active_auth_mode';
const DEMO_PROFILE_KEY = 'jeevancare_demo_user_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('LOADING');
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        setAuthMode('LOADING');

        // Check for URL OAuth errors (e.g. user cancelled prompt or OAuth failed)
        try {
          const currentUrl = new URL(window.location.href);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const errorDesc = currentUrl.searchParams.get('error_description') || hashParams.get('error_description');
          const errorParam = currentUrl.searchParams.get('error') || hashParams.get('error');

          if (errorDesc || errorParam) {
            const rawMsg = errorDesc || errorParam || 'Google authentication was cancelled or could not be completed.';
            const cleanMsg = decodeURIComponent(rawMsg.replace(/\+/g, ' '));
            if (isMounted) {
              setAuthError(cleanMsg);
            }
            window.history.replaceState(null, '', window.location.pathname);
          }
        } catch {
          // ignore URL parsing error
        }

        // 1. Check real Supabase authentication session first
        const currentSession = await supabaseAuth.getCurrentSession();
        if (currentSession?.user) {
          if (isMounted) {
            // Real Account Mode authenticated (Email or Google OAuth)
            localStorage.removeItem(DEMO_AUTH_KEY);
            localStorage.removeItem(DEMO_PROFILE_KEY);
            setSession(currentSession);
            setUser(currentSession.user);
            
            let userProf = await supabaseProfile.fetchProfile(currentSession.user.id);
            if (!userProf && currentSession.user.email) {
              userProf = await supabaseProfile.fetchProfileByEmail(currentSession.user.email);
            }

            if (userProf) {
              setProfile(userProf);
            } else {
              const displayName = currentSession.user.user_metadata?.full_name || 
                                 currentSession.user.user_metadata?.name || 
                                 currentSession.user.email?.split('@')[0] || 
                                 'Patient';

              const baselineProfile: UserProfile = {
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                name: displayName,
                role: (currentSession.user.user_metadata?.role as UserRole) || 'patient',
                bloodGroup: 'O+',
                allergies: [],
                chronicConditions: [],
                emergencyContacts: [],
                isEmergencySharingEnabled: true,
              };

              await supabaseProfile.upsertProfile(baselineProfile);
              setProfile(baselineProfile);
            }
            setAuthMode('ACCOUNT');
          }
          return;
        }

        // 2. Check if user explicitly engaged Demo Mode previously
        const storedAuthMode = localStorage.getItem(DEMO_AUTH_KEY);
        if (storedAuthMode === 'DEMO') {
          const savedDemoUser = localStorage.getItem(DEMO_PROFILE_KEY);
          const parsedDemoProf = savedDemoUser ? JSON.parse(savedDemoUser) : initialProfile;
          if (isMounted) {
            setUser({
              id: parsedDemoProf.id || 'demo_usr_001',
              email: parsedDemoProf.email || 'demo@jeevancare.in',
              user_metadata: { name: parsedDemoProf.name || 'Demo User', isDemo: true },
            });
            setSession(null);
            setProfile(parsedDemoProf);
            setAuthMode('DEMO');
          }
          return;
        }

        // 3. Otherwise signed out
        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setAuthMode('SIGNED_OUT');
        }
      } catch (err: any) {
        console.warn('Auth initialization check failed:', err);
        if (isMounted) {
          setAuthMode('SIGNED_OUT');
        }
      }
    }

    initAuth();

    // Subscribe to Supabase Auth state changes (including OAuth callback redirects)
    const subscription = supabaseAuth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (newSession?.user) {
        localStorage.removeItem(DEMO_AUTH_KEY);
        localStorage.removeItem(DEMO_PROFILE_KEY);
        setSession(newSession);
        setUser(newSession.user);
        setAuthMode('ACCOUNT');

        let userProf = await supabaseProfile.fetchProfile(newSession.user.id);
        if (!userProf && newSession.user.email) {
          userProf = await supabaseProfile.fetchProfileByEmail(newSession.user.email);
        }

        if (userProf) {
          setProfile(userProf);
        } else {
          const displayName = newSession.user.user_metadata?.full_name || 
                             newSession.user.user_metadata?.name || 
                             newSession.user.email?.split('@')[0] || 
                             'Patient';

          const baselineProfile: UserProfile = {
            id: newSession.user.id,
            email: newSession.user.email || '',
            name: displayName,
            role: (newSession.user.user_metadata?.role as UserRole) || 'patient',
            bloodGroup: 'O+',
            allergies: [],
            chronicConditions: [],
            emergencyContacts: [],
            isEmergencySharingEnabled: true,
          };

          await supabaseProfile.upsertProfile(baselineProfile);
          setProfile(baselineProfile);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        localStorage.removeItem(DEMO_AUTH_KEY);
        localStorage.removeItem(DEMO_PROFILE_KEY);
        setAuthMode('SIGNED_OUT');
      }
    });

    return () => {
      isMounted = false;
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async (selectedAccount?: { email: string; name?: string; id?: string }) => {
    setAuthError(null);
    setAuthMode('LOADING');
    try {
      const res = await supabaseAuth.signInWithGoogle(selectedAccount);
      if (res.error) {
        setAuthError(res.error);
        setAuthMode('SIGNED_OUT');
        return { success: false, error: res.error };
      }

      if (res.user) {
        localStorage.removeItem(DEMO_AUTH_KEY);
        localStorage.removeItem(DEMO_PROFILE_KEY);
        setUser(res.user);
        setSession(res.session);
        setAuthMode('ACCOUNT');

        let userProf = await supabaseProfile.fetchProfile(res.user.id);
        if (!userProf && res.user.email) {
          userProf = await supabaseProfile.fetchProfileByEmail(res.user.email);
        }

        if (userProf) {
          setProfile(userProf);
        } else {
          const displayName = res.user.user_metadata?.full_name || 
                             res.user.user_metadata?.name || 
                             res.user.email?.split('@')[0] || 
                             'Patient';

          const baselineProfile: UserProfile = {
            id: res.user.id,
            email: res.user.email || '',
            name: displayName,
            role: (res.user.user_metadata?.role as UserRole) || 'patient',
            bloodGroup: 'O+',
            allergies: [],
            chronicConditions: [],
            emergencyContacts: [],
            isEmergencySharingEnabled: true,
          };

          await supabaseProfile.upsertProfile(baselineProfile);
          setProfile(baselineProfile);
        }
      }
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Google Sign-In could not be initialized.';
      setAuthError(errorMsg);
      setAuthMode('SIGNED_OUT');
      return { success: false, error: errorMsg };
    }
  }, []);

  const signIn = useCallback(async (email: string, pass: string) => {
    setAuthError(null);
    setAuthMode('LOADING');
    try {
      const res = await supabaseAuth.signIn(email, pass);
      if (res.error) {
        setAuthError(res.error);
        setAuthMode('SIGNED_OUT');
        return { success: false, error: res.error };
      }

      if (res.user) {
        // Clear any previous demo state
        localStorage.removeItem(DEMO_AUTH_KEY);
        localStorage.removeItem(DEMO_PROFILE_KEY);
        setUser(res.user);
        setSession(res.session);
        setAuthMode('ACCOUNT');
        const userProf = await supabaseProfile.fetchProfile(res.user.id);
        if (userProf) {
          setProfile(userProf);
        } else {
          setProfile({
            id: res.user.id,
            email: res.user.email || email,
            name: res.user.user_metadata?.name || 'Patient',
            role: res.user.user_metadata?.role || 'patient',
            bloodGroup: 'O+',
            allergies: [],
            chronicConditions: [],
            isEmergencySharingEnabled: true,
          });
        }
      }
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to sign in. Please check your credentials.';
      setAuthError(errorMsg);
      setAuthMode('SIGNED_OUT');
      return { success: false, error: errorMsg };
    }
  }, []);

  const signUp = useCallback(async (email: string, pass: string, name: string, role: UserRole = 'patient') => {
    setAuthError(null);
    setAuthMode('LOADING');
    try {
      const res = await supabaseAuth.signUp(email, pass, name, role);
      if (res.error) {
        setAuthError(res.error);
        setAuthMode('SIGNED_OUT');
        return { success: false, error: res.error };
      }

      if (res.user) {
        localStorage.removeItem(DEMO_AUTH_KEY);
        localStorage.removeItem(DEMO_PROFILE_KEY);
        const newProf: UserProfile = {
          id: res.user.id,
          name,
          email,
          role,
          bloodGroup: 'O+',
          allergies: [],
          chronicConditions: [],
          emergencyContacts: [],
          isEmergencySharingEnabled: true,
        };
        setUser(res.user);
        setProfile(newProf);
        setAuthMode('ACCOUNT');
      }
      return { success: true, user: res.user };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create account. Please try again.';
      setAuthError(errorMsg);
      setAuthMode('SIGNED_OUT');
      return { success: false, error: errorMsg };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setAuthError(null);
    try {
      const res = await supabaseAuth.resetPasswordForEmail(email);
      if (res.error) {
        return { success: false, error: res.error };
      }
      return { success: true, message: res.message || 'Password reset link sent.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error requesting password reset.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthMode('LOADING');
    try {
      await supabaseAuth.signOut();
    } catch (e) {
      console.warn('Signout error:', e);
    } finally {
      localStorage.removeItem(DEMO_AUTH_KEY);
      localStorage.removeItem(DEMO_PROFILE_KEY);
      setUser(null);
      setSession(null);
      setProfile(null);
      setAuthMode('SIGNED_OUT');
    }
  }, []);

  const enterDemoMode = useCallback((role: UserRole = 'patient') => {
    const demoProf: UserProfile = {
      ...initialProfile,
      id: role === 'doctor' ? 'demo_doc_001' : 'demo_pat_001',
      name: role === 'doctor' ? 'Dr. Vikramaditya Sen' : 'Aarav Sharma',
      email: role === 'doctor' ? 'dr.sen@jeevancare.in' : 'aarav.sharma@health.in',
      role,
      specialty: role === 'doctor' ? 'Cardiology & General Medicine' : undefined,
    };
    localStorage.setItem(DEMO_AUTH_KEY, 'DEMO');
    localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(demoProf));
    setUser({
      id: demoProf.id,
      email: demoProf.email,
      user_metadata: { name: demoProf.name, role: demoProf.role, isDemo: true },
    });
    setProfile(demoProf);
    setSession(null);
    setAuthMode('DEMO');
  }, []);

  const exitDemoMode = useCallback(() => {
    localStorage.removeItem(DEMO_AUTH_KEY);
    localStorage.removeItem(DEMO_PROFILE_KEY);
    setUser(null);
    setSession(null);
    setProfile(null);
    setAuthMode('SIGNED_OUT');
  }, []);

  const updateProfileState = useCallback((updated: Partial<UserProfile>) => {
    setProfile((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      if (authMode === 'DEMO') {
        localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(next));
      } else if (authMode === 'ACCOUNT' && user?.id) {
        supabaseProfile.upsertProfile(next).catch((err) => {
          console.warn('Could not sync profile update to Supabase:', err);
        });
      }
      return next;
    });
  }, [authMode, user?.id]);

  const isAccountMode = authMode === 'ACCOUNT';
  const isDemoMode = authMode === 'DEMO';
  const isAuthenticated = authMode === 'ACCOUNT' || authMode === 'DEMO';
  const isLoading = authMode === 'LOADING';

  const contextValue = useMemo(
    () => ({
      authMode,
      isAccountMode,
      isDemoMode,
      isAuthenticated,
      isLoading,
      user,
      session,
      profile,
      authError,
      signIn,
      signInWithGoogle,
      signUp,
      resetPassword,
      signOut,
      enterDemoMode,
      exitDemoMode,
      demoLogin: enterDemoMode, // backward compatible alias
      updateProfileState,
      clearAuthError,
    }),
    [
      authMode,
      isAccountMode,
      isDemoMode,
      isAuthenticated,
      isLoading,
      user,
      session,
      profile,
      authError,
      signIn,
      signInWithGoogle,
      signUp,
      resetPassword,
      signOut,
      enterDemoMode,
      exitDemoMode,
      updateProfileState,
      clearAuthError,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
