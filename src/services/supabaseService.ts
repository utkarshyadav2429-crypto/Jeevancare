import { supabase, isSupabaseConfigured, SUPABASE_STORAGE_BUCKETS } from '../lib/supabase';
import {
  UserProfile,
  ActiveMedicine,
  VaultItem,
  Appointment,
  HealthMetricLog,
  Reminder,
  HealthAssistantMessage,
  UserRole,
  Doctor,
  DoctorVerificationStatus,
  DoctorOnlineStatus,
  BloodDonor,
  VerifiedBloodOrganization,
  BloodRequest,
  BloodGroup,
  AvailabilityStatus,
  SavedGoogleAccount
} from '../types';
import { initialDoctors } from '../data/initialData';
import { auditLogger } from './AuditLogger';

// Helper for user-scoped cache keys to guarantee zero cross-account data leakage
export function getUserCacheKey(domain: string, userId: string): string {
  const safeId = (userId || 'anon').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `jeevancare_${domain}_${safeId}`;
}

// Global registry keys
const GLOBAL_KEYS = {
  REGISTERED_ACCOUNTS: 'jeevancare_registered_accounts',
  ACTIVE_SESSION: 'jeevancare_active_session',
  SAVED_GOOGLE_ACCOUNTS: 'jeevancare_saved_google_accounts',
  DOCTORS: 'jeevancare_supabase_doctors_cache',
  BLOOD_REQUESTS: 'jeevancare_supabase_blood_requests_cache',
  BLOOD_ORGS: 'jeevancare_supabase_blood_orgs_cache',
};

// ============================================================================
// GOOGLE SAVED ACCOUNTS REGISTRY (Device-Level Multi-Account Switcher)
// ============================================================================

