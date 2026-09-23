import React, { useState } from 'react';
import {
  Appointment,
  ActiveMedicine,
  VaultItem,
  UserProfile,
  ClinicalNote,
  PatientSummaryForDoctor,
  DoctorPatientMessage,
  HealthMetricLog
} from '../../types';

import { DoctorDashboardView } from './DoctorDashboardView';
import { DoctorPatientsView } from './DoctorPatientsView';
import { DoctorAppointmentsView } from './DoctorAppointmentsView';
import { DoctorRecordsView } from './DoctorRecordsView';
import { DoctorClinicalNotesView } from './DoctorClinicalNotesView';
import { DoctorPrescriptionsView } from './DoctorPrescriptionsView';
import { DoctorReportsView } from './DoctorReportsView';
import { DoctorClinicalAIView } from './DoctorClinicalAIView';
import { DoctorMessagesView } from './DoctorMessagesView';
import { DoctorProfileView } from './DoctorProfileView';

import {
  initialClinicalNotes,
  initialDoctorPatients,
  initialDoctorMessages
} from '../../data/initialData';

interface DoctorWorkspacePortalProps {
  doctorProfile?: UserProfile;
  appointments: Appointment[];
  activeMedicines: ActiveMedicine[];
  vaultItems: VaultItem[];
  metricLogs: HealthMetricLog[];
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onAddActiveMedicine: (med: ActiveMedicine) => void;
  onAddVaultItem: (item: VaultItem) => void;
  onUpdateDoctorProfile?: (updated: Partial<UserProfile>) => void;
}

export const DoctorWorkspacePortal: React.FC<DoctorWorkspacePortalProps> = ({
  doctorProfile = {
    id: 'doc_01',
    name: 'Rajeshwar K. Tripathi',
    email: 'dr.sen@jeevancare.in',
    role: 'doctor',
    specialty: 'Pulmonology & Internal Medicine',
    qualification: 'M.D. (Pulmonology), M.B.B.S. (KGMU Lucknow)',
    registrationNumber: 'KGMU-48219',
    hospitalAffiliation: 'KGMU Super-Specialty Hospital, Lucknow',
    experienceYears: 14,
    verificationStatus: 'verified',
  },
  appointments = [],
  activeMedicines = [],
  vaultItems = [],
  metricLogs = [],
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  onAddActiveMedicine,
  onAddVaultItem,
  onUpdateDoctorProfile = () => {},
}) => {
  const [internalTab, setInternalTab] = useState<string>('doctor-dashboard');
  const [patients, setPatients] = useState<PatientSummaryForDoctor[]>(initialDoctorPatients);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>(initialClinicalNotes);
  const [messages, setMessages] = useState<DoctorPatientMessage[]>(initialDoctorMessages);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('usr_001');

  const currentTab = propActiveTab || internalTab;

  const handleTabChange = (tab: string) => {
    if (propSetActiveTab) {
      propSetActiveTab(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const handleAddClinicalNote = (note: ClinicalNote) => {
    setClinicalNotes((prev) => [note, ...prev]);
  };

  const handleSendMessage = (msg: DoctorPatientMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  return (
    <div className="space-y-6">
      
      {/* Render current view corresponding to Doctor active tab */}
      {currentTab === 'doctor-dashboard' && (
        <DoctorDashboardView
          doctorProfile={doctorProfile}
          appointments={appointments}
          patients={patients}
          setActiveTab={handleTabChange}
          onSelectPatient={(id) => setSelectedPatientId(id)}
        />
      )}

      {currentTab === 'doctor-patients' && (
        <DoctorPatientsView
          patients={patients}
          clinicalNotes={clinicalNotes}
          activeMedicines={activeMedicines}
          vaultItems={vaultItems}
          metricLogs={metricLogs}
          appointments={appointments}
          selectedPatientId={selectedPatientId}
          onAddClinicalNote={handleAddClinicalNote}
          onAddActiveMedicine={onAddActiveMedicine}
          onAddVaultItem={onAddVaultItem}
          setActiveTab={handleTabChange}
        />
      )}

      {currentTab === 'doctor-appointments' && (
        <DoctorAppointmentsView
          appointments={appointments}
          setActiveTab={handleTabChange}
          onSelectPatient={(id) => setSelectedPatientId(id)}
        />
      )}

      {currentTab === 'doctor-records' && (
        <DoctorRecordsView
          patients={patients}
          vaultItems={vaultItems}
          clinicalNotes={clinicalNotes}
          activeMedicines={activeMedicines}
          setActiveTab={handleTabChange}
        />
      )}

      {currentTab === 'doctor-notes' && (
        <DoctorClinicalNotesView
          clinicalNotes={clinicalNotes}
          patients={patients}
          onAddClinicalNote={handleAddClinicalNote}
          onAddVaultItem={onAddVaultItem}
        />
      )}

      {currentTab === 'doctor-prescriptions' && (
        <DoctorPrescriptionsView
          patients={patients}
          onAddActiveMedicine={onAddActiveMedicine}
          onAddVaultItem={onAddVaultItem}
        />
      )}

      {currentTab === 'doctor-reports' && (
        <DoctorReportsView
          vaultItems={vaultItems}
          patients={patients}
          setActiveTab={handleTabChange}
          onAddVaultItem={onAddVaultItem}
        />
      )}

      {currentTab === 'doctor-messages' && (
        <DoctorMessagesView
          patients={patients}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      )}

      {currentTab === 'doctor-ai' && (
        <DoctorClinicalAIView
          patients={patients}
          vaultItems={vaultItems}
          clinicalNotes={clinicalNotes}
        />
      )}

      {currentTab === 'doctor-profile' && (
        <DoctorProfileView
          doctorProfile={doctorProfile}
          onUpdateProfile={onUpdateDoctorProfile}
        />
      )}

    </div>
  );
};
