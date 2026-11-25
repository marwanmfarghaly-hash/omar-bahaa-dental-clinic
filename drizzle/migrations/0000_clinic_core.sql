CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.clinic_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  info jsonb NOT NULL,
  services jsonb NOT NULL,
  off_days text[] NOT NULL DEFAULT '{}',
  doctor_password_hash text NOT NULL,
  vapid_public text,
  vapid_private text
);
GRANT ALL ON public.clinic_settings TO service_role;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.clinic_settings (id, info, services, doctor_password_hash) VALUES (1,
 '{"phone":"01286661471","addressAr":"٢٦١ ه‍ شارع الضغط","addressEn":"261 H, El-Daght Street","opensAt":"16:00","closesAt":"22:00"}',
 '[{"id":"exam","ar":"كشف واستشارة تخصصية","en":"Dental Examination & Consultation"},{"id":"xray","ar":"أشعة الأسنان الديجيتال","en":"Digital Dental X-Ray"},{"id":"fill","ar":"حشو عادي تجميلي","en":"Cosmetic Fillings"},{"id":"endo","ar":"حشو عصب وعلاج جذور ميكروسكوبي","en":"Endodontic & Root Canal Treatment"},{"id":"prosth","ar":"تركيبات الأسنان الثابتة والمتحركة","en":"Fixed & Removable Prosthodontics"},{"id":"scale","ar":"تنظيف وتلميع وإزالة الجير","en":"Scaling & Teeth Polishing"},{"id":"white","ar":"تبييض الأسنان بالليزر","en":"Laser Teeth Whitening"},{"id":"implant","ar":"زراعة الأسنان بأحدث التقنيات","en":"Advanced Dental Implants"}]',
 encode(extensions.digest('doctor123', 'sha256'), 'hex'));

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  service_id text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'confirmed',
  doctor_notes text NOT NULL DEFAULT '',
  treatment_plan text NOT NULL DEFAULT '',
  reminded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.appointments (date, time);
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.push_subscriptions (
  endpoint text PRIMARY KEY,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;