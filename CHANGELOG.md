# Changelog — JeevanCare

All notable changes to the JeevanCare platform are documented in this file.

---

## [1.0.0] - 2026-08-28

### Added
- **Patient Health Dashboard**: Core clinical vitals display, daily adherence streak, and quick action cards.
- **Prescription Scanner & OCR**: Camera-based and upload capture with Gemini/Tesseract extraction, confidence rating, and manual editor.
- **Medical Vault**: Encrypted cloud document management with PDF export, category tags, and time-bound signed URL previews.
- **Medication Tracking**: Dose schedule management, taken decrements, and refill notifications.
- **Appointment Management**: In-person and Teleconsultation booking with status management.
- **AI Health Assistant**: Gemini conversational clinical helper grounded in personal vault documents and vitals with voice assistance.
- **Doctor Workspace**: Role-gated physician portal with appointment queue, patient medical history, SOAP clinical notes, and digital prescriptions.
- **Admin Audit Panel**: Role-gated audit logs, platform metrics, and user management.
- **Nearby Healthcare Map**: Interactive medical facility locator with emergency integration.
- **ABHA Card Linking**: Ayushman Bharat Health Account integration.
- **Blood Donation Registry**: Blood group matching and donor request management.

### Security & Hardening
- **User-Scoped Caching**: Dynamic cache key generation (`getUserCacheKey`) isolating Demo Mode from authenticated user accounts.
- **Signed URL Access**: Time-bound access for private medical files in Supabase Storage.
- **Role Guards**: Component and route-level protection for Doctor and Admin portals.
- **Secrets Management**: Clean separation of server secrets (`GEMINI_API_KEY`) from client builds.

### Performance & Reliability
- **Route-Level Code Splitting**: 17 heavy views lazy-loaded via `React.lazy` and `Suspense`.
- **Manual Vendor Chunking**: Bundles split across charts, PDF, maps, Supabase, and motion libraries.
- **Sensor Lifecycle Cleanup**: MediaStream and audio synthesizer termination on component unmount.
- **Video Optimization**: Motion and tab visibility listeners in `AuraiHero` to pause background video when inactive.