export function getSavedGoogleAccounts(): SavedGoogleAccount[] {
  try {
    const raw = localStorage.getItem(GLOBAL_KEYS.SAVED_GOOGLE_ACCOUNTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGoogleAccount(acc: { email: string; name?: string; id?: string; avatar?: string }): SavedGoogleAccount {
  const existing = getSavedGoogleAccounts();
  const cleanEmail = acc.email.toLowerCase().trim();
  const cleanName = acc.name?.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const cleanId = acc.id || `usr_google_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

  const filtered = existing.filter((a) => a.email.toLowerCase() !== cleanEmail);
  const updated: SavedGoogleAccount = {
    id: cleanId,
    email: cleanEmail,
    name: cleanName,
    avatar: acc.avatar || '',
    lastUsed: Date.now(),
  };

  localStorage.setItem(GLOBAL_KEYS.SAVED_GOOGLE_ACCOUNTS, JSON.stringify([updated, ...filtered]));
  return updated;
}

export function removeSavedGoogleAccount(email: string): SavedGoogleAccount[] {
  try {
    const existing = getSavedGoogleAccounts();
    const clean = email.toLowerCase().trim();
    const filtered = existing.filter((a) => a.email.toLowerCase() !== clean);
    localStorage.setItem(GLOBAL_KEYS.SAVED_GOOGLE_ACCOUNTS, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
}

// ============================================================================
// 1. AUTHENTICATION SERVICES
// ============================================================================

export const supabaseAuth = {
  async signUp(email: string, pass: string, name: string, role: UserRole = 'patient') {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { user: null, session: null, error: 'Please provide a valid email address.' };
    }
    if (!pass || pass.length < 6) {
      return { user: null, session: null, error: 'Password must be at least 6 characters long.' };
    }
    if (!cleanName) {
      return { user: null, session: null, error: 'Please enter your full legal name.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: {
            data: { name: cleanName, role },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Create matching database profile in Supabase
          const newProfile: UserProfile = {
            id: data.user.id,
            name: cleanName,
            email: cleanEmail,
            role,
            bloodGroup: 'O+',
            allergies: [],
            chronicConditions: [],
            emergencyContacts: [],
            isEmergencySharingEnabled: true,
          };
          await supabaseProfile.upsertProfile(newProfile);

          auditLogger.logAction(
            'USER_SIGNUP',
            `Created new Supabase health account for ${cleanEmail} with role ${role}.`,
            { id: data.user.id, name: cleanEmail, role },
            'SUCCESS'
          );
        }

        return { user: data.user, session: data.session, error: null };
      } catch (err: any) {
        console.warn('Supabase Auth SignUp Error:', err.message);
        return { user: null, session: null, error: err.message || 'Failed to create account in Supabase.' };
      }
    } else {
      // Local Auth Provider for offline & local preview
      try {
        const accountsRaw = localStorage.getItem(GLOBAL_KEYS.REGISTERED_ACCOUNTS);
        const accounts: Array<{ id: string; email: string; passHash: string; name: string; role: UserRole; createdAt: string }> = accountsRaw ? JSON.parse(accountsRaw) : [];

        const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
        if (existing) {
          return { user: null, session: null, error: 'An account with this email address already exists. Please sign in instead.' };
        }

        const userId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        const newUserRecord = {
          id: userId,
          email: cleanEmail,
          passHash: btoa(pass),
          name: cleanName,
          role,
          createdAt: new Date().toISOString(),
        };

        accounts.push(newUserRecord);
        localStorage.setItem(GLOBAL_KEYS.REGISTERED_ACCOUNTS, JSON.stringify(accounts));

        const authUser = {
          id: userId,
          email: cleanEmail,
          user_metadata: { name: cleanName, full_name: cleanName, role },
        };

        const session = {
          access_token: `token_${userId}_${Date.now()}`,
          user: authUser,
          expires_at: Date.now() + 86400000 * 7,
        };

        localStorage.setItem(GLOBAL_KEYS.ACTIVE_SESSION, JSON.stringify(session));

        const newProfile: UserProfile = {
          id: userId,
          name: cleanName,
          email: cleanEmail,
          role,
          bloodGroup: 'O+',
          allergies: [],
          chronicConditions: [],
          emergencyContacts: [],
          isEmergencySharingEnabled: true,
        };
        await supabaseProfile.upsertProfile(newProfile);

        auditLogger.logAction(
          'USER_SIGNUP',
          `Registered new account for ${cleanEmail} (${role}).`,
          { id: userId, name: cleanEmail, role },
          'SUCCESS'
        );

        window.dispatchEvent(new CustomEvent('jeevancare-auth-change', { detail: { event: 'SIGNED_IN', session } }));

        return { user: authUser, session, error: null };
      } catch (err: any) {
        return { user: null, session: null, error: err.message || 'Failed to create account.' };
      }
    }
  },

  async signIn(email: string, pass: string) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass) {
      return { user: null, session: null, error: 'Please enter both email address and password.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass,
        });

        if (error) throw error;

        auditLogger.logAction(
          'USER_LOGIN',
          `Supabase authentication successful for ${cleanEmail}.`,
          { id: data.user?.id, name: cleanEmail },
          'SUCCESS'
        );

        return { user: data.user, session: data.session, error: null };
      } catch (err: any) {
        console.warn('Supabase Auth SignIn Error:', err.message);
        return { user: null, session: null, error: err.message || 'Invalid email or password. Please verify your credentials.' };
      }
    } else {
      // Local Auth Provider
      try {
        const accountsRaw = localStorage.getItem(GLOBAL_KEYS.REGISTERED_ACCOUNTS);
        const accounts: Array<{ id: string; email: string; passHash: string; name: string; role: UserRole }> = accountsRaw ? JSON.parse(accountsRaw) : [];

        const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
        if (!found) {
          return { user: null, session: null, error: 'No account found with this email address. Please sign up first.' };
        }

        if (found.passHash !== btoa(pass)) {
          return { user: null, session: null, error: 'Incorrect password. Please verify and try again.' };
        }

        const authUser = {
          id: found.id,
          email: found.email,
          user_metadata: { name: found.name, full_name: found.name, role: found.role },
        };

        const session = {
          access_token: `token_${found.id}_${Date.now()}`,
          user: authUser,
          expires_at: Date.now() + 86400000 * 7,
        };

        localStorage.setItem(GLOBAL_KEYS.ACTIVE_SESSION, JSON.stringify(session));

        auditLogger.logAction(
          'USER_LOGIN',
          `User ${cleanEmail} logged in successfully.`,
          { id: found.id, name: cleanEmail },
          'SUCCESS'
        );

        window.dispatchEvent(new CustomEvent('jeevancare-auth-change', { detail: { event: 'SIGNED_IN', session } }));

        return { user: authUser, session, error: null };
      } catch (err: any) {
        return { user: null, session: null, error: err.message || 'Authentication error.' };
      }
    }
  },

  async signInWithGoogle(selectedAccount?: { email: string; name?: string; id?: string }) {
    try {
      const redirectTo = window.location.origin;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        });
        if (error) throw error;
        auditLogger.logAction(
          'GOOGLE_AUTH_INITIATED',
          'Redirecting to Google OAuth with account selection prompt.',
          {},
          'SUCCESS'
        );
        return { data, error: null };
      } else {
        // Multi-Account Google Provider for local & preview mode
        let googleEmail = selectedAccount?.email?.trim().toLowerCase();
        let googleName = selectedAccount?.name?.trim();
        let googleId = selectedAccount?.id;

        // If no account explicitly chosen, check saved accounts
        if (!googleEmail) {
          const saved = getSavedGoogleAccounts();
          if (saved.length > 0) {
            // User can select from saved accounts
            const primary = saved[0];
            googleEmail = primary.email;
            googleName = primary.name;
            googleId = primary.id;
          } else {
            googleEmail = 'health.user@gmail.com';
            googleName = 'Google Health User';
            googleId = `usr_google_${Date.now().toString(36)}`;
          }
        }

        if (!googleId) {
          googleId = `usr_google_${googleEmail.replace(/[^a-z0-9]/g, '_')}`;
        }
        if (!googleName) {
          googleName = googleEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        }

        // Save to browser Google Account Switcher list
        saveGoogleAccount({ id: googleId, email: googleEmail, name: googleName });

        const mockGoogleUser = {
          id: googleId,
          email: googleEmail,
          user_metadata: {
            name: googleName,
            full_name: googleName,
            role: 'patient',
            provider: 'google',
          },
          app_metadata: {
            provider: 'google',
            providers: ['google'],
          },
        };

        const session = {
          access_token: `token_${googleId}_${Date.now()}`,
          user: mockGoogleUser,
          expires_at: Date.now() + 86400000 * 7,
        };

        localStorage.setItem(GLOBAL_KEYS.ACTIVE_SESSION, JSON.stringify(session));

        // Ensure user profile exists
        let prof = await supabaseProfile.fetchProfile(googleId);
        if (!prof) {
          prof = {
            id: googleId,
            name: googleName,
            email: googleEmail,
            role: 'patient',
            bloodGroup: 'O+',
            allergies: [],
            chronicConditions: [],
            emergencyContacts: [],
            isEmergencySharingEnabled: true,
          };
          await supabaseProfile.upsertProfile(prof);
        }

        auditLogger.logAction(
          'GOOGLE_AUTH_LOGIN',
          `Google OAuth authentication session established for ${googleEmail}.`,
          { email: googleEmail, role: 'patient', id: googleId },
          'SUCCESS'
        );

        window.dispatchEvent(new CustomEvent('jeevancare-auth-change', { detail: { event: 'SIGNED_IN', session } }));

        return { user: mockGoogleUser, session, error: null };
      }
    } catch (err: any) {
      console.warn('Google Sign-In Error:', err.message);
      return { data: null, user: null, session: null, error: err.message || 'Failed to initiate Google Sign-In.' };
    }
  },

  async signOut() {
    localStorage.removeItem(GLOBAL_KEYS.ACTIVE_SESSION);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err: any) {
        console.warn('Supabase signout warning:', err);
      }
    }
    auditLogger.logAction('USER_LOGOUT', 'User signed out from session.', {}, 'SUCCESS');
    window.dispatchEvent(new CustomEvent('jeevancare-auth-change', { detail: { event: 'SIGNED_OUT', session: null } }));
    return { error: null };
  },

  async getCurrentSession() {
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) return data.session;
      } catch {
        // fallback
      }
    }

    try {
      const raw = localStorage.getItem(GLOBAL_KEYS.ACTIVE_SESSION);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (session?.user?.id) {
        return session;
      }
      return null;
    } catch {
      return null;
    }
  },

  async resetPasswordForEmail(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { message: null, error: 'Please enter your registered email address.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/#reset-password`,
        });
        if (error) throw error;
        auditLogger.logAction(
          'PASSWORD_RESET_REQUESTED',
          `Password reset email sent to ${cleanEmail}.`,
          { name: cleanEmail },
          'SUCCESS'
        );
        return { message: `Password reset link sent to ${cleanEmail}. Please check your inbox.`, error: null };
      } catch (err: any) {
        return { message: null, error: err.message || 'Failed to send password reset link.' };
      }
    } else {
      auditLogger.logAction(
        'PASSWORD_RESET_REQUESTED',
        `Password reset requested for ${cleanEmail}.`,
        { name: cleanEmail },
        'SUCCESS'
      );
      return { message: `Password reset instructions dispatched to ${cleanEmail}.`, error: null };
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    let sub: any = null;
    if (isSupabaseConfigured) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
        sub = subscription;
      } catch (err) {
        console.warn('Could not attach Supabase auth listener:', err);
      }
    }

    const handleCustomAuth = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        callback(customEvent.detail.event, customEvent.detail.session);
      }
    };

    window.addEventListener('jeevancare-auth-change', handleCustomAuth);

    return {
      unsubscribe: () => {
        if (sub?.unsubscribe) sub.unsubscribe();
        window.removeEventListener('jeevancare-auth-change', handleCustomAuth);
      },
    };
  },
};

