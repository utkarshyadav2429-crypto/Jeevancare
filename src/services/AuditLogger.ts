export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'DENIED';
}

const STORAGE_KEY = 'jeevancare_audit_logs_v1';

const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log_001',
    timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    userId: 'usr_001',
    userName: 'Aarav Sharma',
    userRole: 'patient',
    action: 'USER_LOGIN',
    details: 'User authenticated successfully with 2FA OTP verification.',
    ipAddress: '103.24.18.92 (New Delhi, IN)',
    status: 'SUCCESS',
  },
  {
    id: 'log_002',
    timestamp: new Date(Date.now() - 3600000 * 5).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    userId: 'usr_001',
    userName: 'Aarav Sharma',
    userRole: 'patient',
    action: 'RECORD_ACCESS',
    details: 'Viewed encrypted document: Pulmonology Consultation & Prescription (v_101)',
    ipAddress: '103.24.18.92 (New Delhi, IN)',
    status: 'SUCCESS',
  },
  {
    id: 'log_003',
    timestamp: new Date(Date.now() - 3600000 * 12).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    userId: 'usr_001',
    userName: 'Aarav Sharma',
    userRole: 'patient',
    action: 'PRESCRIPTION_SCAN',
    details: 'OCR extraction performed on uploaded prescription image. Identified Amoxicillin 500mg.',
    ipAddress: '103.24.18.92 (New Delhi, IN)',
    status: 'SUCCESS',
  },
  {
    id: 'log_004',
    timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    userId: 'doc_101',
    userName: 'Dr. Rajeshwar K. Tripathi',
    userRole: 'doctor',
    action: 'APPOINTMENT_CONFIRMED',
    details: 'Video consultation scheduled with Aarav Sharma. Fee paid: ₹600',
    ipAddress: '182.73.91.10 (Mumbai, IN)',
    status: 'SUCCESS',
  },
  {
    id: 'log_005',
    timestamp: new Date(Date.now() - 3600000 * 36).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    userId: 'usr_001',
    userName: 'Aarav Sharma',
    userRole: 'patient',
    action: 'DPDP_CONSENT_UPDATE',
    details: 'User accepted India DPDP Act 2023 medical data processing agreement.',
    ipAddress: '103.24.18.92 (New Delhi, IN)',
    status: 'SUCCESS',
  },
];

class AuditLoggerService {
  private logs: AuditLog[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      } else {
        this.logs = INITIAL_LOGS;
        this.saveLogs();
      }
    } catch (e) {
      this.logs = INITIAL_LOGS;
    }
  }

  private saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.error('Failed to save audit logs:', e);
    }
  }

  public getLogs(): AuditLog[] {
    return [...this.logs];
  }

  public logAction(
    action: string,
    details: string,
    user?: { id?: string; name?: string; role?: string; [key: string]: any },
    status: 'SUCCESS' | 'WARNING' | 'DENIED' = 'SUCCESS'
  ): AuditLog {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      userId: user?.id || 'usr_001',
      userName: user?.name || 'Aarav Sharma',
      userRole: user?.role || 'patient',
      action,
      details,
      ipAddress: '103.24.18.92 (India)',
      status,
    };

    this.logs = [newLog, ...this.logs];
    this.saveLogs();
    return newLog;
  }

  public clearLogs() {
    this.logs = [];
    this.saveLogs();
  }

  public exportLogsJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const auditLogger = new AuditLoggerService();
