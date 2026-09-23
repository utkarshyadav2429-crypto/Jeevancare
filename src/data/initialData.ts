import {
  UserProfile,
  ActiveMedicine,
  MedicineDetail,
  Doctor,
  Appointment,
  NearbyFacility,
  HomeCareGuide,
  VaultItem,
  HealthTimelineEvent,
  RiskAlert,
  Reminder,
  AppNotification,
  HealthMetricLog
} from '../types';

export const initialProfile: UserProfile = {
  id: 'usr_001',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@health.in',
  role: 'patient',
  phone: '+91 98765 43210',
  age: 34,
  gender: 'Male',
  bloodGroup: 'O+',
  allergies: ['Penicillin', 'Dust Mites'],
  chronicConditions: ['Mild Asthma', 'Seasonal Rhinitis'],
  mfaEnabled: true,
  abhaNumber: '91-3842-9102-4821',
  abhaAddress: 'aaravsharma@abha',
  abhaLinked: true,
  abhaLinkedAt: '06/08/2026',
  emergencyContacts: [
    { id: 'ec_1', name: 'Pooja Sharma', relation: 'Spouse', phone: '+91 98765 12345' },
    { id: 'ec_2', name: 'Dr. Rajeshwar K. Tripathi', relation: 'Primary Physician (KGMU)', phone: '+91 522 225 7540' }
  ]
};

export const initialActiveMedicines: ActiveMedicine[] = [
  {
    id: 'med_01',
    name: 'Amoxicillin Trihydrate',
    salt: 'Amoxicillin 500mg',
    dosage: '500 mg',
    frequency: '3 times daily (After meals)',
    duration: '7 Days',
    startDate: '2026-08-01',
    endDate: '2026-08-08',
    doctorName: 'Dr. Rajeshwar K. Tripathi',
    instructions: 'Finish full course even if feeling better. Do not skip doses.',
    remainingDoses: 6,
    totalDoses: 21,
    refillRequired: false,
    prescribedFor: 'Upper Respiratory Infection'
  },
  {
    id: 'med_02',
    name: 'Montelukast Sodium',
    salt: 'Montelukast 10mg',
    dosage: '10 mg',
    frequency: 'Once daily at bedtime',
    duration: '30 Days',
    startDate: '2026-07-15',
    endDate: '2026-08-15',
    doctorName: 'Dr. Priya Sharma',
    instructions: 'Take regularly every night. Avoid stopping abruptly.',
    remainingDoses: 9,
    totalDoses: 30,
    refillRequired: true,
    prescribedFor: 'Asthma & Allergy Control'
  },
  {
    id: 'med_03',
    name: 'Metformin Hydrochloride',
    salt: 'Metformin 500mg ER',
    dosage: '500 mg Extended Release',
    frequency: 'Twice daily with meals',
    duration: '90 Days',
    startDate: '2026-06-01',
    endDate: '2026-09-01',
    doctorName: 'Dr. Vikramaditya Verma',
    instructions: 'Take with food to minimize stomach upset.',
    remainingDoses: 42,
    totalDoses: 180,
    refillRequired: false,
    prescribedFor: 'Blood Sugar Regulation'
  }
];

