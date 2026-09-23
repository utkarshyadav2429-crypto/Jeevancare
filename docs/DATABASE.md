# Database Architecture & Schemas — JeevanCare v1.0.0

## 1. Overview

JeevanCare interfaces with a Supabase PostgreSQL database. All operations in the application layer enforce strict client-bound user parameterization to guarantee data ownership and partition multi-tenant records.

---

## 2. Table Schemas & Ownership Mapping

### 2.1 `user_profiles`
- **Purpose**: Stores account metadata, roles, demographic details, and ABHA identifiers.
- **Primary Key**: `id` (UUID, maps to `auth.users.id`).
- **Ownership**: `id = auth.uid()`.
- **Key Fields**: `email`, `full_name`, `role` (`patient` | `doctor` | `admin`), `phone`, `abha_id`, `abha_number`, `abha_address`, `blood_group`, `created_at`.
- **Application Authorization**: Query filters on `.eq('id', userId)`.
- **Live RLS Verification**: NOT VERIFIED (External Cloud Database).

---

### 2.2 `active_medicines`
- **Purpose**: Tracks active medication regimens, scheduled doses, remaining counts, and refill alerts.
- **Primary Key**: `id` (UUID / Text).
- **Ownership**: `user_id` foreign key.
- **Key Fields**: `user_id`, `name`, `dosage`, `frequency`, `duration`, `time_of_day`, `remaining_doses`, `total_doses`, `prescribed_by`, `instructions`.
- **Application Authorization**: Query filters on `.eq('user_id', userId)`.
- **Live RLS Verification**: NOT VERIFIED (External Cloud Database).

---

### 2.3 `vault_items`
- **Purpose**: Metadata index of stored medical documents, lab reports, imaging records, and discharge summaries.
- **Primary Key**: `id` (UUID / Text).
- **Ownership**: `user_id` foreign key.
- **Key Fields**: `user_id`, `title`, `category`, `document_type`, `file_path`, `file_size`, `tags`, `uploaded_at`, `doctor_name`.
- **Application Authorization**: Query filters on `.eq('user_id', userId)`.
- **Live RLS Verification**: NOT VERIFIED (External Cloud Database).

---

### 2.4 `appointments`
- **Purpose**: Clinical consultations and teleconsultation bookings.
- **Primary Key**: `id` (UUID / Text).
- **Ownership**: `patient_id` and `doctor_id` foreign keys.
- **Key Fields**: `patient_id`, `doctor_id`, `doctor_name`, `specialty`, `date`, `time`, `mode` (`in_person` | `teleconsultation`), `status` (`Upcoming` | `Completed` | `Cancelled`), `notes`.
- **Application Authorization**: Patients query `.eq('patient_id', userId)`; Doctors query `.eq('doctor_id', doctorId)`.
- **Live RLS Verification**: NOT VERIFIED (External Cloud Database).

---

### 2.5 `health_metrics`
- **Purpose**: Daily vitals log (Blood Pressure, Glucose, Heart Rate, Oxygen Saturation, Weight).
- **Primary Key**: `id` (UUID / Text).
- **Ownership**: `user_id` foreign key.
- **Key Fields**: `user_id`, `recorded_at`, `systolic_bp`, `diastolic_bp`, `blood_sugar`, `heart_rate`, `oxygen_saturation`, `notes`.
- **Application Authorization**: Query filters on `.eq('user_id', userId)`.
- **Live RLS Verification**: NOT VERIFIED (External Cloud Database).

---

### 2.6 `clinical_notes`
- **Purpose**: Physician-authored clinical summaries, differential diagnoses, and treatment plans.
- **Primary Key**: `id` (UUID / Text).
- **Ownership**: `doctor_id` author foreign key and `patient_id` target foreign key.
- **Key Fields**: `doctor_id`, `patient_id`, `title`, `subjective`, `objective`, `assessment`, `plan`, `created_at`.
- **Application Authorization**: Query filters on `.eq('doctor_id', doctorId)`.
- **Live RLS Verification**: NOT VERIFIED (External Cloud Database).

---

### 2.7 `prescriptions`
- **Purpose**: Digitized prescription records resulting from OCR capture or direct doctor issuance.
- **Primary Key**: `id` (UUID / Text).
- **Ownership**: `user_id` foreign key.
- **Key Fields**: `user_id`, `doctor_name`, `date`, `diagnosis`, `medicines` (JSON array), `notes`, `file_path`.
- **Application Authorization**: Query filters on `.eq('user_id', userId)`.
- **Live RLS Verification**: NOT VERIFIED (External Cloud Database).

---

## 3. Database Ownership Summary vs. Live RLS

| Table Name | Owner Key | Application Query Filter | Live RLS Policy Probing |
| :--- | :--- | :--- | :--- |
| `user_profiles` | `id` | `.eq('id', userId)` | **NOT VERIFIED** |
| `active_medicines` | `user_id` | `.eq('user_id', userId)` | **NOT VERIFIED** |
| `vault_items` | `user_id` | `.eq('user_id', userId)` | **NOT VERIFIED** |
| `appointments` | `patient_id` / `doctor_id` | `.eq('patient_id', id)` / `.eq('doctor_id', id)` | **NOT VERIFIED** |
| `health_metrics` | `user_id` | `.eq('user_id', userId)` | **NOT VERIFIED** |
| `clinical_notes` | `doctor_id` | `.eq('doctor_id', doctorId)` | **NOT VERIFIED** |
| `prescriptions` | `user_id` | `.eq('user_id', userId)` | **NOT VERIFIED** |
