import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartHandshake,
  User,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Car,
  CheckSquare,
  ShieldAlert,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Info,
  CheckCircle2,
  Phone,
  Sparkles,
  ArrowRight,
  Search,
  Crosshair,
  FileText,
  Accessibility
} from 'lucide-react';
import {
  UserProfile,
  MedBuddyBooking,
  PriceSnapshot
} from '../../types';
import { useLocation } from '../../context/LocationContext';
import { medbuddyPricingService } from '../../services/medbuddyPricingService';
import { medbuddyService } from '../../services/medbuddyService';
import { JevanCareLoader } from '../common/JevanCareLoader';

interface MedBuddyBookingWizardProps {
  userProfile: UserProfile;
  onBookingConfirmed: (booking: MedBuddyBooking) => void;
  onCancel: () => void;
  onOpenEmergency: () => void;
}

const REASON_OPTIONS = [
  { id: 'Hospital visit', label: 'Hospital Visit', desc: 'Consultation, follow-up, or outpatient checkup' },
  { id: 'Doctor appointment', label: 'Doctor Appointment', desc: 'Specialist consultation & prescription renewal' },
  { id: 'Diagnostic test', label: 'Diagnostic / Lab Test', desc: 'Blood test, MRI, CT scan, or X-Ray assistance' },
  { id: 'Discharge assistance', label: 'Discharge Assistance', desc: 'Hospital discharge formalities & safe home escort' },
  { id: 'Follow-up visit', label: 'Post-Op / Follow-up', desc: 'Dressing change, suture removal, or review' },
  { id: 'Other', label: 'Other Healthcare Need', desc: 'Custom non-clinical companion assistance' },
];

const POPULAR_HOSPITALS = [
  {
    name: 'King George\'s Medical University (KGMU)',
    address: 'Shah Mina Rd, Chowk, Lucknow, Uttar Pradesh 226003',
    lat: 26.8688,
    lng: 80.9163,
    phone: '+91 522 225 7540',
  },
  {
    name: 'Sanjay Gandhi Postgraduate Institute (SGPGI)',
    address: 'Raebareli Rd, Lucknow, Uttar Pradesh 226014',
    lat: 26.7460,
    lng: 80.9380,
    phone: '+91 522 249 4000',
  },
  {
    name: 'Medanta Super Specialty Hospital',
    address: 'Sector A, Pocket 1, Amar Shaheed Path, Golf City, Lucknow 226030',
    lat: 26.7865,
    lng: 80.8931,
    phone: '+91 522 450 5050',
  },
  {
    name: 'Apollo Hospital Lucknow',
    address: 'Sector B, Bargawan, LDA Colony, Lucknow, Uttar Pradesh 226012',
    lat: 26.7900,
    lng: 80.9800,
    phone: '+91 522 667 7777',
  },
  {
    name: 'Dr. Ram Manohar Lohia Institute (RMLIMS)',
    address: 'Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010',
    lat: 26.8520,
    lng: 80.9980,
    phone: '+91 522 669 2000',
  },
];

const ALL_SERVICES = [
  { id: 'Home pickup assistance', label: 'Home Pickup Assistance', desc: 'Companion meets you at your doorstep' },
  { id: 'Cab coordination', label: 'Cab / Auto Coordination', desc: 'Companion books & manages travel transport' },
  { id: 'Hospital registration', label: 'Hospital Registration', desc: 'Filling patient registration & OPD slips' },
  { id: 'OPD navigation', label: 'OPD & Chamber Navigation', desc: 'Guiding through hospital departments & floors' },
  { id: 'Queue/token assistance', label: 'Queue & Token Collection', desc: 'Standing in line for OPD and tokens' },
  { id: 'Billing counter assistance', label: 'Billing Counter Assistance', desc: 'Processing OPD/diagnostic billing receipts' },
  { id: 'Diagnostic counter assistance', label: 'Diagnostic Lab Assistance', desc: 'Escorting to pathology, radiology & sample collection' },
  { id: 'Prescription/document assistance', label: 'Prescription & Medicine Pickup', desc: 'Helping obtain prescribed medicines from hospital pharmacy' },
  { id: 'Waiting companion', label: 'Waiting Room Companion', desc: 'Sitting with you during waiting hours' },
  { id: 'Discharge paperwork assistance', label: 'Discharge Paperwork Support', desc: 'Helping collect summary, discharge file & clearance' },
  { id: 'Return journey assistance', label: 'Return Journey Transport', desc: 'Accompanying you safely on the return ride' },
  { id: 'Home drop-off', label: 'Safe Home Drop-off', desc: 'Doorstep escort and settling you comfortably back home' },
];

