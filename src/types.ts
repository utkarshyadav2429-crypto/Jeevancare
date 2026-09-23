export type UserRole = 'patient' | 'doctor' | 'admin' | 'medbuddy';
export type RoleType = 'Patient' | 'Doctor' | 'MedBuddy';
export type AuthMode = 'ACCOUNT' | 'DEMO' | 'LOADING' | 'SIGNED_OUT';

export interface SavedGoogleAccount {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  lastUsed: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContacts?: EmergencyContact[];
  mfaEnabled?: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isEmergencySharingEnabled?: boolean;
  abhaNumber?: string;
  abhaAddress?: string;
  abhaLinked?: boolean;
  abhaLinkedAt?: string;
  state?: string;
  district?: string;
  city?: string;
  economicProfile?: EconomicProfile;
  // Doctor specific profile fields
  registrationNumber?: string;
  medicalCouncil?: string;
  specialty?: string;
  qualification?: string;
  hospitalAffiliation?: string;
  experienceYears?: number;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
  canSwitchRole?: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface ActiveMedicine {
  id: string;
  name: string;
  salt: string;
  dosage: string;
  frequency: string; // e.g. "Twice daily after meals"
  duration: string;
  startDate: string;
  endDate?: string;
  doctorName?: string;
  instructions?: string;
  remainingDoses: number;
  totalDoses: number;
  refillRequired?: boolean;
  prescribedFor?: string;
}

export interface ExtractedMedicineItem {
  id?: string;
  name: string;
  brandName?: string;
  activeIngredient?: string;
  salt?: string; // alias for activeIngredient
  strength?: string;
  dosage?: string; // alias for strength
  dosageForm?: string;
  quantity?: string;
  frequency: string;
  duration: string;
  instructions?: string;
  doctorNotes?: string;
  status: 'Prescribed medicine' | 'Possible medicine match';
  confidence: 'High' | 'Needs Confirmation' | 'Low Clarity';
  isUnclear: boolean;
  unclearReason?: string;
}

export interface ScannedPrescriptionResult {
  id: string;
  medicines: ExtractedMedicineItem[];
  doctorName: string;
  hospitalName: string;
  date: string;
  rawNotes?: string;
  potentialRisks?: string[];
  scannedAt: string;
  imageUrl?: string;
}

export interface PharmacyListing {
  pharmacyId: string;
  pharmacyName: string;
  pharmacyType: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  openStatus: string;
  distanceKm: number;
  brandName: string;
  packSize: number;
  packPrice: number | null;
  pricePerUnit: number | null;
  availability: 'Available' | 'Out of Stock' | 'Availability not verified';
  verifiedTimestamp: string | null;
  isVerifiedPrice: boolean;
}

export interface MedicinePharmacyComparison {
  medicineName: string;
  activeIngredient: string;
  strength: string;
  dosageForm: string;
  quantity: string;
  bestVerifiedOption: {
    pricePerUnit: number;
    packPrice: number;
    packSize: number;
    brandName: string;
    pharmacyName: string;
    address: string;
    distanceKm: number;
    verifiedTimestamp: string;
    lat: number;
    lng: number;
    phone?: string;
  } | null;
  allPharmacies: PharmacyListing[];
}

export interface CompletePrescriptionStore {
  pharmacyId: string;
  pharmacyName: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  distanceKm: number;
  totalPrescriptionPrice: number;
  verifiedTimestamp: string;
  hasAllMedicines: boolean;
}

export interface MedicineDetail {
  id: string;
  name: string;
  saltComposition: string;
  category: string;
  uses: string[];
  sideEffects: string[];
  drugInteractions: string[];
  foodInteractions: string[];
  pregnancyWarning: string;
  allergyWarning: string;
  riskLevel: 'Low' | 'Moderate' | 'High';
  genericAlternatives: {
    name: string;
    manufacturer: string;
    price: number;
  }[];
  brandPrice: number;
  availabilityStatus: 'In Stock' | 'Limited Stock' | 'Out of Stock';
  prescriptionRequired: boolean;
}

export interface MedicineUsageLog {
  id: string;
  medicineName: string;
  takenAt: string;
  status: 'taken' | 'missed' | 'snoozed';
  notes?: string;
}

export interface HealthMetricLog {
  id: string;
  timestamp: string;
  systolicBp?: number;
  diastolicBp?: number;
  bloodSugar?: number; // mg/dL
  weight?: number; // kg
  temperature?: number; // °F
  sleepHours?: number;
  mood?: 'Great' | 'Good' | 'Neutral' | 'Poor' | 'Severe';
  painLevel?: number; // 1-10
  symptoms?: string[];
  notes?: string;
}

export interface HealthProgressAnalysisResult {
  recoveryScore: number;
  healthStatusSummary: string;
  trendAnalysis: string[];
  improvements: string[];
  concerns: string[];
  consultationRecommendation: string;
  lifestyleTips: string[];
}

export type DoctorVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
export type DoctorOnlineStatus = 'online' | 'offline' | 'busy';

export interface DoctorWorkingSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface Doctor {
  id: string;
  userId?: string;
  name: string;
  photoUrl?: string; // Uploaded doctor photo URL from Supabase Storage
  avatarUrl?: string; // Fallback or legacy
  specialty: string;
  qualification: string;
  registrationNumber: string; // Medical Council Registration Number
  registrationAuthority: string; // e.g. "Uttar Pradesh Medical Council"
  experienceYears: number;
  languages: string[]; // Spoken languages e.g. ['Hindi', 'English', 'Urdu']
  country: string; // e.g. 'India'
  state: string; // e.g. 'Uttar Pradesh'
  city: string; // e.g. 'Lucknow'
  hospital: string; // Hospital/clinic affiliation
  address: string; // Practice address
  fees: number;
  consultationTypes: ('In-Person' | 'Audio' | 'Video')[];
  about: string; // Professional bio
  verificationStatus: DoctorVerificationStatus;
  verified: boolean; // boolean alias for verificationStatus === 'VERIFIED'
  onlineStatus: DoctorOnlineStatus;
  availableDays: string[];
  availableSlots: string[];
  workingSchedule?: DoctorWorkingSlot[];
  consultationDurationMins?: number;
  createdAt?: string;
  lastActiveAt?: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  rating?: number; // Only from real reviews if present, default 0
  reviewsCount?: number; // Real reviews count
}

export type AppointmentStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'UPCOMING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  patientName: string;
  patientId?: string;
  date: string;
  timeSlot: string;
  type: 'In-Person' | 'Audio' | 'Video';
  status: AppointmentStatus;
  fees: number;
  notes?: string;
  prescriptionsShared?: string[];
  createdAt?: string;
}

