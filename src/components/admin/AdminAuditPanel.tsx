import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  FileText,
  Search,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  TrendingUp,
  IndianRupee,
  Database,
  Building,
  Key,
  Plus
} from 'lucide-react';
import { auditLogger, AuditLog } from '../../services/AuditLogger';
import { UserProfile } from '../../types';
import { useToast } from '../../context/ToastContext';

interface AdminAuditPanelProps {
  userProfile?: UserProfile;
}

export const AdminAuditPanel: React.FC<AdminAuditPanelProps> = ({ userProfile }) => {
  const { showToast, showConfirm } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  const refreshLogs = () => {
    setLogs(auditLogger.getLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const handleClearLogs = () => {
    showConfirm({
      title: 'Clear System Audit Logs?',
      message: 'Are you sure you want to clear all system audit logs? This action is recorded in immutable security backup.',
      confirmText: 'Clear Logs',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        auditLogger.clearLogs();
        refreshLogs();
        showToast('System audit logs cleared.', 'info');
      }
    });
  };

  const handleExportLogs = () => {
    const jsonStr = auditLogger.exportLogsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jeevancare_audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported audit logs JSON file.', 'success');
  };

  const handleAddDemoLog = () => {
    auditLogger.logAction(
      'ADMIN_MANUAL_SECURITY_AUDIT',
      'System administrator performed routine HIPAA & DPDP Act compliance audit check.',
      userProfile,
      'SUCCESS'
    );
    refreshLogs();
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;

    return matchesSearch && matchesStatus && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-teal-400 dark:bg-teal-950 dark:text-teal-300 font-extrabold text-[10px] uppercase tracking-wider">
              System Administration & Compliance
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
              DPDP Act 2023 Compliant
            </span>
          </div>
          <h2 className="text-3xl font-light italic font-serif-editorial text-slate-900 dark:text-slate-100">
            HIPAA & India DPDP Audit Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time immutable action tracking for medical record access, authentication events, and data security governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddDemoLog}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Test Audit Event</span>
          </button>
          <button
            onClick={handleExportLogs}
            className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </header>

      {/* Admin KPI Cards (All in ₹ INR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Audit Events</span>
            <ShieldCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{logs.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">100% Verified</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Encrypted ledger active</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Consultation Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">₹2,45,500</span>
            <span className="text-xs text-emerald-600 font-semibold">+18.4%</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Total processed in India (₹)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Vault Storage Used</span>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">4.2 GB</span>
            <span className="text-xs text-slate-400">AWS S3 / Drive</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">256-bit AES encryption</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Registered Patients</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">1,420</span>
            <span className="text-xs text-teal-600 font-semibold">ABHA Linked</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Active health profiles</p>
        </div>

      </div>

      {/* Compliance & Security Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-900/40 to-slate-900/60 border border-teal-500/30 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-teal-200">HIPAA & India DPDP Governance Standards</h4>
            <p className="text-xs text-slate-300">
              All medical record accesses, doctor prescription approvals, and profile changes are cryptographically hashed.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> E2E Encrypted
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, user, details, IP..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="WARNING">WARNING</option>
            <option value="DENIED">DENIED</option>
          </select>

          {/* Action filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold max-w-[180px] truncate"
          >
            <option value="ALL">All Actions</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          <button
            onClick={refreshLogs}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearLogs}
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-slate-200 dark:border-slate-700"
            title="Clear Audit Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">IP / Location</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                      {log.userName}
                      <span className="block text-[10px] font-normal text-slate-400 uppercase">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[10px] text-teal-600 dark:text-teal-400 border border-slate-200 dark:border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 leading-relaxed max-w-xs break-words text-slate-600 dark:text-slate-300">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : log.status === 'WARNING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
