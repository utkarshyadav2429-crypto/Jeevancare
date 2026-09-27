import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  Printer,
  Sparkles,
  Shield,
  HeartPulse,
  Activity,
  Stethoscope,
  Scan,
  Database,
  Lock,
  Compass,
  AlertTriangle,
  Users,
  CheckCircle2,
  Layers,
  Cpu,
  Globe,
  Radio,
  Share2,
  BookOpen,
  ArrowRight,
  Zap,
  Clock,
  MapPin,
  HeartHandshake
} from 'lucide-react';

interface PresentationDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresentationDeckModal: React.FC<PresentationDeckModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [workflowTab, setWorkflowTab] = useState<'diagram' | 'pillars'>('diagram');
  const [inspectedNode, setInspectedNode] = useState<string | null>('gemini');

  const totalSlides = 10;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 1));
      } else if (e.key === 'Escape' && !isFullscreen) {
        onClose();
      }
    },
    [isOpen, isFullscreen, onClose, totalSlides]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-6xl h-[90vh] sm:h-[88vh] bg-[#fbf9f4] dark:bg-[#122219] text-[#192b21] dark:text-[#f2f0e8] rounded-2xl shadow-2xl flex flex-col border border-[#e2dcd2] dark:border-[#263e30] overflow-hidden print:h-auto print:border-none print:shadow-none">
        
        {/* Top Header Controls (Hidden during print) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2dcd2] dark:border-[#22392b] bg-white/90 dark:bg-[#15271d]/90 backdrop-blur-sm shrink-0 print:hidden">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
              JC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-tight text-[#142b20] dark:text-emerald-300">
                  Jevan Care Presentation Deck
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  Slide {currentSlide} of {totalSlides}
                </span>
              </div>
              <p className="text-[11px] text-[#6d6656] dark:text-[#9e9788] hidden md:block">
                AI-Powered Healthcare Ecosystem • Hackathon & Project Demo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showSpeakerNotes
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-[#f4efe4] dark:bg-[#1a2e22] text-[#4d4738] dark:text-[#c4bdad] border-[#ded7c8] dark:border-[#2a4433] hover:bg-[#eae3d5]'
              }`}
              title="Toggle Speaker Notes"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Speaker Notes</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold bg-[#f4efe4] dark:bg-[#1a2e22] text-[#4d4738] dark:text-[#c4bdad] border border-[#ded7c8] dark:border-[#2a4433] hover:bg-[#eae3d5] flex items-center gap-1.5 cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold bg-[#f4efe4] dark:bg-[#1a2e22] text-[#4d4738] dark:text-[#c4bdad] border border-[#ded7c8] dark:border-[#2a4433] hover:bg-[#eae3d5] flex items-center gap-1.5 cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6d6656] dark:text-[#a8a192] hover:bg-[#eae3d5] dark:hover:bg-[#233c2e] transition-colors cursor-pointer"
              title="Close Presentation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Canvas Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-center">
          
          {/* SLIDE 1: Title & Project Overview */}
          {currentSlide === 1 && (
            <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Generation Healthcare Intelligence Platform</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#11241a] dark:text-[#f4f2ea] tracking-tight leading-tight">
                  Jevan Care
                </h1>
                <p className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  AI-Powered Healthcare & Wellness Ecosystem
                </p>
                <p className="text-sm sm:text-base text-[#524d3e] dark:text-[#b8b1a3] max-w-3xl leading-relaxed">
                  Bridging the critical gap between patients, verified medical care, diagnostic clarity, and public health schemes through multimodal artificial intelligence, real-time hospital companions, and clinical telemetry.
                </p>
              </div>

              {/* Highlight Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-2xs">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3">
                    <Scan className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea]">Prescription OCR</h4>
                  <p className="text-xs text-[#635d4d] dark:text-[#a8a192] mt-1">
                    Multimodal handwriting recognition, dosage schedule extraction, and generic cost savings.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-2xs">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-3">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea]">MedBuddy Companions</h4>
                  <p className="text-xs text-[#635d4d] dark:text-[#a8a192] mt-1">
                    Doorstep verified assistance for senior citizens & OPD queue management.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-2xs">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-3">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea]">7-Day D3 & Gemini Vitals</h4>
                  <p className="text-xs text-[#635d4d] dark:text-[#a8a192] mt-1">
                    D3.js radial gauges and Gemini AI predictive trend forecasting for early prevention.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-2xs">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center mb-3">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea]">Emergency SOS & Blood</h4>
                  <p className="text-xs text-[#635d4d] dark:text-[#a8a192] mt-1">
                    Instant GPS telemetry dispatch and live e-RaktKosh national blood bank integration.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-[#756f5e] dark:text-[#968f80] border-t border-[#e2dcd2] dark:border-[#22392b]">
                <span>Presented for: <strong>Hackathon / Project Demonstration</strong></span>
                <span>Platform: <strong>Web SPA (PWA-Ready) • React 18 & Gemini AI</strong></span>
              </div>
            </div>
          )}

          {/* SLIDE 2: Problem Statement */}
          {currentSlide === 2 && (
            <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>The Challenge in Contemporary Healthcare</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-[#11241a] dark:text-[#f4f2ea] tracking-tight">
                Critical Breakdowns in the Patient Healthcare Journey
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#172b20] border-l-4 border-amber-500 shadow-xs">
                  <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">01. Medication Errors</span>
                  <h3 className="text-base font-extrabold text-[#11241a] dark:text-[#f4f2ea] mt-1">Illegible Handwritten Prescriptions</h3>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] mt-2 leading-relaxed">
                    Over 50% of prescription errors stem from handwritten ambiguity, missing dosage intervals, and lack of generic substitute awareness that inflates patient expenses by 40–70%.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#172b20] border-l-4 border-rose-500 shadow-xs">
                  <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">02. Hospital Anxiety</span>
                  <h3 className="text-base font-extrabold text-[#11241a] dark:text-[#f4f2ea] mt-1">Vulnerable Patients & Senior Citizens</h3>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] mt-2 leading-relaxed">
                    Elderly and solo patients experience acute distress navigating complex tertiary hospitals, OPD registrations, billing counters, and diagnostic lab coordination without trained companions.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#172b20] border-l-4 border-blue-500 shadow-xs">
                  <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">03. Fragmented Records</span>
                  <h3 className="text-base font-extrabold text-[#11241a] dark:text-[#f4f2ea] mt-1">Siloed Data & Emergency Blind Spots</h3>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] mt-2 leading-relaxed">
                    Critical health parameters (blood group, allergies, chronic conditions) are scattered on physical paper receipts, rendering emergency responders blind during life-threatening golden-hour events.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#172b20] border-l-4 border-purple-500 shadow-xs">
                  <span className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider">04. Information Asymmetry</span>
                  <h3 className="text-base font-extrabold text-[#11241a] dark:text-[#f4f2ea] mt-1">Medical Misinformation & Myths</h3>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] mt-2 leading-relaxed">
                    Viral medical rumours and unverified home remedies spread rapidly across social platforms, delaying scientific clinical care and causing preventable complications.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#172b20] border-l-4 border-emerald-500 shadow-xs">
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">05. Scheme Under-Utilization</span>
                  <h3 className="text-base font-extrabold text-[#11241a] dark:text-[#f4f2ea] mt-1">Government Benefits Disconnect</h3>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] mt-2 leading-relaxed">
                    Millions of eligible families fail to claim Ayushman Bharat (AB-PMJAY) and state healthcare subsidies simply due to lack of transparent eligibility matching and hospital discovery.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#172b20] border-l-4 border-teal-500 shadow-xs">
                  <span className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-wider">06. Reactive Health Tracking</span>
                  <h3 className="text-base font-extrabold text-[#11241a] dark:text-[#f4f2ea] mt-1">Absence of Predictive Analytics</h3>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] mt-2 leading-relaxed">
                    Traditional vitals trackers only store static numbers without interpreting week-over-week trends or forecasting physiological trajectories before acute episodes occur.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: Proposed Solution */}
          {currentSlide === 3 && (
            <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>The Unified Jevan Care Answer</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-[#11241a] dark:text-[#f4f2ea] tracking-tight">
                An Intelligent, Integrated Healthcare Operating System
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="p-6 rounded-2xl bg-white dark:bg-[#172b20] border border-emerald-200 dark:border-emerald-800/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-lg mb-4">
                      01
                    </div>
                    <h3 className="text-lg font-black text-[#11241a] dark:text-[#f4f2ea]">Cognitive Clinical Intelligence</h3>
                    <p className="text-xs text-[#595345] dark:text-[#aba495] mt-2 leading-relaxed">
                      Powered by Google Gemini 3.8 Multimodal AI to instantly parse handwritten prescriptions, detect dangerous drug interactions, cross-examine medical rumours against PubMed evidence, and project 7-day vital trends.
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#eee8dc] dark:border-[#233a2d] text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    AI OCR • Fact Checking • Predictive Analytics
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-[#172b20] border border-emerald-200 dark:border-emerald-800/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-lg mb-4">
                      02
                    </div>
                    <h3 className="text-lg font-black text-[#11241a] dark:text-[#f4f2ea]">Human-Centric Physical Care</h3>
                    <p className="text-xs text-[#595345] dark:text-[#aba495] mt-2 leading-relaxed">
                      MedBuddy hospital companion network delivers physical, doorstep support for OPD navigation, paperwork, and medication pickup. Geolocation services match nearby AB-PMJAY empaneled hospitals and live blood donor banks.
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#eee8dc] dark:border-[#233a2d] text-xs font-bold text-teal-700 dark:text-teal-400">
                    MedBuddy Network • GPS Mapping • AB-PMJAY
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-[#172b20] border border-emerald-200 dark:border-emerald-800/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-lg mb-4">
                      03
                    </div>
                    <h3 className="text-lg font-black text-[#11241a] dark:text-[#f4f2ea]">Patient Sovereign Data & SOS</h3>
                    <p className="text-xs text-[#595345] dark:text-[#aba495] mt-2 leading-relaxed">
                      Encrypted Medical Vault with time-bound doctor access tokens, offline-first PWA caching, multi-role interfaces (Patient, Doctor, MedBuddy, Admin), and single-click emergency SOS telemetry dispatch.
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#eee8dc] dark:border-[#233a2d] text-xs font-bold text-blue-700 dark:text-blue-400">
                    Encrypted Vault • Emergency SOS • RBAC
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 4: How It Works / Workflow */}
          {currentSlide === 4 && (
            <div className="space-y-5 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  <Compass className="w-3.5 h-3.5" />
                  <span>End-to-End System Architecture</span>
                </div>

                {/* Workflow View Toggle */}
                <div className="inline-flex items-center rounded-lg border border-[#ded7c8] dark:border-[#284031] bg-white dark:bg-[#172b20] p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setWorkflowTab('diagram')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      workflowTab === 'diagram'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-[#595345] dark:text-[#aba495] hover:text-[#11241a] dark:hover:text-white'
                    }`}
                  >
                    Workflow Diagram
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkflowTab('pillars')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      workflowTab === 'pillars'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-[#595345] dark:text-[#aba495] hover:text-[#11241a] dark:hover:text-white'
                    }`}
                  >
                    4-Stage Pillars
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#11241a] dark:text-[#f4f2ea] tracking-tight">
                  Application Workflow: End-to-End Clinical & AI Data Journey
                </h2>
                <p className="text-xs text-[#595345] dark:text-[#aba495] mt-1">
                  Interactive architectural workflow mapping patient ingestion, edge processing, zero-leakage proxy, Gemini AI reasoning, and cloud persistence.
                </p>
              </div>

              {workflowTab === 'diagram' ? (
                <div className="space-y-4">
                  {/* Interactive Node Map */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#14261c] border border-[#ded7c8] dark:border-[#284031] shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
                      {/* Node 1: Ingestion */}
                      <button
                        type="button"
                        onClick={() => setInspectedNode('ingestion')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                          inspectedNode === 'ingestion'
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                            : 'border-[#ded7c8] dark:border-[#2a3f32] bg-[#fbf9f4] dark:bg-[#1a2f23] hover:border-emerald-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                          <Scan className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h4 className="font-extrabold text-xs text-[#11241a] dark:text-[#f4f2ea]">Data Ingestion</h4>
                        <p className="text-[11px] text-[#595345] dark:text-[#aba495] mt-0.5">Camera OCR, Vitals, GPS, Mic Voice</p>
                        <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">PWA & Sensors</div>
                      </button>

                      {/* Node 2: Client Preprocess */}
                      <button
                        type="button"
                        onClick={() => setInspectedNode('client_prep')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                          inspectedNode === 'client_prep'
                            ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 ring-2 ring-teal-500/20'
                            : 'border-[#ded7c8] dark:border-[#2a3f32] bg-[#fbf9f4] dark:bg-[#1a2f23] hover:border-teal-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center">2</span>
                          <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <h4 className="font-extrabold text-xs text-[#11241a] dark:text-[#f4f2ea]">Client Preparation</h4>
                        <p className="text-[11px] text-[#595345] dark:text-[#aba495] mt-0.5">Canvas contrast, DPI, anonymization</p>
                        <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">Edge Canvas Worker</div>
                      </button>

                      {/* Node 3: Server Gateway */}
                      <button
                        type="button"
                        onClick={() => setInspectedNode('server')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                          inspectedNode === 'server'
                            ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                            : 'border-[#ded7c8] dark:border-[#2a3f32] bg-[#fbf9f4] dark:bg-[#1a2f23] hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">3</span>
                          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-extrabold text-xs text-[#11241a] dark:text-[#f4f2ea]">Express Proxy API</h4>
                        <p className="text-[11px] text-[#595345] dark:text-[#aba495] mt-0.5">Rate limiter, zero key leak, audit log</p>
                        <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">server.ts /api/*</div>
                      </button>

                      {/* Node 4: Gemini AI */}
                      <button
                        type="button"
                        onClick={() => setInspectedNode('gemini')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                          inspectedNode === 'gemini'
                            ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-500/20'
                            : 'border-[#ded7c8] dark:border-[#2a3f32] bg-[#fbf9f4] dark:bg-[#1a2f23] hover:border-purple-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">4</span>
                          <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="font-extrabold text-xs text-[#11241a] dark:text-[#f4f2ea]">Gemini Multimodal</h4>
                        <p className="text-[11px] text-[#595345] dark:text-[#aba495] mt-0.5">Vision OCR, Drug salts, Jan Aushadhi</p>
                        <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">gemini-2.5-flash</div>
                      </button>

                      {/* Node 5: Cloud Persistence */}
                      <button
                        type="button"
                        onClick={() => setInspectedNode('cloud')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                          inspectedNode === 'cloud'
                            ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                            : 'border-[#ded7c8] dark:border-[#2a3f32] bg-[#fbf9f4] dark:bg-[#1a2f23] hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center">5</span>
                          <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h4 className="font-extrabold text-xs text-[#11241a] dark:text-[#f4f2ea]">Cloud & Clinic Loop</h4>
                        <p className="text-[11px] text-[#595345] dark:text-[#aba495] mt-0.5">Supabase DB, Vault Storage, Doctor notes</p>
                        <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">RLS & Signed URLs</div>
                      </button>
                    </div>

                    {/* Node Inspection Card */}
                    <div className="mt-4 p-4 rounded-xl bg-[#f8f5ee] dark:bg-[#1a2e22] border border-[#e2dacf] dark:border-[#2c4233] text-xs transition-all">
                      {inspectedNode === 'ingestion' && (
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#11241a] dark:text-white flex items-center gap-1.5">
                              <Scan className="w-4 h-4 text-emerald-600" /> Tier 1: Patient Data Capture & Edge Ingestion
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">Client / Browser APIs</span>
                          </div>
                          <p className="text-[#595345] dark:text-[#aba495]">
                            Captures prescription photos via Camera/Drag-and-drop, collects vitals (BP, glucose, SpO2, sleep), accesses W3C Geolocation for emergency facility lookup, and captures microphone audio for voice guidance.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Input Format:</span>
                              JPEG / PNG image files, Audio streams, Form vitals
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Offline Capability:</span>
                              PWA Service Worker + Scoped user local caching
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Source Handlers:</span>
                              <code>PrescriptionScanner.tsx</code>, <code>LocationContext.tsx</code>
                            </div>
                          </div>
                        </div>
                      )}

                      {inspectedNode === 'client_prep' && (
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#11241a] dark:text-white flex items-center gap-1.5">
                              <Layers className="w-4 h-4 text-teal-600" /> Tier 2: Edge Canvas Preprocessing & Normalization
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">Client Processing</span>
                          </div>
                          <p className="text-[#595345] dark:text-[#aba495]">
                            Performs client-side image contrast adjustment, grayscale thresholding, orientation normalization, and payload compression to guarantee high OCR accuracy and reduce network bandwidth consumption.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Canvas Filter:</span>
                              Grayscale threshold + Adaptive contrast curve
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Privacy Masking:</span>
                              Strips EXIF metadata & GPS tags prior to transmission
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Source Handlers:</span>
                              <code>utils/ocrPreprocessor.ts</code>, <code>MedicalVault.tsx</code>
                            </div>
                          </div>
                        </div>
                      )}

                      {inspectedNode === 'server' && (
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#11241a] dark:text-white flex items-center gap-1.5">
                              <Shield className="w-4 h-4 text-blue-600" /> Tier 3: Express Backend Gateway & Security Proxy
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">server.ts (Port 3000)</span>
                          </div>
                          <p className="text-[#595345] dark:text-[#aba495]">
                            Handles client requests with strict zero-client-key leakage guarantees. Gemini API keys remain exclusively server-side. Enforces payload validation, rate-limiting, CORS boundaries, and server-side request auditing.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">API Route:</span>
                              <code>POST /api/gemini/proxy</code>
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Security Guarantee:</span>
                              Zero API keys in client bundles, server-side env vars
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Runtime:</span>
                              Node.js Express + TSX Dev / esbuild Prod
                            </div>
                          </div>
                        </div>
                      )}

                      {inspectedNode === 'gemini' && (
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#11241a] dark:text-white flex items-center gap-1.5">
                              <Cpu className="w-4 h-4 text-purple-600" /> Tier 4: Google Gemini AI Multimodal Clinical Engine
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">@google/genai SDK</span>
                          </div>
                          <p className="text-[#595345] dark:text-[#aba495]">
                            Performs vision OCR reasoning on handwritten prescriptions, extracts structured entities (Drug, Dose, Frequency, Duration), checks contraindications against active medications, maps low-cost Jan Aushadhi generic equivalents, and debunks viral health myths.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Models Used:</span>
                              <code>gemini-2.5-flash</code> / <code>gemini-2.0-flash</code>
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Clinical Grounding:</span>
                              RAG patient profile context + Structured JSON schemas
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Safety Guardrails:</span>
                              Automated medical disclaimer + Non-diagnostic classification
                            </div>
                          </div>
                        </div>
                      )}

                      {inspectedNode === 'cloud' && (
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#11241a] dark:text-white flex items-center gap-1.5">
                              <Database className="w-4 h-4 text-amber-600" /> Tier 5: Cloud Persistence, Medical Vault & Doctor Loop
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">Supabase & PostgreSQL</span>
                          </div>
                          <p className="text-[#595345] dark:text-[#aba495]">
                            Persists verified medications, metric logs, and consultation encounters. Stores medical reports in Supabase Storage with time-bound expiring signed URLs. Syncs clinical notes seamlessly between attending doctors and patient records.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Relational Schemas:</span>
                              <code>active_medicines</code>, <code>metric_logs</code>, <code>clinical_notes</code>
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Document Vault:</span>
                              Supabase Storage with 60-min signed preview URLs
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-[#132319] border border-[#e6dfd3] dark:border-[#24392b]">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Clinical Loop:</span>
                              Doctor Workspace reviews trends & updates prescription plan
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* 4-Stage Pillars View */
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                  <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                      <Scan className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea]">Data Capture & Ingestion</h4>
                    <ul className="text-xs text-[#595345] dark:text-[#aba495] mt-2 space-y-1.5 list-disc list-inside">
                      <li>Camera OCR capture</li>
                      <li>Manual vitals logging</li>
                      <li>GPS coordinates detection</li>
                      <li>Audio voice commands</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                      <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea]">Gemini AI Reasoning</h4>
                    <ul className="text-xs text-[#595345] dark:text-[#aba495] mt-2 space-y-1.5 list-disc list-inside">
                      <li>Multimodal OCR parsing</li>
                      <li>Drug interaction verification</li>
                      <li>Jan Aushadhi generic mapping</li>
                      <li>Scientific rumor debunking</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                      <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea]">Analytics & Visualization</h4>
                    <ul className="text-xs text-[#595345] dark:text-[#aba495] mt-2 space-y-1.5 list-disc list-inside">
                      <li>D3.js radial vital rings</li>
                      <li>Recharts 7-day trends</li>
                      <li>Predictive vital forecasting</li>
                      <li>Solar circadian scheduling</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                      <Share2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea]">Action & Community</h4>
                    <ul className="text-xs text-[#595345] dark:text-[#aba495] mt-2 space-y-1.5 list-disc list-inside">
                      <li>MedBuddy companion dispatch</li>
                      <li>Encrypted vault sharing</li>
                      <li>One-click SOS alerts</li>
                      <li>e-RaktKosh blood matches</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Security & Offline Callout */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-900 dark:text-emerald-200">
                    <strong>Secure Enterprise Architecture:</strong> All sensitive operations enforce client-side tokenization, server-side Gemini proxy isolation (no client key leaks), offline service worker caching, and comprehensive audit logs.
                  </p>
                </div>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-full whitespace-nowrap">
                  Production Verified
                </span>
              </div>
            </div>
          )}

          {/* SLIDE 5: Key Features */}
          {currentSlide === 5 && (
            <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                <Layers className="w-3.5 h-3.5" />
                <span>Engineered Capabilities</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-[#11241a] dark:text-[#f4f2ea] tracking-tight">
                Core Feature Suite: Comprehensive Clinical Care
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1 text-xs">
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031]">
                  <div className="font-black text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                    <Scan className="w-4 h-4" /> AI Prescription Scanner
                  </div>
                  <p className="text-[#5c5647] dark:text-[#a8a192]">
                    High-accuracy multimodal OCR extracts doctor handwriting, schedules reminders, checks contraindications, and links to Jan Aushadhi generic equivalents.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031]">
                  <div className="font-black text-teal-700 dark:text-teal-400 mb-1 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4" /> MedBuddy Companion
                  </div>
                  <p className="text-[#5c5647] dark:text-[#a8a192]">
                    On-demand hospital companion booking system with verified helpers, transparent tiered pricing, live tracking, and elderly assistance.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031]">
                  <div className="font-black text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> 7-Day Vitals & AI Trends
                  </div>
                  <p className="text-[#5c5647] dark:text-[#a8a192]">
                    Interactive D3.js concentric gauges, Recharts clinical curves, and Gemini AI 3-to-7 day vital forecasting with concise wellness suggestions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031]">
                  <div className="font-black text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" /> Medical Fact-Check Center
                  </div>
                  <p className="text-[#5c5647] dark:text-[#a8a192]">
                    Instant rumor verification classifying claims as Verified, Caution, or False with scientific citations to stop dangerous viral health myths.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031]">
                  <div className="font-black text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Emergency SOS & Blood
                  </div>
                  <p className="text-[#5c5647] dark:text-[#a8a192]">
                    Golden-hour GPS coordinates SMS dispatch, e-RaktKosh live blood inventory search, and local emergency hotline directory.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031]">
                  <div className="font-black text-purple-700 dark:text-purple-400 mb-1 flex items-center gap-1.5">
                    <Database className="w-4 h-4" /> Encrypted Medical Vault
                  </div>
                  <p className="text-[#5c5647] dark:text-[#a8a192]">
                    Secure document store for lab reports and discharge summaries with time-bound sharing tokens and Doctor Workspace access.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 6: Technology Stack & Architecture */}
          {currentSlide === 6 && (
            <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                <Cpu className="w-3.5 h-3.5" />
                <span>Technical Specifications</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-[#11241a] dark:text-[#f4f2ea] tracking-tight">
                Full-Stack Architecture & Modern Tech Stack
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031]">
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">Frontend UI</span>
                  <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea] mt-1">React 18 & TypeScript</h4>
                  <ul className="text-xs text-[#595345] dark:text-[#aba495] mt-2 space-y-1">
                    <li>• Vite compilation build</li>
                    <li>• Tailwind CSS modern styling</li>
                    <li>• Lucide vector iconography</li>
                    <li>• Accessible Headless UI components</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031]">
                  <span className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-400 tracking-wider">Data Visualization</span>
                  <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea] mt-1">D3.js & Recharts</h4>
                  <ul className="text-xs text-[#595345] dark:text-[#aba495] mt-2 space-y-1">
                    <li>• D3 concentric radial vitals gauge</li>
                    <li>• D3 inline micro-sparklines</li>
                    <li>• Recharts interactive 7-day curves</li>
                    <li>• Clinical threshold reference bands</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031]">
                  <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider">Intelligence Core</span>
                  <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea] mt-1">Google GenAI SDK</h4>
                  <ul className="text-xs text-[#595345] dark:text-[#aba495] mt-2 space-y-1">
                    <li>• Gemini 3.8 Flash multimodal</li>
                    <li>• Node.js & Express server proxy</li>
                    <li>• Structured schema output validation</li>
                    <li>• Zero client-side API key exposure</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031]">
                  <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">PWA & Location</span>
                  <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea] mt-1">Offline & Solar API</h4>
                  <ul className="text-xs text-[#595345] dark:text-[#aba495] mt-2 space-y-1">
                    <li>• Service Worker offline caching</li>
                    <li>• Web Geolocation & Leaflet GIS</li>
                    <li>• NOAA solar zenith day/night sync</li>
                    <li>• Supabase Auth & Storage ready</li>
                  </ul>
                </div>
              </div>

              {/* Architectural diagram badge */}
              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-[#15271d]/60 border border-[#e2dcd2] dark:border-[#263e30] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#142b20] dark:text-[#f2f0e8]">
                  Architectural Pattern:
                </span>
                <span className="text-[#595345] dark:text-[#aba495]">
                  Micro-service oriented client-server proxy • RBAC (Patient, Doctor, Companion, Admin) • Zero-trust data isolation
                </span>
              </div>
            </div>
          )}

          {/* SLIDE 7: Website/App Screenshots & Product Showcase */}
          {currentSlide === 7 && (
            <div className="space-y-5 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <Globe className="w-3.5 h-3.5" />
                <span>Live Interface Walkthrough</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-[#11241a] dark:text-[#f4f2ea] tracking-tight">
                Product Showcase: Production-Grade UI/UX
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Simulated Mockup 1 */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-xs">
                  <div className="h-36 rounded-xl bg-gradient-to-br from-emerald-800 to-teal-950 text-white p-3 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">Dashboard</span>
                      <Activity className="w-3.5 h-3.5 text-emerald-300" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold">7-Day Vitals & D3 Ring</div>
                      <div className="text-[10px] text-emerald-200">Gemini Predictive Forecast: ~116/74 mmHg</div>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-4/5"></div>
                    </div>
                  </div>
                  <h4 className="font-extrabold text-xs text-[#11241a] dark:text-[#f4f2ea] mt-2.5">Health Summary Widget</h4>
                  <p className="text-[11px] text-[#635d4d] dark:text-[#a8a192] mt-1">
                    Concentric radial arcs and interactive Recharts tracking Blood Pressure, Glucose, and Sleep trends.
                  </p>
                </div>

                {/* Simulated Mockup 2 */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-xs">
                  <div className="h-36 rounded-xl bg-gradient-to-br from-amber-700 to-amber-950 text-white p-3 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">MedBuddy</span>
                      <HeartHandshake className="w-3.5 h-3.5 text-amber-300" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold">Doorstep Hospital Companion</div>
                      <div className="text-[10px] text-amber-200">Verified Companions & Live OPD Tracking</div>
                    </div>
                    <div className="flex gap-1 text-[9px] font-bold">
                      <span className="bg-amber-500/40 px-1.5 py-0.5 rounded">OPD Assist</span>
                      <span className="bg-amber-500/40 px-1.5 py-0.5 rounded">Senior Care</span>
                    </div>
                  </div>
                  <h4 className="font-extrabold text-xs text-[#11241a] dark:text-[#f4f2ea] mt-2.5">MedBuddy Companion Hub</h4>
                  <p className="text-[11px] text-[#635d4d] dark:text-[#a8a192] mt-1">
                    Transparent service pricing, companion credentials, patient reviews, and hospital check-in coordination.
                  </p>
                </div>

                {/* Simulated Mockup 3 */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-xs">
                  <div className="h-36 rounded-xl bg-gradient-to-br from-blue-800 to-indigo-950 text-white p-3 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">Intelligence</span>
                      <Scan className="w-3.5 h-3.5 text-blue-300" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold">Multimodal OCR & Medicine</div>
                      <div className="text-[10px] text-blue-200">Generic Jan Aushadhi Savings (Save up to 70%)</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-emerald-300 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Safe Drug Combination
                    </div>
                  </div>
                  <h4 className="font-extrabold text-xs text-[#11241a] dark:text-[#f4f2ea] mt-2.5">Prescription Scanner & Vault</h4>
                  <p className="text-[11px] text-[#635d4d] dark:text-[#a8a192] mt-1">
                    Instant extraction of dosage tables, interaction risk indicators, and secure encrypted cloud storage.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/80 dark:bg-[#14261c]/80 border border-[#ded7c8] dark:border-[#284031] flex items-center justify-between text-xs">
                <span className="font-bold text-[#11241a] dark:text-[#f4f2ea]">
                  Design Philosophy:
                </span>
                <span className="text-[#635d4d] dark:text-[#aba495]">
                  Warm clinical palette (Forest Green & Sage) • Zero AI-slop • WCAG AAA high contrast • Mobile-first responsiveness
                </span>
              </div>
            </div>
          )}

          {/* SLIDE 8: Use Cases & Impact */}
          {currentSlide === 8 && (
            <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <Zap className="w-3.5 h-3.5" />
                <span>Real-World Application</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-[#11241a] dark:text-[#f4f2ea] tracking-tight">
                Transformative Impact Across Stakeholders
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-xs">
                  <div className="flex items-center gap-2 mb-2 font-black text-sm text-emerald-800 dark:text-emerald-300">
                    <Users className="w-4 h-4" /> Elderly & Solo Patients
                  </div>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] leading-relaxed">
                    <strong>Use Case:</strong> 68-year-old patient living alone requires quarterly cardiology checkups at a crowded medical college.
                  </p>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] mt-2 leading-relaxed">
                    <strong>Impact:</strong> A verified MedBuddy meets them at the hospital gate, manages wheelchair transit, handles OPD registration queues, and uploads diagnostic receipts directly to their encrypted Medical Vault.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-xs">
                  <div className="flex items-center gap-2 mb-2 font-black text-sm text-blue-800 dark:text-blue-300">
                    <AlertTriangle className="w-4 h-4" /> Emergency First Responders & Relatives
                  </div>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] leading-relaxed">
                    <strong>Use Case:</strong> Road accident or sudden cardiovascular distress during transit.
                  </p>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] mt-2 leading-relaxed">
                    <strong>Impact:</strong> Single-click Emergency SOS broadcasts live GPS coordinates and emergency contacts via SMS, while opening nearby trauma centers and e-RaktKosh compatible blood availability.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-xs">
                  <div className="flex items-center gap-2 mb-2 font-black text-sm text-teal-800 dark:text-teal-300">
                    <Stethoscope className="w-4 h-4" /> Clinicians & Consulting Physicians
                  </div>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] leading-relaxed">
                    <strong>Use Case:</strong> Reviewing patient history during a 10-minute teleconsultation or OPD visit.
                  </p>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] mt-2 leading-relaxed">
                    <strong>Impact:</strong> Instead of sifting through crinkled paper bags, the doctor views the 7-day longitudinal D3/Recharts trend card, noting cardiovascular trajectory and drug compatibility in seconds.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-xs">
                  <div className="flex items-center gap-2 mb-2 font-black text-sm text-amber-800 dark:text-amber-300">
                    <Shield className="w-4 h-4" /> Economically Disadvantaged Families
                  </div>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] leading-relaxed">
                    <strong>Use Case:</strong> Chronic illness medications putting severe strain on household income.
                  </p>
                  <p className="text-xs text-[#595345] dark:text-[#aba495] mt-2 leading-relaxed">
                    <strong>Impact:</strong> Automated generic substitution maps branded drugs to Jan Aushadhi equivalents saving 50–80%, while checking AB-PMJAY eligibility for tertiary surgery coverage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 9: Future Scope / Challenges / Security */}
          {currentSlide === 9 && (
            <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                <Lock className="w-3.5 h-3.5" />
                <span>Roadmap & Resilience</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-[#11241a] dark:text-[#f4f2ea] tracking-tight">
                Security Posture, Current Challenges & Future Scope
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold mb-3">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#11241a] dark:text-[#f4f2ea]">Data Security & HIPAA</h3>
                  <ul className="text-xs text-[#595345] dark:text-[#aba495] mt-2 space-y-2">
                    <li>• Zero API key exposure: all Gemini requests handled via server-side endpoints.</li>
                    <li>• Time-bound token authorization for third-party doctor access.</li>
                    <li>• AES-256 encrypted file storage in Supabase Medical Vault.</li>
                    <li>• Full immutable audit logging for medical records actions.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold mb-3">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#11241a] dark:text-[#f4f2ea]">Current Engineering Challenges</h3>
                  <ul className="text-xs text-[#595345] dark:text-[#aba495] mt-2 space-y-2">
                    <li>• Extreme doctor cursive handwriting variations requiring secondary heuristic fallbacks.</li>
                    <li>• Connectivity dropouts in rural primary healthcare centers (resolved via offline PWA cache).</li>
                    <li>• Real-time synchronization of national blood inventories across disparate municipal systems.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031] shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold mb-3">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#11241a] dark:text-[#f4f2ea]">Future Roadmap</h3>
                  <ul className="text-xs text-[#595345] dark:text-[#aba495] mt-2 space-y-2">
                    <li>• <strong>ABDM (Ayushman Bharat Digital Mission)</strong> official M1/M2/M3 national sandbox integration.</li>
                    <li>• Gemini Live Audio API for hands-free regional voice triage (Hindi, Tamil, Telugu, Bengali).</li>
                    <li>• Continuous Bluetooth Low Energy (BLE) vital monitor sync for glucometers and ECG straps.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 10: References */}
          {currentSlide === 10 && (
            <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Citations & Verified Frameworks</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-[#11241a] dark:text-[#f4f2ea] tracking-tight">
                References, Clinical Standards & Documentation
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031]">
                  <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea] flex items-center gap-1.5 mb-2">
                    <Globe className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    Government Schemes & Open APIs
                  </h4>
                  <ul className="text-xs text-[#595345] dark:text-[#aba495] space-y-2">
                    <li>
                      <strong>National Health Authority (NHA):</strong> Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY) guidelines and hospital empanelment criteria (pmjay.gov.in).
                    </li>
                    <li>
                      <strong>Ministry of Health & Family Welfare (MoHFW):</strong> e-RaktKosh National Blood Bank management portal and live inventory protocols.
                    </li>
                    <li>
                      <strong>Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP):</strong> Generic formulation database and price regulation schedules.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#172b20] border border-[#ded7c8] dark:border-[#284031]">
                  <h4 className="font-extrabold text-sm text-[#11241a] dark:text-[#f4f2ea] flex items-center gap-1.5 mb-2">
                    <Cpu className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    AI & Technical Architecture
                  </h4>
                  <ul className="text-xs text-[#595345] dark:text-[#aba495] space-y-2">
                    <li>
                      <strong>Google GenAI Gemini SDK:</strong> Gemini 3.8 Flash model documentation for multimodal OCR processing, schema constraints, and safety filters.
                    </li>
                    <li>
                      <strong>D3.js & Recharts:</strong> Data-driven document manipulation standards for concentric SVG radial gauges and responsive time-series charts.
                    </li>
                    <li>
                      <strong>NOAA Solar Position Calculations:</strong> Astronomical solar zenith formula ($90.833^\circ$) for automatic circadian day/night theme scheduling.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Conclusion Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold">Thank You! Questions & Live Demo</h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Experience Jevan Care live: Dashboard, MedBuddy Companion, Prescription OCR, and Gemini Vitals.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer shadow-sm"
                >
                  Explore Live Applet
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Expandable Speaker Notes Drawer */}
        {showSpeakerNotes && (
          <div className="px-5 py-3 border-t border-[#ded7c8] dark:border-[#284031] bg-amber-50/90 dark:bg-[#1a2b1f] text-[#3d3727] dark:text-[#ded8cb] shrink-0 text-xs flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-200 print:hidden">
            <div className="w-6 h-6 rounded-lg bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
              Tip
            </div>
            <div className="flex-1 space-y-1">
              <span className="font-bold text-[11px] uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Speaker Notes for Slide {currentSlide}:
              </span>
              <p className="text-[11px] leading-relaxed">
                {currentSlide === 1 && "Open with passion: Introduce Jevan Care as a modern bridge solving both physical hospital intimidation (via MedBuddy companions) and clinical confusion (via Gemini OCR and predictive telemetry)."}
                {currentSlide === 2 && "Emphasize real pain points: Point out that 50%+ of medication errors originate in paper illegibility, and senior citizens face acute anxiety navigating tertiary OPD queues alone."}
                {currentSlide === 3 && "Pivot cleanly to the solution: Explain the three-pillar architecture—Cognitive AI, Physical Human Companions, and Sovereign Encrypted Patient Data."}
                {currentSlide === 4 && "Walk through the four-step pipeline: Emphasize how data flows from OCR/Sensors -> Gemini 3.8 Reasoning -> D3/Recharts Visualization -> Community Action (SOS & MedBuddy)."}
                {currentSlide === 5 && "Highlight the unique feature mix: Mention that unlike generic trackers, Jevan Care has Jan Aushadhi generic price cutting, fact-checking against myths, and SOS blood matching."}
                {currentSlide === 6 && "Demonstrate technical rigor: Highlight React 18, Vite, D3.js custom radial arcs, server-side Gemini proxy isolation for HIPAA compliance, and NOAA solar calculations."}
                {currentSlide === 7 && "Showcase the UI/UX: Point out the clean emerald palette, high contrast, zero AI slop, and how the dashboard presents actionable telemetry rather than clutter."}
                {currentSlide === 8 && "Tell a human story: Walk through the senior citizen living alone or the emergency Golden Hour scenario to demonstrate direct societal impact."}
                {currentSlide === 9 && "Show maturity: Address real-world challenges like extreme cursive handwriting and explain our roadmap toward official ABDM national sandbox integration."}
                {currentSlide === 10 && "Conclude with confidence: Thank the judges, cite NHA, e-RaktKosh, and Gemini SDK documentation, and invite them to interact with the live demo!"}
              </p>
            </div>
          </div>
        )}

        {/* Bottom Slide Navigation Toolbar (Hidden during print) */}
        <div className="px-4 py-3 border-t border-[#e2dcd2] dark:border-[#22392b] bg-white/90 dark:bg-[#15271d]/90 backdrop-blur-sm flex items-center justify-between shrink-0 print:hidden">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 1))}
            disabled={currentSlide === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f4efe4] dark:bg-[#1c2e23] hover:bg-[#e9e2d4] dark:hover:bg-[#253d2f] text-[#192b21] dark:text-[#f2f0e8] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Slide Number Indicators / Mini Thumbnails */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {Array.from({ length: totalSlides }, (_, i) => i + 1).map((slideNum) => (
              <button
                key={slideNum}
                onClick={() => setCurrentSlide(slideNum)}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                  currentSlide === slideNum
                    ? 'bg-emerald-700 text-white shadow-xs scale-105'
                    : 'bg-[#ede7da] dark:bg-[#1f3528] text-[#6d6656] dark:text-[#aba495] hover:bg-[#e2dcce]'
                }`}
                title={`Jump to Slide ${slideNum}`}
              >
                {slideNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides))}
            disabled={currentSlide === totalSlides}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