export interface ConsultationMessage {
  id: string;
  sender: 'doctor' | 'patient' | 'system';
  text: string;
  timestamp: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface NearbyFacility {
  id: string;
  name: string;
  type: 'Hospital' | 'Clinic' | 'Pharmacy' | 'Blood Bank' | 'Diagnostic Lab' | 'Ambulance';
  address: string;
  phone: string;
  lat: number;
  lng: number;
  distanceKm: number;
  openStatus: string;
  emergencyBedsAvailable?: number;
  bloodStock?: Record<string, 'Available' | 'Low' | 'Out of Stock'>;
  rating: number;
}

export type RumorClassification = 'True' | 'False' | 'Misleading' | 'Partially True';

export interface FactCheckResult {
  id: string;
  claim: string;
  classification: RumorClassification;
  explanation: string;
  keyTakeaways: string[];
  trustedReferences: { title: string; url: string }[];
  safeGuidance: string;
  checkedAt: string;
}

export interface HealthAssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  imageUrl?: string;
  audioUrl?: string;
  hasRedFlags?: boolean;
  isEmergency?: boolean;
  voiceText?: string;
  detectedLanguage?: 'en' | 'hi' | 'hinglish';
  emotionDetected?: string;
  followUpQuestion?: string;
}

export interface HomeCareGuide {
  id: string;
  condition: string;
  symptoms: string[];
  homeCareOptions: string[];
  whenToConsultDoctor: string[];
  emergencyWarningSigns: string[];
  category: string;
}

export interface VaultItem {
  id: string;
  title: string;
  category: 'Prescription' | 'Doctor Note' | 'Lab Report' | 'X-Ray / Scan' | 'ECG' | 'Vaccination' | 'Insurance' | 'Bill' | 'Allergy Record' | 'Discharge Summary';
  doctorName?: string;
  diseaseOrTag?: string;
  date: string;
  fileSize: string;
  fileType: 'pdf' | 'jpg' | 'png' | 'doc';
  fileUrl?: string;
  notes?: string;
  sharedLink?: string;
  sharedExpiry?: string;
  isImportant?: boolean;
}