export const initialMedicineDirectory: MedicineDetail[] = [
  {
    id: 'drug_01',
    name: 'Amoxicillin Trihydrate',
    saltComposition: 'Amoxicillin 500mg',
    category: 'Antibiotic (Penicillin class)',
    uses: ['Bacterial Respiratory Infections', 'Otitis Media (Ear infection)', 'Strep Throat', 'Skin & Soft Tissue Infections'],
    sideEffects: ['Nausea', 'Mild Diarrhea', 'Stomach Cramps', 'Mild Skin Rash'],
    drugInteractions: ['Warfarin (Increased bleeding risk)', 'Oral Contraceptives (Reduced efficacy)', 'Allopurinol (Increased rash risk)'],
    foodInteractions: ['Can be taken with or without food. Drink plenty of water.'],
    pregnancyWarning: 'Category B - Generally considered safe under medical supervision.',
    allergyWarning: 'STRICTLY CONTRAINDICATED in patients with known Penicillin or Cephalosporin allergy.',
    riskLevel: 'Moderate',
    brandPrice: 140.00,
    genericAlternatives: [
      { name: 'Generic Amoxicillin', manufacturer: 'Sun Pharma', price: 35.00 },
      { name: 'Moxclav Generic', manufacturer: 'Cipla Health', price: 42.00 },
      { name: 'Novamox Generic', manufacturer: 'Lupin Labs', price: 38.00 }
    ],
    availabilityStatus: 'In Stock',
    prescriptionRequired: true
  },
  {
    id: 'drug_02',
    name: 'Paracetamol / Acetaminophen',
    saltComposition: 'Paracetamol 650mg',
    category: 'Analgesic & Antipyretic',
    uses: ['Mild to Moderate Pain Relief', 'Fever Reduction', 'Headache & Body Aches', 'Post-Vaccination Soreness'],
    sideEffects: ['Liver toxicity in excessive doses', 'Mild nausea (rare)', 'Allergic reaction (rare)'],
    drugInteractions: ['Alcohol (Severe liver damage risk)', 'Warfarin (Slight INR increase with long use)'],
    foodInteractions: ['Take with water. Limit alcohol strictly while on medication.'],
    pregnancyWarning: 'Category B - Safest first-line painkiller during pregnancy when used as advised.',
    allergyWarning: 'Do not combine with other OTC cold remedies containing paracetamol to prevent overdose.',
    riskLevel: 'Low',
    brandPrice: 45.00,
    genericAlternatives: [
      { name: 'Dolo 650 Generic', manufacturer: 'Micro Labs', price: 14.00 },
      { name: 'Calpol Generic', manufacturer: 'GSK', price: 16.00 }
    ],
    availabilityStatus: 'In Stock',
    prescriptionRequired: false
  },
  {
    id: 'drug_03',
    name: 'Metformin Hydrochloride',
    saltComposition: 'Metformin 500mg Extended Release',
    category: 'Biguanide Antidiabetic Agent',
    uses: ['Type 2 Diabetes Mellitus', 'Insulin Sensitivity Improvement', 'PCOS Glucose Management'],
    sideEffects: ['Gastrointestinal discomfort', 'Flatulence', 'Vitamin B12 deficiency with long use', 'Metallic taste'],
    drugInteractions: ['Contrast Dyes (Lactic acidosis risk - hold 48h before CT)', 'Alcohol (Hypoglycemia)'],
    foodInteractions: ['Take with meal to improve GI tolerance.'],
    pregnancyWarning: 'Category B - Often continued under specialist monitoring.',
    allergyWarning: 'Discontinue immediately if experiencing muscle cramps, fatigue, or difficulty breathing.',
    riskLevel: 'Moderate',
    brandPrice: 160.00,
    genericAlternatives: [
      { name: 'Glycomet SR Generic', manufacturer: 'USV Pharma', price: 32.00 },
      { name: 'Metfor 500 Generic', manufacturer: 'Torrent Pharma', price: 36.00 }
    ],
    availabilityStatus: 'In Stock',
    prescriptionRequired: true
  },
  {
    id: 'drug_04',
    name: 'Atorvastatin Calcium',
    saltComposition: 'Atorvastatin 20mg',
    category: 'HMG-CoA Reductase Inhibitor (Statin)',
    uses: ['Hypercholesterolemia', 'Cardiovascular Risk Reduction', 'Plaque Stabilization'],
    sideEffects: ['Muscle aches (myalgia)', 'Elevated liver enzymes', 'Mild digestive changes'],
    drugInteractions: ['Grapefruit Juice (Inhibits clearance)', 'Ketoconazole', 'Erythromycin'],
    foodInteractions: ['Avoid large amounts of Grapefruit / Grapefruit juice.'],
    pregnancyWarning: 'Category X - CONTRAINDICATED in pregnancy.',
    allergyWarning: 'Report unexplained muscle tenderness or dark urine to doctor immediately.',
    riskLevel: 'Moderate',
    brandPrice: 220.00,
    genericAlternatives: [
      { name: 'Atorva Generic', manufacturer: 'Zydus Cadila', price: 55.00 },
      { name: 'Lipagard Generic', manufacturer: 'Ranbaxy', price: 60.00 }
    ],
    availabilityStatus: 'In Stock',
    prescriptionRequired: true
  }
];

