-- JeevanCare Complete Production Database Schema & Migration
-- Architecture: PostgreSQL 15+ / Supabase Engine
-- Project ID: jwphdtforsqrojhkcyrb
-- Standards: UUID Primary Keys, Relational Integrity, RLS Security, Automated Triggers

--------------------------------------------------------------------------------
-- 0. EXTENSIONS & PREREQUISITES
--------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--------------------------------------------------------------------------------
-- 1. PROFILES (Master User Directory)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'medbuddy', 'admin')),
    phone TEXT,
    age INT CHECK (age IS NULL OR (age >= 0 AND age <= 130)),
    gender TEXT CHECK (gender IS NULL OR gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
    blood_group TEXT CHECK (blood_group IS NULL OR blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    allergies TEXT[] DEFAULT '{}',
    chronic_conditions TEXT[] DEFAULT '{}',
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    is_emergency_sharing_enabled BOOLEAN DEFAULT true,
    mfa_enabled BOOLEAN DEFAULT false,
    abha_number TEXT,
    abha_address TEXT,
    abha_linked BOOLEAN DEFAULT false,
    abha_linked_at TIMESTAMPTZ,
    state TEXT DEFAULT 'Uttar Pradesh',
    district TEXT DEFAULT 'Lucknow',
    city TEXT DEFAULT 'Lucknow',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile on signup" ON public.profiles;
CREATE POLICY "Users can insert their own profile on signup"
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

--------------------------------------------------------------------------------
-- 2. EMERGENCY CONTACTS (Normalized Caregiver Directory)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relation TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Users can manage their emergency contacts"
    ON public.emergency_contacts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 3. ECONOMIC PROFILES (Affordability & Government Schemes Engine)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.economic_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    monthly_household_income NUMERIC(12,2) DEFAULT 0.00,
    annual_household_income NUMERIC(12,2) DEFAULT 0.00,
    income_bracket TEXT,
    family_size INT DEFAULT 1,
    dependents_count INT DEFAULT 0,
    senior_dependents_count INT DEFAULT 0,
    child_dependents_count INT DEFAULT 0,
    occupation_category TEXT,
    ration_card_type TEXT,
    area_type TEXT DEFAULT 'Urban' CHECK (area_type IN ('Rural', 'Semi-Urban', 'Urban')),
    state TEXT DEFAULT 'Uttar Pradesh',
    district TEXT DEFAULT 'Lucknow',
    has_ayushman_card BOOLEAN DEFAULT false,
    ayushman_card_number TEXT,
    has_state_health_card BOOLEAN DEFAULT false,
    state_health_card_name TEXT,
    has_private_insurance BOOLEAN DEFAULT false,
    private_insurance_sum_insured NUMERIC(12,2) DEFAULT 0.00,
    has_disability_or_special_category BOOLEAN DEFAULT false,
    special_category_notes TEXT,
    consent_given BOOLEAN DEFAULT true,
    consent_given_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.economic_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their economic profile" ON public.economic_profiles;
CREATE POLICY "Users can manage their economic profile"
    ON public.economic_profiles FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 4. ACTIVE MEDICINES (Patient Pharmacotherapy Regimens)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.active_medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    salt TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    doctor_name TEXT,
    instructions TEXT,
    remaining_doses INT NOT NULL DEFAULT 10 CHECK (remaining_doses >= 0),
    total_doses INT NOT NULL DEFAULT 30 CHECK (total_doses >= 0),
    refill_required BOOLEAN DEFAULT false,
    prescribed_for TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.active_medicines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their active medicines" ON public.active_medicines;
CREATE POLICY "Users can manage their active medicines"
    ON public.active_medicines FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 5. MEDICINE USAGE LOGS (Adherence & Intake Verification)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medicine_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    active_medicine_id UUID NOT NULL REFERENCES public.active_medicines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMPTZ DEFAULT NOW(),
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'taken' CHECK (status IN ('taken', 'missed', 'skipped', 'snoozed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medicine_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their medicine usage logs" ON public.medicine_usage_logs;
CREATE POLICY "Users can manage their medicine usage logs"
    ON public.medicine_usage_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 6. REMINDERS (Dose Scheduling & Notification Triggers)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    times TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    days_of_week TEXT[] DEFAULT '{"Mon","Tue","Wed","Thu","Fri","Sat","Sun"}',
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their reminders" ON public.reminders;
CREATE POLICY "Users can manage their reminders"
    ON public.reminders FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 7. VAULT ITEMS (Encrypted Clinical Document Metadata)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vault_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Prescription', 'Doctor Note', 'Lab Report', 'X-Ray / Scan', 
        'ECG', 'Vaccination', 'Insurance', 'Bill', 'Allergy Record', 'Discharge Summary'
    )),
    doctor_name TEXT,
    disease_or_tag TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    file_size TEXT NOT NULL DEFAULT '1.0 MB',
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'jpg', 'png', 'doc')),
    file_url TEXT,
    notes TEXT,
    shared_link TEXT,
    shared_expiry DATE,
    is_important BOOLEAN DEFAULT false,
    is_encrypted BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their vault items" ON public.vault_items;