export const MedBuddyBookingWizard: React.FC<MedBuddyBookingWizardProps> = ({
  userProfile,
  onBookingConfirmed,
  onCancel,
  onOpenEmergency,
}) => {
  const {
    location: deviceLocation,
    addressLabel: deviceAddress,
    isLoading: isLocating,
    status: geoStatus,
    refreshLocation
  } = useLocation();

  const deviceLat = deviceLocation?.latitude;
  const deviceLng = deviceLocation?.longitude;

  const deviceCoords = deviceLocation
    ? { latitude: deviceLocation.latitude, longitude: deviceLocation.longitude, accuracy: deviceLocation.accuracy }
    : null;

  // Wizard Step (1 to 8)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1: Reason
  const [reasonCategory, setReasonCategory] = useState<string>('Hospital visit');
  const [customReason, setCustomReason] = useState<string>('');
  const [emergencyWarning, setEmergencyWarning] = useState<string | null>(null);

  // Step 2: Patient
  const [isForSelf, setIsForSelf] = useState<boolean>(true);
  const [patientName, setPatientName] = useState<string>(userProfile.name || '');
  const [patientPhone, setPatientPhone] = useState<string>(userProfile.phone || '+91 98765 43210');
  const [patientAge, setPatientAge] = useState<number>(userProfile.age || 35);
  const [patientRelationship, setPatientRelationship] = useState<string>('Self');
  const [emergencyContactName, setEmergencyContactName] = useState<string>(userProfile.emergencyContactName || 'Pooja Sharma');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>(userProfile.emergencyContactPhone || '+91 98765 12345');

  // Step 3: Pickup Location
  const [pickupAddress, setPickupAddress] = useState<string>(deviceAddress || '');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number }>(() => {
    return deviceCoords ? { lat: deviceCoords.latitude, lng: deviceCoords.longitude } : { lat: 0, lng: 0 };
  });

  useEffect(() => {
    if (deviceCoords) {
      if (pickupCoords.lat === 0 && pickupCoords.lng === 0) {
        setPickupCoords({ lat: deviceCoords.latitude, lng: deviceCoords.longitude });
      }
      if (!pickupAddress && deviceAddress) {
        setPickupAddress(deviceAddress);
      }
    }
  }, [deviceCoords, deviceAddress]);

  // Step 4: Destination Hospital
  const [selectedHospital, setSelectedHospital] = useState<typeof POPULAR_HOSPITALS[0]>(POPULAR_HOSPITALS[0]);
  const [hospitalSearchText, setHospitalSearchText] = useState<string>('');
  const [customHospitalName, setCustomHospitalName] = useState<string>('');
  const [customHospitalAddress, setCustomHospitalAddress] = useState<string>('');

  // Step 5: Date & Time
  const [isAsap, setIsAsap] = useState<boolean>(true);
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState<string>('10:00');
  const [expectedHospitalDuration, setExpectedHospitalDuration] = useState<string>('1–2 hours');

  // Step 6: Return Trip
  const [returnRequired, setReturnRequired] = useState<boolean>(true);
  const [returnOption, setReturnOption] = useState<'after_appointment' | 'specific_time' | 'after_discharge' | 'decide_later'>('after_appointment');

  // Step 7: Services Required & Mobility
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Home pickup assistance',
    'Cab coordination',
    'Hospital registration',
    'OPD navigation',
    'Queue/token assistance',
    'Waiting companion',
    'Return journey assistance',
    'Home drop-off',
  ]);
  const [mobilityRequirement, setMobilityRequirement] = useState<'independent' | 'walking_assistance' | 'wheelchair' | 'walking_stick' | 'extra_assistance'>('walking_assistance');
  const [clinicalTransportWarning, setClinicalTransportWarning] = useState<boolean>(false);

  // Step 8: Safety Acknowledgement
  const [safetyAcknowledged, setSafetyAcknowledged] = useState<boolean>(false);

  // Update pickup when device coordinates change
  useEffect(() => {
    if (deviceLat !== undefined && deviceLng !== undefined) {
      setPickupCoords((prev) => {
        if (Math.abs(prev.lat - deviceLat) < 0.0001 && Math.abs(prev.lng - deviceLng) < 0.0001) {
          return prev;
        }
        return { lat: deviceLat, lng: deviceLng };
      });
      if (deviceAddress) {
        setPickupAddress((prev) => prev || deviceAddress);
      }
    }
  }, [deviceLat, deviceLng, deviceAddress]);

  // Live screening for acute emergency symptoms in Step 1
  useEffect(() => {
    const text = `${reasonCategory} ${customReason}`.toLowerCase();
    const acuteEmergencyWords = [
      'chest pain',
      'heart attack',
      'difficulty breathing',
      'cannot breathe',
      'stroke',
      'unconscious',
      'heavy bleeding',
      'severe bleeding',
      'choking',
      'ambulance',
      'stretcher'
    ];

    const matched = acuteEmergencyWords.find((w) => text.includes(w));
    if (matched) {
      setEmergencyWarning(`Urgent Clinical Advisory: "${matched}" indicates a potential life-threatening emergency. MedBuddy is a non-clinical companion and NOT an emergency transport service. Please call 108 / 112 or use JeevanCare SOS.`);
    } else {
      setEmergencyWarning(null);
    }
  }, [reasonCategory, customReason]);

  // Computed Price Snapshot
  const priceSnapshot: PriceSnapshot = useMemo(() => {
    const destinationCoords = customHospitalName
      ? { lat: pickupCoords.lat + 0.04, lng: pickupCoords.lng + 0.03 }
      : { lat: selectedHospital.lat, lng: selectedHospital.lng };

    const schedIso = isAsap
      ? new Date().toISOString()
      : `${scheduledDate}T${scheduledTime}:00`;

    return medbuddyPricingService.calculatePriceSnapshot({
      pickupCoordinates: pickupCoords,
      destinationCoordinates: destinationCoords,
      scheduledAt: schedIso,
      expectedHospitalDuration,
      returnRequired,
    });
  }, [pickupCoords, selectedHospital, customHospitalName, isAsap, scheduledDate, scheduledTime, expectedHospitalDuration, returnRequired]);

  // Toggle service checkbox
  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Hospital filter
  const filteredHospitals = useMemo(() => {
    if (!hospitalSearchText.trim()) return POPULAR_HOSPITALS;
    return POPULAR_HOSPITALS.filter(
      (h) =>
        h.name.toLowerCase().includes(hospitalSearchText.toLowerCase()) ||
        h.address.toLowerCase().includes(hospitalSearchText.toLowerCase())
    );
  }, [hospitalSearchText]);

  // Submission handler
  const handleConfirmBooking = async () => {
    if (!safetyAcknowledged) return;
    setIsSubmitting(true);

    try {
      const hospitalName = customHospitalName.trim() || selectedHospital.name;
      const hospitalAddress = customHospitalAddress.trim() || selectedHospital.address;
      const destinationCoords = customHospitalName.trim()
        ? { lat: pickupCoords.lat + 0.04, lng: pickupCoords.lng + 0.03 }
        : { lat: selectedHospital.lat, lng: selectedHospital.lng };

      const schedIso = isAsap
        ? new Date().toISOString()
        : `${scheduledDate}T${scheduledTime}:00`;

      const booking = await medbuddyService.createBooking({
        patientId: userProfile.id || 'u_patient_default',
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        isForSelf,
        patientRelationship: isForSelf ? 'Self' : patientRelationship,
        patientAge,
        reasonCategory,
        customReason: customReason.trim(),
        emergencyScreeningCleared: !emergencyWarning,
        pickupAddress: pickupAddress.trim(),
        pickupCoordinates: pickupCoords,
        destinationName: hospitalName,
        destinationAddress: hospitalAddress,
        destinationCoordinates: destinationCoords,
        destinationPhone: selectedHospital.phone,
        scheduledAt: schedIso,
        isAsap,
        expectedHospitalDuration,
        estimatedTotalDurationMinutes: Math.round(priceSnapshot.estimatedCompanionHours * 60),
        returnRequired,
        returnOption,
        requestedServices: selectedServices,
        mobilityRequirement,
        priceSnapshot,
      });

      onBookingConfirmed(booking);
    } catch (err: any) {
      console.error('Failed to create MedBuddy booking:', err);
      alert(`Booking creation failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#14231b] border border-[#e6dfd3] dark:border-[#24382c] rounded-3xl p-5 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto animate-fade-up">
      
      {/* Wizard Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e6dfd3] dark:border-[#24382c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              <HeartHandshake className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif-editorial font-bold text-[#142b20] dark:text-[#f2f0e8]">
              Book a MedBuddy Companion
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#5c5647] dark:text-[#b4aca0] mt-1">
            Step {currentStep} of 8: {
              currentStep === 1 ? 'Reason for Assistance' :
              currentStep === 2 ? 'Patient Details' :
              currentStep === 3 ? 'Home Pickup Location' :
              currentStep === 4 ? 'Destination Hospital' :
              currentStep === 5 ? 'Schedule & Duration' :
              currentStep === 6 ? 'Return Journey' :
              currentStep === 7 ? 'Assistance Services & Mobility' :
              'Review Transparent Price & Confirm'
            }
          </p>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === currentStep
                  ? 'w-6 bg-emerald-700 dark:bg-emerald-400'
                  : s < currentStep
                  ? 'w-2.5 bg-emerald-500/60'
                  : 'w-2 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Emergency Alert Banner if detected */}
      {emergencyWarning && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs sm:text-sm uppercase tracking-wider text-rose-800 dark:text-rose-300">
                Critical Safety Alert: Not Suitable for MedBuddy
              </p>
              <p className="text-xs mt-0.5">{emergencyWarning}</p>
            </div>
          </div>
          <button
            onClick={onOpenEmergency}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shrink-0 shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>Call 108 / SOS</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          STEP 1: REASON FOR ASSISTANCE
          ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h3 className="font-bold text-base text-[#142b20] dark:text-white">
              Why do you need a MedBuddy today?
            </h3>
            <p className="text-xs text-[#5c5647] dark:text-[#b4aca0] mt-0.5">
              Select the primary reason so your companion arrives fully prepared with the right paperwork checklists.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REASON_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setReasonCategory(opt.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  reasonCategory === opt.id
                    ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs'
                    : 'border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] hover:border-emerald-600/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#142b20] dark:text-white">{opt.label}</span>
                  {reasonCategory === opt.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-[#5c5647] dark:text-[#b4aca0] mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-[#142b20] dark:text-white">
              Additional Details or Special Requests (Optional)
            </label>
            <textarea
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Need assistance with 3rd floor cardiology OPD token, have knee pain so will require wheelchair from main gate."
              className="w-full p-3 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 2: PATIENT DETAILS
          ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h3 className="font-bold text-base text-[#142b20] dark:text-white">
              Who will the MedBuddy be accompanying?
            </h3>
            <p className="text-xs text-[#5c5647] dark:text-[#b4aca0] mt-0.5">
              Specify if you are booking for yourself or an elderly relative/friend.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setIsForSelf(true);
                setPatientName(userProfile.name);
                setPatientPhone(userProfile.phone || '+91 98765 43210');
                setPatientAge(userProfile.age || 35);
                setPatientRelationship('Self');
              }}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                isForSelf
                  ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-[#142b20] dark:text-white'
                  : 'border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] text-[#5c5647] dark:text-[#b4aca0]'
              }`}
            >
              <User className="w-5 h-5 mx-auto mb-1 text-emerald-700 dark:text-emerald-400" />
              <span className="text-xs sm:text-sm">Myself</span>
            </button>

            <button
              onClick={() => {
                setIsForSelf(false);
                setPatientRelationship('Parent');
              }}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                !isForSelf
                  ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-[#142b20] dark:text-white'
                  : 'border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] text-[#5c5647] dark:text-[#b4aca0]'
              }`}
            >
              <HeartHandshake className="w-5 h-5 mx-auto mb-1 text-emerald-700 dark:text-emerald-400" />
              <span className="text-xs sm:text-sm">Someone Else (Parent/Relative)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#142b20] dark:text-white">Patient Full Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient full name"
                className="w-full p-2.5 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#142b20] dark:text-white">Patient Phone Number</label>
              <input
                type="tel"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full p-2.5 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#142b20] dark:text-white">Patient Age</label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(Number(e.target.value) || 0)}
                placeholder="Age in years"
                className="w-full p-2.5 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
              />
            </div>

            {!isForSelf && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#142b20] dark:text-white">Relationship to Patient</label>
                <select
                  value={patientRelationship}
                  onChange={(e) => setPatientRelationship(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
                >
                  <option value="Parent">Parent (Mother / Father)</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend / Neighbour</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#142b20] dark:text-white">Emergency Contact Name</label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Name of emergency contact"
                className="w-full p-2.5 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#142b20] dark:text-white">Emergency Contact Phone</label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+91 98765 12345"
                className="w-full p-2.5 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 3: HOME PICKUP LOCATION
          ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h3 className="font-bold text-base text-[#142b20] dark:text-white">
              Where should the MedBuddy pick you up?
            </h3>
            <p className="text-xs text-[#5c5647] dark:text-[#b4aca0] mt-0.5">
              Uses real GPS location coordinates so your companion can navigate directly to your doorstep.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#142b20] dark:text-white">
              Pickup Address & Landmark
            </label>
            <input
              type="text"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="e.g. Flat 402, Royal Residency, Hazratganj, Lucknow"
              className="w-full p-3 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
            />
            <p className="text-[11px] text-[#5c5647] dark:text-[#b4aca0]">
              Include building name, flat number, and prominent nearby landmark for fast companion arrival.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 4: DESTINATION HOSPITAL
          ========================================================================= */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h3 className="font-bold text-base text-[#142b20] dark:text-white">
              Which hospital or diagnostic center are you visiting?
            </h3>
            <p className="text-xs text-[#5c5647] dark:text-[#b4aca0] mt-0.5">
              Select from verified regional healthcare facilities or type a custom medical center.
            </p>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={hospitalSearchText}
              onChange={(e) => setHospitalSearchText(e.target.value)}
              placeholder="Search hospital by name or area (e.g. KGMU, SGPGI, Medanta)..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
            />
          </div>

          {/* Hospital Cards List */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {filteredHospitals.map((hosp) => {
              const isSelected = !customHospitalName && selectedHospital.name === hosp.name;
              return (
                <button
                  key={hosp.name}
                  onClick={() => {
                    setSelectedHospital(hosp);
                    setCustomHospitalName('');
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs'
                      : 'border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] hover:border-emerald-600/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span className="font-bold text-xs sm:text-sm text-[#142b20] dark:text-white truncate">
                        {hosp.name}
                      </span>
                    </div>
                    <p className="text-xs text-[#5c5647] dark:text-[#b4aca0] mt-1 line-clamp-1">
                      {hosp.address}
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                      Phone: {hosp.phone}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Hospital Input */}
          <div className="pt-2 border-t border-[#e6dfd3] dark:border-[#283d30] space-y-2">
            <span className="text-xs font-bold text-[#142b20] dark:text-white block">
              Or Enter Other Hospital / Diagnostic Lab Manually:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={customHospitalName}
                onChange={(e) => setCustomHospitalName(e.target.value)}
                placeholder="Hospital / Diagnostic Center Name"
                className="w-full p-2.5 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
              />
              <input
                type="text"
                value={customHospitalAddress}
                onChange={(e) => setCustomHospitalAddress(e.target.value)}
                placeholder="Hospital Area / Address"
                className="w-full p-2.5 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 5: DATE, TIME & ESTIMATED DURATION
          ========================================================================= */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h3 className="font-bold text-base text-[#142b20] dark:text-white">
              When should your MedBuddy arrive?
            </h3>
            <p className="text-xs text-[#5c5647] dark:text-[#b4aca0] mt-0.5">
              Choose immediate companion dispatch or schedule ahead for an upcoming OPD appointment.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsAsap(true)}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                isAsap
                  ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-[#142b20] dark:text-white'
                  : 'border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] text-[#5c5647] dark:text-[#b4aca0]'
              }`}
            >
              <Clock className="w-5 h-5 mx-auto mb-1 text-emerald-700 dark:text-emerald-400" />
              <span className="text-xs sm:text-sm">As Soon As Possible</span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-normal mt-0.5">
                Arrival in ~20-35 mins
              </p>
            </button>

            <button
              onClick={() => setIsAsap(false)}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                !isAsap
                  ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-[#142b20] dark:text-white'
                  : 'border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] text-[#5c5647] dark:text-[#b4aca0]'
              }`}
            >
              <Calendar className="w-5 h-5 mx-auto mb-1 text-emerald-700 dark:text-emerald-400" />
              <span className="text-xs sm:text-sm">Schedule for Later</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                Select custom date & time
              </p>
            </button>
          </div>

          {!isAsap && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#142b20] dark:text-white">Scheduled Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#142b20] dark:text-white">Pickup Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-[#142b20] dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Expected Hospital Duration */}
          <div className="space-y-2 pt-2 border-t border-[#e6dfd3] dark:border-[#283d30]">
            <label className="text-xs font-bold text-[#142b20] dark:text-white block">
              Expected Hospital Visit Duration:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {['<1 hour', '1–2 hours', '2–4 hours', '4–6 hours', 'Not sure'].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setExpectedHospitalDuration(dur)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    expectedHospitalDuration === dur
                      ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-[#142b20] dark:text-white font-bold'
                      : 'border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] text-[#5c5647] dark:text-[#b4aca0]'
                  }`}
                >
                  {dur}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#5c5647] dark:text-[#b4aca0]">
              Companion fee is based on total duration. Additional waiting beyond included hours is calculated transparently at ₹2/min.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 6: RETURN TRIP REQUIREMENTS
          ========================================================================= */}
      {currentStep === 6 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h3 className="font-bold text-base text-[#142b20] dark:text-white">
              Do you need assistance returning home?
            </h3>
            <p className="text-xs text-[#5c5647] dark:text-[#b4aca0] mt-0.5">
              MedBuddy provides end-to-end support from home to hospital and back to your doorstep.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setReturnRequired(true)}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                returnRequired
                  ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-[#142b20] dark:text-white'
                  : 'border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] text-[#5c5647] dark:text-[#b4aca0]'
              }`}
            >
              <Car className="w-5 h-5 mx-auto mb-1 text-emerald-700 dark:text-emerald-400" />
              <span className="text-xs sm:text-sm">Yes, Return Home Together</span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-normal mt-0.5">
                Recommended (Home → Hospital → Home)
              </p>
            </button>

            <button
              onClick={() => setReturnRequired(false)}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                !returnRequired
                  ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-[#142b20] dark:text-white'
                  : 'border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] text-[#5c5647] dark:text-[#b4aca0]'
              }`}
            >
              <Building2 className="w-5 h-5 mx-auto mb-1 text-slate-500" />
              <span className="text-xs sm:text-sm">One-Way Only (At Hospital)</span>
              <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                Companion leaves after hospital tasks
              </p>
            </button>
          </div>

          {returnRequired && (
            <div className="space-y-2 pt-2 border-t border-[#e6dfd3] dark:border-[#283d30]">
              <label className="text-xs font-bold text-[#142b20] dark:text-white block">
                When will you be ready to return?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'after_appointment', label: 'Return after appointment finishes', desc: 'Companion stays and travels back with you' },
                  { id: 'after_discharge', label: 'Return after hospital discharge summary', desc: 'Companion helps complete billing & summary' },
                  { id: 'specific_time', label: 'Return at a specific agreed time', desc: 'Pre-scheduled return cab booking' },
                  { id: 'decide_later', label: 'I\'ll coordinate during the visit', desc: 'Confirm return timing with companion at hospital' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setReturnOption(opt.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      returnOption === opt.id
                        ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-[#142b20] dark:text-white'
                        : 'border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] text-[#5c5647] dark:text-[#b4aca0]'
                    }`}
                  >
                    <span className="text-xs block font-bold">{opt.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          STEP 7: ASSISTANCE SERVICES & MOBILITY
          ========================================================================= */}
      {currentStep === 7 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h3 className="font-bold text-base text-[#142b20] dark:text-white">
              Select services & mobility needs
            </h3>
            <p className="text-xs text-[#5c5647] dark:text-[#b4aca0] mt-0.5">
              Check all administrative and navigational tasks you want your MedBuddy to handle.
            </p>
          </div>

          {/* Mobility Needs */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#142b20] dark:text-white block">
              Patient Mobility Condition:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'independent', label: 'Walking Independently' },
                { id: 'walking_assistance', label: 'Needs Walking Assistance' },
                { id: 'wheelchair', label: 'Uses Wheelchair' },
                { id: 'walking_stick', label: 'Uses Walking Stick' },
                { id: 'extra_assistance', label: 'Needs Extra Physical Support' },
              ].map((mob) => (
                <button
                  key={mob.id}
                  onClick={() => setMobilityRequirement(mob.id as any)}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    mobilityRequirement === mob.id
                      ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-[#142b20] dark:text-white font-bold'
                      : 'border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22] text-[#5c5647] dark:text-[#b4aca0]'
                  }`}
                >
                  {mob.label}
                </button>
              ))}
            </div>
          </div>

          {/* Services Checklist */}
          <div className="space-y-2 pt-2 border-t border-[#e6dfd3] dark:border-[#283d30]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#142b20] dark:text-white">
                Assistance Checklist ({selectedServices.length} selected):
              </label>
              <button
                onClick={() => setSelectedServices(ALL_SERVICES.map((s) => s.id))}
                className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
              >
                Select All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
              {ALL_SERVICES.map((srv) => {
                const isChecked = selectedServices.includes(srv.id);
                return (
                  <button
                    key={srv.id}
                    onClick={() => toggleService(srv.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      isChecked
                        ? 'border-emerald-700/60 dark:border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-[#e6dfd3] dark:border-[#283d30] bg-[#fcfaf6] dark:bg-[#1a2d22]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                        isChecked
                          ? 'bg-emerald-700 text-white'
                          : 'border border-slate-400 dark:border-slate-600'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-[#142b20] dark:text-white block">
                        {srv.label}
                      </span>
                      <span className="text-[10px] text-[#5c5647] dark:text-[#b4aca0] block">
                        {srv.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Important Clinical Boundary:</strong> MedBuddy companions assist strictly with administrative and navigational tasks. They cannot provide medical treatments, administer injections, change dosages, or make clinical decisions.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 8: TRANSPARENT PRICE BREAKDOWN & CONFIRMATION
          ========================================================================= */}
      {currentStep === 8 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h3 className="font-bold text-base text-[#142b20] dark:text-white">
              Transparent Pricing & Booking Review
            </h3>
            <p className="text-xs text-[#5c5647] dark:text-[#b4aca0] mt-0.5">
              Review full itemized companion rates, route distance, and transport estimates before confirmation.
            </p>
          </div>

          {/* Booking Summary Card */}
          <div className="p-4 rounded-2xl bg-[#fcfaf6] dark:bg-[#1a2d22] border border-[#e6dfd3] dark:border-[#283d30] space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Patient</span>
                <span className="font-bold text-[#142b20] dark:text-white">{patientName} ({isForSelf ? 'Self' : patientRelationship}, Age {patientAge})</span>
                <span className="text-slate-500 block">{patientPhone}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Destination Hospital</span>
                <span className="font-bold text-[#142b20] dark:text-white">{customHospitalName.trim() || selectedHospital.name}</span>
                <span className="text-slate-500 block truncate">{customHospitalAddress.trim() || selectedHospital.address}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Pickup Location</span>
                <span className="font-bold text-[#142b20] dark:text-white">{pickupAddress}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Schedule & Estimated Duration</span>
                <span className="font-bold text-[#142b20] dark:text-white">
                  {isAsap ? 'As Soon As Possible (Arrival in ~20-35 mins)' : `${scheduledDate} at ${scheduledTime}`}
                </span>
                <span className="text-slate-500 block">Total Est: ~{priceSnapshot.estimatedCompanionHours} hours</span>
              </div>
            </div>
          </div>

          {/* Transparent Itemized Price Table */}
          <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800">
              <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                Itemized Price Breakdown (Snapshot Saved with Booking)
              </span>
              <span className="font-mono text-[11px] text-emerald-800 dark:text-emerald-400 font-bold">
                INR (₹)
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#142b20] dark:text-white">MedBuddy Companion Assistance</span>
                  <p className="text-[10px] text-slate-500">Includes base dispatch + ~{priceSnapshot.estimatedCompanionHours} hrs duration</p>
                </div>
                <span className="font-bold text-[#142b20] dark:text-white font-mono">
                  ₹{priceSnapshot.companionFee}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#142b20] dark:text-white">Outbound Estimated Transport</span>
                  <p className="text-[10px] text-slate-500">Home → Hospital (~{priceSnapshot.outboundDistanceKm} km road distance)</p>
                </div>
                <span className="font-bold text-[#142b20] dark:text-white font-mono">
                  ₹{priceSnapshot.outboundTransportMin} – ₹{priceSnapshot.outboundTransportMax}
                </span>
              </div>

              {priceSnapshot.returnRequired && (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#142b20] dark:text-white">Return Estimated Transport</span>
                    <p className="text-[10px] text-slate-500">Hospital → Home (~{priceSnapshot.returnDistanceKm} km road distance)</p>
                  </div>
                  <span className="font-bold text-[#142b20] dark:text-white font-mono">
                    ₹{priceSnapshot.returnTransportMin} – ₹{priceSnapshot.returnTransportMax}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#142b20] dark:text-white">Platform & Safety Operations Fee</span>
                  <p className="text-[10px] text-slate-500">Identity verification, 4-digit PIN protocol & support</p>
                </div>
                <span className="font-bold text-[#142b20] dark:text-white font-mono">
                  ₹{priceSnapshot.platformFee}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#142b20] dark:text-white">Applicable Taxes (5% GST)</span>
                </div>
                <span className="font-bold text-[#142b20] dark:text-white font-mono">
                  ₹{priceSnapshot.taxAmount}
                </span>
              </div>

              <div className="pt-2 border-t border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-sm sm:text-base font-extrabold text-emerald-950 dark:text-emerald-200">
                <span>Total Estimated Cost</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-300">
                  ₹{priceSnapshot.estimatedTotalMin} – ₹{priceSnapshot.estimatedTotalMax}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1">
              * Transport fares are calculated from real city route distances. Final cab fare may vary based on the selected cab provider meter, live traffic, and waiting time.
            </p>
          </div>

          {/* Cancellation Policy Box */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#182a20] border border-slate-200 dark:border-[#283d30] text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Cancellation Policy:</span>
            <p>{priceSnapshot.cancellationPolicy.description}</p>
          </div>

          {/* Safety Acknowledgement Checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 cursor-pointer">
            <input
              type="checkbox"
              checked={safetyAcknowledged}
              onChange={(e) => setSafetyAcknowledged(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-emerald-700 rounded focus:ring-emerald-500"
            />
            <span className="text-xs text-[#142b20] dark:text-white leading-relaxed">
              <strong>I understand and acknowledge:</strong> MedBuddy is a non-clinical human companion service for administrative, travel, and OPD navigation support. MedBuddies do NOT perform medical procedures or make clinical decisions. For medical emergencies, I will use ambulance/SOS services.
            </span>
          </label>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#e6dfd3] dark:border-[#24382c]">
        {currentStep > 1 ? (
          <button
            onClick={() => setCurrentStep((prev) => prev - 1)}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-[#e6dfd3] dark:border-[#283d30] text-xs font-bold text-[#142b20] dark:text-white hover:bg-slate-50 dark:hover:bg-[#1c2e23] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#e6dfd3] dark:border-[#283d30] text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c2e23] transition-all cursor-pointer"
          >
            Cancel
          </button>
        )}

        {currentStep < 8 ? (
          <button
            onClick={() => {
              if (currentStep === 1 && emergencyWarning) {
                alert('Please address the emergency symptoms warning before booking MedBuddy.');
                return;
              }
              if (currentStep === 2 && (!patientName.trim() || !patientPhone.trim())) {
                alert('Please enter patient name and phone number.');
                return;
              }
              if (currentStep === 3 && !pickupAddress.trim()) {
                alert('Please enter pickup address.');
                return;
              }
              setCurrentStep((prev) => prev + 1);
            }}
            className="px-6 py-2.5 bg-[#1b3b2b] hover:bg-[#142e22] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleConfirmBooking}
            disabled={!safetyAcknowledged || isSubmitting}
            className={`px-8 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer ${
              safetyAcknowledged && !isSubmitting
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <JevanCareLoader size="xs" color="white" />
                <span>Confirming Booking...</span>
              </>
            ) : (
              <>
                <span>Confirm MedBuddy Booking</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
};