export const initialDoctors: Doctor[] = [
  {
    id: 'doc_101',
    name: 'Dr. Rajeshwar K. Tripathi',
    specialty: 'Pulmonologist',
    qualification: 'MBBS, MD (Internal Med), DM (Pulmonology - KGMU Lucknow)',
    registrationNumber: 'UPMC-48219',
    registrationAuthority: 'Uttar Pradesh Medical Council',
    experienceYears: 18,
    languages: ['Hindi', 'English', 'Urdu'],
    country: 'India',
    state: 'Uttar Pradesh',
    city: 'Lucknow',
    hospital: "King George's Medical University (KGMU), Lucknow",
    address: 'Shah Mina Road, Chowk, Lucknow, UP - 226003',
    lat: 26.8688,
    lng: 80.9163,
    distanceKm: 1.8,
    rating: 0,
    reviewsCount: 0,
    fees: 600,
    consultationTypes: ['Video', 'Audio', 'In-Person'],
    verificationStatus: 'VERIFIED',
    verified: true,
    onlineStatus: 'online',
    availableDays: ['Mon', 'Tue', 'Thu', 'Fri'],
    availableSlots: ['09:30 AM', '11:00 AM', '02:30 PM', '04:15 PM'],
    consultationDurationMins: 20,
    about: 'Senior Pulmonology Specialist at KGMU Lucknow. Expert in asthma, COPD, chest infections, respiratory allergy care, and post-viral recovery.'
  },
  {
    id: 'doc_102',
    name: 'Dr. Ananya Srivastava',
    specialty: 'Cardiologist',
    qualification: 'MBBS, MD (Medicine), DM (Cardiology - SGPGIMS), FACC',
    registrationNumber: 'UPMC-51042',
    registrationAuthority: 'Uttar Pradesh Medical Council',
    experienceYears: 15,
    languages: ['Hindi', 'English'],
    country: 'India',
    state: 'Uttar Pradesh',
    city: 'Lucknow',
    hospital: 'Medanta Hospital, Shaheed Path, Lucknow',
    address: 'Sector A, Sushant Golf City, Shaheed Path, Lucknow, UP - 226030',
    lat: 26.7900,
    lng: 80.9800,
    distanceKm: 4.2,
    rating: 0,
    reviewsCount: 0,
    fees: 1000,
    consultationTypes: ['Video', 'In-Person'],
    verificationStatus: 'VERIFIED',
    verified: true,
    onlineStatus: 'online',
    availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
    availableSlots: ['10:00 AM', '11:30 AM', '03:00 PM', '05:00 PM'],
    consultationDurationMins: 25,
    about: 'Senior Consultant Cardiologist at Medanta Lucknow. Specialized in preventative cardiology, coronary angioplasty, hypertension, and heart failure management.'
  },
  {
    id: 'doc_103',
    name: 'Dr. Vikramaditya Verma',
    specialty: 'Endocrinologist',
    qualification: 'MBBS, MD (Gen Med), DM (Endocrinology - SGPGIMS Lucknow)',
    registrationNumber: 'UPMC-39182',
    registrationAuthority: 'Uttar Pradesh Medical Council',
    experienceYears: 22,
    languages: ['Hindi', 'English'],
    country: 'India',
    state: 'Uttar Pradesh',
    city: 'Lucknow',
    hospital: 'SGPGIMS (Sanjay Gandhi PG Institute), Lucknow',
    address: 'Raebareli Road, Eldeco Udyan II, Lucknow, UP - 226014',
    lat: 26.7460,
    lng: 80.9380,
    distanceKm: 5.5,
    rating: 0,
    reviewsCount: 0,
    fees: 800,
    consultationTypes: ['Video', 'Audio', 'In-Person'],
    verificationStatus: 'VERIFIED',
    verified: true,
    onlineStatus: 'busy',
    availableDays: ['Tue', 'Wed', 'Thu', 'Sat'],
    availableSlots: ['08:30 AM', '10:15 AM', '01:30 PM', '03:45 PM'],
    consultationDurationMins: 20,
    about: 'Eminent Diabetologist and Professor of Endocrinology at SGPGIMS Lucknow. Pioneer in diabetes reversal, thyroid management, and metabolic health.'
  },
  {
    id: 'doc_104',
    name: 'Dr. Priya Sharma',
    specialty: 'General Physician',
    qualification: 'MBBS, MD, DNB (Internal & Respiratory Medicine)',
    registrationNumber: 'UPMC-62910',
    registrationAuthority: 'Uttar Pradesh Medical Council',
    experienceYears: 12,
    languages: ['Hindi', 'English', 'Punjabi'],
    country: 'India',
    state: 'Uttar Pradesh',
    city: 'Lucknow',
    hospital: 'Apollomedics Super Speciality Hospital, Lucknow',
    address: 'Sector B, Bargawan, LDA Colony, Kanpur Road, Lucknow, UP - 226012',
    lat: 26.7865,
    lng: 80.8931,
    distanceKm: 3.4,
    rating: 0,
    reviewsCount: 0,
    fees: 700,
    consultationTypes: ['Video', 'Audio'],
    verificationStatus: 'VERIFIED',
    verified: true,
    onlineStatus: 'online',
    availableDays: ['Mon', 'Tue', 'Wed', 'Fri'],
    availableSlots: ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'],
    consultationDurationMins: 20,
    about: 'Consultant Physician at Apollomedics Lucknow, providing general healthcare, pediatric respiratory support, and acute wellness guidance.'
  },
  {
    id: 'doc_105',
    name: 'Dr. Sameer Deshmukh',
    specialty: 'Neurologist',
    qualification: 'MBBS, MD (Med), DM (Neurology - KEM Hospital Mumbai)',
    registrationNumber: 'MMC-2012/05/1429',
    registrationAuthority: 'Maharashtra Medical Council',
    experienceYears: 16,
    languages: ['English', 'Marathi', 'Hindi'],
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    hospital: 'KEM Hospital & Seth GS Medical College, Mumbai',
    address: 'Acharya Donde Marg, Parel, Mumbai, MH - 400012',
    lat: 19.0024,
    lng: 72.8424,
    distanceKm: 12.0,
    rating: 0,
    reviewsCount: 0,
    fees: 1200,
    consultationTypes: ['Video', 'In-Person'],
    verificationStatus: 'VERIFIED',
    verified: true,
    onlineStatus: 'online',
    availableDays: ['Mon', 'Wed', 'Thu', 'Sat'],
    availableSlots: ['10:00 AM', '12:00 PM', '03:30 PM', '05:30 PM'],
    consultationDurationMins: 30,
    about: 'Chief Neurologist at KEM Hospital Mumbai. Expert in stroke care, migraine protocols, movement disorders, and peripheral neuropathy.'
  },
  {
    id: 'doc_106',
    name: 'Dr. Meenakshi Agarwal',
    specialty: 'Gynecology & Obstetrics',
    qualification: 'MBBS, MS (Obstetrics & Gynecology - KGMU), FICOG',
    registrationNumber: 'UPMC-41209',
    registrationAuthority: 'Uttar Pradesh Medical Council',
    experienceYears: 19,
    languages: ['Hindi', 'English'],
    country: 'India',
    state: 'Uttar Pradesh',
    city: 'Lucknow',
    hospital: 'Max Super Speciality / Sahara Hospital, Gomti Nagar',
    address: 'Viraj Khand 1, Gomti Nagar, Lucknow, UP - 226010',
    lat: 26.8520,
    lng: 80.9980,
    distanceKm: 3.1,
    rating: 0,
    reviewsCount: 0,
    fees: 750,
    consultationTypes: ['Video', 'Audio', 'In-Person'],
    verificationStatus: 'VERIFIED',
    verified: true,
    onlineStatus: 'online',
    availableDays: ['Tue', 'Thu', 'Fri', 'Sat'],
    availableSlots: ['09:30 AM', '11:30 AM', '02:30 PM', '05:00 PM'],
    consultationDurationMins: 20,
    about: 'Senior Consultant Obstetrician & Gynecologist in Gomti Nagar, Lucknow. Specializes in high-risk pregnancies, laparoscopic surgeries, and PCOD care.'
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: 'app_801',
    doctorId: 'doc_101',
    doctorName: 'Dr. Rajeshwar K. Tripathi',
    specialty: 'Pulmonologist',
    patientName: 'Aarav Sharma',
    date: '2026-08-10',
    timeSlot: '11:00 AM',
    type: 'Video',
    status: 'UPCOMING',
    fees: 600,
    notes: 'Follow-up regarding bronchospasm recovery and peak flow readings at KGMU OPD.'
  },
  {
    id: 'app_802',
    doctorId: 'doc_103',
    doctorName: 'Dr. Vikramaditya Verma',
    specialty: 'Endocrinologist',
    patientName: 'Aarav Sharma',
    date: '2026-07-12',
    timeSlot: '01:30 PM',
    type: 'In-Person',
    status: 'COMPLETED',
    fees: 800,
    notes: 'Quarterly HbA1c review (6.2%) at SGPGIMS OPD. Metformin dose adjusted.'
  }
];