CREATE POLICY "Users can manage their vault items"
    ON public.vault_items FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 8. VAULT SHARE LINKS (Secure Temporary Physician Access)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vault_share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_item_id UUID NOT NULL REFERENCES public.vault_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    passcode_hash TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 HOURS'),
    view_count INT DEFAULT 0,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vault_share_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own share links" ON public.vault_share_links;
CREATE POLICY "Users can manage their own share links"
    ON public.vault_share_links FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view active valid share links" ON public.vault_share_links;
CREATE POLICY "Public can view active valid share links"
    ON public.vault_share_links FOR SELECT
    USING (is_revoked = false AND expires_at > NOW());

--------------------------------------------------------------------------------
-- 9. HEALTH METRIC LOGS (Time-Series Physiological Telemetry)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.health_metric_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    systolic_bp INT CHECK (systolic_bp IS NULL OR (systolic_bp BETWEEN 50 AND 260)),
    diastolic_bp INT CHECK (diastolic_bp IS NULL OR (diastolic_bp BETWEEN 30 AND 160)),
    blood_sugar NUMERIC CHECK (blood_sugar IS NULL OR blood_sugar > 0),
    weight NUMERIC CHECK (weight IS NULL OR weight > 0),
    temperature NUMERIC CHECK (temperature IS NULL OR (temperature BETWEEN 90 AND 110)),
    sleep_hours NUMERIC CHECK (sleep_hours IS NULL OR (sleep_hours BETWEEN 0 AND 24)),
    mood TEXT CHECK (mood IS NULL OR mood IN ('Great', 'Good', 'Neutral', 'Poor', 'Severe')),
    pain_level INT CHECK (pain_level IS NULL OR (pain_level BETWEEN 1 AND 10)),
    symptoms TEXT[] DEFAULT '{}',
    notes TEXT
);

ALTER TABLE public.health_metric_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their health metric logs" ON public.health_metric_logs;
CREATE POLICY "Users can manage their health metric logs"
    ON public.health_metric_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 10. DOCTORS (Verified Professional Directory & Telehealth Identity)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_code TEXT UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    photo_url TEXT,
    avatar_url TEXT,
    specialty TEXT NOT NULL,
    qualification TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    registration_authority TEXT NOT NULL DEFAULT 'Uttar Pradesh Medical Council',
    experience_years INT NOT NULL DEFAULT 0,
    rating NUMERIC NOT NULL DEFAULT 0.0 CHECK (rating BETWEEN 0 AND 5),
    reviews_count INT NOT NULL DEFAULT 0,
    hospital TEXT NOT NULL,
    address TEXT,
    city TEXT NOT NULL DEFAULT 'Lucknow',
    state TEXT NOT NULL DEFAULT 'Uttar Pradesh',
    country TEXT NOT NULL DEFAULT 'India',
    fees NUMERIC NOT NULL DEFAULT 500 CHECK (fees >= 0),
    consultation_types TEXT[] NOT NULL DEFAULT '{"Video", "In-Person"}',
    about TEXT,
    languages TEXT[] NOT NULL DEFAULT '{"English", "Hindi"}',
    verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('VERIFIED', 'PENDING', 'REJECTED', 'SUSPENDED')),
    online_status TEXT NOT NULL DEFAULT 'online' CHECK (online_status IN ('online', 'offline', 'busy')),
    available_days TEXT[] DEFAULT '{"Mon", "Tue", "Wed", "Thu", "Fri"}',
    available_slots TEXT[] DEFAULT '{"09:30 AM", "11:00 AM", "02:30 PM", "04:15 PM"}',
    consultation_duration_mins INT DEFAULT 20,
    lat NUMERIC,
    lng NUMERIC,
    distance_km NUMERIC DEFAULT 2.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view verified doctors" ON public.doctors;
