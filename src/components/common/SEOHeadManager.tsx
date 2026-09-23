import React, { useEffect } from 'react';

interface SEOHeadManagerProps {
  activeTab: string;
  activeRole: string;
  isAuthenticated: boolean;
}

const TAB_SEO_TITLES: Record<string, { title: string; desc: string; isPrivate: boolean }> = {
  dashboard: {
    title: 'Jevan Care | AI-Powered Healthcare & Wellness Platform',
    desc: 'Access active medications, health metrics, AI companion, medical vault, and verified doctor consultations in your all-in-one health portal.',
    isPrivate: false,
  },
  scanner: {
    title: 'Smart Prescription Scanner | Jevan Care AI',
    desc: 'Instantly scan medical prescriptions with OCR & AI to extract drug names, dosage, salt composition, frequency, and safety warnings.',
    isPrivate: false,
  },
  medicine: {
    title: 'Medicine Intelligence & Salt Finder | Jevan Care',
    desc: 'Search pharmaceutical directory for drug interactions, substitute salt brands, dosage guides, and usage precautions.',
    isPrivate: false,
  },
  doctors: {
    title: 'Doctor Consultations & Appointments | Jevan Care',
    desc: 'Book online teleconsultations or clinic visits with verified specialists, pulmonologists, cardiologists, and general practitioners.',
    isPrivate: false,
  },
  map: {
    title: 'Nearby Healthcare & Hospital Finder | Jevan Care',
    desc: 'Locate nearby 24/7 emergency rooms, diagnostic lab centers, pharmacies, and clinics with real-time GPS routing and contact details.',
    isPrivate: false,
  },
  rumor: {
    title: 'Medical Fact Check & Health Rumor Debunker | Jevan Care',
    desc: 'Verify trending health claims, WhatsApp medical myths, and home remedies against peer-reviewed clinical research and WHO guidelines.',
    isPrivate: false,
  },
  assistant: {
    title: 'AI Health Companion & Voice Assistant | Jevan Care',
    desc: 'Consult your 24/7 AI wellness companion for disease awareness, symptom guidance, first aid advice, and personalized health insights.',
    isPrivate: false,
  },
  progress: {
    title: 'Health Progress & Vital Metrics Tracker | Jevan Care',
    desc: 'Log and monitor blood pressure, SpO2, blood glucose, heart rate, and BMI over time with visual analytics.',
    isPrivate: true,
  },
  lifestyle: {
    title: 'Lifestyle Care & Home Remedies | Jevan Care',
    desc: 'Explore therapist-guided diaphragmatic breathing exercises, natural herbal remedies, and daily wellness wisdom.',
    isPrivate: false,
  },
  vault: {
    title: 'Lifetime Medical Vault | Jevan Care',
    desc: 'Secure ABHA-linked cloud storage for lab reports, discharge summaries, vaccination records, and diagnostic scans.',
    isPrivate: true,
  },
  profile: {
    title: 'ABHA Health Profile & Settings | Jevan Care',
    desc: 'Manage ABHA health ID credentials, emergency contact details, allergies, and account security settings.',
    isPrivate: true,
  },
  admin: {
    title: 'Clinical Audit Panel | Jevan Care',
    desc: 'System administration and security audit log monitor.',
    isPrivate: true,
  },
  'blood-donation': {
    title: 'Voluntary Blood Donor Network | Jevan Care',
    desc: 'Join the private Jevan Care voluntary blood donor network. Connect securely with verified medical institutions when urgent requests match.',
    isPrivate: true,
  },
};

// Doctor Portal SEO
const DOCTOR_SEO_TITLES: Record<string, string> = {
  'doctor-dashboard': 'Physician Workspace Dashboard | Jevan Care Doctor Portal',
  'doctor-patients': 'Patients Roster & Medical Charts | Doctor Portal',
  'doctor-appointments': 'Clinical Appointments Queue | Doctor Portal',
  'doctor-records': 'Authorized Patient Vault Records | Doctor Portal',
  'doctor-notes': 'Clinical SOAP Notes Generator | Doctor Portal',
  'doctor-prescriptions': 'e-Prescription Pad | Doctor Portal',
  'doctor-reports': 'Diagnostics & Lab Reports Review | Doctor Portal',
  'doctor-ai': 'Clinical AI Diagnostic Assistant | Doctor Portal',
  'doctor-messages': 'Patient Consult Chat | Doctor Portal',
  'doctor-profile': 'Medical Credentials & Verification | Doctor Portal',
};

export const SEOHeadManager: React.FC<SEOHeadManagerProps> = ({
  activeTab,
  activeRole,
  isAuthenticated,
}) => {
  useEffect(() => {
    let title = 'Jevan Care - Digital Healthcare & Wellness Ecosystem';
    let description =
      'The complete AI-powered digital healthcare ecosystem with smart prescription scanner, AI health assistant, rumor detection, emergency hub, lifestyle engine, and lifetime Medical Vault.';
    let isPrivate = false;

    if (activeRole === 'Doctor') {
      title = DOCTOR_SEO_TITLES[activeTab] || 'Physician Clinical Portal | Jevan Care';
      description = 'Secure physician clinical workspace for patient evaluations, e-prescriptions, and SOAP notes.';
      isPrivate = true;
    } else {
      const tabInfo = TAB_SEO_TITLES[activeTab];
      if (tabInfo) {
        title = tabInfo.title;
        description = tabInfo.desc;
        isPrivate = tabInfo.isPrivate;
      }
    }

    // Update document title
    document.title = title;

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Update meta robots tag to protect private medical pages from search engine indexing
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }

    if (isPrivate && isAuthenticated) {
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else {
      metaRobots.setAttribute('content', 'index, follow');
    }

    // Update OpenGraph title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);
  }, [activeTab, activeRole, isAuthenticated]);

  return null;
};