export const initialNearbyFacilities: NearbyFacility[] = [
  {
    id: 'fac_01',
    name: "KGMU Emergency & Trauma Centre",
    type: 'Hospital',
    address: 'Shah Mina Road, Chowk, Lucknow, Uttar Pradesh 226003',
    phone: '+91 522 225 7540 / 108 Emergency',
    lat: 26.8688,
    lng: 80.9163,
    distanceKm: 1.8,
    openStatus: 'Open 24/7 (Level-1 Trauma & Emergency)',
    emergencyBedsAvailable: 28,
    bloodStock: { 'O+': 'Available', 'O-': 'Available', 'A+': 'Available', 'B+': 'Available' },
    rating: 4.8
  },
  {
    id: 'fac_02',
    name: 'Pradhan Mantri Jan Aushadhi Kendra (Hazratganj)',
    type: 'Pharmacy',
    address: 'MG Marg, Near Janpath Market, Hazratganj, Lucknow, UP 226001',
    phone: '+91 522 223 4100',
    lat: 26.8500,
    lng: 80.9499,
    distanceKm: 0.8,
    openStatus: 'Open 24/7 (80% Generic Medicine Discount)',
    rating: 4.9
  },
  {
    id: 'fac_03',
    name: 'SGPGIMS Advanced Transfusion & Blood Bank',
    type: 'Blood Bank',
    address: 'Raebareli Road, Eldeco Udyan II, Lucknow, UP 226014',
    phone: '+91 522 249 4000',
    lat: 26.7460,
    lng: 80.9380,
    distanceKm: 4.2,
    openStatus: 'Open 24 Hours (Platelet & Whole Blood)',
    bloodStock: { 'O+': 'Available', 'O-': 'Available', 'A+': 'Available', 'AB+': 'Available', 'B-': 'Low' },
    rating: 4.95
  },
  {
    id: 'fac_04',
    name: 'Apollomedics Diagnostic & MRI Center',
    type: 'Diagnostic Lab',
    address: 'Sector B, Bargawan, Kanpur Road, Lucknow, UP 226012',
    phone: '+91 522 678 8888',
    lat: 26.7865,
    lng: 80.8931,
    distanceKm: 3.1,
    openStatus: 'Closes at 9:00 PM (Home Sample Pickup Available)',
    rating: 4.85
  },
  {
    id: 'fac_05',
    name: '108 UP Health ALS Ambulance Service',
    type: 'Ambulance',
    address: 'Hazratganj Emergency Fleet Hub, Lucknow, UP',
    phone: '108 / Direct +91 522 108 0000',
    lat: 26.8467,
    lng: 80.9462,
    distanceKm: 0.5,
    openStatus: 'On Standby (Avg Arrival 5-7 mins in Lucknow)',
    rating: 4.95
  }
];