CREATE POLICY "Anyone can view verified doctors"
    ON public.doctors FOR SELECT
    USING (verification_status = 'VERIFIED' OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));

DROP POLICY IF EXISTS "Doctors can manage their own profile" ON public.doctors;
CREATE POLICY "Doctors can manage their own profile"
    ON public.doctors FOR ALL
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can register as doctor" ON public.doctors;
CREATE POLICY "Authenticated users can register as doctor"
    ON public.doctors FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

--------------------------------------------------------------------------------
-- 11. APPOINTMENTS (Consultation Scheduling & Transactions)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE RESTRICT,
    legacy_doctor_id TEXT,
    doctor_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('In-Person', 'Audio', 'Video')),
    status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'CONFIRMED', 'UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    fees NUMERIC NOT NULL DEFAULT 0 CHECK (fees >= 0),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'waived')),
    payment_id TEXT,
    notes TEXT,
    prescriptions_shared UUID[] DEFAULT '{}',
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their appointments" ON public.appointments;
CREATE POLICY "Users can manage their appointments"
    ON public.appointments FOR ALL
    USING (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT user_id FROM public.doctors WHERE id = appointments.doctor_id)
    )
    WITH CHECK (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT user_id FROM public.doctors WHERE id = appointments.doctor_id)
    );

--------------------------------------------------------------------------------
-- 12. CLINICAL NOTES (Signed Doctor SOAP Documentation)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE RESTRICT,
    patient_name TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    note_type TEXT NOT NULL DEFAULT 'SOAP Note' CHECK (note_type IN ('SOAP Note', 'Progress Note', 'Discharge Summary', 'Pre-Op Evaluation')),
    subjective TEXT NOT NULL,
    objective TEXT NOT NULL,
    assessment TEXT NOT NULL,
    plan TEXT NOT NULL,
    vitals_snapshot JSONB DEFAULT '{}',
    doctor_signature TEXT NOT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients and attending doctors can view clinical notes" ON public.clinical_notes;
CREATE POLICY "Patients and attending doctors can view clinical notes"
    ON public.clinical_notes FOR SELECT
    USING (
        auth.uid() = patient_id OR 
        auth.uid() IN (SELECT user_id FROM public.doctors WHERE id = clinical_notes.doctor_id)
    );

DROP POLICY IF EXISTS "Doctors can create clinical notes for appointments" ON public.clinical_notes;
CREATE POLICY "Doctors can create clinical notes for appointments"
    ON public.clinical_notes FOR INSERT
    WITH CHECK (
        auth.uid() IN (SELECT user_id FROM public.doctors WHERE id = clinical_notes.doctor_id)
    );

--------------------------------------------------------------------------------
-- 13. CONSULTATION MESSAGES (Telehealth Dialogue & Attachments)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consultation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('doctor', 'patient', 'system')),
    text TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    is_urgent BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view consultation messages" ON public.consultation_messages;
CREATE POLICY "Participants can view consultation messages"
    ON public.consultation_messages FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.appointments WHERE id = consultation_messages.appointment_id
            UNION
            SELECT d.user_id FROM public.doctors d 
            JOIN public.appointments a ON a.doctor_id = d.id 
            WHERE a.id = consultation_messages.appointment_id
        )
    );

DROP POLICY IF EXISTS "Participants can send consultation messages" ON public.consultation_messages;
CREATE POLICY "Participants can send consultation messages"
    ON public.consultation_messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

--------------------------------------------------------------------------------
-- 14. MEDBUDDY PROFILES (Healthcare Companion Roster)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medbuddy_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_code TEXT UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    photo TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('Female', 'Male', 'Other')),
    age INT NOT NULL CHECK (age BETWEEN 18 AND 80),
    rating NUMERIC NOT NULL DEFAULT 5.0 CHECK (rating BETWEEN 0 AND 5),
    review_count INT NOT NULL DEFAULT 0,
    completed_trips INT NOT NULL DEFAULT 0,
    verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'suspended')),
    background_verified BOOLEAN NOT NULL DEFAULT true,
    training_completed BOOLEAN NOT NULL DEFAULT true,
    languages TEXT[] NOT NULL DEFAULT '{"Hindi", "English"}',
    service_area TEXT NOT NULL DEFAULT 'Lucknow Metro',
    current_availability TEXT NOT NULL DEFAULT 'available' CHECK (current_availability IN ('available', 'busy', 'offline', 'suspended')),
    current_lat NUMERIC,
    current_lng NUMERIC,
    bio TEXT,
    experience_years INT DEFAULT 2,
    active_booking_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medbuddy_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view verified medbuddy companions" ON public.medbuddy_profiles;
