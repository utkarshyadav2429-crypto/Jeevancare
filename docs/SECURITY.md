# Security Architecture & Policies — JeevanCare v1.0.0

## 1. Authentication Architecture

JeevanCare employs Supabase Auth for token-based identity verification.
- **Session Tokens**: Handled via JWT access tokens and secure refresh mechanisms.
- **Role Validation**: Roles (`patient`, `doctor`, `admin`) are stored in `user_profiles` and checked during session initialization.

---

## 2. Cross-Account & Session Isolation

- **Deterministic Cache Keys**: All client-side storage keys are generated via `getUserCacheKey(prefix, userId)`:
  - Demo Sessions: `jeevancare_demo_<key>`
  - Authenticated Accounts: `jeevancare_<userId>_<key>`
- **Sign-Out Purge**: Signing out clears active in-memory state hooks and disassociates cache keys.
- **Zero-Data State**: Fresh accounts initialize strictly empty without hydrating demo fixtures or previous user states.

---

## 3. Storage Security & Document Protection

- **Bucket Hierarchy**: Stored objects are partitioned under `vault/${userId}/${filename}`.
- **URL Signing**: Client file requests receive short-lived signed URLs. Public permanent URLs are not exposed for sensitive clinical documents.
- **Document Deletion**: Invoking deletion purges both the cloud record metadata and the local cache entry.

---

## 4. API & Secret Management

- **Client Environment (`.env`)**: Only public anon keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are exposed to the browser.
- **Server Secrets**: Generative AI API keys (`GEMINI_API_KEY`) and server-side configurations are kept exclusively in server environment variables.
- **Logging Sanitization**: Medical reports, passwords, auth tokens, and raw prescription transcripts are excluded from logging pipelines.

---

## 5. Security Verification Status

| Security Control | Application Verification | Remote Cloud Probing |
| :--- | :--- | :--- |
| **Authentication Lifecycle** | **PASS** | **PASS** |
| **Session & Cache Isolation** | **PASS** | N/A |
| **Doctor/Patient Access Gating** | **PASS** | N/A |
| **Admin Route Protection** | **PASS** | N/A |
| **Storage Path Partitioning** | **PASS** | **PASS** |
| **Live Remote PostgreSQL RLS** | Pre-filtered in query | **NOT VERIFIED** |
| **Upstream Provider Backups** | Managed by cloud | **NOT VERIFIED** |

*Note: Live remote Supabase RLS policy execution has not been independently probed via direct administrative database access from this sandbox environment.*