export const initialHomeCareGuides: HomeCareGuide[] = [
  {
    id: 'hc_01',
    condition: 'Common Cold & Upper Respiratory Congestion',
    category: 'Respiratory',
    symptoms: ['Runny or stuffy nose', 'Sore throat', 'Mild body aches', 'Low-grade fever (< 100.4°F)'],
    homeCareOptions: [
      'Stay well hydrated with warm water, herbal teas, and clear broths.',
      'Use steam inhalation 2-3 times daily or a cool-mist humidifier.',
      'Saltwater gargle (1/2 tsp salt in warm water) for throat soothing.',
      'Adequate rest for 7-8 hours daily.'
    ],
    whenToConsultDoctor: [
      'Fever exceeds 102°F or persists longer than 3 days.',
      'Symptoms continue worsening beyond 7-10 days.',
      'Persistent sinus pressure and facial pain.'
    ],
    emergencyWarningSigns: [
      'Difficulty breathing, wheezing, or chest tightness.',
      'Inability to keep liquids down / severe dehydration.',
      'Blueish coloration on lips or face.'
    ]
  },
  {
    id: 'hc_02',
    condition: 'Acute Sore Throat & Mild Pharyngitis',
    category: 'ENT',
    symptoms: ['Pain or scratchy sensation in throat', 'Pain when swallowing', 'Swollen neck glands'],
    homeCareOptions: [
      'Warm honey and lemon tea (do not give honey to infants < 1 year).',
      'Warm saltwater gargles every 3-4 hours.',
      'Throat lozenges or hard candies to keep throat moist.',
      'Rest voice and avoid dry, smoky environments.'
    ],
    whenToConsultDoctor: [
      'Severe pain making swallowing liquids impossible.',
      'Visible white patches or pus spots on tonsils.',
      'Fever above 101°F accompanying sore throat.'
    ],
    emergencyWarningSigns: [
      'Difficulty breathing or noisy breathing (stridor).',
      'Inability to open mouth (trismus) or severe neck stiffness.'
    ]
  },
  {
    id: 'hc_03',
    condition: 'Mild Fever & Flu-like Aches',
    category: 'General',
    symptoms: ['Elevated temperature (100°F - 102°F)', 'Chills and sweating', 'Headache & muscle fatigue'],
    homeCareOptions: [
      'Apply lukewarm water sponge compresses on forehead and neck.',
      'Dress in lightweight, breathable clothing. Do not bundle excessively.',
      'Replenish fluids with oral rehydration solution (ORS) or coconut water.',
      'OTC Paracetamol if approved by doctor.'
    ],
    whenToConsultDoctor: [
      'Fever remains above 102°F despite sponge bathing and OTC antipyretics.',
      'Fever lasts more than 72 hours continuously.'
    ],
    emergencyWarningSigns: [
      'Confusion, extreme lethargy, or loss of consciousness.',
      'Unexplained rash that does not fade when pressed.',
      'Stiff neck or severe sensitivity to light.'
    ]
  }
];

