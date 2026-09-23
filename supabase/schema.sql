-- JeevanCare Supabase Complete Database Schema & RLS Policies
-- Project ID: jwphdtforsqrojhkcyrb
-- Target Engine: PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. PROFILES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
    phone TEXT,
    age INT,
    gender TEXT,
    blood_group TEXT,
    allergies TEXT[] DEFAULT '{}',
    chronic_conditions TEXT[] DEFAULT '{}',
    mfa_enabled BOOLEAN DEFAULT false,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    is_emergency_sharing_enabled BOOLEAN DEFAULT true,
    abha_number TEXT,
    abha_address TEXT,
    abha_linked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile on signup" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

--------------------------------------------------------------------------------
-- 2. ACTIVE MEDICINES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.active_medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    remaining_doses INT NOT NULL DEFAULT 10,
    total_doses INT NOT NULL DEFAULT 30,
    refill_required BOOLEAN DEFAULT false,
    prescribed_for TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.active_medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their active medicines"
    ON public.active_medicines FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 3. MEDICAL VAULT ITEMS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vault_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Prescription', 'Doctor Note', 'Lab Report', 'X-Ray / Scan', 
        'ECG', 'Vaccination', 'Insurance', 'Bill', 'Allergy Record', 'Discharge Summary'
    )),
    doctor_name TEXT,
    disease_or_tag TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    file_size TEXT NOT NULL DEFAULT '1.2 MB',
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'jpg', 'png', 'doc')),
    file_url TEXT,
    notes TEXT,
    shared_link TEXT,
    shared_expiry DATE,
    is_important BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their vault items"
    ON public.vault_items FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 4. APPOINTMENTS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('In-Person', 'Audio', 'Video')),
    status TEXT NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Completed', 'Cancelled')),
    fees NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    prescriptions_shared TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their appointments"
    ON public.appointments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 5. HEALTH METRIC LOGS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.health_metric_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    systolic_bp INT,
    diastolic_bp INT,
    blood_sugar NUMERIC,
    weight NUMERIC,
    temperature NUMERIC,
    sleep_hours NUMERIC,
    mood TEXT CHECK (mood IN ('Great', 'Good', 'Neutral', 'Poor', 'Severe')),
    pain_level INT CHECK (pain_level BETWEEN 1 AND 10),
    symptoms TEXT[] DEFAULT '{}',
    notes TEXT
);

ALTER TABLE public.health_metric_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their health metric logs"
    ON public.health_metric_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 6. MEDICINE REMINDERS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE POLICY "Users can manage their reminders"
    ON public.reminders FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 7. ASSISTANT CHAT MESSAGES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assistant_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    text TEXT NOT NULL,
    image_url TEXT,
    audio_url TEXT,
    has_red_flags BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their assistant messages"
    ON public.assistant_messages FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 8. DOCTORS DIRECTORY & VERIFICATION TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctors (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    photo_url TEXT,
    avatar_url TEXT,
    specialty TEXT NOT NULL,
    qualification TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    registration_authority TEXT NOT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    rating NUMERIC NOT NULL DEFAULT 0,
    reviews_count INT NOT NULL DEFAULT 0,
    hospital TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    address TEXT,
    fees NUMERIC NOT NULL DEFAULT 500,
    consultation_types TEXT[] NOT NULL DEFAULT '{"Video", "In-Person"}',
    about TEXT,
    languages TEXT[] NOT NULL DEFAULT '{"English", "Hindi"}',
    verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('VERIFIED', 'PENDING', 'REJECTED')),
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

CREATE POLICY "Anyone can view verified doctors"
    ON public.doctors FOR SELECT
    USING (verification_status = 'VERIFIED' OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));

CREATE POLICY "Doctors can manage their own profile"
    ON public.doctors FOR ALL
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can register as doctor"
    ON public.doctors FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

--------------------------------------------------------------------------------
-- 9. BLOOD DONORS DIRECTORY TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_donors (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    preferred_contact_method TEXT NOT NULL DEFAULT 'Email' CHECK (preferred_contact_method IN ('Email', 'Phone', 'SMS', 'WhatsApp')),
    availability TEXT NOT NULL DEFAULT 'Available' CHECK (availability IN ('Available', 'Busy', 'Temporarily Unavailable')),
    last_donation_date DATE,
    consent_given BOOLEAN NOT NULL DEFAULT true,
    consent_given_at TIMESTAMPTZ DEFAULT NOW(),
    notifications_paused BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own blood donor profile"
    ON public.blood_donors FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can search active voluntary blood donors"
    ON public.blood_donors FOR SELECT
    USING (is_active = true AND consent_given = true);

--------------------------------------------------------------------------------
-- 10. BLOOD REQUESTS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_requests (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    org_name TEXT NOT NULL,
    blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    units_needed INT NOT NULL DEFAULT 1,
    urgency TEXT NOT NULL DEFAULT 'URGENT' CHECK (urgency IN ('CRITICAL', 'URGENT', 'STANDARD')),
    hospital_name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    additional_instructions TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FULFILLED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open blood requests"
    ON public.blood_requests FOR SELECT
    USING (status = 'OPEN');

CREATE POLICY "Authenticated users can create blood requests"
    ON public.blood_requests FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

--------------------------------------------------------------------------------
-- 11. STORAGE BUCKET CONFIGURATION & POLICIES
--------------------------------------------------------------------------------
-- Create medical-documents storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('doctor-photos', 'doctor-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Security Policies
CREATE POLICY "Users can upload their medical documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their medical documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their medical documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view doctor photos"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('doctor-photos', 'user-avatars'));

CREATE POLICY "Authenticated users can upload avatars and photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id IN ('doctor-photos', 'user-avatars') AND auth.uid() IS NOT NULL);