CREATE POLICY "Anyone can view verified medbuddy companions"
    ON public.medbuddy_profiles FOR SELECT
    USING (verification_status = 'verified' OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));

DROP POLICY IF EXISTS "MedBuddy companions can update their own profile" ON public.medbuddy_profiles;
CREATE POLICY "MedBuddy companions can update their own profile"
    ON public.medbuddy_profiles FOR UPDATE
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create medbuddy profile" ON public.medbuddy_profiles;
CREATE POLICY "Authenticated users can create medbuddy profile"
    ON public.medbuddy_profiles FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

--------------------------------------------------------------------------------
-- 15. MEDBUDDY BOOKINGS (Assisted Hospital Visit Bookings)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medbuddy_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_buddy_id UUID REFERENCES public.medbuddy_profiles(id) ON DELETE SET NULL,
    legacy_buddy_id TEXT,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    is_for_self BOOLEAN DEFAULT true,
    patient_relationship TEXT,
    patient_age INT,
    reason_category TEXT NOT NULL,
    custom_reason TEXT,
    emergency_screening_cleared BOOLEAN DEFAULT true,
    pickup_address TEXT NOT NULL,
    pickup_lat NUMERIC NOT NULL,
    pickup_lng NUMERIC NOT NULL,
    destination_place_id TEXT,
    destination_name TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    destination_lat NUMERIC NOT NULL,
    destination_lng NUMERIC NOT NULL,
    destination_phone TEXT,
    destination_maps_url TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    is_asap BOOLEAN DEFAULT false,
    expected_hospital_duration TEXT DEFAULT '1–2 hours',
    estimated_total_duration_minutes INT DEFAULT 120,
    return_required BOOLEAN DEFAULT true,
    return_option TEXT DEFAULT 'after_appointment',
    requested_services TEXT[] DEFAULT '{}',
    mobility_requirement TEXT DEFAULT 'independent' CHECK (mobility_requirement IN ('independent', 'walking_assistance', 'wheelchair', 'walking_stick', 'extra_assistance')),
    price_snapshot JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    pickup_pin VARCHAR(4) NOT NULL DEFAULT LPAD(FLOOR(RANDOM()*10000)::TEXT, 4, '0'),
    cab_status TEXT DEFAULT 'CAB_REQUESTED',
    cab_provider_name TEXT DEFAULT 'City Fleet',
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'paid', 'failed', 'refunded', 'cash', 'test_mode')),
    payment_id TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by TEXT,
    rating INT CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
    review_feedback TEXT,
    rated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medbuddy_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients and assigned companions can view bookings" ON public.medbuddy_bookings;
CREATE POLICY "Patients and assigned companions can view bookings"
    ON public.medbuddy_bookings FOR SELECT
    USING (
        auth.uid() = patient_id OR 
        auth.uid() IN (SELECT user_id FROM public.medbuddy_profiles WHERE id = medbuddy_bookings.assigned_buddy_id)
    );

DROP POLICY IF EXISTS "Patients can create bookings" ON public.medbuddy_bookings;
CREATE POLICY "Patients can create bookings"
    ON public.medbuddy_bookings FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients and assigned companions can update bookings" ON public.medbuddy_bookings;
CREATE POLICY "Patients and assigned companions can update bookings"
    ON public.medbuddy_bookings FOR UPDATE
    USING (
        auth.uid() = patient_id OR 
        auth.uid() IN (SELECT user_id FROM public.medbuddy_profiles WHERE id = medbuddy_bookings.assigned_buddy_id)
    );