export const initialVaultItems: VaultItem[] = [
  {
    id: 'v_101',
    title: 'Pulmonology Consultation & Prescription',
    category: 'Prescription',
    doctorName: 'Dr. Rajeshwar K. Tripathi',
    diseaseOrTag: 'Upper Respiratory Infection',
    date: '2026-08-01',
    fileSize: '1.2 MB',
    fileType: 'pdf',
    notes: 'KGMU Lucknow OPD prescription. Prescribed Amoxicillin course and inhaler dosage guidelines.',
    isImportant: true,
    sharedLink: 'https://jeevancare.in/v/share/p-2026-08-01-rt',
    sharedExpiry: '2026-08-31'
  },
  {
    id: 'v_102',
    title: 'Comprehensive Blood Panel & HbA1c Lab Report',
    category: 'Lab Report',
    doctorName: 'Dr. Vikramaditya Verma',
    diseaseOrTag: 'Metabolic & Diabetes Check',
    date: '2026-07-10',
    fileSize: '3.4 MB',
    fileType: 'pdf',
    notes: 'SGPGIMS Lucknow Lab. HbA1c 6.2%, Lipid profile normal. Fasting glucose 108 mg/dL.',
    isImportant: true
  },
  {
    id: 'v_103',
    title: 'Chest X-Ray PA View & Radiologist Note',
    category: 'X-Ray / Scan',
    doctorName: 'Dr. Ananya Srivastava',
    diseaseOrTag: 'Chest Clear Check',
    date: '2026-05-18',
    fileSize: '8.1 MB',
    fileType: 'jpg',
    notes: 'Medanta Lucknow Radiology. No focal lung consolidation or pleural effusion observed.',
    isImportant: false
  },
  {
    id: 'v_104',
    title: 'COVID-19 Booster & Adult Immunization Certificate',
    category: 'Vaccination',
    doctorName: 'Chief Medical Officer, Lucknow Health Dept',
    diseaseOrTag: 'Vaccination History',
    date: '2025-11-12',
    fileSize: '650 KB',
    fileType: 'pdf',
    notes: 'Official UP Government digital immunization record.',
    isImportant: false
  },
  {
    id: 'v_105',
    title: 'Annual Health Insurance Cover & Ayushman Card',
    category: 'Insurance',
    diseaseOrTag: 'Policy Docs',
    date: '2026-01-01',
    fileSize: '2.1 MB',
    fileType: 'pdf',
    notes: 'Ayushman Bharat ABHA Card & Star Health Policy #UP-9982312. Cashless network hospital pre-authorization.'
  }
];

export const initialHealthTimelineEvents: HealthTimelineEvent[] = [
  {
    id: 'tl_01',
    date: '2026-08-01',
    title: 'Upper Respiratory Tract Infection Treatment Started',
    type: 'medication',
    description: 'Diagnosed with bacterial bronchitis/bronchospasm at KGMU OPD Lucknow. Commenced 7-day course of Amoxicillin 500mg.',
    doctorOrHospital: 'Dr. Rajeshwar K. Tripathi (KGMU Lucknow)',
    relatedVaultItemId: 'v_101'
  },
  {
    id: 'tl_02',
    date: '2026-07-10',
    title: 'Metabolic Health Check & HbA1c Assessment',
    type: 'lab_test',
    description: 'Quarterly blood work at SGPGIMS Lucknow showed HbA1c improvement to 6.2%. Metformin maintained at 500mg ER.',
    doctorOrHospital: 'Dr. Vikramaditya Verma (SGPGIMS Lucknow)',
    relatedVaultItemId: 'v_102'
  },
  {
    id: 'tl_03',
    date: '2026-05-18',
    title: 'Preventative Cardiology & Chest Imaging',
    type: 'diagnosis',
    description: 'Evaluated seasonal bronchospasm at Medanta Lucknow. Chest X-Ray confirmed clear lungs without focal lesion.',
    doctorOrHospital: 'Dr. Ananya Srivastava (Medanta Lucknow)',
    relatedVaultItemId: 'v_103'
  },
  {
    id: 'tl_04',
    date: '2025-11-12',
    title: 'Immunization Record Update',
    type: 'vaccination',
    description: 'Received Annual Influenza vaccine and COVID-19 booster dose at Lucknow Health Hub.',
    doctorOrHospital: 'Chief Medical Office, Lucknow',
    relatedVaultItemId: 'v_104'
  }
];

export const initialRiskAlerts: RiskAlert[] = [
  {
    id: 'risk_01',
    title: 'Potential Prolonged Antibiotic Usage Alert',
    severity: 'medium',
    description: 'AI detected 2 antibiotic prescriptions within 60 days. Excessive or repeated use can increase risk of antibiotic resistance or gut flora imbalance.',
    recommendation: 'Consult your prescribing doctor before repeating any antibiotic course.',
    affectedMedicines: ['Amoxicillin Trihydrate'],
    detectedAt: '2026-08-02'
  }
];

