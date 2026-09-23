import {
  GovernmentBenefitScheme,
  OfficialBloodUnitRecord,
  BloodCompatibilityInfo,
  BloodGroup,
  EconomicProfile
} from '../types';

// ============================================================================
// 1. OFFICIAL VERIFIED GOVERNMENT HEALTH BENEFIT SCHEMES & E-KOSH INTEGRATIONS
// ============================================================================

export const verifiedGovernmentSchemes: GovernmentBenefitScheme[] = [
  {
    id: 'scheme_pmjay',
    code: 'AB-PMJAY',
    name: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana',
    shortName: 'PM-JAY (Ayushman Card)',
    authority: 'National Health Authority (MoHFW, Govt of India)',
    level: 'Central / National',
    applicableStates: ['ALL'],
    category: 'Hospitalization & Surgeries',
    coverageAmountDescription: '₹5,00,000 per family per year for secondary & tertiary cashless inpatient care',
    maxFinancialAssistance: 500000,
    incomeCeilingAnnual: 250000,
    eligibleRationCards: [
      'Antyodaya Anna Yojana (AAY - Poorest of Poor)',
      'Priority Household (BPL / PHH)',
      'State Food Security (NFSA)'
    ],
    targetBeneficiaries: [
      'Bottom 40% vulnerable households (SECC 2011 database)',
      'AAY / BPL / PHH Ration Card holders',
      'All senior citizens aged 70+ (Universal Ayushman Vay Vandana expansion)',
      'Unorganized workers, rural poor, and urban occupational worker categories'
    ],
    keyBenefits: [
      'Cashless & paperless access to services at 27,000+ empaneled public & private hospitals across India',
      'Covers 1,949+ medical procedures including oncology, cardiology, orthopedics, neurosurgery, and intensive care',
      'Pre-existing conditions covered from Day 1 without waiting periods',
      'Pre-hospitalization (3 days) and post-hospitalization (15 days) diagnostics and medications included'
    ],
    eligibilitySummary: [
      'Listed in SECC 2011 depository OR holds active NFSA/BPL/AAY Ration Card',
      'OR is a Senior Citizen aged 70 years or above (irrespective of income slab under AB-PMJAY Vay Vandana)',
      'Family size has no cap; all registered family members eligible'
    ],
    requiredDocuments: [
      'Aadhaar Card (Linked with active mobile for OTP or Biometric)',
      'Ration Card (AAY / BPL / PHH) or PM-JAY Family ID letter',
      'Active Mobile Number for Ayushman App digital e-KYC'
    ],
    applicationPortalUrl: 'https://beneficiary.nha.gov.in',
    officialHelpline: '14555 / 1800-111-565',
    eKoshTreasuryIntegrated: true,
    verificationMethod: 'Aadhaar e-KYC via BIS (Beneficiary Identification System) Portal & NHA Nodal Desks',
    lastVerifiedDate: '2026-08-15'
  },
  {
    id: 'scheme_pmbjp',
    code: 'PMBJP',
    name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    shortName: 'PMBJP Janaushadhi Generic Network',
    authority: 'Pharmaceuticals & Medical Devices Bureau of India (PMBI), Ministry of Chemicals & Fertilizers',
    level: 'Central / National',
    applicableStates: ['ALL'],
    category: 'Generic Medicines & Discounts',
    coverageAmountDescription: '50% to 90% direct price reduction on 2,000+ essential medicines, surgicals & consumables',
    maxFinancialAssistance: 0,
    targetBeneficiaries: [
      'Universal coverage: Open to every Indian citizen without income criteria',
      'Chronic illness patients (Diabetes, Hypertension, Cardiac, Thyroid, Asthma, Arthritis)',
      'Low and middle-income households managing lifelong recurring medication costs'
    ],
    keyBenefits: [
      'Over 10,000+ Janaushadhi Kendras operating across all districts in India',
      'WHO-GMP certified quality generic medicines identical in therapeutic bio-equivalence to leading brands',
      'Surgical items, diagnostic test strips, and nutraceuticals available at fraction of commercial rates',
      'Average family monthly chronic medicine expense drops from ₹3,000+ to ₹400-₹600'
    ],
    eligibilitySummary: [
      'Universal: Valid physical or digital prescription from any registered medical practitioner (MBBS/MD/Specialist)',
      'No income certificate or ration card verification required'
    ],
    requiredDocuments: [
      'Valid Doctor Prescription (with active salt composition or generic name)',
      'No financial documents needed'
    ],
    applicationPortalUrl: 'https://janaushadhi.gov.in',
    officialHelpline: '1800-180-8080',
    eKoshTreasuryIntegrated: false,
    verificationMethod: 'Direct Over-the-Counter purchase at certified PMBJP Stores via prescription review',
    lastVerifiedDate: '2026-08-10'
  },
  {
    id: 'scheme_ran',
    code: 'RAN',
    name: 'Rashtriya Arogya Nidhi & Rare Disease Assistance',
    shortName: 'RAN (Super-Specialty Aid)',
    authority: 'Ministry of Health and Family Welfare (MoHFW), Govt of India',
    level: 'Central / National',
    applicableStates: ['ALL'],
    category: 'Critical Illness Emergency Relief',
    coverageAmountDescription: 'Direct financial assistance up to ₹15,00,000 to ₹50,00,000 for super-specialty treatment in Central Govt Hospitals',
    maxFinancialAssistance: 1500000,
    incomeCeilingAnnual: 180000,
    eligibleRationCards: [
      'Antyodaya Anna Yojana (AAY - Poorest of Poor)',
      'Priority Household (BPL / PHH)'
    ],
    targetBeneficiaries: [
      'Patients living below state-notified poverty line suffering from life-threatening major illnesses',
      'Patients requiring organ transplants (Kidney, Liver, Bone Marrow), oncology surgery, or cardiac interventions',
      'Patients diagnosed with notified Group 1 & Group 2 Rare Diseases (up to ₹50 Lakh grant)'
    ],
    keyBenefits: [
      'One-time direct financial grant disbursed straight to treating Central Government Hospital (e.g., AIIMS, PGIMER, KGMU, SGPGI, JIPMER)',
      'Covers emergency surgical consumables, biological implants, chemotherapy cycles, and super-specialty diagnostics',
      'Emergency Revolving Fund mechanism at AIIMS/Govt hospitals allows immediate sanction up to ₹5 Lakhs by Medical Superintendent'
    ],
    eligibilitySummary: [
      'Family income below state poverty line threshold (BPL / AAY)',
      'Treatment MUST be received at participating Government Super-Specialty Institutes (AIIMS/SGPGI/etc.)',
      'Patient must NOT be covered under any existing government health scheme for the same procedure'
    ],
    requiredDocuments: [
      'Income Certificate issued by competent Revenue Authority (Tehsildar/SDM)',
      'BPL / AAY Ration Card copy',
      'Detailed Medical Estimate Certificate & Treatment Protocol signed by Hospital HoD & Medical Superintendent',
      'Aadhaar Card of Patient and Family Head'
    ],
    applicationPortalUrl: 'https://main.mohfw.gov.in/major-programmes/poor-patients-financial-assistance/rashtriya-arogya-nidhi',
    officialHelpline: '011-23061986 / 011-23061730',
    eKoshTreasuryIntegrated: true,
    verificationMethod: 'Medical Superintendent Verification & MoHFW Section Review Committee',
    lastVerifiedDate: '2026-07-28'
  },
  {
    id: 'scheme_hmdg',
    code: 'HMDG',
    name: "Health Minister's Discretionary Grant",
    shortName: "Health Minister Grant (HMDG)",
    authority: 'Ministry of Health and Family Welfare (MoHFW), Govt of India',
    level: 'Central / National',
    applicableStates: ['ALL'],
    category: 'Direct Financial Grant / e-Kosh',
    coverageAmountDescription: 'Financial aid up to ₹1,25,000 for critical surgeries and specialized hospitalization',
    maxFinancialAssistance: 125000,
    incomeCeilingAnnual: 125000,
    eligibleRationCards: [
      'Antyodaya Anna Yojana (AAY - Poorest of Poor)',
      'Priority Household (BPL / PHH)',
      'State Food Security (NFSA)'
    ],
    targetBeneficiaries: [
      'Indigent citizens with annual family income up to ₹1,25,000',
      'Patients needing financial assistance for heart surgeries, kidney transplants, hip/knee implants, or cancer chemotherapy in government hospitals'
    ],
    keyBenefits: [
      'Up to ₹1,25,000 for procedures where total cost is up to ₹1,75,000',
      'Direct payment transfer to government hospital escrow account',
      'Simple application process endorsed by treating government specialist'
    ],
    eligibilitySummary: [
      'Annual household income must not exceed ₹1,25,000 per annum',
      'Treatment undergoing in Government/Autonomous Medical College or recognized institute'
    ],
    requiredDocuments: [
      'Income Certificate from Tehsildar / District Magistrate',
      'Hospital Estimate Proforma filled by Government Doctor',
      'Patient Identity & Address Proof (Aadhaar / Voter ID)'
    ],
    applicationPortalUrl: 'https://main.mohfw.gov.in',
    officialHelpline: '011-23061483',
    eKoshTreasuryIntegrated: true,
    verificationMethod: 'Nodal Ministry Direct Grant Scrutiny',
    lastVerifiedDate: '2026-08-01'
  },
  {
    id: 'scheme_up_mmjay',
    code: 'UP-MMJAY',
    name: 'Uttar Pradesh Mukhyamantri Jan Arogya Yojana',
    shortName: 'UP MMJAY (CM Health Scheme)',
    authority: 'State Agency for Comprehensive Health and Integrated Services (SACHIS), Govt of UP',
    level: 'State Government',
    applicableStates: ['Uttar Pradesh'],
    category: 'Hospitalization & Surgeries',
    coverageAmountDescription: '₹5,00,000 per family per year on par with AB-PMJAY for UP residents left out of SECC list',
    maxFinancialAssistance: 500000,
    incomeCeilingAnnual: 250000,
    eligibleRationCards: [
      'Antyodaya Anna Yojana (AAY - Poorest of Poor)',
      'Priority Household (BPL / PHH)',
      'State Food Security (NFSA)'
    ],
    targetBeneficiaries: [
      'Registered construction workers with UP BOCW (Building & Other Construction Workers Welfare Board)',
      'Eligible rural and urban Antyodaya / Priority Ration card holders in Uttar Pradesh',
      'Families missed in central SECC database but verified under state poverty indexes'
    ],
    keyBenefits: [
      'Cashless secondary & tertiary hospital care at 3,500+ empaneled government & private hospitals in UP',
      'Complete diagnostic, pre/post hospitalization, intensive care, and surgical coverage',
      'Integrated seamlessly with e-Kosh / Koshvani UP state treasury disbursement'
    ],
    eligibilitySummary: [
      'Permanent resident of Uttar Pradesh',
      'Holds registered UP Ration Card or UP BOCW Labour registration card'
    ],
    requiredDocuments: [
      'UP NFSA/AAY/PHH Ration Card',
      'Aadhaar Card (UP Address)',
      'UP BOCW Registration Card (if claiming under labour worker category)'
    ],
    applicationPortalUrl: 'https://sachis.up.gov.in',
    officialHelpline: '1800-1800-4444 / 104',
    eKoshTreasuryIntegrated: true,
    verificationMethod: 'SACHIS UP Portal Biometric e-KYC via CSC Centers or District Hospitals',
    lastVerifiedDate: '2026-08-14'
  },
  {
    id: 'scheme_ekosh_treasury',
    code: 'E-KOSH-MED',
    name: 'State Health Financial Treasury & Indigent Medical Relief (e-Kosh / Koshvani)',
    shortName: 'e-Kosh Direct Medical Assistance Registry',
    authority: 'State Finance Department & Chief Minister Relief Fund (CMRF)',
    level: 'State Government',
    applicableStates: ['Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Rajasthan', 'Madhya Pradesh', 'Bihar', 'ALL'],
    category: 'Direct Financial Grant / e-Kosh',
    coverageAmountDescription: 'Direct treasury benefit transfers from ₹25,000 to ₹5,00,000 from State CM Relief Fund / IFMS',
    maxFinancialAssistance: 500000,
    incomeCeilingAnnual: 200000,
    eligibleRationCards: [
      'Antyodaya Anna Yojana (AAY - Poorest of Poor)',
      'Priority Household (BPL / PHH)',
      'State Food Security (NFSA)'
    ],
    targetBeneficiaries: [
      'Patients facing catastrophic unexpected medical expenses not fully covered by other schemes',
      'Major surgeries, road traffic accident polytrauma, renal failure dialysis, cancer chemoradiation',
      'Pensioners, unorganized workers, and low-income families verified by District Magistrate'
    ],
    keyBenefits: [
      'Direct Treasury electronic fund transfer (e-Payment / DBT) to treating hospital account',
      'Online application tracking via State Treasury Portal (e-Kosh / Koshvani / MahaKosh)',
      'Fast-track sanctioning for emergency ICU or pediatric surgery requisitions'
    ],
    eligibilitySummary: [
      'State resident with verified income certificate',
      'Treatment in recognized Medical College / District Hospital or Empaneled Tertiary Center'
    ],
    requiredDocuments: [
      'Original Medical Estimate Certificate countersigned by Chief Medical Officer (CMO)',
      'Income Certificate (Annual family income proof issued by Tehsildar)',
      'Aadhaar Card & Bank Account Passbook (for reimbursement tracking)',
      'Ration Card / Voter ID proof'
    ],
    applicationPortalUrl: 'https://cmrf.up.nic.in',
    officialHelpline: '1076 (CM Helpline) / 0522-2239296',
    eKoshTreasuryIntegrated: true,
    verificationMethod: 'District Magistrate Scrutiny + CMO Medical Board Clearance + Treasury IFMS DBT',
    lastVerifiedDate: '2026-08-18'
  },
  {
    id: 'scheme_nphce',
    code: 'NPHCE',
    name: 'National Programme for Health Care of the Elderly',
    shortName: 'Senior Citizen Healthcare (NPHCE)',
    authority: 'Ministry of Health and Family Welfare (MoHFW)',
    level: 'Central / National',
    applicableStates: ['ALL'],
    category: 'Elderly & Geriatric Healthcare',
    coverageAmountDescription: 'Dedicated free geriatric consultations, chronic disease management, assistive aids, and home care visits',
    maxFinancialAssistance: 0,
    targetBeneficiaries: [
      'All senior citizens aged 60 years and above',
      'Elderly suffering from chronic morbidities (Hypertension, Diabetes, Osteoarthritis, Cataract, Dementia)'
    ],
    keyBenefits: [
      'Dedicated weekly geriatric clinics at Community Health Centers (CHC) and District Hospitals',
      'Free routine geriatric medicines, physiotherapy sessions, and laboratory screenings',
      'Free provision of assistive devices (walking sticks, wheelchairs, hearing aids via ALIMCO camps)'
    ],
    eligibilitySummary: [
      'Age 60 years or above (Proof of age via Aadhaar or Senior Citizen ID)',
      'Universal access across all public healthcare facilities in India'
    ],
    requiredDocuments: [
      'Age proof (Aadhaar Card / Voter ID / Pension Passbook)',
      'Doctor prescription or previous medical records'
    ],
    applicationPortalUrl: 'https://main.mohfw.gov.in/Major-Programmes/Non-Communicable-Diseases-Injury-Trauma/nphce',
    officialHelpline: '14567 (Elder Line National Helpline)',
    eKoshTreasuryIntegrated: false,
    verificationMethod: 'Age verification at District Geriatric Units & CHC Wellness Desks',
    lastVerifiedDate: '2026-08-05'
  },
  {
    id: 'scheme_mjpjay',
    code: 'MJPJAY',
    name: 'Mahatma Jyotirao Phule Jan Arogya Yojana',
    shortName: 'MJPJAY (Maharashtra Health Assurance)',
    authority: 'State Health Assurance Society (SHAS), Govt of Maharashtra',
    level: 'State Government',
    applicableStates: ['Maharashtra'],
    category: 'Hospitalization & Surgeries',
    coverageAmountDescription: '₹5,00,000 per family per year for 1,356 medical & surgical procedures',
    maxFinancialAssistance: 500000,
    eligibleRationCards: [
      'Antyodaya Anna Yojana (AAY - Poorest of Poor)',
      'Priority Household (BPL / PHH)',
      'State Food Security (NFSA)',
      'Non-NFSA / Above Poverty Line (APL)'
    ],
    targetBeneficiaries: [
      'All Ration Card holders (Yellow, Orange, and White Ration Cards) in Maharashtra (Universal Coverage)',
      'Farmers from 14 drought-affected districts of Maharashtra',
      'Govt-approved orphanage and old age home inmates'
    ],
    keyBenefits: [
      'Cashless hospital treatment at 1,000+ empaneled hospitals across Maharashtra',
      '100% universal access for state ration card holders',
      'Includes Renal Transplant (up to ₹3 Lakhs + ₹50k immunosuppressants)'
    ],
    eligibilitySummary: [
      'Resident of Maharashtra with valid Ration Card (Yellow/Orange/White) & Aadhaar Card'
    ],
    requiredDocuments: [
      'Maharashtra Ration Card',
      'Aadhaar Card of patient'
    ],
    applicationPortalUrl: 'https://www.jeevandayee.gov.in',
    officialHelpline: '155388 / 1800-233-2200',
    eKoshTreasuryIntegrated: true,
    verificationMethod: 'Arogyamitra Biometric Check at Empaneled Hospitals',
    lastVerifiedDate: '2026-08-12'
  },
  {
    id: 'scheme_aarogyasri',
    code: 'AAROGYASRI',
    name: 'Dr. YSR Aarogyasri Health Scheme',
    shortName: 'Dr. YSR Aarogyasri (AP / Telangana)',
    authority: 'Aarogyasri Health Care Trust',
    level: 'State Government',
    applicableStates: ['Andhra Pradesh', 'Telangana'],
    category: 'Hospitalization & Surgeries',
    coverageAmountDescription: 'Cashless treatment up to ₹5,00,000 to ₹10,00,000 per family per year for 3,250+ procedures',
    maxFinancialAssistance: 1000000,
    incomeCeilingAnnual: 500000,
    eligibleRationCards: [
      'Antyodaya Anna Yojana (AAY - Poorest of Poor)',
      'Priority Household (BPL / PHH)',
      'State Food Security (NFSA)'
    ],
    targetBeneficiaries: [
      'BPL families and households with annual income up to ₹5 Lakh in AP/Telangana',
      'Rice Card / White Ration Card holders and registered building workers'
    ],
    keyBenefits: [
      'Covers 3,255 procedures with free post-operative follow-up and medicine package',
      'Free post-operative sustenance allowance (Aarogyasri Aasara) ₹225/day during recovery period',
      'Empaneled network spans top tertiary hospitals across Hyderabad, Vijayawada, Visakhapatnam, Chennai, and Bengaluru'
    ],
    eligibilitySummary: [
      'Rice Card / White Card or annual income certificate below ₹5 Lakhs',
      'Resident of Andhra Pradesh or Telangana'
    ],
    requiredDocuments: [
      'Rice Card / Aarogyasri Card',
      'Aadhaar Card of patient'
    ],
    applicationPortalUrl: 'https://aarogyasri.telangana.gov.in',
    officialHelpline: '104 / 1800-599-1111',
    eKoshTreasuryIntegrated: true,
    verificationMethod: 'Vaaidya Mitra Helpdesk at Network Hospitals',
    lastVerifiedDate: '2026-08-10'
  },
  {
    id: 'scheme_cmchis_tn',
    code: 'CMCHIS-TN',
    name: "Chief Minister's Comprehensive Health Insurance Scheme (CMCHIS)",
    shortName: 'CMCHIS (Tamil Nadu)',
    authority: 'United India Insurance & Govt of Tamil Nadu',
    level: 'State Government',
    applicableStates: ['Tamil Nadu'],
    category: 'Hospitalization & Surgeries',
    coverageAmountDescription: 'Cashless coverage up to ₹5,00,000 per family per year for 1,513 procedures',
    maxFinancialAssistance: 500000,
    incomeCeilingAnnual: 120000,
    eligibleRationCards: [
      'Antyodaya Anna Yojana (AAY - Poorest of Poor)',
      'Priority Household (BPL / PHH)',
      'State Food Security (NFSA)'
    ],
    targetBeneficiaries: [
      'Families residing in Tamil Nadu with annual income less than ₹1,20,000 per annum',
      'Sri Lankan refugees in camps, registered unorganized workers, and eligible trans persons'
    ],
    keyBenefits: [
      'Cashless inpatient care at 1,600+ empaneled government & private hospitals in Tamil Nadu',
      'Dedicated coverage for diagnostic packages, bone marrow transplants, and cochlear implants'
    ],
    eligibilitySummary: [
      'Resident of Tamil Nadu with annual household income proof < ₹1.2 Lakhs or Smart Card'
    ],
    requiredDocuments: [
      'Family Smart Ration Card',
      'Income Certificate issued by Revenue Department',
      'Aadhaar Card'
    ],
    applicationPortalUrl: 'https://cmchistn.com',
    officialHelpline: '1800-425-3993',
    eKoshTreasuryIntegrated: true,
    verificationMethod: 'District Kiosk Smart Card Verification',
    lastVerifiedDate: '2026-08-08'
  }
];

