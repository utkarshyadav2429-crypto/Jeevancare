# Known Limitations & Clinical Disclaimers — JeevanCare v1.0.0

## 1. Clinical & Medical Disclaimers

1. **Non-Diagnostic Tool**: JeevanCare and its AI assistant provide informational and workflow assistance only. It does not replace the diagnosis, prescription, or treatment of a licensed medical practitioner.
2. **Prescription OCR Verification**: Machine extraction of handwriting may produce errors or misread dosages. Patients and clinicians must always review and verify extracted medications before confirming.
3. **Emergency SOS Scope**: The Emergency SOS feature provides rapid local emergency contact numbers and quick-dial buttons. It does **not** provide automated satellite tracking or direct emergency service dispatch.

---

## 2. Infrastructure & Technical Verification Boundaries

1. **Live Remote Supabase RLS Policy Probing**: While client queries strictly filter by `user_id` and `doctor_id`, PostgreSQL-level RLS policies on the live cloud instance cannot be independently probed without direct administrative credentials.
2. **PWA Runtime in Preview**: Service Worker lifecycle execution within sandboxed preview iframes cannot be verified in development mode.
3. **Automated Disaster Recovery**: Database snapshot frequencies and automated backups are governed by upstream cloud providers (Supabase / GCP).