export const initialReminders: Reminder[] = [
  {
    id: 'rem_1',
    medicineName: 'Amoxicillin Trihydrate (500mg)',
    dosage: '1 Capsule',
    times: ['08:00', '14:00', '20:00'],
    isActive: true,
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    instructions: 'Take after food with a full glass of water.'
  },
  {
    id: 'rem_2',
    medicineName: 'Montelukast Sodium (10mg)',
    dosage: '1 Tablet',
    times: ['21:30'],
    isActive: true,
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    instructions: 'Take at bedtime.'
  },
  {
    id: 'rem_3',
    medicineName: 'Metformin 500mg ER',
    dosage: '1 Tablet',
    times: ['08:30', '19:30'],
    isActive: true,
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    instructions: 'Take during or immediately after meals.'
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'Upcoming Appointment Reminder',
    message: 'You have a Video Consultation with Dr. Rajeshwar K. Tripathi on Aug 10, 2026 at 11:00 AM.',
    type: 'appointment',
    timestamp: '10 minutes ago',
    read: false
  },
  {
    id: 'notif_2',
    title: 'Medicine Refill Warning',
    message: 'Your Montelukast prescription has 9 remaining doses left. Consider requesting a refill soon.',
    type: 'reminder',
    timestamp: '2 hours ago',
    read: false
  },
  {
    id: 'notif_3',
    title: 'Medical Vault Document Uploaded',
    message: 'Your Pulmonology prescription has been successfully indexed into your Lifetime Medical Vault.',
    type: 'report',
    timestamp: '1 day ago',
    read: true
  }
];

export const sampleHealthMetrics: HealthMetricLog[] = [
  {
    id: 'm_1',
    timestamp: '2026-08-08',
    systolicBp: 118,
    diastolicBp: 76,
    bloodSugar: 102,
    weight: 68.2,
    temperature: 98.4,
    sleepHours: 7.8,
    mood: 'Great',
    painLevel: 0,
    symptoms: []
  },
  {
    id: 'm_2',
    timestamp: '2026-08-06',
    systolicBp: 120,
    diastolicBp: 78,
    bloodSugar: 105,
    weight: 68.4,
    temperature: 98.5,
    sleepHours: 7.5,
    mood: 'Great',
    painLevel: 1,
    symptoms: []
  },
  {
    id: 'm_3',
    timestamp: '2026-08-04',
    systolicBp: 122,
    diastolicBp: 80,
    bloodSugar: 110,
    weight: 68.6,
    temperature: 98.6,
    sleepHours: 7.2,
    mood: 'Good',
    painLevel: 1,
    symptoms: ['Slight fatigue']
  },
  {
    id: 'm_4',
    timestamp: '2026-08-02',
    systolicBp: 125,
    diastolicBp: 82,
    bloodSugar: 116,
    weight: 68.8,
    temperature: 99.0,
    sleepHours: 6.5,
    mood: 'Neutral',
    painLevel: 2,
    symptoms: ['Mild nasal congestion']
  },
  {
    id: 'm_5',
    timestamp: '2026-07-30',
    systolicBp: 126,
    diastolicBp: 83,
    bloodSugar: 118,
    weight: 69.1,
    temperature: 98.8,
    sleepHours: 6.8,
    mood: 'Good',
    painLevel: 2,
    symptoms: ['Mild sore throat']
  },
  {
    id: 'm_6',
    timestamp: '2026-07-26',
    systolicBp: 128,
    diastolicBp: 84,
    bloodSugar: 122,
    weight: 69.3,
    temperature: 98.6,
    sleepHours: 6.2,
    mood: 'Neutral',
    painLevel: 2,
    symptoms: []
  },
  {
    id: 'm_7',
    timestamp: '2026-07-20',
    systolicBp: 130,
    diastolicBp: 85,
    bloodSugar: 125,
    weight: 69.5,
    temperature: 98.6,
    sleepHours: 6.0,
    mood: 'Poor',
    painLevel: 3,
    symptoms: ['Mild headache']
  },
  {
    id: 'm_8',
    timestamp: '2026-07-14',
    systolicBp: 132,
    diastolicBp: 86,
    bloodSugar: 128,
    weight: 69.8,
    temperature: 98.7,
    sleepHours: 5.8,
    mood: 'Neutral',
    painLevel: 3,
    symptoms: []
  },
  {
    id: 'm_9',
    timestamp: '2026-07-10',
    systolicBp: 134,
    diastolicBp: 88,
    bloodSugar: 132,
    weight: 70.1,
    temperature: 98.6,
    sleepHours: 5.5,
    mood: 'Poor',
    painLevel: 3,
    symptoms: ['Work stress', 'Fatigue']
  }
];

export const initialMetricLogs = sampleHealthMetrics;