--------------------------------------------------------------------------------
-- 16. MEDBUDDY BOOKING TASKS (Hospital Visit Checklist)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medbuddy_booking_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.medbuddy_bookings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('pickup', 'hospital', 'admin', 'return')),
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    completed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medbuddy_booking_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Booking participants can manage tasks" ON public.medbuddy_booking_tasks;
CREATE POLICY "Booking participants can manage tasks"
    ON public.medbuddy_booking_tasks FOR ALL
    USING (
        auth.uid() IN (
            SELECT patient_id FROM public.medbuddy_bookings WHERE id = medbuddy_booking_tasks.booking_id
            UNION
            SELECT mb.user_id FROM public.medbuddy_profiles mb 
            JOIN public.medbuddy_bookings b ON b.assigned_buddy_id = mb.id 
            WHERE b.id = medbuddy_booking_tasks.booking_id
        )
    );

--------------------------------------------------------------------------------
-- 17. MEDBUDDY BOOKING EVENTS (Immutable Ride Audit Log)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medbuddy_booking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.medbuddy_bookings(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL CHECK (actor_role IN ('patient', 'buddy', 'admin', 'system')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.medbuddy_booking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Booking participants can view events" ON public.medbuddy_booking_events;
CREATE POLICY "Booking participants can view events"
    ON public.medbuddy_booking_events FOR SELECT
    USING (
        auth.uid() IN (
            SELECT patient_id FROM public.medbuddy_bookings WHERE id = medbuddy_booking_events.booking_id
            UNION
            SELECT mb.user_id FROM public.medbuddy_profiles mb 
            JOIN public.medbuddy_bookings b ON b.assigned_buddy_id = mb.id 
            WHERE b.id = medbuddy_booking_events.booking_id
        )
    );

DROP POLICY IF EXISTS "Participants can insert booking events" ON public.medbuddy_booking_events;
CREATE POLICY "Participants can insert booking events"
    ON public.medbuddy_booking_events FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

--------------------------------------------------------------------------------
-- 18. BLOOD DONORS (Voluntary Registry)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_code TEXT UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    city TEXT NOT NULL DEFAULT 'Lucknow',
    state TEXT NOT NULL DEFAULT 'Uttar Pradesh',
    country TEXT NOT NULL DEFAULT 'India',
    preferred_contact_method TEXT NOT NULL DEFAULT 'Email' CHECK (preferred_contact_method IN ('Email', 'Phone', 'SMS', 'WhatsApp', 'Both')),
    availability TEXT NOT NULL DEFAULT 'Available' CHECK (availability IN ('Available', 'Busy', 'Temporarily Unavailable', 'Emergency Only', 'Currently Unavailable')),
    last_donation_date DATE,
    consent_given BOOLEAN NOT NULL DEFAULT true,
    consent_given_at TIMESTAMPTZ DEFAULT NOW(),
    notifications_paused BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own blood donor profile" ON public.blood_donors;
CREATE POLICY "Users can manage their own blood donor profile"
    ON public.blood_donors FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can search active voluntary blood donors" ON public.blood_donors;
CREATE POLICY "Authenticated users can search active voluntary blood donors"
    ON public.blood_donors FOR SELECT
    USING (is_active = true AND consent_given = true);

--------------------------------------------------------------------------------
-- 19. BLOOD REQUESTS (Emergency Shortage Calls)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_code TEXT UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    org_id TEXT NOT NULL,
    org_name TEXT NOT NULL,
    blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    units_needed INT NOT NULL DEFAULT 1 CHECK (units_needed > 0),
    urgency TEXT NOT NULL DEFAULT 'URGENT' CHECK (urgency IN ('CRITICAL', 'URGENT', 'STANDARD')),
    hospital_name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Lucknow',
    state TEXT NOT NULL DEFAULT 'Uttar Pradesh',
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    additional_instructions TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FULFILLED', 'CANCELLED', 'EXPIRED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view open blood requests" ON public.blood_requests;
CREATE POLICY "Anyone can view open blood requests"
    ON public.blood_requests FOR SELECT
    USING (status = 'OPEN');

DROP POLICY IF EXISTS "Authenticated users can create blood requests" ON public.blood_requests;
CREATE POLICY "Authenticated users can create blood requests"
    ON public.blood_requests FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Creators can update their blood requests" ON public.blood_requests;
CREATE POLICY "Creators can update their blood requests"
    ON public.blood_requests FOR UPDATE
    USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 20. ASSISTANT MESSAGES (AI Health Assistant Conversations)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assistant_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    text TEXT NOT NULL,
    image_url TEXT,
    audio_url TEXT,
    voice_text TEXT,
    has_red_flags BOOLEAN DEFAULT false,
    is_emergency BOOLEAN DEFAULT false,
    detected_language TEXT DEFAULT 'en',
    emotion_detected TEXT DEFAULT 'neutral',
    follow_up_question TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their assistant messages" ON public.assistant_messages;
CREATE POLICY "Users can manage their assistant messages"
    ON public.assistant_messages FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 21. AUDIT LOGS (HIPAA/DISHA Regulatory Access Log)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_id_text TEXT,
    user_name TEXT,
    user_role TEXT NOT NULL DEFAULT 'patient',
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT DEFAULT '103.24.18.92 (India)',
    status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'WARNING', 'DENIED')),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their own audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        auth.uid() = actor_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