export interface HealthTimelineEvent {
  id: string;
  date: string;
  title: string;
  type: 'diagnosis' | 'medication' | 'surgery' | 'lab_test' | 'vaccination' | 'doctor_visit';
  description: string;
  doctorOrHospital?: string;
  relatedVaultItemId?: string;
}

export interface RiskAlert {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
  affectedMedicines?: string[];
  detectedAt: string;
}

export interface Reminder {
  id: string;
  medicineName: string;
  dosage: string;
  times: string[]; // e.g. ["08:00", "20:00"]
  isActive: boolean;
  daysOfWeek: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  instructions?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'reminder' | 'report' | 'emergency' | 'insight';
  timestamp: string;
  read: boolean;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  type: 'SOAP Note' | 'Progress Note' | 'Discharge Summary' | 'Pre-Op Evaluation';
  subjective: string; // Patient symptoms & complaints
  objective: string;   // Vitals & physical examination
  assessment: string;  // Diagnosis / Clinical impressions
  plan: string;        // Medication, tests, follow-up
  vitals?: {
    bp?: string;
    pulse?: number;
    temp?: number;
    spO2?: number;
  };
  doctorSignature: string;
  isLocked: boolean;
}

export interface DoctorPatientMessage {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  senderRole: 'doctor' | 'patient';
  text: string;
  timestamp: string;
  attachmentUrl?: string;
  attachmentTitle?: string;
  isUrgent?: boolean;
}

export interface PatientSummaryForDoctor {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  allergies: string[];
  chronicConditions: string[];
  abhaNumber?: string;
  lastVisitDate?: string;
  recentVitalsSummary?: string;
  activeMedCount: number;
  vaultDocCount: number;
}

// ============================================================================
// BLOOD DONATION NETWORK TYPES
// ============================================================================

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type ContactMethod = 'Email' | 'Phone' | 'Both';
export type AvailabilityStatus = 'Available' | 'Emergency Only' | 'Currently Unavailable';