export const initialClinicalNotes = [
  {
    id: 'cn_001',
    patientId: 'usr_001',
    patientName: 'Aarav Sharma',
    doctorId: 'doc_01',
    doctorName: 'Dr. Rajeshwar K. Tripathi',
    date: '2026-08-05',
    type: 'SOAP Note' as const,
    subjective: 'Patient reports mild productive cough for 4 days, low-grade evening fever, and mild tightness in chest during morning walks. Denies hemoptysis, severe dyspnea, or chills.',
    objective: 'Vitals: BP 122/80 mmHg, Pulse 76 bpm, Temp 99.1°F, SpO2 98% on room air. Chest auscultation shows mild bilateral vesicular breath sounds with occasional rhonchi in upper lobes.',
    assessment: 'Acute mild upper respiratory tract infection with mild bronchospasm reactivity in a patient with history of seasonal asthma.',
    plan: '1. Amoxicillin Trihydrate 500mg TID x 7 days.\n2. Continue Montelukast 10mg HS.\n3. Steam inhalation twice daily.\n4. Re-evaluate in 7 days if symptoms persist.',
    vitals: { bp: '122/80', pulse: 76, temp: 99.1, spO2: 98 },
    doctorSignature: 'Dr. Rajeshwar K. Tripathi (M.D. Pulmonology - Reg # KGMU-48219)',
    isLocked: true,
  },
  {
    id: 'cn_002',
    patientId: 'usr_002',
    patientName: 'Sunita Mehra',
    doctorId: 'doc_01',
    doctorName: 'Dr. Rajeshwar K. Tripathi',
    date: '2026-08-02',
    type: 'Progress Note' as const,
    subjective: 'Follow-up for chronic hypertension and HbA1c review. Reports consistent home BP logs ranging 128-135/82-88.',
    objective: 'BP 130/84 mmHg, Weight 64 kg. HbA1c lab report (01/08/2026): 6.8%. Serum creatinine 0.9 mg/dL.',
    assessment: 'Essential hypertension well-controlled on current ACE inhibitor regime; Type 2 Diabetes Mellitus under adequate glycemic control.',
    plan: 'Maintain current Telmisartan 40mg OD and Metformin 500mg BID. Next renal panel in 3 months.',
    vitals: { bp: '130/84', pulse: 72, temp: 98.6, spO2: 99 },
    doctorSignature: 'Dr. Rajeshwar K. Tripathi (M.D. Pulmonology - Reg # KGMU-48219)',
    isLocked: true,
  }
];

export const initialDoctorPatients = [
  {
    id: 'usr_001',
    name: 'Aarav Sharma',
    age: 34,
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '+91 98765 43210',
    email: 'aarav.sharma@health.in',
    allergies: ['Penicillin', 'Dust Mites'],
    chronicConditions: ['Mild Asthma', 'Seasonal Rhinitis'],
    abhaNumber: '91-3842-9102-4821',
    lastVisitDate: '2026-08-05',
    recentVitalsSummary: 'BP 122/80 mmHg • SpO2 98%',
    activeMedCount: 3,
    vaultDocCount: 5,
  },
  {
    id: 'usr_002',
    name: 'Sunita Mehra',
    age: 58,
    gender: 'Female',
    bloodGroup: 'B+',
    phone: '+91 98123 45678',
    email: 'sunita.mehra@health.in',
    allergies: ['Sulfa Drugs'],
    chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
    abhaNumber: '91-1029-3847-5612',
    lastVisitDate: '2026-08-02',
    recentVitalsSummary: 'BP 130/84 mmHg • HbA1c 6.8%',
    activeMedCount: 2,
    vaultDocCount: 4,
  },
  {
    id: 'usr_003',
    name: 'Rohan Gupta',
    age: 27,
    gender: 'Male',
    bloodGroup: 'A+',
    phone: '+91 97654 32109',
    email: 'rohan.gupta@health.in',
    allergies: ['None Reported'],
    chronicConditions: ['Sinusitis'],
    abhaNumber: '91-5544-3322-1100',
    lastVisitDate: '2026-07-28',
    recentVitalsSummary: 'BP 118/78 mmHg • SpO2 99%',
    activeMedCount: 1,
    vaultDocCount: 2,
  }
];

export const initialDoctorMessages = [
  {
    id: 'msg_01',
    patientId: 'usr_001',
    patientName: 'Aarav Sharma',
    doctorId: 'doc_01',
    doctorName: 'Dr. Rajeshwar K. Tripathi',
    senderRole: 'patient' as const,
    text: 'Good morning Dr. Tripathi, I have uploaded my latest CBC report to my vault. Could you please review when free?',
    timestamp: '2026-08-08 09:15 AM',
    attachmentTitle: 'CBC_Lab_Report_Aug2026.pdf',
    attachmentUrl: '#',
  },
  {
    id: 'msg_02',
    patientId: 'usr_001',
    patientName: 'Aarav Sharma',
    doctorId: 'doc_01',
    doctorName: 'Dr. Rajeshwar K. Tripathi',
    senderRole: 'doctor' as const,
    text: 'Hello Aarav. I reviewed your CBC. Hemoglobin and WBC count are well within normal limits. Continue your prescribed inhaler and complete the antibiotic dose.',
    timestamp: '2026-08-08 10:30 AM',
  }
];

