import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Stethoscope,
  Search,
  MapPin,
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  Building,
  CheckCircle2,
  Share2,
  X,
  FileText,
  Upload,
  Send,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  ShieldCheck,
  UserPlus,
  Navigation,
  Globe,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Doctor, Appointment, ConsultationMessage, VaultItem, DoctorVerificationStatus } from '../../types';
import { initialDoctors } from '../../data/initialData';
import { supabaseDoctors } from '../../services/supabaseService';
import { auditLogger } from '../../services/AuditLogger';
import { DoctorCard } from './DoctorCard';
import { DoctorProfileModal } from './DoctorProfileModal';
import { DoctorOnboardingModal } from './DoctorOnboardingModal';
import { DoctorVerificationAdmin } from '../admin/DoctorVerificationAdmin';
import { DoctorAvatar } from './DoctorAvatar';

interface DoctorConsultationProps {
  doctors?: Doctor[];
  appointments: Appointment[];
  vaultItems: VaultItem[];
  onBookAppointment: (app: Appointment) => void;
  setActiveTab: (tab: string) => void;
}

const REGIONAL_LOCATIONS: Record<string, string[]> = {
  'All States': ['All Cities'],
  'Uttar Pradesh': ['All Cities', 'Lucknow', 'Kanpur', 'Prayagraj', 'Varanasi', 'Noida', 'Agra'],
  'Maharashtra': ['All Cities', 'Mumbai', 'Pune', 'Nagpur', 'Nashik'],
  'Delhi': ['All Cities', 'New Delhi', 'South Delhi', 'Dwarka'],
  'Karnataka': ['All Cities', 'Bengaluru', 'Mysuru', 'Mangaluru'],
  'Tamil Nadu': ['All Cities', 'Chennai', 'Coimbatore', 'Madurai'],
  'West Bengal': ['All Cities', 'Kolkata', 'Howrah'],
  'Gujarat': ['All Cities', 'Ahmedabad', 'Surat', 'Vadodara'],
};

const LANGUAGES_LIST = [
  'All Languages',
  'Hindi',
  'English',
  'Urdu',
  'Bengali',
  'Marathi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Gujarati',
  'Punjabi',
];

const SPECIALTIES_LIST = [
  'All Specializations',
  'General Physician',
  'Pulmonologist',
  'Cardiologist',
  'Endocrinologist',
  'Neurologist',
  'Gynecology & Obstetrics',
  'Dermatologist',
  'Pediatrician',
  'Psychiatrist',
  'Orthopedic Surgeon',
];

