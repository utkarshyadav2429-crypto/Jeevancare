# Data Flow & Privacy Lifecycle — JeevanCare v1.0.0

This document outlines how clinical and personal data flows across JeevanCare.

---

## 1. Prescription Scanning Pipeline

```
Patient Uploads Image
  │
  ▼
Client Canvas Pre-Processing (Orientation / Contrast)
  │
  ▼
Vision Analysis (Gemini / Tesseract OCR)
  │
  ▼
Structured Entity Extraction (JSON: Drug, Dose, Duration)
  │
  ▼
Patient Verification & Manual Corrections in UI
  │
  ▼
Supabase Database (`active_medicines` & `prescriptions`)
```

---

## 2. Medical Vault Document Pipeline

```
User Selects Lab Report / Image / PDF
  │
  ▼
Client Validation (MIME type, size limit)
  │
  ▼
Supabase Storage Bucket (`vault/${userId}/${filename}`)
  │
  ▼
Database Metadata Record Creation (`vault_items`)
  │
  ▼
Time-Bound Signed URL Generation for Secure Client Previews
```

---

## 3. AI Health Assistant Context Grounding

```
Patient Submits Health Inquiry
  │
  ▼
Client retrieves active patient medicines & recent vitals
  │
  ▼
Server-Side Gemini API Proxy with Clinical Prompt Context
  │
  ▼
Educational Response Generation + Medical Disclaimer
  │
  ▼
Rendered in UI & Cached under `getUserCacheKey('ai_chat_history', userId)`
```