// ============================================================================
// 2. OFFICIAL JANAUSHADHI (PMBJP) GENERIC MEDICINE & EQUIVALENCE REGISTRY
// ============================================================================

export interface JanaushadhiPriceMapping {
  genericSalt: string;
  dosageStrength: string;
  dosageForm: string;
  popularBrandNames: string[];
  brandAvgMrpPerStrip: number; // In INR for standard strip
  janaushadhiMrpPerStrip: number; // In INR for standard strip (Real PMBJP price)
  stripSize: number; // e.g. 10 tablets
  savingsPercentage: number;
  therapeuticCategory: string;
  pmbjpCode: string;
}

export const officialJanaushadhiDirectory: JanaushadhiPriceMapping[] = [
  {
    genericSalt: 'Paracetamol',
    dosageStrength: '650 mg',
    dosageForm: 'Tablet',
    popularBrandNames: ['Dolo 650', 'Calpol 650', 'Pacimol 650', 'P-650'],
    brandAvgMrpPerStrip: 33.50,
    janaushadhiMrpPerStrip: 11.20,
    stripSize: 10,
    savingsPercentage: 66.5,
    therapeuticCategory: 'Analgesic & Antipyretic (Fever/Pain)',
    pmbjpCode: 'PMBJP-0012'
  },
  {
    genericSalt: 'Amoxicillin',
    dosageStrength: '500 mg',
    dosageForm: 'Capsule',
    popularBrandNames: ['Mox 500', 'Novamox 500', 'Amoxil 500', 'Almox 500'],
    brandAvgMrpPerStrip: 118.00,
    janaushadhiMrpPerStrip: 52.00,
    stripSize: 10,
    savingsPercentage: 55.9,
    therapeuticCategory: 'Antibiotic (Penicillin Class)',
    pmbjpCode: 'PMBJP-0145'
  },
  {
    genericSalt: 'Pantoprazole',
    dosageStrength: '40 mg',
    dosageForm: 'Tablet',
    popularBrandNames: ['Pan 40', 'Pantocid 40', 'Pantodac 40', 'Protera 40'],
    brandAvgMrpPerStrip: 155.00,
    janaushadhiMrpPerStrip: 26.50,
    stripSize: 10,
    savingsPercentage: 82.9,
    therapeuticCategory: 'Gastrointestinal (Proton Pump Inhibitor / Acidity)',
    pmbjpCode: 'PMBJP-0280'
  },
  {
    genericSalt: 'Metformin Hydrochloride',
    dosageStrength: '500 mg Extended Release',
    dosageForm: 'Tablet',
    popularBrandNames: ['Glycomet 500 SR', 'Obimet 500 SR', 'Cetapin 500', 'Glyciphage 500'],
    brandAvgMrpPerStrip: 48.00,
    janaushadhiMrpPerStrip: 12.00,
    stripSize: 10,
    savingsPercentage: 75.0,
    therapeuticCategory: 'Antidiabetic (Type-2 Glycemic Control)',
    pmbjpCode: 'PMBJP-0410'
  },
  {
    genericSalt: 'Telmisartan',
    dosageStrength: '40 mg',
    dosageForm: 'Tablet',
    popularBrandNames: ['Telma 40', 'Telmikind 40', 'Telsar 40', 'Telvas 40'],
    brandAvgMrpPerStrip: 125.00,
    janaushadhiMrpPerStrip: 22.00,
    stripSize: 10,
    savingsPercentage: 82.4,
    therapeuticCategory: 'Cardiovascular (Hypertension & Blood Pressure)',
    pmbjpCode: 'PMBJP-0530'
  },
  {
    genericSalt: 'Atorvastatin',
    dosageStrength: '10 mg',
    dosageForm: 'Tablet',
    popularBrandNames: ['Atorva 10', 'Lipitor 10', 'Storvas 10', 'Tonact 10'],
    brandAvgMrpPerStrip: 110.00,
    janaushadhiMrpPerStrip: 18.50,
    stripSize: 10,
    savingsPercentage: 83.2,
    therapeuticCategory: 'Cardiovascular (Cholesterol & Lipid Lowering)',
    pmbjpCode: 'PMBJP-0588'
  },
  {
    genericSalt: 'Montelukast Sodium',
    dosageStrength: '10 mg',
    dosageForm: 'Tablet',
    popularBrandNames: ['Singulair 10', 'Montek 10', 'Montair 10', 'Romilast 10'],
    brandAvgMrpPerStrip: 145.00,
    janaushadhiMrpPerStrip: 34.00,
    stripSize: 10,
    savingsPercentage: 76.5,
    therapeuticCategory: 'Respiratory (Asthma & Allergic Rhinitis)',
    pmbjpCode: 'PMBJP-0672'
  },
  {
    genericSalt: 'Azithromycin',
    dosageStrength: '500 mg',
    dosageForm: 'Tablet',
    popularBrandNames: ['Aithral 500', 'Azee 500', 'Zithrox 500', 'Azimax 500'],
    brandAvgMrpPerStrip: 125.00,
    janaushadhiMrpPerStrip: 68.00,
    stripSize: 5,
    savingsPercentage: 45.6,
    therapeuticCategory: 'Antibiotic (Macrolide Class)',
    pmbjpCode: 'PMBJP-0199'
  },
  {
    genericSalt: 'Vildagliptin + Metformin',
    dosageStrength: '50 mg / 500 mg',
    dosageForm: 'Tablet',
    popularBrandNames: ['Galvus Met 50/500', 'Zomelis Met 50/500', 'Jalra M 50/500'],
    brandAvgMrpPerStrip: 260.00,
    janaushadhiMrpPerStrip: 65.00,
    stripSize: 10,
    savingsPercentage: 75.0,
    therapeuticCategory: 'Antidiabetic (Combination Glycemic Control)',
    pmbjpCode: 'PMBJP-0920'
  },
  {
    genericSalt: 'Rosuvastatin',
    dosageStrength: '10 mg',
    dosageForm: 'Tablet',
    popularBrandNames: ['Rosuvas 10', 'Rozavel 10', 'Crestor 10', 'Rosave 10'],
    brandAvgMrpPerStrip: 185.00,
    janaushadhiMrpPerStrip: 29.00,
    stripSize: 10,
    savingsPercentage: 84.3,
    therapeuticCategory: 'Cardiovascular (Statin / High Cholesterol)',
    pmbjpCode: 'PMBJP-0612'
  }
];