export interface BloodDonor {
  id: string;
  user_id: string;
  fullName: string;
  email: string;
  phone?: string;
  bloodGroup: BloodGroup;
  city: string;
  state: string;
  country: string;
  preferredContactMethod: ContactMethod;
  availability: AvailabilityStatus;
  lastDonationDate?: string;
  consentGiven: boolean;
  consentGivenAt: string;
  notificationsPaused: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VerifiedBloodOrganization {
  id: string;
  name: string;
  orgType: 'Hospital' | 'Red Cross' | 'Government Blood Bank' | 'Registered NGO';
  verificationStatus: 'VERIFIED' | 'PENDING';
  city: string;
  state: string;
  country: string;
  officialWebsite?: string;
  contactEmail?: string;
  requirements?: string;
  supportedBloodGroups: BloodGroup[];
}

export interface BloodRequest {
  id: string;
  orgId: string;
  orgName: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgency: 'CRITICAL' | 'URGENT' | 'STANDARD';
  hospitalName: string;
  city: string;
  state: string;
  contactEmail: string;
  additionalInstructions?: string;
  createdAt: string;
  status: 'OPEN' | 'FULFILLED' | 'EXPIRED';
}

export interface DonorRequestMatch {
  id: string;
  requestId: string;
  donorId: string;
  status: 'NOTIFIED' | 'RESPONDED_YES' | 'RESPONDED_NO';
  notifiedAt: string;
  respondedAt?: string;
}

// ============================================================================
// JEEVANCARE 2.0: HEALTHCARE ACCESSIBILITY & AFFORDABILITY INTELLIGENCE
// ============================================================================

export type OccupationCategory =
  | 'Organized Sector / Salaried'
  | 'Unorganized / Informal / Gig'
  | 'Agriculture / Farming'
  | 'Self-Employed / Small Business'
  | 'Daily Wage Earner'
  | 'Retired / Pensioner / Senior'
  | 'Student / Homemaker'
  | 'Unemployed';

export type RationCardType =
  | 'Antyodaya Anna Yojana (AAY - Poorest of Poor)'
  | 'Priority Household (BPL / PHH)'
  | 'State Food Security (NFSA)'
  | 'Non-NFSA / Above Poverty Line (APL)'
  | 'None / Not Applicable';

export type IncomeBracket =
  | 'Below ₹1,00,000 / year (Under ₹8.3k/mo)'
  | '₹1,00,000 - ₹2,50,000 / year (₹8.3k - ₹20.8k/mo)'
  | '₹2,50,000 - ₹5,00,000 / year (₹20.8k - ₹41.6k/mo)'
  | '₹5,00,000 - ₹10,00,000 / year (₹41.6k - ₹83.3k/mo)'
  | 'Above ₹10,00,000 / year (Above ₹83.3k/mo)';

export interface EconomicProfile {
  id: string;
  userId: string;
  monthlyHouseholdIncome: number; // in INR
  annualHouseholdIncome: number; // in INR
  incomeBracket: IncomeBracket;
  familySize: number;
  dependentsCount: number;
  seniorDependentsCount: number;
  childDependentsCount: number;
  occupationCategory: OccupationCategory;
  rationCardType: RationCardType;
  areaType: 'Rural' | 'Semi-Urban' | 'Urban';
  state: string;
  district: string;
  hasAyushmanCard: boolean;
  ayushmanCardNumber?: string;
  hasStateHealthCard: boolean;
  stateHealthCardName?: string;
  hasPrivateInsurance: boolean;
  privateInsuranceSumInsured?: number;
  hasDisabilityOrSpecialCategory: boolean;
  specialCategoryNotes?: string;
  consentGiven: boolean;
  consentGivenAt: string;
  lastUpdated: string;
}

export type SchemeCoverageCategory =
  | 'Hospitalization & Surgeries'
  | 'Generic Medicines & Discounts'
  | 'Critical Illness Emergency Relief'
  | 'Direct Financial Grant / e-Kosh'
  | 'Elderly & Geriatric Healthcare'
  | 'Maternal & Child Health'
  | 'Diagnostic Subsidy';

export type PotentialMatchLevel = 'Strong Potential Match' | 'Potential Match' | 'General Universal Benefit' | 'Criteria Not Met';

export interface GovernmentBenefitScheme {
  id: string;
  code: string;
  name: string;
  shortName: string;
  authority: string; // e.g. 'National Health Authority (MoHFW)' or 'Govt of Uttar Pradesh'
  level: 'Central / National' | 'State Government' | 'Autonomous Fund';
  applicableStates: string[]; // ['ALL'] or specific states e.g. ['Uttar Pradesh']
  category: SchemeCoverageCategory;
  coverageAmountDescription: string;
  maxFinancialAssistance: number; // in INR e.g. 500000
  incomeCeilingAnnual?: number; // max income limit if any
  eligibleRationCards?: RationCardType[];
  targetBeneficiaries: string[];
  keyBenefits: string[];
  eligibilitySummary: string[];
  requiredDocuments: string[];
  applicationPortalUrl: string;
  officialHelpline: string;
  eKoshTreasuryIntegrated?: boolean;
  verificationMethod: string;
  lastVerifiedDate: string;
}

export interface SchemeMatchingResult {
  scheme: GovernmentBenefitScheme;
  matchLevel: PotentialMatchLevel;
  matchPercentage: number; // 0-100
  matchingFactors: string[];
  missingOrUnmetFactors: string[];
  actionSteps: string[];
  disclaimer: string;
}

export type FinancialBurdenTier = 'Low (<5%)' | 'Moderate (5-15%)' | 'High / Catastrophic (>15%)' | 'Severe (>25%)';

export interface HealthFinancialBurdenAnalysis {
  monthlyEstimatedMedsBrandedCost: number;
  monthlyEstimatedMedsGenericCost: number;
  monthlyEstimatedDiagnosticsCost: number;
  monthlyEstimatedDoctorVisitsCost: number;
  totalMonthlyEstimatedHealthcareCost: number;
  monthlyHouseholdIncome: number;
  burdenRatioPercentage: number;
  burdenTier: FinancialBurdenTier;
  monthlyPotentialGenericSavings: number;
  annualPotentialGenericSavings: number;
  janaushadhiAvailabilityNote: string;
  recommendedAssistanceSchemes: SchemeMatchingResult[];
  costMitigationStrategy: string[];
}

// ============================================================================
// OFFICIAL BLOOD AVAILABILITY & e-RAKTKOSH TYPES
// ============================================================================

export type BloodComponentType =
  | 'Whole Blood'
  | 'Packed Red Blood Cells (PRBC)'
  | 'Platelet Concentrate (RDP)'
  | 'Single Donor Platelets (SDP)'
  | 'Fresh Frozen Plasma (FFP)'
  | 'Cryoprecipitate';

export type FacilityTier = 'Government Medical College' | 'District Hospital Blood Bank' | 'Red Cross Society' | 'Licensed Private Blood Center' | 'Charitable Trust';

export type DataFreshnessTier = 'Live Updated (<30m)' | 'Recent (<4h)' | 'Same-Day (<24h)' | 'Verification Recommended (>24h)';

export interface OfficialBloodUnitRecord {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityTier: FacilityTier;
  licenseNumber: string;
  state: string;
  district: string;
  city: string;
  address: string;
  phone: string;
  emergencyHelpline?: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  availableUnits: number;
  stockStatus: 'Adequate Stock' | 'Low Stock' | 'Critical Shortage' | 'Out of Stock';
  lastReportedTimestamp: string;
  freshnessTier: DataFreshnessTier;
  freshnessMinutes: number;
  officialSource: 'e-RaktKosh National Portal' | 'State Blood Transfusion Council' | 'Hospital Live Feed';
  verifiedByNodalOfficer: boolean;
  componentProcessingCapabilities: BloodComponentType[];
  operatingHours: string;
  is24x7: boolean;
}

export interface BloodCompatibilityInfo {
  bloodGroup: BloodGroup;
  canGiveWholeBloodAndRBC: BloodGroup[];
  canReceiveWholeBloodAndRBC: BloodGroup[];
  canGivePlasma: BloodGroup[];
  canReceivePlasma: BloodGroup[];
  isUniversalRBCDonor: boolean;
  isUniversalRBCRecipient: boolean;
  isUniversalPlasmaDonor: boolean;
  isUniversalPlasmaRecipient: boolean;
  rarityDescription: string;
}

export interface AccessibilityScoreBreakdown {
  overallScore: number; // 0-100
  ratingTier: 'Excellent' | 'Good' | 'Moderate' | 'Vulnerable' | 'Critical Needs';
  dimensions: {
    affordability: { score: number; max: 30; label: string; insight: string };
    resourceProximity: { score: number; max: 25; label: string; insight: string };
    schemeProtection: { score: number; max: 25; label: string; insight: string };
    emergencyReadiness: { score: number; max: 20; label: string; insight: string };
  };
  keyActionItems: string[];
  generatedAt: string;
}

export interface HealthcarePathwaySelection {
  primaryNeed: 'prescription_cost' | 'government_scheme' | 'blood_emergency' | 'doctor_specialist' | 'diagnostic_support' | 'general_guidance';
  urgency: 'routine' | 'urgent' | 'emergency';
  targetConditionOrMedicine?: string;
  preferredFacilityType?: 'government' | 'janaushadhi' | 'private' | 'any';
}

// ============================================================================
// MEDBUDDY HUMAN HEALTHCARE COMPANION DOMAIN MODELS
// ============================================================================

export type MedBuddyBookingStatus =
  | 'REQUESTED'
  | 'SEARCHING_FOR_BUDDY'
  | 'BUDDY_ASSIGNED'
  | 'BUDDY_EN_ROUTE'
  | 'BUDDY_ARRIVED'
  | 'PICKUP_CONFIRMED'
  | 'TRAVELLING_TO_HOSPITAL'
  | 'ARRIVED_AT_HOSPITAL'
  | 'REGISTRATION_ASSISTANCE'
  | 'WAITING_WITH_PATIENT'
  | 'DISCHARGE_ASSISTANCE'
  | 'RETURN_TRIP'
  | 'DROPPED_HOME'
  | 'COMPLETED'
  | 'CANCELLED';

export type MedBuddyVerificationStatus = 'pending' | 'verified' | 'suspended';

export type MedBuddyAvailability = 'available' | 'busy' | 'offline' | 'suspended';

export type CabBookingState =
  | 'FARE_ESTIMATED'
  | 'CAB_REQUESTED'
  | 'CAB_CONFIRMED'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVING'
  | 'RIDE_STARTED'
  | 'RIDE_COMPLETED'
  | 'CAB_CANCELLED';

export interface MedBuddyProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  photo: string;
  gender: 'Female' | 'Male' | 'Other';
  age: number;
  rating: number;
  reviewCount: number;
  completedTrips: number;
  verificationStatus: MedBuddyVerificationStatus;
  backgroundVerified: boolean;
  trainingCompleted: boolean;
  languages: string[];
  serviceArea: string;
  currentAvailability: MedBuddyAvailability;
  currentCoordinates?: { lat: number; lng: number };
  bio?: string;
  experienceYears?: number;
  activeBookingId?: string | null;
  joinedDate: string;
}