// ============================================================================
// 2. USER PROFILE SERVICES
// ============================================================================

export const supabaseProfile = {
  async fetchProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = getUserCacheKey('profile', userId);
    if (!isSupabaseConfigured) {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const formatted: UserProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone,
          age: data.age,
          gender: data.gender,
          bloodGroup: data.blood_group,
          allergies: data.allergies || [],
          chronicConditions: data.chronic_conditions || [],
          emergencyContactName: data.emergency_contact_name,
          emergencyContactPhone: data.emergency_contact_phone,
          isEmergencySharingEnabled: data.is_emergency_sharing_enabled ?? true,
          abhaNumber: data.abha_number,
          abhaAddress: data.abha_address,
          abhaLinked: data.abha_linked ?? false,
        };
        localStorage.setItem(cacheKey, JSON.stringify(formatted));
        return formatted;
      }
      return null;
    } catch (err) {
      console.warn('Supabase profile fetch error, using local cache:', err);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    }
  },

  async fetchProfileByEmail(email: string): Promise<UserProfile | null> {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();

    if (!isSupabaseConfigured) {
      try {
        const accountsRaw = localStorage.getItem(GLOBAL_KEYS.REGISTERED_ACCOUNTS);
        const accounts: Array<any> = accountsRaw ? JSON.parse(accountsRaw) : [];
        const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
        if (found) {
          const profCache = localStorage.getItem(getUserCacheKey('profile', found.id));
          if (profCache) return JSON.parse(profCache);
        }
      } catch {
        // ignore
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const formatted: UserProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone,
          age: data.age,
          gender: data.gender,
          bloodGroup: data.blood_group,
          allergies: data.allergies || [],
          chronicConditions: data.chronic_conditions || [],
          emergencyContactName: data.emergency_contact_name,
          emergencyContactPhone: data.emergency_contact_phone,
          isEmergencySharingEnabled: data.is_emergency_sharing_enabled ?? true,
          abhaNumber: data.abha_number,
          abhaAddress: data.abha_address,
          abhaLinked: data.abha_linked ?? false,
        };
        return formatted;
      }
      return null;
    } catch (err) {
      console.warn('Supabase profile fetch by email error:', err);
      return null;
    }
  },

  async upsertProfile(profile: UserProfile): Promise<boolean> {
    const cacheKey = getUserCacheKey('profile', profile.id);
    localStorage.setItem(cacheKey, JSON.stringify(profile));

    if (!isSupabaseConfigured) return true;

    try {
      const dbRow = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        phone: profile.phone || null,
        age: profile.age || null,
        gender: profile.gender || null,
        blood_group: profile.bloodGroup || null,
        allergies: profile.allergies || [],
        chronic_conditions: profile.chronicConditions || [],
        emergency_contact_name: profile.emergencyContactName || null,
        emergency_contact_phone: profile.emergencyContactPhone || null,
        is_emergency_sharing_enabled: profile.isEmergencySharingEnabled ?? true,
        abha_number: profile.abhaNumber || null,
        abha_address: profile.abhaAddress || null,
        abha_linked: profile.abhaLinked ?? false,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(dbRow);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase profile upsert error:', err);
      return false;
    }
  },
};

// ============================================================================
// 3. MEDICINES SERVICES
// ============================================================================

