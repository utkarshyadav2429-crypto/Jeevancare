import React, { useState } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Stethoscope,
  Building,
  MapPin,
  Clock,
  IndianRupee,
  AlertCircle
} from 'lucide-react';
import { Doctor } from '../../types';
import { supabaseDoctors } from '../../services/supabaseService';
import { auditLogger } from '../../services/AuditLogger';

interface DoctorOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: (newDoctor: Doctor) => void;
}

const INDIAN_STATES = [
  'Uttar Pradesh',
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Tamil Nadu',
  'West Bengal',
  'Gujarat',
  'Telangana',
  'Rajasthan',
  'Kerala',
  'Punjab',
  'Bihar',
  'Haryana',
  'Madhya Pradesh',
  'Assam',
  'Odisha',
];

const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Gynecologist & Obstetrician',
  'Psychiatrist',
  'Orthopedic Surgeon',
  'ENT Specialist',
  'Ophthalmologist',
  'Dentist',
  'Neurologist',
  'Endocrinologist',
  'Pulmonologist',
  'Gastroenterologist',
  'Urologist',
  'Nephrologist',
  'Oncologist',
  'Rheumatologist',
];

const AVAILABLE_LANGUAGES = [
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
  'Odia',
  'Assamese',
];

export const DoctorOnboardingModal: React.FC<DoctorOnboardingModalProps> = ({
  isOpen,
  onClose,
  onRegistered,
}) => {
  const [fullName, setFullName] = useState('');
  const [specialty, setSpecialty] = useState(SPECIALIZATIONS[0]);
  const [qualification, setQualification] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [registrationAuthority, setRegistrationAuthority] = useState('Uttar Pradesh Medical Council');
  const [experienceYears, setExperienceYears] = useState(5);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Hindi', 'English']);
  const [country, setCountry] = useState('India');
  const [stateName, setStateName] = useState('Uttar Pradesh');
  const [city, setCity] = useState('');
  const [hospital, setHospital] = useState('');
  const [address, setAddress] = useState('');
  const [fees, setFees] = useState(500);
  const [consultationTypes, setConsultationTypes] = useState<('Video' | 'Audio' | 'In-Person')[]>(['Video', 'In-Person']);
  const [about, setAbout] = useState('');
  
  // Photo upload
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const toggleConsultMode = (mode: 'Video' | 'Audio' | 'In-Person') => {
    if (consultationTypes.includes(mode)) {
      if (consultationTypes.length > 1) {
        setConsultationTypes(consultationTypes.filter((m) => m !== mode));
      }
    } else {
      setConsultationTypes([...consultationTypes, mode]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !qualification.trim() || !registrationNumber.trim() || !city.trim() || !hospital.trim()) {
      setErrorMsg('Please complete all required fields including Medical Registration Number, City, and Practice Hospital/Clinic.');
      return;
    }

    setSubmitting(true);

    try {
      let uploadedPhotoUrl = photoPreview || undefined;

      const newDocId = `doc_${Date.now()}`;

      if (photoFile) {
        setIsUploading(true);
        const uploaded = await supabaseDoctors.uploadProfilePhoto(newDocId, photoFile);
        if (uploaded) uploadedPhotoUrl = uploaded;
        setIsUploading(false);
      }

      const formattedName = fullName.startsWith('Dr.') ? fullName : `Dr. ${fullName}`;

      const createdDoc = await supabaseDoctors.registerDoctor({
        id: newDocId,
        name: formattedName,
        photoUrl: uploadedPhotoUrl,
        specialty,
        qualification,
        registrationNumber,
        registrationAuthority,
        experienceYears: Number(experienceYears),
        languages: selectedLanguages,
        country,
        state: stateName,
        city,
        hospital,
        address,
        fees: Number(fees),
        consultationTypes,
        about: about || `Consultant ${specialty} at ${hospital}, ${city}. Experienced in medical diagnosis and patient care.`,
        verificationStatus: 'PENDING',
        verified: false,
        onlineStatus: 'online',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        availableSlots: ['09:30 AM', '11:00 AM', '02:30 PM', '04:15 PM'],
        consultationDurationMins: 20,
      });

      auditLogger.logAction(
        'DOCTOR_ONBOARDING_SUBMITTED',
        `Doctor registration submitted for ${formattedName} (Reg #${registrationNumber}). Status: PENDING verification.`,
        { registrationNumber, city, state: stateName },
        'SUCCESS'
      );

      setSuccessMsg(true);
      onRegistered(createdDoc);

      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit doctor registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative my-8">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Doctor Onboarding & Verification</h3>
              <p className="text-xs text-emerald-100">Register as a Verified Healthcare Specialist on Jevan Care</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 text-xs font-semibold space-y-1 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Registration Submitted Successfully!</span>
              </div>
              <p>
                Your professional profile and registration number (<strong>{registrationNumber}</strong>) have been received. Your status is <strong>PENDING verification</strong> and will appear in public search results once verified by administrators.
              </p>
            </div>
          )}

          {/* Section 1: Personal & Photo */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              1. Personal Details & Professional Photograph
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Photo Upload Area */}
              <div className="flex flex-col items-center justify-center space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold flex flex-col items-center justify-center text-xs">
                    <span>Photo</span>
                    <Upload className="w-4 h-4 mt-1" />
                  </div>
                )}
                <label className="cursor-pointer text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                  <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400">Authentic profile picture</p>
              </div>

              {/* Full Name & Experience */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name (with Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Kumar Srivastava"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Specialization *
                    </label>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                    >
                      {SPECIALIZATIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Experience (Years) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      required
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Qualifications & Registration Credentials */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              2. Medical Qualifications & Registration Number
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Medical Qualification / Degrees *
              </label>
              <input
                type="text"
                required
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. MBBS, MD (Internal Medicine - KGMU Lucknow)"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medical Council Reg. Number *
                </label>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. UPMC-48219 or MMC-2015/08/99"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registration Authority / Council *
                </label>
                <input
                  type="text"
                  required
                  value={registrationAuthority}
                  onChange={(e) => setRegistrationAuthority(e.target.value)}
                  placeholder="e.g. Uttar Pradesh Medical Council"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Spoken Languages */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Spoken Languages (Select all that apply) *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}{lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Practice Location */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              3. Practice Location & Hospital Affiliation
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                <input
                  type="text"
                  disabled
                  value={country}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">State / UT *</label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City / Region *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lucknow, Kanpur, Mumbai"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hospital / Clinic Name *
                </label>
                <input
                  type="text"
                  required
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  placeholder="e.g. KGMU OPD or Medanta Hospital"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinic Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shah Mina Road, Chowk, Lucknow"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Consultation Fees & Modes */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              4. Consultation Fees & Supported Modes
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Consultation Fee (₹ INR) *
                </label>
                <input
                  type="number"
                  min={100}
                  max={10000}
                  step={50}
                  required
                  value={fees}
                  onChange={(e) => setFees(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supported Consultation Modes *
                </label>
                <div className="flex gap-2">
                  {(['Video', 'Audio', 'In-Person'] as const).map((mode) => {
                    const isChecked = consultationTypes.includes(mode);
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => toggleConsultMode(mode)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Professional Bio & Clinical Expertise Summary
              </label>
              <textarea
                rows={2}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Brief summary of clinical specialties, hospital experience, and medical achievements..."
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Submitting Registration...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Registration for Verification</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