export interface MedBuddyPricingConfig {
  baseServiceFee: number; // e.g. 299 for initial 1 hour companion
  hourlyRate: number; // e.g. 149/hr
  additionalHourRate: number; // e.g. 149/hr
  nightSurcharge: number; // e.g. 99 (8 PM - 6 AM)
  weekendSurcharge: number; // e.g. 49
  platformFee: number; // e.g. 39
  cancellationFee: number; // e.g. 99
  taxRate: number; // e.g. 0.05 (5% GST)
  includedWaitingMinutes: number; // e.g. 30
  extraWaitingPerMinuteRate: number; // e.g. 2
}

export interface TransportPricingConfig {
  baseFare: number; // e.g. 50
  perKm: number; // e.g. 14
  perMinute: number; // e.g. 2
  bookingFee: number; // e.g. 20
  taxPercent: number; // e.g. 5
  surgeMultiplier: number; // default 1.0
}

export interface PriceSnapshot {
  pricingConfigVersion: string;
  baseServiceFee: number;
  hourlyRate: number;
  estimatedCompanionHours: number;
  companionFee: number;
  platformFee: number;
  taxRate: number;
  taxAmount: number;
  // Outbound Transport
  outboundDistanceKm: number;
  outboundDurationMinutes: number;
  outboundTransportMin: number;
  outboundTransportMax: number;
  // Return Transport
  returnRequired: boolean;
  returnDistanceKm: number;
  returnDurationMinutes: number;
  returnTransportMin: number;
  returnTransportMax: number;
  // Aggregates
  totalTransportMin: number;
  totalTransportMax: number;
  estimatedTotalMin: number;
  estimatedTotalMax: number;
  currency: string;
  cancellationPolicy: {
    freeCancellationMinutes: number;
    fee: number;
    description: string;
  };
}

