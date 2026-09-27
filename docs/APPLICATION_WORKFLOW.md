# Application Workflow Specification — JeevanCare

This document defines the comprehensive end-to-end application workflow, state transitions, subsystem interactions, and sequence diagrams for the JeevanCare platform.

---

## 1. Macro End-to-End Application Workflow

The following diagram illustrates how users, clinical professionals, edge sensors, server endpoints, and external services interact across the entire lifecycle of patient care:

```mermaid
flowchart TD
    %% Actors
    Patient([Patient / Caregiver])
    Doctor([Licensed Physician])
    Admin([System Auditor])

    %% Entry & Authentication
    subgraph AuthLayer ["1. Identity & Role Orchestration"]
        Entry[App Entry / Landing Page]
        AuthChoice{Auth Mode}
        DemoSession[Guest Demo Engine\nDeterministic Local Storage]
        SupabaseAuth[Supabase Auth\nJWT Token + Secure Cookies]
        RoleRouter{Role Dispatcher}
        
        Entry --> AuthChoice
        AuthChoice -->|Explore Demo| DemoSession
        AuthChoice -->|Sign In / Up| SupabaseAuth
        DemoSession --> RoleRouter
        SupabaseAuth --> RoleRouter
    end

    %% Role Routing
    RoleRouter -->|Role: Patient| PatientPortal[Patient Care Hub]
    RoleRouter -->|Role: Doctor| DoctorPortal[Doctor Workspace Portal]
    RoleRouter -->|Role: Admin| AdminPortal[Audit & Governance Panel]

    %% Patient Workflows
    subgraph PatientLoop ["2. Patient Core Workflow Loop"]
        Patient --> PatientPortal

        %% Intake Branches
        PatientPortal --> VitalsLog[Log Vitals\nBP, Glucose, SpO2, Sleep]
        PatientPortal --> OCRScan[Prescription Scanner\nCamera / File Upload]
        PatientPortal --> VaultUpload[Medical Vault\nEncrypted Lab Reports]
        PatientPortal --> AIChat[AI Health Assistant\nConversational Triage]
        PatientPortal --> EmergencySOS[Emergency SOS & MedBuddy]

        %% Processing
        OCRScan --> PreProcess[Canvas Contrast & Grayscale Pre-processing]
        PreProcess --> ServerProxy[Express Backend API\nPOST /api/gemini/proxy]
        AIChat --> ServerProxy
        
        ServerProxy --> GeminiAI[Google Gemini AI\nMultimodal & Clinical Extraction]
        GeminiAI --> StructuredJSON[JSON Extraction\nDrug, Dosage, Frequency, Warnings]
        StructuredJSON --> HumanVerify[Patient Confirmation & Safety Verification]

        %% Persistence
        HumanVerify --> DBActiveMeds[(Supabase DB: active_medicines)]
        VitalsLog --> DBVitals[(Supabase DB: metric_logs)]
        VaultUpload --> S3Storage[(Supabase Storage: medical-documents)]
        S3Storage --> DBVault[(Supabase DB: vault_items)]

        %% Analytics & Circadian
        DBVitals --> TrendEngine[D3 / Recharts Trend & Forecasting Engine]
        TrendEngine --> PredictiveAlerts[Predictive Risk Alerts & Circadian Regimen]
        PredictiveAlerts --> RoutineScheduler[Solar / Circadian Wellness Schedule]
    end

    %% Emergency Hub
    subgraph EmergencyWorkflow ["3. Rapid Response & Community Network"]
        EmergencySOS --> GPSCapture[GPS Geolocation Coordinates]
        GPSCapture --> FacilityQuery[OSM Overpass / Haversine Facility Matching]
        FacilityQuery --> MedBuddyBook[MedBuddy Hospital Companion Dispatch]
        FacilityQuery --> BloodNetwork[e-RaktKosh Live Blood Matcher]
    end

    %% Doctor Loop
    subgraph ClinicalLoop ["4. Clinical Review & Doctor Workspace"]
        Doctor --> DoctorPortal
        DoctorPortal --> PatientRoster[Assigned Patient Directory]
        PatientRoster --> ClinicalReview[Review Patient Trends, Vault & OCR Rx]
        ClinicalReview --> WriteNotes[Author Clinical Encounter Notes]
        ClinicalReview --> IssueRx[Issue / Validate Verified Digital Prescription]
        
        WriteNotes --> DBClinicalNotes[(Supabase DB: clinical_notes)]
        IssueRx --> DBActiveMeds
        DBClinicalNotes -.->|Synced to Patient View| PatientPortal
    end

    %% Admin & Audit Loop
    subgraph GovernanceLoop ["5. Security, Audit & Compliance"]
        Admin --> AdminPortal
        AdminPortal --> AuditLogs[(Supabase DB: audit_logs)]
        AdminPortal --> HealthPings[System Health Monitoring]
    end
```

---

## 2. Subsystem Workflow Diagrams

### 2.1 Prescription OCR & Medication Intelligence Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient
    participant UI as Scanner UI (React)
    participant Canvas as Client Canvas Worker
    participant Server as Express Server (server.ts)
    participant Gemini as Google Gemini AI
    participant DB as Supabase PostgreSQL

    Patient->>UI: Selects Camera or Uploads Rx Photo
    UI->>Canvas: Run Grayscale & Contrast Normalization
    Canvas-->>UI: Optimized High-DPI Base64 Data
    UI->>Server: POST /api/gemini/proxy (Prompt + Image Part)
    Note over Server: Validates Content-Type & Rate Limit
    Server->>Gemini: gemini-2.5-flash / gemini-2.0-flash generateContent()
    Gemini-->>Server: Structured JSON with Medicines, Doses, Timings
    Server-->>UI: Return Extracted Entities
    UI->>UI: Run Interaction & Contraindication Check (Local DB)
    UI->>Patient: Display Editable Verification Card
    Patient->>UI: Confirms / Adjusts Dosages
    UI->>DB: INSERT into `prescriptions` & `active_medicines`
    DB-->>UI: Confirmation & Refreshed Medication Schedule
    UI->>Patient: Scheduled Medication Alarms & Jan Aushadhi Generic Savings