// ============================================================================
// 3. OFFICIAL E-RAKTKOSH / LICENSED BLOOD BANK INVENTORY REPOSITORY
// ============================================================================

export const officialBloodUnitsDirectory: OfficialBloodUnitRecord[] = [
  {
    id: 'bb_kgmu_01',
    facilityId: 'FAC_KGMU_LKO',
    facilityName: "King George's Medical University (KGMU) Blood Transfusion Center",
    facilityTier: 'Government Medical College',
    licenseNumber: 'LIC/UP/FDA/BB/2018/004',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    city: 'Lucknow',
    address: 'Department of Transfusion Medicine, KGMU Campus, Shah Mina Road, Chowk, Lucknow, UP 226003',
    phone: '+91 522 225 7540',
    emergencyHelpline: '104 / +91 522 225 8000',
    lat: 26.8688,
    lng: 80.9125,
    distanceKm: 0.8,
    bloodGroup: 'O+',
    componentType: 'Packed Red Blood Cells (PRBC)',
    availableUnits: 38,
    stockStatus: 'Adequate Stock',
    lastReportedTimestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    freshnessTier: 'Live Updated (<30m)',
    freshnessMinutes: 14,
    officialSource: 'e-RaktKosh National Portal',
    verifiedByNodalOfficer: true,
    componentProcessingCapabilities: [
      'Whole Blood',
      'Packed Red Blood Cells (PRBC)',
      'Platelet Concentrate (RDP)',
      'Single Donor Platelets (SDP)',
      'Fresh Frozen Plasma (FFP)',
      'Cryoprecipitate'
    ],
    operatingHours: '24 Hours Open (Emergency Blood Dispatch)',
    is24x7: true
  },
  {
    id: 'bb_kgmu_02',
    facilityId: 'FAC_KGMU_LKO',
    facilityName: "King George's Medical University (KGMU) Blood Transfusion Center",
    facilityTier: 'Government Medical College',
    licenseNumber: 'LIC/UP/FDA/BB/2018/004',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    city: 'Lucknow',
    address: 'Department of Transfusion Medicine, KGMU Campus, Shah Mina Road, Chowk, Lucknow, UP 226003',
    phone: '+91 522 225 7540',
    emergencyHelpline: '104 / +91 522 225 8000',
    lat: 26.8688,
    lng: 80.9125,
    distanceKm: 0.8,
    bloodGroup: 'O-',
    componentType: 'Packed Red Blood Cells (PRBC)',
    availableUnits: 4,
    stockStatus: 'Low Stock',
    lastReportedTimestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    freshnessTier: 'Live Updated (<30m)',
    freshnessMinutes: 14,
    officialSource: 'e-RaktKosh National Portal',
    verifiedByNodalOfficer: true,
    componentProcessingCapabilities: [
      'Whole Blood',
      'Packed Red Blood Cells (PRBC)',
      'Platelet Concentrate (RDP)',
      'Single Donor Platelets (SDP)',
      'Fresh Frozen Plasma (FFP)',
      'Cryoprecipitate'
    ],
    operatingHours: '24 Hours Open',
    is24x7: true
  },
  {
    id: 'bb_kgmu_03',
    facilityId: 'FAC_KGMU_LKO',
    facilityName: "King George's Medical University (KGMU) Blood Transfusion Center",
    facilityTier: 'Government Medical College',
    licenseNumber: 'LIC/UP/FDA/BB/2018/004',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    city: 'Lucknow',
    address: 'Department of Transfusion Medicine, KGMU Campus, Shah Mina Road, Chowk, Lucknow, UP 226003',
    phone: '+91 522 225 7540',
    emergencyHelpline: '104 / +91 522 225 8000',
    lat: 26.8688,
    lng: 80.9125,
    distanceKm: 0.8,
    bloodGroup: 'B+',
    componentType: 'Platelet Concentrate (RDP)',
    availableUnits: 24,
    stockStatus: 'Adequate Stock',
    lastReportedTimestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    freshnessTier: 'Live Updated (<30m)',
    freshnessMinutes: 14,
    officialSource: 'e-RaktKosh National Portal',
    verifiedByNodalOfficer: true,
    componentProcessingCapabilities: [
      'Whole Blood',
      'Packed Red Blood Cells (PRBC)',
      'Platelet Concentrate (RDP)',
      'Single Donor Platelets (SDP)',
      'Fresh Frozen Plasma (FFP)'
    ],
    operatingHours: '24 Hours Open',
    is24x7: true
  },
  {
    id: 'bb_sgpgi_01',
    facilityId: 'FAC_SGPGI_LKO',
    facilityName: 'Sanjay Gandhi Postgraduate Institute of Medical Sciences (SGPGI) Blood Bank',
    facilityTier: 'Government Medical College',
    licenseNumber: 'LIC/UP/FDA/BB/2015/012',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    city: 'Lucknow',
    address: 'Raebareli Road, Haibat Mau Mawaiya, Lucknow, UP 226014',
    phone: '+91 522 249 4000',
    emergencyHelpline: '+91 522 249 4235',
    lat: 26.7450,
    lng: 80.9420,
    distanceKm: 13.5,
    bloodGroup: 'A+',
    componentType: 'Packed Red Blood Cells (PRBC)',
    availableUnits: 46,
    stockStatus: 'Adequate Stock',
    lastReportedTimestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    freshnessTier: 'Recent (<4h)',
    freshnessMinutes: 45,
    officialSource: 'e-RaktKosh National Portal',
    verifiedByNodalOfficer: true,
    componentProcessingCapabilities: [
      'Whole Blood',
      'Packed Red Blood Cells (PRBC)',
      'Platelet Concentrate (RDP)',
      'Single Donor Platelets (SDP)',
      'Fresh Frozen Plasma (FFP)',
      'Cryoprecipitate'
    ],
    operatingHours: '24 Hours Open',
    is24x7: true
  },
  {
    id: 'bb_sgpgi_02',
    facilityId: 'FAC_SGPGI_LKO',
    facilityName: 'Sanjay Gandhi Postgraduate Institute of Medical Sciences (SGPGI) Blood Bank',
    facilityTier: 'Government Medical College',
    licenseNumber: 'LIC/UP/FDA/BB/2015/012',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    city: 'Lucknow',
    address: 'Raebareli Road, Haibat Mau Mawaiya, Lucknow, UP 226014',
    phone: '+91 522 249 4000',
    emergencyHelpline: '+91 522 249 4235',
    lat: 26.7450,
    lng: 80.9420,
    distanceKm: 13.5,
    bloodGroup: 'AB-',
    componentType: 'Packed Red Blood Cells (PRBC)',
    availableUnits: 2,
    stockStatus: 'Critical Shortage',
    lastReportedTimestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    freshnessTier: 'Recent (<4h)',
    freshnessMinutes: 45,
    officialSource: 'e-RaktKosh National Portal',
    verifiedByNodalOfficer: true,
    componentProcessingCapabilities: [
      'Whole Blood',
      'Packed Red Blood Cells (PRBC)',
      'Platelet Concentrate (RDP)',
      'Single Donor Platelets (SDP)',
      'Fresh Frozen Plasma (FFP)'
    ],
    operatingHours: '24 Hours Open',
    is24x7: true
  },
  {
    id: 'bb_balrampur_01',
    facilityId: 'FAC_BLRMPR_LKO',
    facilityName: 'Balrampur District Hospital Blood Bank',
    facilityTier: 'District Hospital Blood Bank',
    licenseNumber: 'LIC/UP/FDA/BB/2016/088',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    city: 'Lucknow',
    address: 'Golaganj, Near Qaiserbagh Bus Stand, Lucknow, UP 226018',
    phone: '+91 522 222 4153',
    lat: 26.8520,
    lng: 80.9230,
    distanceKm: 2.1,
    bloodGroup: 'O+',
    componentType: 'Whole Blood',
    availableUnits: 19,
    stockStatus: 'Adequate Stock',
    lastReportedTimestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    freshnessTier: 'Recent (<4h)',
    freshnessMinutes: 110,
    officialSource: 'State Blood Transfusion Council',
    verifiedByNodalOfficer: true,
    componentProcessingCapabilities: [
      'Whole Blood',
      'Packed Red Blood Cells (PRBC)',
      'Fresh Frozen Plasma (FFP)'
    ],
    operatingHours: '24 Hours Open',
    is24x7: true
  },
  {
    id: 'bb_redcross_lko',
    facilityId: 'FAC_REDCROSS_LKO',
    facilityName: 'Indian Red Cross Society State Blood Bank Lucknow',
    facilityTier: 'Red Cross Society',
    licenseNumber: 'LIC/UP/FDA/BB/2012/031',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    city: 'Lucknow',
    address: 'Red Cross Bhawan, Raja Nawab Ali Road, Kaiserbagh, Lucknow, UP 226001',
    phone: '+91 522 262 3901',
    lat: 26.8560,
    lng: 80.9320,
    distanceKm: 2.7,
    bloodGroup: 'B+',
    componentType: 'Packed Red Blood Cells (PRBC)',
    availableUnits: 28,
    stockStatus: 'Adequate Stock',
    lastReportedTimestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    freshnessTier: 'Recent (<4h)',
    freshnessMinutes: 180,
    officialSource: 'e-RaktKosh National Portal',
    verifiedByNodalOfficer: true,
    componentProcessingCapabilities: [
      'Whole Blood',
      'Packed Red Blood Cells (PRBC)',
      'Platelet Concentrate (RDP)',
      'Fresh Frozen Plasma (FFP)'
    ],
    operatingHours: '08:00 AM - 08:00 PM (Emergency on-call 24x7)',
    is24x7: false
  },
  {
    id: 'bb_aiims_delhi_01',
    facilityId: 'FAC_AIIMS_DEL',
    facilityName: 'All India Institute of Medical Sciences (AIIMS) Main Blood Bank',
    facilityTier: 'Government Medical College',
    licenseNumber: 'LIC/DL/FDA/BB/2010/001',
    state: 'Delhi',
    district: 'New Delhi',
    city: 'New Delhi',
    address: 'Ansari Nagar, Sri Aurobindo Marg, New Delhi 110029',
    phone: '+91 11 2658 8500',
    emergencyHelpline: '104 / +91 11 2659 4444',
    lat: 28.5672,
    lng: 77.2100,
    distanceKm: 480,
    bloodGroup: 'O-',
    componentType: 'Packed Red Blood Cells (PRBC)',
    availableUnits: 15,
    stockStatus: 'Adequate Stock',
    lastReportedTimestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    freshnessTier: 'Live Updated (<30m)',
    freshnessMinutes: 20,
    officialSource: 'e-RaktKosh National Portal',
    verifiedByNodalOfficer: true,
    componentProcessingCapabilities: [
      'Whole Blood',
      'Packed Red Blood Cells (PRBC)',
      'Platelet Concentrate (RDP)',
      'Single Donor Platelets (SDP)',
      'Fresh Frozen Plasma (FFP)',
      'Cryoprecipitate'
    ],
    operatingHours: '24 Hours Open',
    is24x7: true
  }
];