export interface MedBuddyBookingTask {
  id: string;
  title: string;
  category: 'pickup' | 'hospital' | 'admin' | 'return';
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface MedBuddyBookingEvent {
  id: string;
  bookingId: string;
  eventType: string;
  actorId: string;
  actorRole: 'patient' | 'buddy' | 'admin' | 'system';
  timestamp: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface MedBuddyBooking {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isForSelf: boolean;
  patientRelationship?: string;
  patientAge?: number;
  
  // Need & Screening
  reasonCategory: string; // 'Hospital visit' | 'Doctor appointment' | 'Diagnostic test' | 'Follow-up visit' | 'Discharge assistance' | 'Other'
  customReason?: string;
  emergencyScreeningCleared: boolean;
  
  // Locations
  pickupAddress: string;
  pickupCoordinates: { lat: number; lng: number };
  destinationPlaceId?: string;
  destinationName: string;
  destinationAddress: string;
  destinationCoordinates: { lat: number; lng: number };
  destinationPhone?: string;
  destinationMapsUrl?: string;
  
  // Timing & Duration
  scheduledAt: string;
  isAsap: boolean;
  estimatedArrivalWindow?: string;
  expectedHospitalDuration: string; // '<1 hour' | '1–2 hours' | '2–4 hours' | '4–6 hours' | 'Not sure'
  estimatedTotalDurationMinutes: number;
  
  // Return & Services
  returnRequired: boolean;
  returnOption: 'after_appointment' | 'specific_time' | 'after_discharge' | 'decide_later';
  requestedServices: string[];
  mobilityRequirement: 'independent' | 'walking_assistance' | 'wheelchair' | 'walking_stick' | 'extra_assistance';
  
  // Pricing
  priceSnapshot: PriceSnapshot;
  
  // Status & Assignment
  status: MedBuddyBookingStatus;
  assignedBuddyId?: string | null;
  assignedBuddy?: MedBuddyProfile | null;
  pickupPin: string; // 4-digit verification PIN
  
  // Tasks & Progress
  tasks: MedBuddyBookingTask[];
  events: MedBuddyBookingEvent[];
  
  // Transport Sub-state
  cabStatus: CabBookingState;
  cabProviderName?: string;
  
  // Payment
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'cash' | 'test_mode';
  paymentId?: string;
  
  // Closure
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: 'patient' | 'buddy' | 'admin' | 'system';
  rating?: number;
  reviewFeedback?: string;
  ratedAt?: string;
  
  createdAt: string;
  updatedAt: string;
  isDemoData?: boolean;
}




