import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Paperclip,
  CheckCircle2,
  Clock,
  FileText,
  Search
} from 'lucide-react';
import { DoctorPatientMessage, PatientSummaryForDoctor } from '../../types';

interface DoctorMessagesViewProps {
  patients: PatientSummaryForDoctor[];
  messages: DoctorPatientMessage[];
  onSendMessage: (msg: DoctorPatientMessage) => void;
}

export const DoctorMessagesView: React.FC<DoctorMessagesViewProps> = ({
  patients = [],
  messages = [],
  onSendMessage,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || 'usr_001');
  const [inputText, setInputText] = useState('');

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const threadMessages = messages.filter((m) => m.patientId === selectedPatient?.id);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPatient) return;

    const newMsg: DoctorPatientMessage = {
      id: `msg_${Date.now()}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: 'doc_01',
      doctorName: 'Dr. Rajeshwar K. Tripathi',
      senderRole: 'doctor',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSendMessage(newMsg);
    setInputText('');
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Secure Doctor-Patient Consult Chat</h2>
            <p className="text-xs text-slate-300">
              End-to-end encrypted messaging for follow-up queries and report reviews.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        
        {/* Left Column: Patient List (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 px-1">
            Active Consultations
          </h3>

          <div className="space-y-2">
            {patients.map((pat) => {
              const isSelected = pat.id === selectedPatientId;
              return (
                <div
                  key={pat.id}
                  onClick={() => setSelectedPatientId(pat.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-1 ${
                    isSelected
                      ? 'bg-indigo-950 text-white border-indigo-600 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{pat.name}</span>
                    <span className="text-[10px] text-slate-400">{pat.lastVisitDate}</span>
                  </div>
                  <p className={isSelected ? 'text-indigo-200 text-[11px]' : 'text-slate-500 text-[11px]'}>
                    ABHA: {pat.abhaNumber || 'Not Linked'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chat Window (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                {selectedPatient?.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedPatient?.name}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {selectedPatient?.gender}, {selectedPatient?.age} yrs • Blood: {selectedPatient?.bloodGroup}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Encrypted Channel
            </span>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto min-h-[350px]">
            {threadMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No previous messages with {selectedPatient?.name}. Send a message to initiate consultation follow-up.
              </div>
            ) : (
              threadMessages.map((msg) => {
                const isDoc = msg.senderRole === 'doctor';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isDoc ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1.5 shadow-2xs ${
                        isDoc
                          ? 'bg-slate-900 text-white rounded-br-none border border-slate-800'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <p className="font-semibold">{msg.text}</p>
                      {msg.attachmentTitle && (
                        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{msg.attachmentTitle}</span>
                        </div>
                      )}
                      <span className="block text-[10px] text-slate-400 text-right">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Send message to ${selectedPatient?.name}...`}
              className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