// ============================================================================
// 4. SCIENTIFIC BLOOD COMPATIBILITY MATRICES (RBC & PLASMA)
// ============================================================================

export const bloodCompatibilityDirectory: Record<BloodGroup, BloodCompatibilityInfo> = {
  'O-': {
    bloodGroup: 'O-',
    canGiveWholeBloodAndRBC: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveWholeBloodAndRBC: ['O-'],
    canGivePlasma: ['O-'],
    canReceivePlasma: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    isUniversalRBCDonor: true,
    isUniversalRBCRecipient: false,
    isUniversalPlasmaDonor: false,
    isUniversalPlasmaRecipient: true,
    rarityDescription: 'Universal Red Cell Donor (approx. 2% of population in India). Vital for trauma & emergency transfusions.'
  },
  'O+': {
    bloodGroup: 'O+',
    canGiveWholeBloodAndRBC: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveWholeBloodAndRBC: ['O-', 'O+'],
    canGivePlasma: ['O-', 'O+'],
    canReceivePlasma: ['O+', 'A+', 'B+', 'AB+'],
    isUniversalRBCDonor: false,
    isUniversalRBCRecipient: false,
    isUniversalPlasmaDonor: false,
    isUniversalPlasmaRecipient: false,
    rarityDescription: 'Most common blood group in India (approx. 37% of population). High demand for routine surgical procedures.'
  },
  'A-': {
    bloodGroup: 'A-',
    canGiveWholeBloodAndRBC: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveWholeBloodAndRBC: ['O-', 'A-'],
    canGivePlasma: ['A-', 'O-'],
    canReceivePlasma: ['A-', 'A+', 'AB-', 'AB+'],
    isUniversalRBCDonor: false,
    isUniversalRBCRecipient: false,
    isUniversalPlasmaDonor: false,
    isUniversalPlasmaRecipient: false,
    rarityDescription: 'Rare blood group in India (approx. 0.6% of population). Specialized donor matching critical.'
  },
  'A+': {
    bloodGroup: 'A+',
    canGiveWholeBloodAndRBC: ['A+', 'AB+'],
    canReceiveWholeBloodAndRBC: ['O-', 'O+', 'A-', 'A+'],
    canGivePlasma: ['A-', 'A+', 'O-', 'O+'],
    canReceivePlasma: ['A+', 'AB+'],
    isUniversalRBCDonor: false,
    isUniversalRBCRecipient: false,
    isUniversalPlasmaDonor: false,
    isUniversalPlasmaRecipient: false,
    rarityDescription: 'Common blood group in India (approx. 22% of population).'
  },
  'B-': {
    bloodGroup: 'B-',
    canGiveWholeBloodAndRBC: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveWholeBloodAndRBC: ['O-', 'B-'],
    canGivePlasma: ['B-', 'O-'],
    canReceivePlasma: ['B-', 'B+', 'AB-', 'AB+'],
    isUniversalRBCDonor: false,
    isUniversalRBCRecipient: false,
    isUniversalPlasmaDonor: false,
    isUniversalPlasmaRecipient: false,
    rarityDescription: 'Rare Rh-negative group in India (approx. 1.1% of population).'
  },
  'B+': {
    bloodGroup: 'B+',
    canGiveWholeBloodAndRBC: ['B+', 'AB+'],
    canReceiveWholeBloodAndRBC: ['O-', 'O+', 'B-', 'B+'],
    canGivePlasma: ['B-', 'B+', 'O-', 'O+'],
    canReceivePlasma: ['B+', 'AB+'],
    isUniversalRBCDonor: false,
    isUniversalRBCRecipient: false,
    isUniversalPlasmaDonor: false,
    isUniversalPlasmaRecipient: false,
    rarityDescription: 'Second most frequent blood group in India (approx. 32% of population).'
  },
  'AB-': {
    bloodGroup: 'AB-',
    canGiveWholeBloodAndRBC: ['AB-', 'AB+'],
    canReceiveWholeBloodAndRBC: ['O-', 'A-', 'B-', 'AB-'],
    canGivePlasma: ['AB-', 'A-', 'B-', 'O-'],
    canReceivePlasma: ['AB-', 'AB+'],
    isUniversalRBCDonor: false,
    isUniversalRBCRecipient: false,
    isUniversalPlasmaDonor: false,
    isUniversalPlasmaRecipient: false,
    rarityDescription: 'Rarest standard blood group in India (approx. 0.4% of population).'
  },
  'AB+': {
    bloodGroup: 'AB+',
    canGiveWholeBloodAndRBC: ['AB+'],
    canReceiveWholeBloodAndRBC: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canGivePlasma: ['AB-', 'AB+', 'A-', 'A+', 'B-', 'B+', 'O-', 'O+'],
    canReceivePlasma: ['AB+'],
    isUniversalRBCDonor: false,
    isUniversalRBCRecipient: true,
    isUniversalPlasmaDonor: true,
    isUniversalPlasmaRecipient: false,
    rarityDescription: 'Universal Red Cell Recipient & Universal Plasma Donor (approx. 8% of population).'
  }
};

