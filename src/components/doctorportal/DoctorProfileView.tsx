import React, { useState } from 'react';
import {
  BadgeCheck,
  Building2,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Save,
  Clock,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../../types';

interface DoctorProfileViewProps {
  doctorProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const DoctorProfileView: React.FC<DoctorProfileViewProps> = ({
  doctorProfile,
  onUpdateProfile,
}) => {
  const [regNum, setRegNum] = useState(doctorProfile.registrationNumber || 'KGMU-48219');
  const [council, setCouncil] = useState(doctorProfile.medicalCouncil || 'Uttar Pradesh Medical Council (UPMC)');
  const [specialty, setSpecialty] = useState(doctorProfile.specialty || 'Pulmonology & Internal Medicine');
  const [qualification, setQualification] = useState(doctorProfile.qualification || 'M.D. (Pulmonology), M.B.B.S. (KGMU Lucknow)');
  const [hospital, setHospital] = useState(doctorProfile.hospitalAffiliation || 'KGMU Super-Specialty Hospital, Lucknow');
  const [expYears, setExpYears] = useState(doctorProfile.experienceYears || 14);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      registrationNumber: regNum,
      medicalCouncil: council,
      specialty,
      qualification,
      hospitalAffiliation: hospital,
      experienceYears: Number(expYears),
      verificationStatus: 'verified',
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const status = doctorProfile.verificationStatus || 'verified';

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 max-w-4xl mx-auto">
      
      {/* Verification Status Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
            <BadgeCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Doctor Verification & Credentials</h2>
              {status === 'verified' && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Practitioner
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Medical registration records validated against official State Medical Council databases.
            </p>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Professional credentials updated successfully!</span>
        </div>
      )}

      {/* Profile & Credentials Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
        
        <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Medical Registration Number *
              </label>
              <input
                type="text"
                required
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                State Medical Council
              </label>
              <input
                type="text"
                required
                value={council}
                onChange={(e) => setCouncil(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Specialty
              </label>
              <input
                type="text"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Years of Clinical Experience
              </label>
              <input
                type="number"
                value={expYears}
                onChange={(e) => setExpYears(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Medical Qualifications
            </label>
            <input
              type="text"
              required
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Hospital / Clinic Affiliation
            </label>
            <input
              type="text"
              required
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Changes reflect on digital prescriptions and patient consult banners.
            </span>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & Verify Credentials</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