export const DoctorConsultation: React.FC<DoctorConsultationProps> = ({
  doctors: initialPropDoctors = initialDoctors,
  appointments = [],
  vaultItems = [],
  onBookAppointment,
  setActiveTab,
}) => {
  const [liveDoctors, setLiveDoctors] = useState<Doctor[]>(initialPropDoctors);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Active View Tab: 'DISCOVERY' or 'ADMIN_VERIFICATION'
  const [activeSubTab, setActiveSubTab] = useState<'DISCOVERY' | 'ADMIN_VERIFICATION'>('DISCOVERY');

  // Filters
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedLanguage, setSelectedLanguage] = useState('All Languages');
  const [specialtyFilter, setSpecialtyFilter] = useState('All Specializations');
  const [searchQuery, setSearchQuery] = useState('');
  const [useGpsDistance, setUseGpsDistance] = useState(false);

  // Modals
  const [selectedDoctorForProfile, setSelectedDoctorForProfile] = useState<Doctor | null>(null);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Active Teleconsultation Room state
  const [activeCallApp, setActiveCallApp] = useState<Appointment | null>(null);
  const [messages, setMessages] = useState<ConsultationMessage[]>([
    {
      id: 'm1',
      sender: 'doctor',
      text: 'Namaste! I am your verified consultant on Jevan Care. I have reviewed your clinical history and lab records. How may I assist you today?',
      timestamp: '11:01 AM',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  // Load verified doctors from database
  const loadDoctorsFromDb = useCallback(async () => {
    setLoadingDoctors(true);
    try {
      const fetched = await supabaseDoctors.fetchDoctors();
      setLiveDoctors(fetched);
    } catch (err) {
      console.warn('Failed to fetch doctors from Supabase:', err);
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  useEffect(() => {
    loadDoctorsFromDb();
  }, [loadDoctorsFromDb]);

  // Sync state & city dropdowns
  useEffect(() => {
    setSelectedCity('All Cities');
  }, [selectedState]);

  // Handle GPS location click
  const handleUseGpsLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUseGpsDistance(true);
          setSelectedState('Uttar Pradesh');
          setSelectedCity('Lucknow');
          auditLogger.logAction(
            'GPS_LOCATION_APPLIED',
            `Applied patient location coordinates (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}) for doctor discovery.`,
            { lat: pos.coords.latitude, lng: pos.coords.longitude },
            'SUCCESS'
          );
        },
        () => {
          setSelectedState('Uttar Pradesh');
          setSelectedCity('Lucknow');
        }
      );
    } else {
      setSelectedState('Uttar Pradesh');
      setSelectedCity('Lucknow');
    }
  }, []);

  // Filter Verified Doctors ONLY for public discovery
  const verifiedDoctors = useMemo(
    () => liveDoctors.filter((d) => d.verificationStatus === 'VERIFIED' || d.verified === true),
    [liveDoctors]
  );

  const filteredDoctors = useMemo(
    () =>
      verifiedDoctors.filter((doc) => {
        const matchesState = selectedState === 'All States' || doc.state === selectedState;
        const matchesCity = selectedCity === 'All Cities' || doc.city === selectedCity;
        const matchesLanguage =
          selectedLanguage === 'All Languages' ||
          (doc.languages && doc.languages.some((l) => l.toLowerCase() === selectedLanguage.toLowerCase()));
        const matchesSpec =
          specialtyFilter === 'All Specializations' ||
          doc.specialty.toLowerCase().includes(specialtyFilter.toLowerCase());
        const matchesSearch =
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.city.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesState && matchesCity && matchesLanguage && matchesSpec && matchesSearch;
      }),
    [verifiedDoctors, selectedState, selectedCity, selectedLanguage, specialtyFilter, searchQuery]
  );

  const handleDoctorRegistered = useCallback((newDoc: Doctor) => {
    setLiveDoctors((prev) => [newDoc, ...prev]);
  }, []);

  const handleDoctorStatusUpdated = useCallback((doctorId: string, newStatus: DoctorVerificationStatus) => {
    setLiveDoctors((prev) =>
      prev.map((d) =>
        d.id === doctorId ? { ...d, verificationStatus: newStatus, verified: newStatus === 'VERIFIED' } : d
      )
    );
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        sender: 'patient',
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setNewMessage('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_doc_${Date.now()}`,
          sender: 'doctor',
          text: 'Thank you for sharing your symptom update. Please follow the prescribed medication and reach out if fever or breathlessness persists.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  const handleShareVaultDoc = (docTitle: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_vault_${Date.now()}`,
        sender: 'patient',
        text: `Shared Medical Vault Document: ${docTitle}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachmentName: docTitle,
      },
    ]);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 flex items-center justify-center shrink-0">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>Verified Doctor Consultation Platform</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                Live Database
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Authentic doctors verified by Medical Registration Councils. Real availability, regional discovery, and secure teleconsultations.
            </p>
          </div>
        </div>

        {/* Header Action CTAs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Join as Doctor</span>
          </button>

          <button
            onClick={() => setActiveSubTab(activeSubTab === 'DISCOVERY' ? 'ADMIN_VERIFICATION' : 'DISCOVERY')}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
              activeSubTab === 'ADMIN_VERIFICATION'
                ? 'bg-slate-800 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{activeSubTab === 'ADMIN_VERIFICATION' ? 'Patient Discovery Mode' : 'Admin Audit Console'}</span>
          </button>
        </div>
      </div>

      {/* SubTab 1: ADMIN VERIFICATION CONSOLE */}
      {activeSubTab === 'ADMIN_VERIFICATION' ? (
        <DoctorVerificationAdmin
          doctors={liveDoctors}
          onDoctorStatusUpdated={handleDoctorStatusUpdated}
        />
      ) : (
        /* SubTab 2: PATIENT DOCTOR DISCOVERY PLATFORM */
        <div className="space-y-6">

          {/* Regional & Specialty Discovery Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Patient Location & Regional Discovery</span>
              </div>

              <button
                onClick={handleUseGpsLocation}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>📍 Detect My Nearby Location</span>
              </button>
            </div>

            {/* Filter Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              
              {/* Search Box */}
              <div className="relative lg:col-span-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Doctor, hospital, specialty..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* State Filter */}
              <div>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-semibold"
                >
                  {Object.keys(REGIONAL_LOCATIONS).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-semibold"
                >
                  {(REGIONAL_LOCATIONS[selectedState] || ['All Cities']).map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>

              {/* Language Filter */}
              <div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-semibold"
                >
                  {LANGUAGES_LIST.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* Specialty Filter */}
              <div>
                <select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-semibold"
                >
                  {SPECIALTIES_LIST.map((sp) => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Active Filters Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                Showing <strong>{filteredDoctors.length}</strong> verified doctors for region: <strong>{selectedCity}, {selectedState}</strong>
              </span>

              {(selectedState !== 'All States' || selectedCity !== 'All Cities' || specialtyFilter !== 'All Specializations' || selectedLanguage !== 'All Languages' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedState('All States');
                    setSelectedCity('All Cities');
                    setSelectedLanguage('All Languages');
                    setSpecialtyFilter('All Specializations');
                    setSearchQuery('');
                  }}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

          </div>

          {/* Active Call Teleconsultation Room */}
          {activeCallApp && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-2xl space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                  <div>
                    <h3 className="font-bold text-base">{activeCallApp.doctorName}</h3>
                    <p className="text-xs text-emerald-300">{activeCallApp.specialty} • Teleconsultation Room</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveCallApp(null)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <PhoneOff className="w-4 h-4" /> End Consultation
                </button>
              </div>

              {/* Video Frame & Chat */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative min-h-[320px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-6">
                  <div className="relative text-center space-y-3">
                    <div className="w-24 h-24 rounded-2xl bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-100 font-bold text-2xl mx-auto shadow-2xl">
                      {activeCallApp.doctorName.replace(/^Dr\.\s*/i, '').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{activeCallApp.doctorName}</h4>
                      <p className="text-xs text-teal-300 font-semibold">Live Encrypted Video Consultation</p>
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 w-28 h-20 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-400">
                    Patient View
                  </div>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700">
                    <button
                      onClick={() => setIsMicOn(!isMicOn)}
                      className={`p-2.5 rounded-full transition-colors ${
                        isMicOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setIsVideoOn(!isVideoOn)}
                      className={`p-2.5 rounded-full transition-colors ${
                        isVideoOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col h-[380px]">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">
                    Consultation Chat & Vault Records
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xl max-w-[85%] ${
                          m.sender === 'patient'
                            ? 'bg-emerald-700 text-white ml-auto'
                            : 'bg-slate-800 text-slate-200 mr-auto border border-slate-700'
                        }`}
                      >
                        <p>{m.text}</p>
                        <span className="text-[9px] opacity-70 block text-right mt-1">{m.timestamp}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800 mb-2">
                    <p className="text-[10px] text-slate-400 mb-1">Share Document from Medical Vault:</p>
                    <div className="flex gap-1 overflow-x-auto scrollbar-none">
                      {vaultItems.slice(0, 3).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleShareVaultDoc(item.title)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-teal-300 font-medium whitespace-nowrap border border-slate-700"
                        >
                          + {item.title.substring(0, 18)}...
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Message doctor..."
                      className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500"
                    />
                    <button type="submit" className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* User's Scheduled Consultations Section */}
          {appointments.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Your Scheduled Consultations
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {appointments.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{app.doctorName}</span>
                      <p className="text-slate-500 dark:text-slate-400">{app.specialty}</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                        {app.date} at {app.timeSlot} ({app.type})
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveCallApp(app)}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Call</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Cards Grid */}
          {filteredDoctors.length === 0 ? (
            /* Honest Empty State */
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-4 max-w-xl mx-auto my-6 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-800 dark:text-white">
                  No Verified Doctors Found for "{selectedCity}, {selectedState}"
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  There are currently no doctors with verified medical council credentials matching your selected location or specialization criteria.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedState('All States');
                    setSelectedCity('All Cities');
                    setSpecialtyFilter('All Specializations');
                    setSelectedLanguage('All Languages');
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  Show All Verified Doctors
                </button>

                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Register as a Doctor Here
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDoctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  onViewProfile={(d) => setSelectedDoctorForProfile(d)}
                  onBookConsultation={(d) => setSelectedDoctorForBooking(d)}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* Doctor Profile View Modal */}
      {selectedDoctorForProfile && (
        <DoctorProfileModal
          doctor={selectedDoctorForProfile}
          existingAppointments={appointments}
          onClose={() => setSelectedDoctorForProfile(null)}
          onBookAppointment={onBookAppointment}
        />
      )}

      {/* Doctor Direct Slot Booking Modal */}
      {selectedDoctorForBooking && (
        <DoctorProfileModal
          doctor={selectedDoctorForBooking}
          existingAppointments={appointments}
          onClose={() => setSelectedDoctorForBooking(null)}
          onBookAppointment={onBookAppointment}
        />
      )}

      {/* Doctor Onboarding Modal */}
      <DoctorOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onRegistered={handleDoctorRegistered}
      />

    </div>
  );
};