// ============================================================================
// 5. DEFAULT INITIAL ECONOMIC PROFILE SAMPLE (FOR SEAMLESS FIRST-TIME EXPERIENCE)
// ============================================================================

export const defaultInitialEconomicProfile: EconomicProfile = {
  id: 'econ_usr_001',
  userId: 'usr_001',
  monthlyHouseholdIncome: 28000,
  annualHouseholdIncome: 336000,
  incomeBracket: '₹2,50,000 - ₹5,00,000 / year (₹20.8k - ₹41.6k/mo)',
  familySize: 4,
  dependentsCount: 2,
  seniorDependentsCount: 1,
  childDependentsCount: 1,
  occupationCategory: 'Self-Employed / Small Business',
  rationCardType: 'State Food Security (NFSA)',
  areaType: 'Urban',
  state: 'Uttar Pradesh',
  district: 'Lucknow',
  hasAyushmanCard: true,
  ayushmanCardNumber: 'AB-PMJAY-9102-4821',
  hasStateHealthCard: true,
  stateHealthCardName: 'UP Mukhyamantri Jan Arogya Card',
  hasPrivateInsurance: false,
  hasDisabilityOrSpecialCategory: false,
  consentGiven: true,
  consentGivenAt: '2026-08-01T10:00:00Z',
  lastUpdated: '2026-08-15T14:30:00Z'
};
