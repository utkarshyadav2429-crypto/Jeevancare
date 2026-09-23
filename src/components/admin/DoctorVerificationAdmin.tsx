import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Building,
  MapPin,
  Clock,
  UserCheck,
  FileCheck2,
  Stethoscope
} from 'lucide-react';
import { Doctor, DoctorVerificationStatus } from '../../types';
import { DoctorAvatar } from '../doctors/DoctorAvatar';
import { supabaseDoctors } from '../../services/supabaseService';
import { auditLogger } from '../../services/AuditLogger';

interface DoctorVerificationAdminProps {
  doctors: Doctor[];
  onDoctorStatusUpdated: (doctorId: string, newStatus: DoctorVerificationStatus) => void;
}

export const DoctorVerificationAdmin: React.FC<DoctorVerificationAdminProps> = ({
  doctors = [],
  onDoctorStatusUpdated,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filtered = doctors.filter((doc) => {
    const matchesStatus = filterStatus === 'ALL' || doc.verificationStatus === filterStatus;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = async (doctorId: string, doctorName: string, status: DoctorVerificationStatus) => {
    setProcessingId(doctorId);
    try {
      await supabaseDoctors.updateDoctorVerification(doctorId, status);
      onDoctorStatusUpdated(doctorId, status);

      auditLogger.logAction(
        'DOCTOR_VERIFICATION_UPDATED',
        `Admin updated verification status for ${doctorName} to ${status}.`,
        { doctorId, status },
        'SUCCESS'
      );
    } catch (err) {
      console.error('Failed to update doctor verification status:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = doctors.filter((d) => d.verificationStatus === 'PENDING').length;
  const verifiedCount = doctors.filter((d) => d.verificationStatus === 'VERIFIED' || d.verified).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <span>Doctor Verification & Audit Console</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-bold">
                  {pendingCount} Pending
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review medical registration authority records, verify doctor credentials, and audit healthcare listings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
            ✓ {verifiedCount} Verified Doctors
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reg number, name, city..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto text-xs">
          {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Review List */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-bold">No doctor records match the status "{filterStatus}".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => {
            const statusColor = {
              VERIFIED: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200',
              PENDING: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200',
              REJECTED: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200',
              SUSPENDED: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300',
            }[doc.verificationStatus || 'PENDING'];

            return (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3">
                  <DoctorAvatar doctor={doc} size="md" showVerifiedBadge={false} />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">{doc.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                        {doc.verificationStatus || 'PENDING'}
                      </span>
                    </div>

                    <p className="text-teal-700 dark:text-teal-300 font-semibold">{doc.specialty} • {doc.qualification}</p>

                    <p className="font-mono text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded inline-block text-[11px]">
                      Reg No: {doc.registrationNumber || 'NOT PROVIDED'} ({doc.registrationAuthority || 'Medical Council'})
                    </p>

                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {doc.hospital} ({doc.city}, {doc.state}) • ₹{doc.fees} Fee
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200 dark:border-slate-700">
                  {doc.verificationStatus !== 'VERIFIED' && (
                    <button
                      onClick={() => handleUpdateStatus(doc.id, doc.name, 'VERIFIED')}
                      disabled={processingId === doc.id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Verify
                    </button>
                  )}

                  {doc.verificationStatus !== 'REJECTED' && (
                    <button
                      onClick={() => handleUpdateStatus(doc.id, doc.name, 'REJECTED')}
                      disabled={processingId === doc.id}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  )}

                  {doc.verificationStatus !== 'SUSPENDED' && doc.verificationStatus === 'VERIFIED' && (
                    <button
                      onClick={() => handleUpdateStatus(doc.id, doc.name, 'SUSPENDED')}
                      disabled={processingId === doc.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1 disabled:opacity-50"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Suspend
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