```

---

### 2.2 Medical Vault Encrypted Document Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient
    participant UI as Medical Vault (React)
    participant Cache as Scoped User Cache
    participant Storage as Supabase Storage Bucket
    participant DB as Supabase PostgreSQL

    Patient->>UI: Drags & Drops Lab Report (PDF / Image)
    UI->>UI: Verify MIME Type & File Size (<15MB)
    alt Supabase Connected
        UI->>Storage: upload(`vault/${userId}/${docId}_${fileName}`)
        Storage-->>UI: Path Confirmation
        UI->>DB: INSERT into `vault_items` (title, category, tags, storage_path)
        DB-->>UI: Record Created
        UI->>Storage: createSignedUrl(storage_path, 3600)
        Storage-->>UI: Expiring Secure URL for Preview
    else Offline or Demo Mode
        UI->>Cache: Save Document Metadata & Local Blob URL
        Cache-->>UI: In-Memory / LocalStorage Record
    end
    UI->>Patient: Document Indexed with Category Filter & Privacy Tags
```

---

### 2.3 Emergency SOS & MedBuddy Dispatch Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient in Distress
    participant UI as Emergency Hub UI
    participant Geo as Browser Geolocation API
    participant Overpass as Nearby Facility Service
    participant SMS as Emergency Dispatcher
    participant Buddy as MedBuddy Companion Network

    Patient->>UI: Taps Red SOS Button (3-Second Safety Guard)
    UI->>Geo: Request High-Accuracy Coordinates (lat, lng)
    Geo-->>UI: Lat: 28.6139, Lng: 77.2090
    par Parallel Dispatch
        UI->>Overpass: Query Emergency Facilities within 5km radius
        Overpass-->>UI: Ranked Hospitals with Distance & Directions
        UI->>SMS: Generate SOS SMS link with Live Google Maps Pin
        UI->>Buddy: Match Nearest MedBuddy Companion for Bedside Support
    end
    UI->>Patient: Live Route Navigation, 108 Direct Call & Companion Status
```

---

### 2.4 Doctor Consultation & Clinical Note Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Doctor as Attending Physician
    participant Portal as Doctor Workspace
    participant DB as Supabase PostgreSQL
    actor Patient as Patient

    Doctor->>Portal: Authenticates with Doctor Credentials
    Portal->>DB: SELECT patients WHERE assigned_doctor = current_doctor_id
    DB-->>Portal: Patient List with Recent Vitals & Alerts
    Doctor->>Portal: Selects Patient Record
    Portal->>DB: Query 7-Day Metric Logs & Vault Reports
    DB-->>Portal: Structured Vitals Matrix & Lab Results
    Doctor->>Portal: Enters Clinical Assessment & Prescription Plan
    Portal->>DB: INSERT into `clinical_notes` & UPDATE `active_medicines`
    DB-->>Portal: Transaction Confirmed
    DB-->>Patient: Real-Time Sync / Dashboard Notification Updated
```

---

## 3. Component Communication Matrix

| Source Component | Destination Component | Protocol / Channel | Payload / Schema | Security & Fallback |
| :--- | :--- | :--- | :--- | :--- |
| **React Client** | **Express Backend (`server.ts`)** | HTTP POST `/api/gemini/proxy` | Multimodal prompt, user clinical context, image data | API key secured on server; rate-limited; sanitized input |
| **React Client** | **Supabase Auth** | HTTPS REST / WebSocket | Email, password, session refresh token | JWT token stored securely; deterministic demo fallback |
| **React Client** | **Supabase Database** | PostgreSQL via `@supabase/supabase-js` | `metric_logs`, `active_medicines`, `vault_items`, `clinical_notes` | Row-Level Security (RLS) scoped to `auth.uid()` |
| **React Client** | **Supabase Storage** | HTTPS S3-compatible API | Encrypted PDFs, DICOM, Lab Images | Time-bound signed URLs (60-minute expiry) |
| **React Client** | **Browser Geolocation API** | W3C Geolocation API | `{ latitude, longitude, accuracy }` | User permission check; fallback to New Delhi center |
| **React Client** | **OpenStreetMap / Overpass** | HTTPS REST API | Bounding box coordinates | Client-side Haversine distance ranking |
| **React Client** | **Service Worker (`sw.js`)** | Cache API / Service Worker | Offline assets, shell HTML, icons | Offline fallback with background sync banner |

---

## 4. State Transition & Lifecycle States

```
[ App Init ] 
      │
      ├── (Check Local Storage / Supabase Session)
      │
      ├──► Mode: DEMO_GUEST ──► Seeded Deterministic Store ──► LocalStorage
      │
      └──► Mode: AUTHENTICATED ──► JWT Validated ──► Supabase PostgreSQL (RLS)
              │
              ├── Role: PATIENT ────► Vitals Tracker ──► OCR Scanner ──► Vault
              │
              ├── Role: DOCTOR ─────► Patient Directory ──► Consultation Notes
              │
              └── Role: ADMIN ──────► Audit Logs ──► System Performance
```

This workflow ensures complete transparency, compliance with privacy regulations, zero client-side credential leakage, and seamless continuity between offline and cloud-connected states.
