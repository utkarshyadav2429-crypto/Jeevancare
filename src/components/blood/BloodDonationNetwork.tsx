import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Heart,
  Droplet,
  ShieldCheck,
  Bell,
  BellOff,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Lock,
  Building,
  Plus,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  Sliders,
  UserX,
  Send,
  HeartHandshake
} from 'lucide-react';
import {
  BloodDonor,
  BloodGroup,
  ContactMethod,
  AvailabilityStatus,
  VerifiedBloodOrganization,
  BloodRequest,
  UserProfile
} from '../../types';
import { supabaseBloodDonation } from '../../services/supabaseService';
import { auditLogger } from '../../services/AuditLogger';
import { useToast } from '../../context/ToastContext';

interface BloodDonationNetworkProps {
  userProfile: UserProfile;
  onOpenEmergency?: () => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const BloodDonationNetwork: React.FC<BloodDonationNetworkProps> = ({
  userProfile,
  onOpenEmergency
}) => {
  const { showToast } = useToast();
  const [donorProfile, setDonorProfile] = useState<BloodDonor | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [matchedRequests, setMatchedRequests] = useState<BloodRequest[]>([]);
  const [verifiedOrgs, setVerifiedOrgs] = useState<VerifiedBloodOrganization[]>([]);
  const [userResponses, setUserResponses] = useState<Record<string, string>>({});

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState<boolean>(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState(userProfile.name || '');
  const [email, setEmail] = useState(userProfile.email || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<BloodGroup | ''>('');
  const [city, setCity] = useState('Lucknow');
  const [state, setState] = useState('Uttar Pradesh');
  const [country, setCountry] = useState('India');
  const [preferredContact, setPreferredContact] = useState<ContactMethod>('Email');
  const [availability, setAvailability] = useState<AvailabilityStatus>('Available');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Org Request Form state
  const [orgName, setOrgName] = useState('');
  const [reqBloodGroup, setReqBloodGroup] = useState<BloodGroup>('O+');
  const [unitsNeeded, setUnitsNeeded] = useState(2);
  const [urgency, setUrgency] = useState<'CRITICAL' | 'URGENT' | 'STANDARD'>('URGENT');
  const [reqHospital, setReqHospital] = useState('');
  const [reqCity, setReqCity] = useState('Lucknow');
  const [reqContactEmail, setReqContactEmail] = useState('');
  const [reqInstructions, setReqInstructions] = useState('');

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load Donor Profile & Requests
  const loadNetworkData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeId = userProfile?.id || 'usr_anonymous';
      const donor = await supabaseBloodDonation.fetchDonorProfile(activeId);
      const orgs = await supabaseBloodDonation.fetchVerifiedOrganizations();
      
      if (!isMountedRef.current) return;

      if (donor) {
        setDonorProfile(donor);
        const reqs = await supabaseBloodDonation.fetchMatchedRequests(
          donor.bloodGroup,
          donor.city,
          donor.state
        );
        if (isMountedRef.current) {
          setMatchedRequests(reqs);
        }
      } else {
        const allReqs = await supabaseBloodDonation.fetchMatchedRequests();
        if (isMountedRef.current) {
          setMatchedRequests(allReqs);
        }
      }

      if (isMountedRef.current) {
        setVerifiedOrgs(orgs);
      }
    } catch (err) {
      console.warn('Error loading Blood Network data:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userProfile?.id]);

  useEffect(() => {
    loadNetworkData();
  }, [loadNetworkData]);

  // Handle Donor Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Please enter your full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!selectedBloodGroup) {
      setFormError('Please explicitly select your verified blood group.');
      return;
    }
    if (!city.trim() || !state.trim()) {
      setFormError('Please provide your city and state for geographic matching.');
      return;
    }
    if (!consentGiven) {
      setFormError('Explicit privacy consent is required before joining the donor network.');
      return;
    }

    const newDonor: BloodDonor = {
      id: donorProfile?.id || `bd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: userProfile?.id || 'usr_anonymous',
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      bloodGroup: selectedBloodGroup as BloodGroup,
      city: city.trim(),
      state: state.trim(),
      country: country.trim() || 'India',
      preferredContactMethod: preferredContact,
      availability: availability,
      lastDonationDate: lastDonationDate || undefined,
      consentGiven: true,
      consentGivenAt: new Date().toISOString(),
      notificationsPaused: donorProfile?.notificationsPaused || false,
      isActive: true,
      createdAt: donorProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const saved = await supabaseBloodDonation.upsertDonorProfile(newDonor);
      if (isMountedRef.current) {
        setDonorProfile(saved);
        setIsRegisterOpen(false);
        setSuccessNotice('You have successfully registered in the Jevan Care Voluntary Blood Donor Network!');
        setTimeout(() => setSuccessNotice(null), 5000);
        loadNetworkData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save donor registration. Please try again.');
    }
  };

  // Toggle Pause Notifications
  const handleToggleNotifications = async () => {
    if (!donorProfile) return;
    const newStatus = !donorProfile.notificationsPaused;
    const updated = { ...donorProfile, notificationsPaused: newStatus };
    setDonorProfile(updated);

    try {
      await supabaseBloodDonation.updateDonorSettings(donorProfile.user_id, {
        notificationsPaused: newStatus
      });
      setSuccessNotice(newStatus ? 'Blood donation notifications paused.' : 'Blood donation notifications resumed.');
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err) {
      console.warn('Failed to toggle notifications:', err);
    }
  };

  // Leave Network
  const handleConfirmLeave = async () => {
    if (!donorProfile) return;
    try {
      await supabaseBloodDonation.leaveNetwork(donorProfile.user_id);
      if (isMountedRef.current) {
        setDonorProfile(null);
        setIsLeaveConfirmOpen(false);
        setSuccessNotice('Your blood donor profile has been deactivated and removed from notifications.');
        setTimeout(() => setSuccessNotice(null), 4000);
      }
    } catch (err) {
      setErrorNotice('Failed to deactivate profile. Please check your network connection.');
      setTimeout(() => setErrorNotice(null), 4000);
    }
  };

  // Donor Response to Request
  const handleRespondToRequest = async (requestId: string, choice: 'RESPONDED_YES' | 'RESPONDED_NO') => {
    if (!donorProfile) return;
    setUserResponses((prev) => ({ ...prev, [requestId]: choice }));
    try {
      await supabaseBloodDonation.respondToRequest(requestId, donorProfile.id, choice);
      if (choice === 'RESPONDED_YES') {
        setSuccessNotice('Thank you! Your willingness to donate has been logged. The requesting medical entity will contact you via your preferred contact method.');
      } else {
        setSuccessNotice('Response recorded. Thank you for keeping the network updated.');
      }
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err) {
      console.warn('Failed to respond to request:', err);
    }
  };

  // Org Create Request Submit
  const handleCreateOrgRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !reqHospital.trim() || !reqContactEmail.trim()) {
      showToast('Please fill in all required organization fields.', 'warning');
      return;
    }

    const newReq: BloodRequest = {
      id: `br_${Date.now()}`,
      orgId: `org_${Date.now()}`,
      orgName: orgName.trim(),
      bloodGroup: reqBloodGroup,
      unitsNeeded: unitsNeeded,
      urgency: urgency,
      hospitalName: reqHospital.trim(),
      city: reqCity.trim(),
      state: 'Uttar Pradesh',
      contactEmail: reqContactEmail.trim(),
      additionalInstructions: reqInstructions.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'OPEN'
    };

    await supabaseBloodDonation.createOrgBloodRequest(newReq);
    setIsOrgModalOpen(false);
    setSuccessNotice('Verified blood request broadcasted to matched active donors in region.');
    setTimeout(() => setSuccessNotice(null), 5000);
    loadNetworkData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner Notice */}
      {successNotice && (
        <div className="bg-[#1b3b2b] text-[#faf8f5] p-4 rounded-2xl flex items-center justify-between shadow-lg border border-[#3b604a] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#a3d4b6] shrink-0" />
            <p className="text-xs sm:text-sm font-medium">{successNotice}</p>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-[#a3d4b6] hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="bg-rose-900 text-rose-50 p-4 rounded-2xl flex items-center justify-between shadow-lg border border-rose-700 animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
            <p className="text-xs sm:text-sm font-medium">{errorNotice}</p>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-rose-200 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Glass Header CTA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#8b263e] via-[#6d1b2e] to-[#1b3b2b] text-white p-6 sm:p-8 md:p-10 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-rose-200">
            <Droplet className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
            <span>Voluntary & Private Healthcare Network</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#faf8f5]">
            Jevan Care Blood Donation Network
          </h1>

          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
            Connect privately with verified hospitals, blood banks, and emergency medical teams when urgent blood requests match your blood group and region. Your contact details remain confidential until you choose to respond.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {!donorProfile ? (
              <button
                onClick={() => {
                  setSelectedBloodGroup((userProfile.bloodGroup as BloodGroup) || '');
                  setIsRegisterOpen(true);
                }}
                className="px-6 py-3 rounded-2xl bg-[#faf8f5] text-[#8b263e] font-bold text-xs sm:text-sm hover:bg-stone-100 shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <HeartHandshake className="w-4 h-4 text-[#8b263e]" />
                <span>Join Blood Donation Network</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Registered Active Donor ({donorProfile.bloodGroup})</span>
                </span>
                <button
                  onClick={handleToggleNotifications}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {donorProfile.notificationsPaused ? (
                    <>
                      <BellOff className="w-3.5 h-3.5 text-amber-300" />
                      <span>Notifications Paused</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Notifications Active</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={() => setIsOrgModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-medium border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Building className="w-3.5 h-3.5 text-stone-300" />
              <span>For Verified Medical Entities</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Blood Bank vs Volunteer Donor Distinction Advisory */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-amber-800 dark:text-amber-300 block">
              Official Data Integrity Notice (Source Distinction)
            </span>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5">
              This module manages <strong>private volunteer donors</strong>. For verified, live unit counts in government storage facilities (e-RaktKosh), visit the <strong>Official Blood Availability</strong> registry. Volunteer counts and licensed storage inventories are strictly separated.
            </p>
          </div>
        </div>
      </div>

      {/* Registered Donor Profile Dashboard Card */}
      {donorProfile && (
        <div className="bg-[#faf8f5] dark:bg-[#18261e] rounded-3xl p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e6dfd3] dark:border-[#283c2e]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#8b263e] text-white flex flex-col items-center justify-center shadow-md font-extrabold text-xl">
                <span>{donorProfile.bloodGroup}</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                  {donorProfile.fullName}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[#5c5647] dark:text-[#b0aaa0] mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#2b503b]" />
                    {donorProfile.city}, {donorProfile.state}
                  </span>
                  <span>•</span>
                  <span>Contact: {donorProfile.preferredContactMethod}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#e8eee5] dark:bg-[#23382b] text-[#1b3b2b] dark:text-[#a3d4b6] text-xs font-semibold hover:bg-[#d8e4d3] transition-all cursor-pointer"
              >
                Edit Details
              </button>
              <button
                onClick={() => setIsLeaveConfirmOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
              >
                Leave Network
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#f5f0e6] dark:bg-[#1d2d23] border border-[#e2d8c7] dark:border-[#2a4232]">
              <span className="text-[11px] font-semibold text-[#6e6756] dark:text-[#9e9788] uppercase tracking-wider block mb-1">
                Availability Status
              </span>
              <span className="text-xs font-bold text-[#1b3b2b] dark:text-[#d3e3d8] flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${donorProfile.availability === 'Available' ? 'bg-emerald-500' : donorProfile.availability === 'Emergency Only' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                {donorProfile.availability}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#f5f0e6] dark:bg-[#1d2d23] border border-[#e2d8c7] dark:border-[#2a4232]">
              <span className="text-[11px] font-semibold text-[#6e6756] dark:text-[#9e9788] uppercase tracking-wider block mb-1">
                Last Donation Date
              </span>
              <span className="text-xs font-bold text-[#1b3b2b] dark:text-[#d3e3d8]">
                {donorProfile.lastDonationDate || 'Not specified'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#f5f0e6] dark:bg-[#1d2d23] border border-[#e2d8c7] dark:border-[#2a4232]">
              <span className="text-[11px] font-semibold text-[#6e6756] dark:text-[#9e9788] uppercase tracking-wider block mb-1">
                Privacy Consent
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified ({new Date(donorProfile.consentGivenAt).toLocaleDateString()})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Matched Urgent Blood Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#8b263e] fill-[#8b263e]/20" />
              <span>Matched Urgent Blood Requests</span>
            </h2>
            <p className="text-xs text-[#5c5647] dark:text-[#b0aaa0]">
              Real-time urgent requests broadcasted by verified medical institutions in your region.
            </p>
          </div>
          <button
            onClick={loadNetworkData}
            className="p-2 rounded-xl bg-stone-100 dark:bg-[#1d2d23] text-[#2b503b] hover:bg-stone-200 transition-all cursor-pointer"
            title="Refresh Requests"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {matchedRequests.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#faf8f5] dark:bg-[#18261e] border border-[#e6dfd3] dark:border-[#283c2e] text-center space-y-3">
            <Droplet className="w-8 h-8 text-[#8b263e]/60 mx-auto" />
            <h3 className="text-sm font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
              No active blood requests matched right now
            </h3>
            <p className="text-xs text-[#5c5647] dark:text-[#b0aaa0] max-w-md mx-auto">
              There are currently no open urgent requests for {donorProfile ? `blood group ${donorProfile.bloodGroup}` : 'your location'}. When a verified hospital issues a request, matched donors will be notified immediately.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedRequests.map((req) => {
              const userResp = userResponses[req.id];
              return (
                <div
                  key={req.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#18261e] border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-[#8b263e] dark:text-rose-300 font-extrabold flex items-center justify-center text-sm">
                        {req.bloodGroup}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                          {req.hospitalName}
                        </h4>
                        <p className="text-xs text-[#5c5647] dark:text-[#b0aaa0]">
                          Issued by {req.orgName} • {req.city}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                      req.urgency === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : req.urgency === 'URGENT'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {req.urgency}
                    </span>
                  </div>

                  <div className="text-xs text-[#2b503b] dark:text-[#c4ded0] space-y-1 bg-[#f8f5ee] dark:bg-[#142018] p-3 rounded-2xl border border-[#e6dfd3] dark:border-[#23382b]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Units Required:</span>
                      <span className="font-bold">{req.unitsNeeded} Units</span>
                    </div>
                    {req.additionalInstructions && (
                      <p className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0] italic pt-1 border-t border-[#e6dfd3] dark:border-[#23382b]">
                        "{req.additionalInstructions}"
                      </p>
                    )}
                  </div>

                  {donorProfile ? (
                    <div className="pt-1 flex items-center gap-2">
                      {userResp === 'RESPONDED_YES' ? (
                        <div className="w-full py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center border border-emerald-300 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Responded Yes - Hospital Notified</span>
                        </div>
                      ) : userResp === 'RESPONDED_NO' ? (
                        <div className="w-full py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-medium text-center">
                          Responded Unavailable
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRespondToRequest(req.id, 'RESPONDED_YES')}
                            className="flex-1 py-2.5 rounded-xl bg-[#1b3b2b] hover:bg-[#284f3b] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5 text-[#a3d4b6]" />
                            <span>I Can Donate</span>
                          </button>
                          <button
                            onClick={() => handleRespondToRequest(req.id, 'RESPONDED_NO')}
                            className="px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300 text-xs font-medium transition-all cursor-pointer"
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-[#e8eee5] dark:bg-[#23382b] text-[#1b3b2b] dark:text-[#a3d4b6] text-xs font-bold hover:bg-[#d8e4d3] transition-all cursor-pointer"
                    >
                      Register as Donor to Respond
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verified Organizations Section */}
      <div className="bg-[#faf8f5] dark:bg-[#18261e] rounded-3xl p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-2">
              <Building className="w-5 h-5 text-[#2b503b] dark:text-[#a3d4b6]" />
              <span>Verified Blood Donation Organizations</span>
            </h2>
            <p className="text-xs text-[#5c5647] dark:text-[#b0aaa0]">
              Only genuinely verified medical organizations, government blood banks, and registered NGOs are authorized to request blood.
            </p>
          </div>
        </div>

        {verifiedOrgs.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#f5f0e6] dark:bg-[#142018] border border-[#e2d8c7] dark:border-[#23382b] text-center space-y-2">
            <Info className="w-6 h-6 text-[#2b503b] dark:text-[#a3d4b6] mx-auto" />
            <p className="text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
              Blood donation organizations are being onboarded
            </p>
            <p className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0] max-w-lg mx-auto">
              Medical facilities undergo rigorous credential verification before issuing broadcast requests to Jevan Care donors.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {verifiedOrgs.map((org) => (
              <div key={org.id} className="p-4 rounded-2xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#23382b] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">{org.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">VERIFIED</span>
                </div>
                <p className="text-[11px] text-[#5c5647] dark:text-[#b0aaa0]">
                  {org.orgType} • {org.city}, {org.state}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#faf8f5] dark:bg-[#18261e] rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#e6dfd3] dark:border-[#283c2e] shadow-2xl space-y-6 relative my-8 animate-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setIsRegisterOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#e8eee5] dark:hover:bg-[#23382b] text-[#5c5647] dark:text-[#b0aaa0] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/40 text-[#8b263e] dark:text-rose-300 text-xs font-bold">
                <Heart className="w-3.5 h-3.5 fill-[#8b263e]" />
                <span>Voluntary Donor Registration</span>
              </div>
              <h2 className="text-xl font-bold text-[#1b3b2b] dark:text-[#f2f0e8]">
                {donorProfile ? 'Update Donor Profile' : 'Join Blood Donation Network'}
              </h2>
              <p className="text-xs text-[#5c5647] dark:text-[#b0aaa0]">
                Your information is kept private and will never be published on public directories.
              </p>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-100 text-rose-900 text-xs font-medium border border-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8] focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                  placeholder="e.g. Aarav Sharma"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8] focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8] focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    Blood Group * (Explicit Selection)
                  </label>
                  <select
                    required
                    value={selectedBloodGroup}
                    onChange={(e) => setSelectedBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-bold text-[#8b263e] dark:text-rose-300 focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                  >
                    <option value="">-- Select Verified Blood Group --</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        Blood Group {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    Availability *
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as AvailabilityStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8] focus:outline-hidden focus:ring-2 focus:ring-[#1b3b2b]"
                  >
                    <option value="Available">Available for Regular & Urgent</option>
                    <option value="Emergency Only">Emergency Needs Only</option>
                    <option value="Currently Unavailable">Currently Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    State / Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    Preferred Contact Method
                  </label>
                  <select
                    value={preferredContact}
                    onChange={(e) => setPreferredContact(e.target.value as ContactMethod)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8]"
                  >
                    <option value="Email">Email Only</option>
                    <option value="Phone">Phone Only</option>
                    <option value="Both">Both Email and Phone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    Last Donation Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={lastDonationDate}
                    onChange={(e) => setLastDonationDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8]"
                  />
                </div>
              </div>

              {/* Explicit Privacy Consent Checkbox */}
              <div className="p-4 rounded-2xl bg-[#f5f0e6] dark:bg-[#142018] border border-[#e2d8c7] dark:border-[#23382b] space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-1 rounded-md text-[#8b263e] focus:ring-[#8b263e] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-[#1b3b2b] dark:text-[#d3e3d8] leading-relaxed">
                    <strong>Explicit Voluntary Consent:</strong> I consent to join the Jevan Care Voluntary Blood Donation Network. I agree to receive confidential notifications when an urgent blood request matches my blood group ({selectedBloodGroup || 'selected'}) and region ({city || 'city'}). My contact information will remain private and will never be shared without my explicit confirmation.
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#5c5647] dark:text-[#b0aaa0] hover:bg-stone-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#8b263e] hover:bg-[#a02f4a] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Complete Registration
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Org Broadcast Modal */}
      {isOrgModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#faf8f5] dark:bg-[#18261e] rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#e6dfd3] dark:border-[#283c2e] shadow-2xl space-y-5 relative my-8">
            <button
              onClick={() => setIsOrgModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-200 text-stone-500 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#1b3b2b] dark:text-[#f2f0e8] flex items-center gap-2">
                <Building className="w-5 h-5 text-[#2b503b]" />
                <span>Issue Verified Blood Request</span>
              </h2>
              <p className="text-xs text-[#5c5647] dark:text-[#b0aaa0]">
                Broadcast urgent blood requirements to verified, matching voluntary donors in your locality.
              </p>
            </div>

            <form onSubmit={handleCreateOrgRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                  Organization / Medical Center Name *
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. KGMU Blood Bank & Trauma Center"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    Hospital / Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqHospital}
                    onChange={(e) => setReqHospital(e.target.value)}
                    placeholder="e.g. Emergency Ward 3, KGMU"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqCity}
                    onChange={(e) => setReqCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={reqBloodGroup}
                    onChange={(e) => setReqBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-bold text-[#8b263e]"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    Units Needed
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={unitsNeeded}
                    onChange={(e) => setUnitsNeeded(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                    Urgency
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8]"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate)</option>
                    <option value="URGENT">URGENT (24 Hours)</option>
                    <option value="STANDARD">STANDARD (Planned)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                  Official Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={reqContactEmail}
                  onChange={(e) => setReqContactEmail(e.target.value)}
                  placeholder="emergency@kgmu.edu.in"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1b3b2b] dark:text-[#d3e3d8] mb-1">
                  Additional Instructions / Requirements
                </label>
                <textarea
                  rows={2}
                  value={reqInstructions}
                  onChange={(e) => setReqInstructions(e.target.value)}
                  placeholder="e.g. Patient undergoing cardiac surgery. Please report to Blood Bank Counter 2."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#142018] border border-[#e6dfd3] dark:border-[#283c2e] text-xs font-medium text-[#1b3b2b] dark:text-[#f2f0e8]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOrgModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#1b3b2b] hover:bg-[#284f3b] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Broadcast Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Network Confirmation Dialog */}
      {isLeaveConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18261e] rounded-3xl max-w-md w-full p-6 border border-[#e6dfd3] dark:border-[#283c2e] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-700 dark:text-rose-400">
              <UserX className="w-6 h-6" />
              <h3 className="text-base font-bold">Leave Blood Donation Network?</h3>
            </div>
            <p className="text-xs text-[#5c5647] dark:text-[#b0aaa0] leading-relaxed">
              Your donor profile will be deactivated immediately. You will no longer receive emergency blood match notifications. You can rejoin at any time.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsLeaveConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                Keep Active
              </button>
              <button
                onClick={handleConfirmLeave}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
              >
                Deactivate Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