--------------------------------------------------------------------------------
-- 22. DATABASE FUNCTIONS & TRIGGERS
--------------------------------------------------------------------------------

-- Function 1: Automatically populate profiles when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        name, 
        role
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'patient')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function 2: Generic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_economic_profiles_updated_at ON public.economic_profiles;
CREATE TRIGGER trg_economic_profiles_updated_at
    BEFORE UPDATE ON public.economic_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_active_medicines_updated_at ON public.active_medicines;
CREATE TRIGGER trg_active_medicines_updated_at
    BEFORE UPDATE ON public.active_medicines
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_vault_items_updated_at ON public.vault_items;
CREATE TRIGGER trg_vault_items_updated_at
    BEFORE UPDATE ON public.vault_items
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_doctors_updated_at ON public.doctors;
CREATE TRIGGER trg_doctors_updated_at
    BEFORE UPDATE ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_medbuddy_bookings_updated_at ON public.medbuddy_bookings;
CREATE TRIGGER trg_medbuddy_bookings_updated_at
    BEFORE UPDATE ON public.medbuddy_bookings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function 3: Automatic dose decrementing on intake logging
CREATE OR REPLACE FUNCTION public.decrement_medicine_dose()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'taken' THEN
        UPDATE public.active_medicines
        SET 
            remaining_doses = GREATEST(0, remaining_doses - 1),
            refill_required = (remaining_doses - 1 <= 3),
            updated_at = NOW()
        WHERE id = NEW.active_medicine_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_decrement_dose ON public.medicine_usage_logs;
CREATE TRIGGER trg_decrement_dose
    AFTER INSERT ON public.medicine_usage_logs
    FOR EACH ROW EXECUTE FUNCTION public.decrement_medicine_dose();