export const supabaseMedicines = {
  async fetchActiveMedicines(userId: string): Promise<ActiveMedicine[]> {
    const cacheKey = getUserCacheKey('medicines', userId);
    if (!isSupabaseConfigured) {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }

    try {
      const { data, error } = await supabase
        .from('active_medicines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const meds: ActiveMedicine[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          salt: d.salt,
          dosage: d.dosage,
          frequency: d.frequency,
          duration: d.duration,
          startDate: d.start_date,
          endDate: d.end_date,
          doctorName: d.doctor_name,
          instructions: d.instructions,
          remainingDoses: d.remaining_doses,
          totalDoses: d.total_doses,
          refillRequired: d.refill_required,
          prescribedFor: d.prescribed_for,
        }));
        localStorage.setItem(cacheKey, JSON.stringify(meds));
        return meds;
      }
      return [];
    } catch (err) {
      console.warn('Failed to fetch medicines from Supabase:', err);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async addMedicine(userId: string, med: ActiveMedicine): Promise<boolean> {
    const cacheKey = getUserCacheKey('medicines', userId);
    const existing = await this.fetchActiveMedicines(userId);
    localStorage.setItem(cacheKey, JSON.stringify([med, ...existing]));

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase.from('active_medicines').insert({
        user_id: userId,
        name: med.name,
        salt: med.salt,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        start_date: med.startDate,
        doctor_name: med.doctorName,
        instructions: med.instructions,
        remaining_doses: med.remainingDoses,
        total_doses: med.totalDoses,
        prescribed_for: med.prescribedFor,
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to add medicine to Supabase:', err);
      return false;
    }
  },

  async updateMedicineDose(userId: string, medId: string, remainingDoses: number): Promise<boolean> {
    const cacheKey = getUserCacheKey('medicines', userId);
    const existing = await this.fetchActiveMedicines(userId);
    const updated = existing.map((m) => (m.id === medId ? { ...m, remainingDoses } : m));
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from('active_medicines')
        .update({ remaining_doses: remainingDoses })
        .eq('id', medId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to update medicine dose in Supabase:', err);
      return false;
    }
  },

  async deleteMedicine(userId: string, medId: string): Promise<boolean> {
    const cacheKey = getUserCacheKey('medicines', userId);
    const existing = await this.fetchActiveMedicines(userId);
    const filtered = existing.filter((m) => m.id !== medId);
    localStorage.setItem(cacheKey, JSON.stringify(filtered));

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from('active_medicines')
        .delete()
        .eq('id', medId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to delete medicine from Supabase:', err);
      return false;
    }
  },
};

// ============================================================================
// 4. MEDICAL VAULT & STORAGE SERVICES
// ============================================================================

export const supabaseVault = {
  async fetchVaultItems(userId: string): Promise<VaultItem[]> {
    const cacheKey = getUserCacheKey('vault', userId);
    if (!isSupabaseConfigured) {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }

    try {
      const { data, error } = await supabase
        .from('vault_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const items: VaultItem[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          doctorName: d.doctor_name,
          diseaseOrTag: d.disease_or_tag,
          date: d.date,
          fileSize: d.file_size,
          fileType: d.file_type,
          fileUrl: d.file_url,
          notes: d.notes,
          sharedLink: d.shared_link,
          sharedExpiry: d.shared_expiry,
          isImportant: d.is_important,
        }));
        localStorage.setItem(cacheKey, JSON.stringify(items));
        return items;
      }
      return [];
    } catch (err) {
      console.warn('Failed to fetch vault items from Supabase:', err);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async addVaultItem(userId: string, item: VaultItem): Promise<boolean> {
    const cacheKey = getUserCacheKey('vault', userId);
    const existing = await this.fetchVaultItems(userId);
    localStorage.setItem(cacheKey, JSON.stringify([item, ...existing]));

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase.from('vault_items').insert({
        user_id: userId,
        title: item.title,
        category: item.category,
        doctor_name: item.doctorName,
        disease_or_tag: item.diseaseOrTag,
        date: item.date,
        file_size: item.fileSize,
        file_type: item.fileType,
        file_url: item.fileUrl,
        notes: item.notes,
        shared_link: item.sharedLink,
        is_important: item.isImportant ?? false,
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to add vault item to Supabase:', err);
      return false;
    }
  },

  async deleteVaultItem(userId: string, itemId: string): Promise<boolean> {
    const cacheKey = getUserCacheKey('vault', userId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed: VaultItem[] = JSON.parse(cached);
      const filtered = parsed.filter((i) => i.id !== itemId);
      localStorage.setItem(cacheKey, JSON.stringify(filtered));
    }

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from('vault_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to delete vault item from Supabase:', err);
      return false;
    }
  },

  async uploadDocumentToStorage(userId: string, file: File): Promise<string | null> {
    if (!isSupabaseConfigured) {
      // Create data URL fallback for local testing
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    try {
      const filePath = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKETS.MEDICAL_DOCUMENTS)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;

      // Get public or signed URL
      const { data: publicUrlData } = supabase.storage
        .from(SUPABASE_STORAGE_BUCKETS.MEDICAL_DOCUMENTS)
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.warn('Supabase Storage upload error:', err);
      return null;
    }
  },
};

// ============================================================================
// 5. APPOINTMENTS SERVICES
// ============================================================================

