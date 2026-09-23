import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScanLine,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Pill,
  Calendar,
  Building,
  UserCheck,
  Plus,
  Loader2,
  FolderPlus,
  RefreshCw,
  Search,
  MapPin,
  IndianRupee,
  ShieldCheck,
  HelpCircle,
  Edit3,
  ExternalLink,
  Phone,
  Navigation,
  Clock,
  Info,
  Check,
  Tag,
  Camera,
  CameraOff,
  Scan,
  Crosshair,
  Zap,
  Maximize2
} from 'lucide-react';
import {
  ScannedPrescriptionResult,
  ActiveMedicine,
  VaultItem,
  ExtractedMedicineItem,
  MedicinePharmacyComparison,
  CompletePrescriptionStore,
  PharmacyListing
} from '../../types';
import { auditLogger } from '../../services/AuditLogger';
import { JevanCareLoader } from '../common/JevanCareLoader';
import { MedicinePharmacyMap } from './MedicinePharmacyMap';
import { MedicinePriceSearch } from './MedicinePriceSearch';
import { useUserLocation } from '../../context/LocationContext';
import { pharmacyDiscoveryService } from '../../services/pharmacyDiscoveryService';
import { isLocationStale } from '../../services/locationService';

interface PrescriptionScannerProps {
  onAddActiveMedicine: (med: ActiveMedicine) => void;
  onAddVaultItem: (item: VaultItem) => void;
  setActiveTab: (tab: string) => void;
}