--------------------------------------------------------------------------------
-- 23. PERFORMANCE INDEXES
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_time ON public.health_metric_logs (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_active_meds_user ON public.active_medicines (user_id, remaining_doses);
CREATE INDEX IF NOT EXISTS idx_appointments_doc_slot ON public.appointments (doctor_id, date, time_slot);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments (user_id, status);
CREATE INDEX IF NOT EXISTS idx_doctors_search ON public.doctors (city, specialty, verification_status);
CREATE INDEX IF NOT EXISTS idx_medbuddy_status ON public.medbuddy_bookings (status, assigned_buddy_id);
CREATE INDEX IF NOT EXISTS idx_blood_donors_search ON public.blood_donors (city, blood_group, is_active);
CREATE INDEX IF NOT EXISTS idx_blood_requests_open ON public.blood_requests (city, blood_group, status);
CREATE INDEX IF NOT EXISTS idx_vault_user_cat ON public.vault_items (user_id, category);
CREATE INDEX IF NOT EXISTS idx_vault_share_token ON public.vault_share_links (access_token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_id, timestamp DESC);

--------------------------------------------------------------------------------
-- 24. STORAGE BUCKET CONFIGURATION & POLICIES
--------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('doctor-photos', 'doctor-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
-- Storage Policies
DROP POLICY IF EXISTS "Users can upload their medical documents" ON storage.objects;
CREATE POLICY "Users can upload their medical documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view their medical documents" ON storage.objects;
CREATE POLICY "Users can view their medical documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their medical documents" ON storage.objects;
CREATE POLICY "Users can delete their medical documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Anyone can view doctor photos" ON storage.objects;
CREATE POLICY "Anyone can view doctor photos"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('doctor-photos', 'user-avatars'));

DROP POLICY IF EXISTS "Authenticated users can upload avatars and photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars and photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id IN ('doctor-photos', 'user-avatars') AND auth.uid() IS NOT NULL);

--------------------------------------------------------------------------------
-- 25. SEED DATA (Doctors, MedBuddy Companions, Blood Requests)
--------------------------------------------------------------------------------
INSERT INTO public.doctors (
    legacy_code, name, specialty, qualification, registration_number, hospital, city, fees, rating, reviews_count, verification_status, online_status
) VALUES 
(
    'doc_001',
    'Dr. Rajeshwar K. Tripathi',
    'General Medicine & Pulmonology',
    'M.D. (Medicine), DM (Pulmonary) - KGMU Lucknow',
    'UPMC-48291',
    'King George''s Medical University (KGMU)',
    'Lucknow',
    600,
    4.9,
    128,
    'VERIFIED',
    'online'
),
(
    'doc_002',
    'Dr. Priya Sharma',
    'Cardiology & Preventive Care',
    'M.D., DNB (Cardiology), FACC',
    'UPMC-52194',
    'Sanjay Gandhi Postgraduate Institute (SGPGI)',
    'Lucknow',
    800,
    4.8,
    94,
    'VERIFIED',
    'online'
),
(
    'doc_003',
    'Dr. Vikramaditya Verma',
    'Endocrinology & Diabetology',
    'M.D. (Medicine), DM (Endocrinology - AIIMS)',
    'UPMC-39102',
    'Medanta Hospital & Research Institute',
    'Lucknow',
    750,
    4.9,
    112,
    'VERIFIED',
    'online'
),
(
    'doc_004',
    'Dr. Ananya Sen',
    'Pediatrics & Child Health',
    'M.D. (Pediatrics), DCH (UK)',
    'UPMC-61028',
    'Balrampur Hospital Campus',
    'Lucknow',
    500,
    4.7,
    81,
    'VERIFIED',
    'busy'
)
ON CONFLICT (legacy_code) DO NOTHING;

INSERT INTO public.medbuddy_profiles (
    legacy_code, name, phone, email, photo, gender, age, rating, review_count, completed_trips, verification_status, background_verified, training_completed, service_area, current_availability
) VALUES
(
    'mb_01',
    'Pooja Sharma',
    '+91 98765 21011',
    'pooja.companion@jeevancare.in',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'Female',
    28,
    4.9,
    34,
    38,
    'verified',
    true,
    true,
    'Chowk, Gomti Nagar & KGMU Campus',
    'available'
),
(
    'mb_02',
    'Rajesh Kumar',
    '+91 98765 21012',
    'rajesh.buddy@jeevancare.in',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'Male',
    34,
    4.8,
    52,
    64,
    'verified',
    true,
    true,
    'Alambagh, Charbagh & SGPGI Route',
    'available'
),
(
    'mb_03',
    'Sunita Devi',
    '+91 98765 21013',
    'sunita.care@jeevancare.in',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'Female',
    42,
    5.0,
    78,
    91,
    'verified',
    true,
    true,
    'Indira Nagar, Mahanagar & Civil Hospital',
    'available'
),
(
    'mb_04',
    'Amit Verma',
    '+91 98765 21014',
    'amit.assist@jeevancare.in',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    'Male',
    29,
    4.7,
    29,
    31,
    'verified',
    true,
    true,
    'Hazratganj & Balrampur Hospital Area',
    'available'
)
ON CONFLICT (legacy_code) DO NOTHING;

INSERT INTO public.blood_requests (
    legacy_code, org_id, org_name, blood_group, units_needed, urgency, hospital_name, city, contact_email, contact_phone, additional_instructions, status
) VALUES
(
    'br_001',
    'hosp_kgmu_01',
    'KGMU Emergency Trauma Center',
    'O-',
    3,
    'CRITICAL',
    'King George''s Medical University Trauma Complex',
    'Lucknow',
    'trauma.blood@kgmu.edu.in',
    '+91 522 225 7540',
    'Urgent emergency replacement required for road accident surgical stabilization.',
    'OPEN'
),
(
    'br_002',
    'hosp_sgpgi_02',
    'SGPGI Hematology & Oncology Ward',
    'B+',
    2,
    'URGENT',
    'Sanjay Gandhi Postgraduate Institute of Medical Sciences',
    'Lucknow',
    'bloodbank@sgpgi.ac.in',
    '+91 522 249 4000',
    'PRBC required for scheduled chemotherapy support patient.',
    'OPEN'
)
ON CONFLICT (legacy_code) DO NOTHING;