export const supabaseAppointments = {
  async fetchAppointments(userId: string): Promise<Appointment[]> {
    const cacheKey = getUserCacheKey('appointments', userId);
    if (!isSupabaseConfigured) {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const apps: Appointment[] = data.map((d: any) => ({
          id: d.id,
          doctorId: d.doctor_id,
          doctorName: d.doctor_name,
          specialty: d.specialty,
          patientName: d.patient_name,
          date: d.date,
          timeSlot: d.time_slot,
          type: d.type,
          status: d.status,
          fees: d.fees,
          notes: d.notes,
          prescriptionsShared: d.prescriptions_shared || [],
        }));
        localStorage.setItem(cacheKey, JSON.stringify(apps));
        return apps;
      }
      return [];
    } catch (err) {
      console.warn('Failed to fetch appointments from Supabase:', err);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async createAppointment(userId: string, app: Appointment): Promise<boolean> {
    const cacheKey = getUserCacheKey('appointments', userId);
    const existing = await this.fetchAppointments(userId);
    localStorage.setItem(cacheKey, JSON.stringify([app, ...existing]));

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase.from('appointments').insert({
        user_id: userId,
        doctor_id: app.doctorId,
        doctor_name: app.doctorName,
        specialty: app.specialty,
        patient_name: app.patientName,
        date: app.date,
        time_slot: app.timeSlot,
        type: app.type,
        status: app.status || 'Upcoming',
        fees: app.fees,
        notes: app.notes,
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to create appointment in Supabase:', err);
      return false;
    }
  },
};

// ============================================================================
// 6. HEALTH METRICS LOGS SERVICES
// ============================================================================

export const supabaseHealthMetrics = {
  async fetchMetricLogs(userId: string): Promise<HealthMetricLog[]> {
    const cacheKey = getUserCacheKey('metrics', userId);
    if (!isSupabaseConfigured) {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }

    try {
      const { data, error } = await supabase
        .from('health_metric_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const logs: HealthMetricLog[] = data.map((d: any) => ({
          id: d.id,
          timestamp: d.timestamp,
          systolicBp: d.systolic_bp,
          diastolicBp: d.diastolic_bp,
          bloodSugar: d.blood_sugar,
          weight: d.weight,
          temperature: d.temperature,
          sleepHours: d.sleep_hours,
          mood: d.mood,
          painLevel: d.pain_level,
          symptoms: d.symptoms || [],
          notes: d.notes,
        }));
        localStorage.setItem(cacheKey, JSON.stringify(logs));
        return logs;
      }
      return [];
    } catch (err) {
      console.warn('Failed to fetch metric logs from Supabase:', err);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async addMetricLog(userId: string, log: HealthMetricLog): Promise<boolean> {
    const cacheKey = getUserCacheKey('metrics', userId);
    const existing = await this.fetchMetricLogs(userId);
    localStorage.setItem(cacheKey, JSON.stringify([log, ...existing]));

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase.from('health_metric_logs').insert({
        user_id: userId,
        systolic_bp: log.systolicBp,
        diastolic_bp: log.diastolicBp,
        blood_sugar: log.bloodSugar,
        weight: log.weight,
        temperature: log.temperature,
        sleep_hours: log.sleepHours,
        mood: log.mood,
        pain_level: log.painLevel,
        symptoms: log.symptoms || [],
        notes: log.notes,
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to add health metric log to Supabase:', err);
      return false;
    }
  },
};

// ============================================================================
// 7. REAL DOCTOR DATABASE & VERIFICATION SERVICES
// ============================================================================

export const supabaseDoctors = {
  async fetchDoctors(): Promise<Doctor[]> {
    if (!isSupabaseConfigured) {
      const cached = localStorage.getItem(GLOBAL_KEYS.DOCTORS);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // fallback
        }
      }
      localStorage.setItem(GLOBAL_KEYS.DOCTORS, JSON.stringify(initialDoctors));
      return initialDoctors;
    }

    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const doctors: Doctor[] = data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          name: d.name,
          photoUrl: d.photo_url || undefined,
          avatarUrl: d.avatar_url || undefined,
          specialty: d.specialty,
          qualification: d.qualification,
          registrationNumber: d.registration_number,
          registrationAuthority: d.registration_authority,
          experienceYears: d.experience_years || 0,
          languages: Array.isArray(d.languages) ? d.languages : (d.languages ? JSON.parse(d.languages) : ['English', 'Hindi']),
          country: d.country || 'India',
          state: d.state || 'Uttar Pradesh',
          city: d.city || 'Lucknow',
          hospital: d.hospital || '',
          address: d.address || '',
          fees: d.fees || 500,
          consultationTypes: Array.isArray(d.consultation_types) ? d.consultation_types : ['Video', 'In-Person'],
          about: d.about || '',
          verificationStatus: (d.verification_status as DoctorVerificationStatus) || 'PENDING',
          verified: d.verification_status === 'VERIFIED',
          onlineStatus: (d.online_status as DoctorOnlineStatus) || 'online',
          availableDays: Array.isArray(d.available_days) ? d.available_days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          availableSlots: Array.isArray(d.available_slots) ? d.available_slots : ['09:30 AM', '11:00 AM', '02:30 PM', '04:15 PM'],
          consultationDurationMins: d.consultation_duration_mins || 20,
          createdAt: d.created_at,
          lastActiveAt: d.last_active_at,
          lat: d.lat,
          lng: d.lng,
          distanceKm: d.distance_km || 2.0,
          rating: d.rating || 0,
          reviewsCount: d.reviews_count || 0,
        }));

        localStorage.setItem(GLOBAL_KEYS.DOCTORS, JSON.stringify(doctors));
        return doctors;
      }

      // If database returns 0 rows, use cached initial verified doctors
      const cached = localStorage.getItem(GLOBAL_KEYS.DOCTORS);
      const fallback = cached ? JSON.parse(cached) : initialDoctors;
      return fallback;
    } catch (err) {
      console.warn('Failed to fetch doctors from Supabase, using cached records:', err);
      const cached = localStorage.getItem(GLOBAL_KEYS.DOCTORS);
      return cached ? JSON.parse(cached) : initialDoctors;
    }
  },

  async registerDoctor(newDoctor: Omit<Doctor, 'id'> & { id?: string }): Promise<Doctor> {
    const docId = newDoctor.id || `doc_${Date.now()}`;
    const fullDoc: Doctor = {
      ...newDoctor,
      id: docId,
      verificationStatus: 'PENDING',
      verified: false,
      onlineStatus: newDoctor.onlineStatus || 'online',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      rating: 0,
      reviewsCount: 0,
    };

    // Update local cache
    const current = await this.fetchDoctors();
    const updated = [fullDoc, ...current.filter((d) => d.id !== docId)];
    localStorage.setItem(GLOBAL_KEYS.DOCTORS, JSON.stringify(updated));

    if (!isSupabaseConfigured) return fullDoc;

    try {
      const { error } = await supabase.from('doctors').upsert({
        id: fullDoc.id,
        user_id: fullDoc.userId || null,
        name: fullDoc.name,
        photo_url: fullDoc.photoUrl || null,
        specialty: fullDoc.specialty,
        qualification: fullDoc.qualification,
        registration_number: fullDoc.registrationNumber,
        registration_authority: fullDoc.registrationAuthority,
        experience_years: fullDoc.experienceYears,
        languages: fullDoc.languages,
        country: fullDoc.country,
        state: fullDoc.state,
        city: fullDoc.city,
        hospital: fullDoc.hospital,
        address: fullDoc.address,
        fees: fullDoc.fees,
        consultation_types: fullDoc.consultationTypes,
        about: fullDoc.about,
        verification_status: fullDoc.verificationStatus,
        online_status: fullDoc.onlineStatus,
        available_days: fullDoc.availableDays,
        available_slots: fullDoc.availableSlots,
        consultation_duration_mins: fullDoc.consultationDurationMins || 20,
        lat: fullDoc.lat || null,
        lng: fullDoc.lng || null,
      });

      if (error) console.warn('Supabase doctor registration error:', error.message);
    } catch (err) {
      console.warn('Failed to register doctor in Supabase:', err);
    }

    return fullDoc;
  },

  async updateDoctorVerification(doctorId: string, status: DoctorVerificationStatus): Promise<boolean> {
    const cached = localStorage.getItem(GLOBAL_KEYS.DOCTORS);
    if (cached) {
      try {
        const parsed: Doctor[] = JSON.parse(cached);
        const updated = parsed.map((d) =>
          d.id === doctorId
            ? { ...d, verificationStatus: status, verified: status === 'VERIFIED' }
            : d
        );
        localStorage.setItem(GLOBAL_KEYS.DOCTORS, JSON.stringify(updated));
      } catch (err) {
        console.warn('Cache update error:', err);
      }
    }

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          verification_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', doctorId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to update doctor verification in Supabase:', err);
      return false;
    }
  },

  async updateDoctorOnlineStatus(doctorId: string, status: DoctorOnlineStatus): Promise<boolean> {
    const cached = localStorage.getItem(GLOBAL_KEYS.DOCTORS);
    if (cached) {
      try {
        const parsed: Doctor[] = JSON.parse(cached);
        const updated = parsed.map((d) =>
          d.id === doctorId ? { ...d, onlineStatus: status, lastActiveAt: new Date().toISOString() } : d
        );
        localStorage.setItem(GLOBAL_KEYS.DOCTORS, JSON.stringify(updated));
      } catch (err) {
        console.warn('Cache update error:', err);
      }
    }

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          online_status: status,
          last_active_at: new Date().toISOString(),
        })
        .eq('id', doctorId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to update doctor online status in Supabase:', err);
      return false;
    }
  },

  async uploadProfilePhoto(doctorId: string, file: File): Promise<string | null> {
    if (!isSupabaseConfigured) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    try {
      const filePath = `doctors/${doctorId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const bucketName = SUPABASE_STORAGE_BUCKETS.AVATARS || 'doctor-photos';

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.warn('Doctor photo upload error:', err);
      return null;
    }
  },
};

// ============================================================================
// 8. BLOOD DONATION NETWORK SERVICES
// ============================================================================

export const supabaseBloodDonation = {
  async fetchDonorProfile(userId: string): Promise<BloodDonor | null> {
    const cacheKey = getUserCacheKey('blood_donor', userId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed: BloodDonor = JSON.parse(cached);
        if (parsed && parsed.user_id === userId && parsed.isActive) {
          return parsed;
        }
      } catch (e) {
        console.warn('Donor profile cache read error:', e);
      }
    }

    if (!isSupabaseConfigured) return null;

    try {
      const { data, error } = await supabase
        .from('blood_donors')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) return null;

      const donor: BloodDonor = {
        id: data.id,
        user_id: data.user_id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone || undefined,
        bloodGroup: data.blood_group,
        city: data.city,
        state: data.state,
        country: data.country,
        preferredContactMethod: data.preferred_contact_method,
        availability: data.availability,
        lastDonationDate: data.last_donation_date || undefined,
        consentGiven: data.consent_given,
        consentGivenAt: data.consent_given_at,
        notificationsPaused: data.notifications_paused,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      localStorage.setItem(cacheKey, JSON.stringify(donor));
      return donor;
    } catch (err) {
      console.warn('Failed to fetch blood donor profile from Supabase:', err);
      return null;
    }
  },

  async upsertDonorProfile(donor: BloodDonor): Promise<BloodDonor> {
    const cacheKey = getUserCacheKey('blood_donor', donor.user_id);
    localStorage.setItem(cacheKey, JSON.stringify(donor));

    auditLogger.logAction(
      'BLOOD_DONOR_REGISTER',
      `Registered/Updated blood donor profile for ${donor.email} (Blood Group: ${donor.bloodGroup}). Privacy consent recorded.`,
      { userId: donor.user_id, bloodGroup: donor.bloodGroup, city: donor.city },
      'SUCCESS'
    );

    if (!isSupabaseConfigured) return donor;

    try {
      const { error } = await supabase.from('blood_donors').upsert({
        id: donor.id,
        user_id: donor.user_id,
        full_name: donor.fullName,
        email: donor.email,
        phone: donor.phone || null,
        blood_group: donor.bloodGroup,
        city: donor.city,
        state: donor.state,
        country: donor.country,
        preferred_contact_method: donor.preferredContactMethod,
        availability: donor.availability,
        last_donation_date: donor.lastDonationDate || null,
        consent_given: donor.consentGiven,
        consent_given_at: donor.consentGivenAt,
        notifications_paused: donor.notificationsPaused,
        is_active: donor.isActive,
        updated_at: new Date().toISOString(),
      });

      if (error) console.warn('Supabase donor upsert error:', error.message);
    } catch (err) {
      console.warn('Failed to save donor profile to Supabase:', err);
    }

    return donor;
  },

  async updateDonorSettings(
    userId: string,
    settings: { notificationsPaused?: boolean; availability?: AvailabilityStatus; isActive?: boolean }
  ): Promise<boolean> {
    const cacheKey = getUserCacheKey('blood_donor', userId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed: BloodDonor = JSON.parse(cached);
        if (parsed && parsed.user_id === userId) {
          const updated = {
            ...parsed,
            ...settings,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(cacheKey, JSON.stringify(updated));
        }
      } catch (e) {
        console.warn('Donor cache update error:', e);
      }
    }

    if (!isSupabaseConfigured) return true;

    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (settings.notificationsPaused !== undefined) payload.notifications_paused = settings.notificationsPaused;
      if (settings.availability !== undefined) payload.availability = settings.availability;
      if (settings.isActive !== undefined) payload.is_active = settings.isActive;

      const { error } = await supabase
        .from('blood_donors')
        .update(payload)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to update donor settings in Supabase:', err);
      return false;
    }
  },

  async leaveNetwork(userId: string): Promise<boolean> {
    const cacheKey = getUserCacheKey('blood_donor', userId);
    localStorage.removeItem(cacheKey);

    auditLogger.logAction(
      'BLOOD_DONOR_LEAVE',
      `User ${userId} requested to leave the Blood Donation Network. Profile deactivated.`,
      { userId },
      'SUCCESS'
    );

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from('blood_donors')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to deactivate donor in Supabase:', err);
      return false;
    }
  },

  async fetchVerifiedOrganizations(): Promise<VerifiedBloodOrganization[]> {
    const cached = localStorage.getItem(GLOBAL_KEYS.BLOOD_ORGS);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  },

  async fetchMatchedRequests(bloodGroup?: BloodGroup, city?: string, state?: string): Promise<BloodRequest[]> {
    if (!isSupabaseConfigured) {
      const cached = localStorage.getItem(GLOBAL_KEYS.BLOOD_REQUESTS);
      if (cached) {
        try {
          const parsed: BloodRequest[] = JSON.parse(cached);
          if (bloodGroup) {
            return parsed.filter((r) => r.status === 'OPEN' && r.bloodGroup === bloodGroup);
          }
          return parsed.filter((r) => r.status === 'OPEN');
        } catch (e) {}
      }
      return [];
    }

    try {
      let query = supabase
        .from('blood_requests')
        .select('*')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false });

      if (bloodGroup) {
        query = query.eq('blood_group', bloodGroup);
      }
      if (city && city !== 'All Cities') {
        query = query.eq('city', city);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const reqs: BloodRequest[] = data.map((d: any) => ({
          id: d.id,
          orgId: d.org_id,
          orgName: d.org_name,
          bloodGroup: d.blood_group as BloodGroup,
          unitsNeeded: d.units_needed,
          urgency: d.urgency,
          hospitalName: d.hospital_name,
          city: d.city,
          state: d.state,
          contactEmail: d.contact_email,
          additionalInstructions: d.additional_instructions || undefined,
          status: d.status,
          createdAt: d.created_at,
        }));
        localStorage.setItem(GLOBAL_KEYS.BLOOD_REQUESTS, JSON.stringify(reqs));
        return reqs;
      }

      return [];
    } catch (err) {
      console.warn('Failed to fetch blood requests from Supabase:', err);
      const cached = localStorage.getItem(GLOBAL_KEYS.BLOOD_REQUESTS);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async createOrgBloodRequest(req: BloodRequest): Promise<boolean> {
    const cached = localStorage.getItem(GLOBAL_KEYS.BLOOD_REQUESTS);
    let list: BloodRequest[] = [];
    if (cached) {
      try {
        list = JSON.parse(cached);
      } catch (e) {}
    }
    list = [req, ...list];
    localStorage.setItem(GLOBAL_KEYS.BLOOD_REQUESTS, JSON.stringify(list));

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase.from('blood_requests').insert({
        id: req.id,
        org_id: req.orgId,
        org_name: req.orgName,
        blood_group: req.bloodGroup,
        units_needed: req.unitsNeeded,
        urgency: req.urgency,
        hospital_name: req.hospitalName,
        city: req.city,
        state: req.state,
        contact_email: req.contactEmail,
        additional_instructions: req.additionalInstructions || null,
        status: req.status,
        created_at: req.createdAt,
      });

      if (error) {
        console.warn('Supabase blood request insert error:', error.message);
        throw error;
      }
      return true;
    } catch (err) {
      console.warn('Failed to save blood request to Supabase:', err);
      return false;
    }
  },

  async updateBloodRequestStatus(requestId: string, status: 'OPEN' | 'FULFILLED' | 'CANCELLED'): Promise<boolean> {
    const cached = localStorage.getItem(GLOBAL_KEYS.BLOOD_REQUESTS);
    if (cached) {
      try {
        const parsed: BloodRequest[] = JSON.parse(cached);
        const updated = parsed.map((r) => (r.id === requestId ? { ...r, status } : r));
        localStorage.setItem(GLOBAL_KEYS.BLOOD_REQUESTS, JSON.stringify(updated));
      } catch (e) {}
    }

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from('blood_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to update blood request status in Supabase:', err);
      return false;
    }
  },

  async respondToRequest(requestId: string, donorId: string, response: 'RESPONDED_YES' | 'RESPONDED_NO'): Promise<boolean> {
    auditLogger.logAction(
      'BLOOD_DONATION_RESPONSE',
      `Donor ${donorId} responded ${response} to request ${requestId}.`,
      { requestId, donorId, response },
      'SUCCESS'
    );
    const key = `jeevancare_donor_response_${requestId}`;
    localStorage.setItem(key, response);
    return true;
  },
};

// ============================================================================
// 9. MEDICINE REMINDERS SERVICES
// ============================================================================

export const supabaseReminders = {
  async fetchReminders(userId: string): Promise<Reminder[]> {
    const cacheKey = getUserCacheKey('reminders', userId);
    if (!isSupabaseConfigured) {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }

    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const rems: Reminder[] = data.map((d: any) => ({
          id: d.id,
          medicineName: d.medicine_name,
          dosage: d.dosage,
          times: d.times || [],
          isActive: d.is_active ?? true,
          daysOfWeek: d.days_of_week || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          instructions: d.instructions || undefined,
        }));
        localStorage.setItem(cacheKey, JSON.stringify(rems));
        return rems;
      }
      return [];
    } catch (err) {
      console.warn('Failed to fetch reminders from Supabase:', err);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async createReminder(userId: string, reminder: Omit<Reminder, 'id'> & { id?: string }): Promise<Reminder | null> {
    const cacheKey = getUserCacheKey('reminders', userId);
    const localId = reminder.id || `rem_${Date.now()}`;
    const newRem: Reminder = {
      id: localId,
      medicineName: reminder.medicineName,
      dosage: reminder.dosage,
      times: reminder.times,
      isActive: reminder.isActive ?? true,
      daysOfWeek: reminder.daysOfWeek || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      instructions: reminder.instructions,
    };

    // Update local cache
    const current = await this.fetchReminders(userId);
    localStorage.setItem(cacheKey, JSON.stringify([...current, newRem]));

    if (!isSupabaseConfigured) return newRem;

    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: userId,
          medicine_name: reminder.medicineName,
          dosage: reminder.dosage,
          times: reminder.times,
          is_active: reminder.isActive ?? true,
          days_of_week: reminder.daysOfWeek || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          instructions: reminder.instructions || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        return {
          id: data.id,
          medicineName: data.medicine_name,
          dosage: data.dosage,
          times: data.times || [],
          isActive: data.is_active ?? true,
          daysOfWeek: data.days_of_week || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          instructions: data.instructions || undefined,
        };
      }
      return newRem;
    } catch (err) {
      console.warn('Failed to create reminder in Supabase:', err);
      return newRem;
    }
  },

  async updateReminder(userId: string, reminderId: string, updates: Partial<Reminder>): Promise<boolean> {
    const cacheKey = getUserCacheKey('reminders', userId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed: Reminder[] = JSON.parse(cached);
        const updated = parsed.map((r) => (r.id === reminderId ? { ...r, ...updates } : r));
        localStorage.setItem(cacheKey, JSON.stringify(updated));
      } catch (e) {
        console.warn('Reminder cache update error:', e);
      }
    }

    if (!isSupabaseConfigured) return true;

    try {
      const payload: any = {};
      if (updates.medicineName !== undefined) payload.medicine_name = updates.medicineName;
      if (updates.dosage !== undefined) payload.dosage = updates.dosage;
      if (updates.times !== undefined) payload.times = updates.times;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;
      if (updates.daysOfWeek !== undefined) payload.days_of_week = updates.daysOfWeek;
      if (updates.instructions !== undefined) payload.instructions = updates.instructions;

      const { error } = await supabase
        .from('reminders')
        .update(payload)
        .eq('id', reminderId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to update reminder in Supabase:', err);
      return false;
    }
  },

  async deleteReminder(userId: string, reminderId: string): Promise<boolean> {
    const cacheKey = getUserCacheKey('reminders', userId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed: Reminder[] = JSON.parse(cached);
        const filtered = parsed.filter((r) => r.id !== reminderId);
        localStorage.setItem(cacheKey, JSON.stringify(filtered));
      } catch (e) {
        console.warn('Reminder cache deletion error:', e);
      }
    }

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to delete reminder from Supabase:', err);
      return false;
    }
  },

  async toggleReminderStatus(userId: string, reminderId: string, isActive: boolean): Promise<boolean> {
    return this.updateReminder(userId, reminderId, { isActive });
  },
};

// ============================================================================
// 10. ASSISTANT CHAT MESSAGES PERSISTENCE SERVICES
// ============================================================================

export const supabaseAssistantMessages = {
  async fetchMessages(userId: string, limit = 50): Promise<HealthAssistantMessage[]> {
    const cacheKey = getUserCacheKey('assistant_messages', userId);
    if (!isSupabaseConfigured) {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }

    try {
      const { data, error } = await supabase
        .from('assistant_messages')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true })
        .limit(limit);

      if (error) throw error;

      if (data && data.length > 0) {
        const msgs = data.map((d: any) => ({
          id: d.id,
          sender: d.sender,
          text: d.text,
          imageUrl: d.image_url || undefined,
          hasRedFlags: d.has_red_flags ?? false,
          timestamp: d.timestamp
            ? new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        localStorage.setItem(cacheKey, JSON.stringify(msgs));
        return msgs;
      }
      return [];
    } catch (err) {
      console.warn('Failed to fetch assistant messages from Supabase:', err);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async saveMessage(userId: string, msg: HealthAssistantMessage): Promise<boolean> {
    const cacheKey = getUserCacheKey('assistant_messages', userId);
    const existing = await this.fetchMessages(userId);
    localStorage.setItem(cacheKey, JSON.stringify([...existing, msg]));

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase.from('assistant_messages').insert({
        user_id: userId,
        sender: msg.sender,
        text: msg.text,
        image_url: msg.imageUrl || null,
        has_red_flags: msg.hasRedFlags ?? false,
        timestamp: new Date().toISOString(),
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to save assistant message to Supabase:', err);
      return false;
    }
  },

  async clearMessages(userId: string): Promise<boolean> {
    const cacheKey = getUserCacheKey('assistant_messages', userId);
    localStorage.removeItem(cacheKey);

    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from('assistant_messages')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Failed to clear assistant messages from Supabase:', err);
      return false;
    }
  },
};