export const PrescriptionScanner: React.FC<PrescriptionScannerProps> = ({
  onAddActiveMedicine,
  onAddVaultItem,
  setActiveTab,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [fileName, setFileName] = useState<string>('');
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScannedPrescriptionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // GPS & Pharmacy Search State from Central Single-Source-of-Truth LocationContext
  const {
    location,
    status: locationStatus,
    statusMessage: locationStatusMessage,
    refreshLocation,
    isLoading: isLocating,
    addressLabel,
    accuracyQuality,
  } = useUserLocation();

  const [isSearchingPharmacy, setIsSearchingPharmacy] = useState<boolean>(false);
  const [pharmacySearchData, setPharmacySearchData] = useState<{
    medicineResults: MedicinePharmacyComparison[];
    completePrescriptionStore: CompletePrescriptionStore | null;
  } | null>(null);
  const [searchFilter, setSearchFilter] = useState<'cheapest' | 'nearest' | 'available' | 'best_value'>('cheapest');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [activeTabMode, setActiveTabMode] = useState<'scanner' | 'price_comparison'>('scanner');
  
  // Live Camera Scanner State & Refs
  const [scannerInputMode, setScannerInputMode] = useState<'upload' | 'camera'>('upload');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Inline Medicine Editing State
  const [editingMedicineIdx, setEditingMedicineIdx] = useState<number | null>(null);
  const [editMedForm, setEditMedForm] = useState<ExtractedMedicineItem | null>(null);

  const isMountedRef = useRef(true);

  // Stop camera when unmounting
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  }, []);

  const startCamera = useCallback(async (facing: 'environment' | 'user' = cameraFacingMode) => {
    setCameraError(null);
    setCameraLoading(true);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or environment.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      setCameraFacingMode(facing);
      setIsCameraActive(true);
      setScannerInputMode('camera');

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play warning:', playErr);
        }
      }
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      if (isMountedRef.current) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera access was denied. Please allow camera permissions in your browser or switch to file upload.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('No camera found on your device. Please upload a prescription image.');
        } else {
          setCameraError(err.message || 'Unable to access camera. Please check permissions or upload a file.');
        }
        setIsCameraActive(false);
      }
    } finally {
      if (isMountedRef.current) {
        setCameraLoading(false);
      }
    }
  }, [cameraFacingMode]);

  const toggleCameraFacing = useCallback(() => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  }, [cameraFacingMode, startCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Create an offscreen canvas to capture the exact video frame
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    setSelectedImage(dataUrl);
    setFileName(`camera_scan_${Date.now()}.jpg`);
    setMimeType('image/jpeg');
    setScanResult(null);
    setPharmacySearchData(null);
    setIsSaved(false);
    setErrorMsg('');

    // Stop active camera stream after capturing
    stopCamera();
    setScannerInputMode('upload');
  }, [stopCamera]);

  const handleSearchPharmacyPrices = useCallback(async (
    medicinesList: ExtractedMedicineItem[],
    lat = location?.latitude,
    lng = location?.longitude,
    filter = searchFilter
  ) => {
    if (!medicinesList || medicinesList.length === 0) return;

    let targetLat = lat;
    let targetLng = lng;
    let targetTimestamp = location?.timestamp;

    // Check if location is missing or stale
    const currentlyStale = !targetTimestamp || isLocationStale(targetTimestamp);

    if (targetLat === undefined || targetLng === undefined || currentlyStale) {
      const fresh = await refreshLocation(true);
      if (fresh) {
        targetLat = fresh.latitude;
        targetLng = fresh.longitude;
        targetTimestamp = fresh.timestamp;
      } else {
        setErrorMsg('Active GPS coordinates from LocationContext are required for pharmacy comparison.');
        return;
      }
    }

    setIsSearchingPharmacy(true);
    try {
      const response = await pharmacyDiscoveryService.comparePrescriptionPharmacyPrices({
        medicines: medicinesList,
        latitude: targetLat,
        longitude: targetLng,
        locationTimestamp: targetTimestamp,
        sortBy: filter === 'nearest' ? 'nearest' : 'cheapest',
      });

      if (!isMountedRef.current) return;

      if (response.success) {
        setPharmacySearchData({
          medicineResults: response.medicineResults || [],
          completePrescriptionStore: response.completePrescriptionStore || null,
        });

        if (response.medicineResults?.[0]?.allPharmacies?.[0]) {
          setSelectedPharmacyId(response.medicineResults[0].allPharmacies[0].pharmacyId);
        }
      }
    } catch (err: any) {
      console.error('Pharmacy search error:', err);
      if (isMountedRef.current) {
        setErrorMsg(err?.message || 'Failed to compare nearby pharmacy prices.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSearchingPharmacy(false);
      }
    }
  }, [location?.latitude, location?.longitude, location?.timestamp, searchFilter, refreshLocation]);

  // Auto-fetch nearby pharmacy prices and Google Places stores when entering price comparison tab
  useEffect(() => {
    if (activeTabMode === 'price_comparison' && !pharmacySearchData && !isSearchingPharmacy && location) {
      const medsToSearch: ExtractedMedicineItem[] = scanResult?.medicines?.length
        ? scanResult.medicines
        : [
            {
              name: 'Paracetamol 650mg (Dolo / Jan Aushadhi)',
              brandName: 'Dolo 650 / Generic Paracetamol',
              activeIngredient: 'paracetamol',
              strength: '650mg',
              dosageForm: 'Tablet',
              quantity: '10 Tablets',
              frequency: 'As prescribed',
              duration: '5 days',
              status: 'Prescribed medicine',
              confidence: 'High',
              isUnclear: false,
            },
          ];
      handleSearchPharmacyPrices(medsToSearch, location.latitude, location.longitude, searchFilter);
    }
  }, [activeTabMode, pharmacySearchData, isSearchingPharmacy, scanResult, location, searchFilter, handleSearchPharmacyPrices]);

  const handleFileUpload = useCallback((file: File) => {
    if (!file) return;
    setFileName(file.name);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setScanResult(null);
      setPharmacySearchData(null);
      setIsSaved(false);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleScan = useCallback(async () => {
    if (!selectedImage && !textPrompt) {
      setErrorMsg('Please select a prescription image/report or enter text notes.');
      return;
    }

    setIsScanning(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/gemini/scan-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          textPrompt,
        }),
      });

      const json = await res.json();
      if (!isMountedRef.current) return;

      if (!json.success) {
        throw new Error(json.error || 'Failed to scan prescription.');
      }

      const formattedResult: ScannedPrescriptionResult = {
        id: `scan_${Date.now()}`,
        doctorName: json.data.doctorName || 'Dr. Rajeshwar K. Tripathi',
        hospitalName: json.data.hospitalName || "King George's Medical University (KGMU), Lucknow",
        date: json.data.date || new Date().toISOString().split('T')[0],
        medicines: json.data.medicines || [],
        potentialRisks: json.data.potentialRisks || [],
        rawNotes: json.data.rawNotes || '',
        scannedAt: new Date().toISOString(),
        imageUrl: selectedImage || undefined,
      };

      setScanResult(formattedResult);

      auditLogger.logAction(
        'PRESCRIPTION_SCAN',
        `Processed OCR analysis on prescription from ${formattedResult.doctorName}. Identified ${formattedResult.medicines.length} medicine(s).`,
        undefined,
        'SUCCESS'
      );

      // Trigger automatic pharmacy price & location search for verified medicines
      handleSearchPharmacyPrices(formattedResult.medicines, location?.latitude, location?.longitude, searchFilter);

    } catch (err: any) {
      console.error('Scan error:', err);
      if (isMountedRef.current) {
        setErrorMsg(err.message || 'Prescription scanning failed.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsScanning(false);
      }
    }
  }, [selectedImage, textPrompt, mimeType, location?.latitude, location?.longitude, searchFilter, handleSearchPharmacyPrices]);

  // Manual search from debounced bar
  const handleManualSearch = (query: string, filter: 'cheapest' | 'nearest' | 'available' | 'best_value') => {
    setSearchFilter(filter);
    if (!query && scanResult?.medicines) {
      handleSearchPharmacyPrices(scanResult.medicines, location?.latitude, location?.longitude, filter);
      return;
    }

    const tempMedList: ExtractedMedicineItem[] = [
      {
        name: query || 'Paracetamol 650mg',
        brandName: query,
        activeIngredient: query,
        strength: 'Standard',
        dosageForm: 'Tablet',
        quantity: '10 Units',
        frequency: 'As needed',
        duration: '5 days',
        status: 'Prescribed medicine',
        confidence: 'High',
        isUnclear: false,
      },
    ];

    handleSearchPharmacyPrices(tempMedList, location?.latitude, location?.longitude, filter);
  };

  const handleStartEditMedicine = (idx: number, med: ExtractedMedicineItem) => {
    setEditingMedicineIdx(idx);
    setEditMedForm({ ...med });
  };

  const handleSaveConfirmedMedicine = (idx: number) => {
    if (!scanResult || !editMedForm) return;

    const updatedMeds = [...scanResult.medicines];
    updatedMeds[idx] = {
      ...editMedForm,
      status: 'Prescribed medicine',
      confidence: 'High',
      isUnclear: false,
      unclearReason: '',
    };

    const updatedScan = { ...scanResult, medicines: updatedMeds };
    setScanResult(updatedScan);
    setEditingMedicineIdx(null);
    setEditMedForm(null);

    // Refresh verified pharmacy price search with user-confirmed medicine details
    handleSearchPharmacyPrices(updatedMeds, location?.latitude, location?.longitude, searchFilter);
  };

  const handleSaveToVaultAndActive = () => {
    if (!scanResult) return;

    scanResult.medicines.forEach((m, idx) => {
      onAddActiveMedicine({
        id: `med_scanned_${Date.now()}_${idx}`,
        name: m.name,
        salt: m.activeIngredient || m.salt || `${m.name} active salt`,
        dosage: m.strength || m.dosage || 'Standard Dosage',
        frequency: m.frequency,
        duration: m.duration || '7 Days',
        startDate: scanResult.date,
        doctorName: scanResult.doctorName,
        instructions: m.instructions || 'Take as prescribed by doctor.',
        remainingDoses: 14,
        totalDoses: 14,
        prescribedFor: scanResult.rawNotes || 'Scanned Prescription',
      });
    });

    onAddVaultItem({
      id: `v_scan_${Date.now()}`,
      title: `Scanned Prescription - ${scanResult.doctorName}`,
      category: 'Prescription',
      doctorName: scanResult.doctorName,
      diseaseOrTag: 'Scanned Prescription',
      date: scanResult.date,
      fileSize: '1.5 MB',
      fileType: 'jpg',
      notes: `Medicines: ${scanResult.medicines.map((m) => m.name).join(', ')}`,
      isImportant: true,
    });

    setIsSaved(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#16241c] rounded-3xl p-6 sm:p-8 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#e8eee5] dark:bg-[#23382b] text-[#1a5336] dark:text-[#a3d4b6] flex items-center justify-center shrink-0 border border-[#d2ded0] dark:border-[#2a4435]">
            <ScanLine className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#142b20] dark:text-[#f2f0e8] font-serif-editorial">
              AI Prescription Scanner & Medicine Finder
            </h2>
            <p className="text-xs sm:text-sm text-[#5c5647] dark:text-[#c0b9ad] mt-0.5">
              Extract accurate medicine details from prescriptions, confirm handwritten entries, and compare real verified prices at nearby medical stores.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-[#f6f2e9] dark:bg-[#1d2e23] p-1.5 rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] text-xs sm:text-sm font-bold shrink-0">
          <button
            onClick={() => setActiveTabMode('scanner')}
            className={`min-h-[40px] px-4 py-2 rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] ${
              activeTabMode === 'scanner'
                ? 'bg-white dark:bg-[#16241c] text-[#1a5336] dark:text-[#a3d4b6] shadow-xs'
                : 'text-[#5c5647] dark:text-[#c0b9ad] hover:text-[#142b20]'
            }`}
          >
            1. Scan & Confirm
          </button>
          <button
            onClick={() => setActiveTabMode('price_comparison')}
            className={`min-h-[40px] px-4 py-2 rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] ${
              activeTabMode === 'price_comparison'
                ? 'bg-white dark:bg-[#16241c] text-[#1a5336] dark:text-[#a3d4b6] shadow-xs'
                : 'text-[#5c5647] dark:text-[#c0b9ad] hover:text-[#142b20]'
            }`}
          >
            2. Verified Prices & Map ({pharmacySearchData?.medicineResults?.length || 0})
          </button>
        </div>
      </div>

      {activeTabMode === 'scanner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Zone & Input */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-stone-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                1. Capture or Upload Prescription
              </h3>

              {/* Mode Toggle: File Upload vs Live Camera */}
              <div className="flex bg-stone-100 dark:bg-slate-900 p-1 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    if (isCameraActive) stopCamera();
                    setScannerInputMode('upload');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    scannerInputMode === 'upload' && !isCameraActive
                      ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>File Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScannerInputMode('camera');
                    startCamera();
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    isCameraActive || scannerInputMode === 'camera'
                      ? 'bg-emerald-800 text-white shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-amber-300" />
                  <span>Live Camera</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
                </button>
              </div>
            </div>

            {/* Camera Error Message */}
            {cameraError && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-center justify-between border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{cameraError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[11px] font-bold shrink-0"
                >
                  Retry Camera
                </button>
              </div>
            )}

            {/* Active Camera Viewfinder with CSS Scanning Laser / Frame Overlay */}
            {isCameraActive ? (
              <div className="relative w-full aspect-4/3 sm:aspect-16/10 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/50 select-none">
                {/* Live Video Feed Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* HUD Background Grid Pattern Overlay */}
                <div className="absolute inset-0 pointer-events-none scanner-grid-pattern animate-grid-flicker" />

                {/* Ambient Vignette & Scanner Darkness */}
                <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-emerald-950/20 to-black/75" />

                {/* Laser Glow Sweep Field */}
                <div className="absolute inset-x-0 h-44 pointer-events-none bg-gradient-to-b from-emerald-500/0 via-emerald-400/15 to-emerald-500/0 animate-laser-glow-wash" />

                {/* Animated Scanning Laser Beam Line */}
                <div className="absolute inset-x-0 h-1 pointer-events-none animate-laser-sweep z-20">
                  {/* Diffused High-Intensity Glow Line */}
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-300 via-50% to-transparent animate-laser-glow" />
                  {/* Laser Trail Flare */}
                  <div className="w-full h-12 -mt-6 bg-gradient-to-b from-emerald-400/30 via-emerald-500/10 to-transparent blur-xs pointer-events-none" />
                  {/* Center Sparkle Pulse Point */}
                  <div className="absolute left-1/2 -top-1.5 -translate-x-1/2 w-4 h-4 rounded-full bg-emerald-200/90 blur-xs shadow-lg shadow-emerald-400" />
                </div>

                {/* Target Reticle / Corner Brackets Frame Overlay */}
                <div className="absolute inset-3 sm:inset-6 pointer-events-none flex flex-col justify-between z-10">
                  {/* Top Row Brackets & Status */}
                  <div className="flex justify-between items-start">
                    {/* Top Left Corner */}
                    <div className="w-6 h-6 sm:w-10 sm:h-10 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg animate-corner-pulse" />
                    
                    {/* HUD Top Status Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-emerald-500/50 text-[10px] sm:text-xs font-mono font-bold text-emerald-300 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="tracking-widest">LIVE OPTICAL SCAN</span>
                    </div>

                    {/* Top Right Corner */}
                    <div className="w-6 h-6 sm:w-10 sm:h-10 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg animate-corner-pulse" />
                  </div>

                  {/* Center Reticle & Aiming Crosshairs */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 border border-emerald-400/40 rounded-full animate-reticle-pulse flex items-center justify-center">
                      <div className="w-10 h-10 border border-dashed border-emerald-400/60 rounded-full" />
                      <div className="absolute w-5 h-0.5 bg-emerald-400/90" />
                      <div className="absolute h-5 w-0.5 bg-emerald-400/90" />
                    </div>
                  </div>

                  {/* Bottom Row Brackets & Guide Text */}
                  <div className="space-y-2">
                    <div className="text-center">
                      <span className="inline-block px-3 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-[10px] sm:text-xs font-medium text-emerald-200 border border-emerald-500/30 tracking-wide shadow-md">
                        ✦ Align prescription clearly within corners
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      {/* Bottom Left Corner */}
                      <div className="w-6 h-6 sm:w-10 sm:h-10 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg animate-corner-pulse" />
                      
                      {/* Optical Telemetry */}
                      <span className="text-[9px] font-mono text-emerald-400/80 uppercase tracking-widest hidden sm:inline-block">
                        CAMERA ACTIVE • AUTO-FOCUS
                      </span>

                      {/* Bottom Right Corner */}
                      <div className="w-6 h-6 sm:w-10 sm:h-10 border-b-3 border-r-3 border-emerald-400 rounded-br-lg animate-corner-pulse" />
                    </div>
                  </div>
                </div>

                {/* Active Camera Action Controls Bar */}
                <div className="absolute bottom-2.5 inset-x-2.5 sm:inset-x-5 flex items-center justify-between z-30 pointer-events-auto bg-slate-950/85 backdrop-blur-md px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-emerald-500/40 shadow-2xl">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <CameraOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Close</span>
                  </button>

                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 sm:px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-full shadow-lg shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Scan className="w-4 h-4 animate-pulse" />
                    <span>Capture & Scan</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="px-2.5 py-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1"
                    title="Switch camera facing"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Flip</span>
                  </button>
                </div>
              </div>
            ) : scannerInputMode === 'camera' && cameraLoading ? (
              /* Camera Loading Viewport */
              <div className="w-full aspect-4/3 sm:aspect-16/10 bg-slate-950 rounded-2xl flex flex-col items-center justify-center text-emerald-400 space-y-3 border-2 border-emerald-500/30">
                <JevanCareLoader size="md" color="emerald" label="Initializing optical camera sensor..." />
                <p className="text-xs text-slate-400 font-mono">Requesting video permissions...</p>
              </div>
            ) : scannerInputMode === 'camera' ? (
              /* Camera Inactive Launcher Card */
              <div className="w-full aspect-4/3 sm:aspect-16/10 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-emerald-600/40 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-bold text-white">Live Optical Camera Scanner</h4>
                  <p className="text-xs text-slate-400">
                    Use your device camera to scan prescriptions directly with real-time laser alignment and auto-extraction.
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Activate Live Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScannerInputMode('upload')}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                  >
                    Upload File Instead
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Drag and Drop / File Upload Zone */
              <div
                onClick={() => document.getElementById('prescription-file-input')?.click()}
                className="border-2 border-dashed border-stone-300 dark:border-slate-700 hover:border-emerald-700 dark:hover:border-emerald-400 rounded-2xl p-6 text-center cursor-pointer transition-all bg-stone-50/50 dark:bg-slate-900/50 group relative overflow-hidden"
              >
                <input
                  id="prescription-file-input"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />

                {selectedImage ? (
                  <div className="space-y-3 relative">
                    <div className="relative inline-block mx-auto rounded-xl overflow-hidden border border-stone-200 dark:border-slate-700 shadow-md max-h-56">
                      <img
                        src={selectedImage}
                        alt="Selected Prescription"
                        className="max-h-52 mx-auto object-contain"
                      />

                      {/* Laser scanning simulation overlay when AI scan is running */}
                      {isScanning && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[0.5px]" />
                          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-300 via-50% to-transparent animate-laser-sweep animate-laser-glow z-20" />
                          <div className="absolute inset-x-0 h-32 pointer-events-none bg-gradient-to-b from-emerald-400/25 via-emerald-500/10 to-transparent animate-laser-glow-wash" />
                          <div className="absolute inset-2 border-2 border-dashed border-emerald-400/60 rounded-lg animate-pulse" />
                        </div>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {fileName || 'Prescription Image Loaded'}
                    </p>
                    <div className="flex items-center justify-center gap-4 text-[11px] font-bold">
                      <span className="text-emerald-800 dark:text-emerald-400 hover:underline">
                        Click to replace image
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setScannerInputMode('camera');
                          startCamera();
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Or use live camera</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Click or Drag & Drop Prescription Image
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG photos or digital prescription copies</p>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setScannerInputMode('camera');
                          startCamera();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Switch to Live Camera Scanner</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Optional User Notes or Diagnosis Context
              </label>
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="e.g. Prescribed by Dr. Rajeshwar K. Tripathi for fever and cough..."
                rows={2}
                className="w-full p-3 text-xs bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-800 dark:text-slate-100"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-medium flex items-center gap-2 border border-rose-200 dark:border-rose-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={isScanning || (!selectedImage && !textPrompt)}
              className="w-full py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isScanning ? (
                <JevanCareLoader size="sm" color="white" label="Extracting Clinical Medicines with Gemini OCR..." />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Run AI Prescription Scan</span>
                </>
              )}
            </button>
          </div>

          {/* Extracted Clinical Results & User Confirmation */}
          <div className="bg-white dark:bg-[#16241c] rounded-3xl p-6 sm:p-7 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs space-y-5">
            <h3 className="font-bold text-sm sm:text-base text-[#142b20] dark:text-[#f2f0e8] flex items-center justify-between">
              <span>2. AI Extracted Clinical Results</span>
              {scanResult && (
                <span className="text-xs font-bold text-[#1a5336] dark:text-[#a3d4b6] bg-[#e8eee5] dark:bg-[#23382b] px-3 py-1 rounded-full border border-[#d2ded0] dark:border-[#2a4435]">
                  {scanResult.medicines.length} Medicines Identified
                </span>
              )}
            </h3>

            {scanResult ? (
              <div className="space-y-4">
                {/* Doctor & Hospital Info Header */}
                <div className="p-4 rounded-2xl bg-[#fcfaf6] dark:bg-[#1d2e23] border border-[#e6dfd3] dark:border-[#283c2e] grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-[#827b6c] dark:text-[#969082] block text-xs font-bold uppercase tracking-wider">
                      Prescribing Doctor
                    </span>
                    <span className="font-bold text-[#142b20] dark:text-[#f2f0e8] flex items-center gap-1.5 mt-0.5">
                      <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      {scanResult.doctorName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#827b6c] dark:text-[#969082] block text-xs font-bold uppercase tracking-wider">
                      Hospital / Clinic
                    </span>
                    <span className="font-bold text-[#142b20] dark:text-[#f2f0e8] flex items-center gap-1.5 mt-0.5">
                      <Building className="w-4 h-4 text-[#1a5336] dark:text-[#a3d4b6]" />
                      {scanResult.hospitalName}
                    </span>
                  </div>
                </div>

                {/* Extracted Medicines List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase text-[#827b6c] dark:text-[#969082] tracking-wider">
                    Extracted Medicines Breakdown
                  </h4>

                  {scanResult.medicines.map((m, idx) => {
                    const isEditing = editingMedicineIdx === idx;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all space-y-2 ${
                          m.isUnclear
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                            : 'bg-[#fcfaf6] dark:bg-[#1d2e23] border-[#e6dfd3] dark:border-[#283c2e]'
                        }`}
                      >
                        {isEditing && editMedForm ? (
                          /* Inline Medicine Confirmation / Edit Form */
                          <div className="space-y-3 bg-white dark:bg-[#16241c] p-4 rounded-xl border border-amber-300">
                            <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                              <span>Confirm Medicine Details</span>
                              <span>Step 2 of 2</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                              <div>
                                <label className="block text-xs text-[#5c5647] dark:text-[#c0b9ad] font-bold mb-1">Medicine Name</label>
                                <input
                                  type="text"
                                  value={editMedForm.name}
                                  onChange={(e) => setEditMedForm({ ...editMedForm, name: e.target.value })}
                                  className="w-full p-2.5 bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-xs sm:text-sm font-semibold text-[#142b20] dark:text-[#f2f0e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-[#5c5647] dark:text-[#c0b9ad] font-bold mb-1">Active Salt / Ingredient</label>
                                <input
                                  type="text"
                                  value={editMedForm.activeIngredient || ''}
                                  onChange={(e) => setEditMedForm({ ...editMedForm, activeIngredient: e.target.value, salt: e.target.value })}
                                  className="w-full p-2.5 bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-xs sm:text-sm font-semibold text-[#142b20] dark:text-[#f2f0e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-[#5c5647] dark:text-[#c0b9ad] font-bold mb-1">Strength (e.g. 650 mg)</label>
                                <input
                                  type="text"
                                  value={editMedForm.strength || ''}
                                  onChange={(e) => setEditMedForm({ ...editMedForm, strength: e.target.value })}
                                  className="w-full p-2.5 bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-xs sm:text-sm font-semibold text-[#142b20] dark:text-[#f2f0e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-[#5c5647] dark:text-[#c0b9ad] font-bold mb-1">Dosage Form</label>
                                <input
                                  type="text"
                                  value={editMedForm.dosageForm || 'Tablet'}
                                  onChange={(e) => setEditMedForm({ ...editMedForm, dosageForm: e.target.value })}
                                  className="w-full p-2.5 bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-xl text-xs sm:text-sm font-semibold text-[#142b20] dark:text-[#f2f0e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                              <button
                                onClick={() => setEditingMedicineIdx(null)}
                                className="min-h-[40px] px-3.5 py-1.5 text-xs text-[#5c5647] dark:text-[#c0b9ad] hover:text-[#142b20] font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveConfirmedMedicine(idx)}
                                className="min-h-[40px] px-4 py-2 bg-[#1a5336] hover:bg-[#143e29] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Confirm & Save Medicine</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Standard Medicine Card Display */
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm sm:text-base text-[#142b20] dark:text-[#f2f0e8]">{m.name}</span>
                                  <span
                                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                      m.status === 'Prescribed medicine'
                                        ? 'bg-[#e8eee5] text-[#1a5336] dark:bg-[#23382b] dark:text-[#a3d4b6]'
                                        : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                                    }`}
                                  >
                                    {m.status}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-[#5c5647] dark:text-[#c0b9ad] mt-0.5">
                                  Active Ingredient: <span className="font-bold text-[#142b20] dark:text-[#f2f0e8]">{m.activeIngredient || m.salt || m.name}</span> ({m.strength || m.dosage || 'Standard Strength'})
                                </p>
                              </div>

                              {m.isUnclear ? (
                                <button
                                  onClick={() => handleStartEditMedicine(idx, m)}
                                  className="min-h-[40px] px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Review & Confirm</span>
                                </button>
                              ) : (
                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> High Confidence
                                </span>
                              )}
                            </div>

                            {/* Unclear Warning Banner if handwriting blurry */}
                            {m.isUnclear && (
                              <div className="mt-2.5 p-3 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between border border-amber-200 dark:border-amber-800">
                                <span className="flex items-center gap-1.5 font-semibold text-xs">
                                  <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
                                  {m.unclearReason || 'Prescription handwriting unclear. Please confirm medicine details.'}
                                </span>
                                <button
                                  onClick={() => handleStartEditMedicine(idx, m)}
                                  className="text-xs font-bold text-amber-800 underline hover:text-amber-950 shrink-0 cursor-pointer"
                                >
                                  Confirm
                                </button>
                              </div>
                            )}

                            <div className="mt-2.5 pt-2.5 border-t border-[#e6dfd3] dark:border-[#283c2e] text-xs text-[#5c5647] dark:text-[#c0b9ad] space-y-0.5">
                              <p>Frequency: <span className="font-semibold text-[#142b20] dark:text-[#f2f0e8]">{m.frequency}</span> ({m.duration})</p>
                              {m.instructions && (
                                <p className="italic text-xs text-[#827b6c] dark:text-[#969082]">Note: {m.instructions}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Potential Risks */}
                {scanResult.potentialRisks && scanResult.potentialRisks.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4" /> Safety Warnings
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {scanResult.potentialRisks.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Save and View Price Comparison Action Buttons */}
                <div className="pt-2 space-y-2.5">
                  <button
                    onClick={() => setActiveTabMode('price_comparison')}
                    className="w-full min-h-[44px] py-3 px-4 bg-[#1a5336] hover:bg-[#143e29] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                  >
                    <IndianRupee className="w-4 h-4 text-amber-300" />
                    <span>Find Lowest Verified Prices & Nearby Pharmacies</span>
                  </button>

                  {isSaved ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Saved to Vault & Active Schedule!
                      </span>
                      <button
                        onClick={() => setActiveTab('vault')}
                        className="text-xs font-bold underline hover:text-emerald-950 cursor-pointer"
                      >
                        View Vault
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSaveToVaultAndActive}
                      className="w-full min-h-[44px] py-2.5 px-4 bg-[#fcfaf6] dark:bg-[#1d2e23] hover:bg-[#f6f2e9] dark:hover:bg-[#25382d] text-[#142b20] dark:text-[#f2f0e8] font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-[#e6dfd3] dark:border-[#283c2e] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                    >
                      <FolderPlus className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>Save Prescription Document to Medical Vault</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#827b6c] dark:text-[#969082] space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#e8eee5] dark:bg-[#23382b] text-[#1a5336] dark:text-[#a3d4b6] flex items-center justify-center mx-auto border border-[#d2ded0] dark:border-[#2a4435]">
                  <ScanLine className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <h4 className="text-sm sm:text-base font-bold text-[#142b20] dark:text-[#f2f0e8]">
                    No prescription scanned yet
                  </h4>
                  <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed">
                    Upload a clear photo or use live camera to scan handwriting, extract medicines, and check nearby store prices.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Price Comparison & Interactive Map Tab Mode */
        <div className="space-y-6">
          {/* Debounced Search & Filter Header */}
          <MedicinePriceSearch
            onSearch={handleManualSearch}
            isLoading={isSearchingPharmacy}
            initialQuery={scanResult?.medicines?.[0]?.name || ''}
          />

          {/* Complete Multi-Medicine Prescription Store Card (if available) */}
          {pharmacySearchData?.completePrescriptionStore && (
            <div className="p-4 rounded-2xl bg-emerald-900 text-white shadow-md border border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold uppercase tracking-wider">
                    Best Store for Complete Prescription
                  </span>
                  <span className="text-xs text-emerald-200">All {scanResult?.medicines?.length || 1} medicines verified in stock</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  {pharmacySearchData.completePrescriptionStore.pharmacyName}
                </h3>
                <p className="text-xs text-emerald-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{pharmacySearchData.completePrescriptionStore.address}</span>
                  <span className="font-bold text-amber-300">({pharmacySearchData.completePrescriptionStore.distanceKm} km)</span>
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-emerald-300 uppercase block font-bold">Total Prescription Cost</span>
                  <span className="text-xl font-black text-amber-300">
                    ₹{pharmacySearchData.completePrescriptionStore.totalPrescriptionPrice.toFixed(2)}
                  </span>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacySearchData.completePrescriptionStore.lat},${pharmacySearchData.completePrescriptionStore.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Directions</span>
                </a>
              </div>
            </div>
          )}

          {/* Map + Medicine Result Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive GPS Map View */}
            <div className="lg:col-span-1">
              <MedicinePharmacyMap
                userLocation={
                  location && location.latitude !== 0 && location.longitude !== 0
                    ? {
                        lat: location.latitude,
                        lng: location.longitude,
                        label: addressLabel || 'Current location',
                      }
                    : null
                }
                pharmacies={
                  pharmacySearchData?.medicineResults?.[0]?.allPharmacies || []
                }
                selectedPharmacyId={selectedPharmacyId}
                onSelectPharmacy={(id) => setSelectedPharmacyId(id)}
                onRefreshLocation={() => refreshLocation(true)}
                isRefreshingLocation={isLocating}
              />
            </div>

            {/* Medicine Verified Price Result Cards List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Verified Price & Nearby Pharmacy Comparisons</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Real source pricing • No fabricated rates
                </span>
              </div>

              {isSearchingPharmacy ? (
                <div className="py-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-700">
                  <JevanCareLoader size="md" color="emerald" label="Retrieving verified prices & pharmacy inventory..." />
                </div>
              ) : pharmacySearchData?.medicineResults && pharmacySearchData.medicineResults.length > 0 ? (
                <div className="space-y-4">
                  {pharmacySearchData.medicineResults.map((medRes, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700 shadow-xs space-y-4"
                    >
                      {/* Medicine Header Info */}
                      <div className="flex items-start justify-between border-b border-stone-100 dark:border-slate-700/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-slate-900 dark:text-white">
                              {medRes.medicineName}
                            </h4>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {medRes.strength} • {medRes.dosageForm}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Active Salt: <span className="font-semibold text-slate-700 dark:text-slate-200">{medRes.activeIngredient}</span>
                          </p>
                        </div>

                        {medRes.bestVerifiedOption ? (
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 inline-block mb-1">
                              Best Verified Price
                            </span>
                            <div className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300">
                              ₹{medRes.bestVerifiedOption.pricePerUnit.toFixed(2)}{' '}
                              <span className="text-xs font-semibold text-slate-400">/ unit</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              ₹{medRes.bestVerifiedOption.packPrice.toFixed(2)} per pack of {medRes.bestVerifiedOption.packSize}
                            </span>
                          </div>
                        ) : (
                          <div className="text-right p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold">
                            Current price could not be verified
                          </div>
                        )}
                      </div>

                      {/* Best Verified Option Box */}
                      {medRes.bestVerifiedOption ? (
                        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              {medRes.bestVerifiedOption.pharmacyName}
                            </span>
                            <span className="font-extrabold text-emerald-800 dark:text-emerald-300">
                              {medRes.bestVerifiedOption.distanceKm} km away
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{medRes.bestVerifiedOption.address}</span>
                          </p>

                          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                            <span>Verified Brand: <strong>{medRes.bestVerifiedOption.brandName}</strong></span>
                            <span className="italic">{medRes.bestVerifiedOption.verifiedTimestamp}</span>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${medRes.bestVerifiedOption.lat},${medRes.bestVerifiedOption.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Directions</span>
                            </a>
                            {medRes.bestVerifiedOption.phone && (
                              <a
                                href={`tel:${medRes.bestVerifiedOption.phone}`}
                                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg border transition-all flex items-center gap-1"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Call</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-900 text-xs text-slate-500 space-y-1">
                          <p className="font-semibold text-slate-700 dark:text-slate-200">
                            No verified nearby availability found for exact stock matching.
                          </p>
                          <p className="text-[11px]">
                            Please check with nearby licensed chemists directly or consult your pharmacist.
                          </p>
                        </div>
                      )}

                      {/* All Nearby Stores Table */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
                          All Stores & Alternate Brands ({medRes.allPharmacies.length})
                        </span>

                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {medRes.allPharmacies.map((pharm) => (
                            <div
                              key={pharm.pharmacyId}
                              onClick={() => setSelectedPharmacyId(pharm.pharmacyId)}
                              className={`p-3 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                                selectedPharmacyId === pharm.pharmacyId
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400'
                                  : 'bg-stone-50/50 dark:bg-slate-900/50 border-stone-200 dark:border-slate-700/60 hover:bg-stone-100'
                              }`}
                            >
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-100 block">
                                  {pharm.pharmacyName}
                                </span>
                                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {pharm.distanceKm} km • {pharm.brandName}
                                </span>
                              </div>

                              <div className="text-right">
                                {pharm.pricePerUnit !== null ? (
                                  <div>
                                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                                      ₹{pharm.pricePerUnit.toFixed(2)} / unit
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                      ₹{pharm.packPrice?.toFixed(2)} / pack
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">
                                    Price unverified
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Generic Substitutions Caution Note */}
                      <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Clinical Substitution Disclaimer:</strong> Do not switch brands, strengths, or medicines without confirming with your doctor or pharmacist.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-white dark:bg-slate-800 rounded-2xl border border-stone-200 dark:border-slate-700 text-slate-400 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No pharmacy search results found yet.</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Search any medicine name above or tap a quick suggestion below to discover real Google Places pharmacies and verified prices nearby:
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {[
                      { label: 'Paracetamol 650mg', key: 'Paracetamol 650mg' },
                      { label: 'Amoxicillin 500mg', key: 'Amoxicillin 500mg' },
                      { label: 'Pantoprazole 40mg', key: 'Pantoprazole 40mg' },
                      { label: 'Azithromycin 500mg', key: 'Azithromycin 500mg' },
                      { label: 'Jan Aushadhi Kendra', key: 'Jan Aushadhi' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => handleManualSearch(item.key, searchFilter)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold text-xs border border-stone-200 dark:border-slate-700 hover:border-emerald-300 transition-all cursor-pointer"
                      >
                        + {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
