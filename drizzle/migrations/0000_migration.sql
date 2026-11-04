CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  account_type text NOT NULL DEFAULT 'provider' CHECK (account_type IN ('provider','researcher','pharma','user')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text := coalesce(new.raw_user_meta_data->>'account_type','provider');
BEGIN
  IF t NOT IN ('provider','researcher','pharma','user') THEN t := 'provider'; END IF;
  INSERT INTO public.profiles (id, username, account_type)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), t);
  RETURN new;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.providers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  type text,
  location text
);
GRANT SELECT ON public.providers TO anon, authenticated;
GRANT ALL ON public.providers TO service_role;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers public read" ON public.providers FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.datasets (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  provider text NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  category text,
  format text NOT NULL DEFAULT 'FHIR',
  owner_id uuid,
  listing_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.datasets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.datasets TO authenticated;
GRANT ALL ON public.datasets TO service_role;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "datasets public read" ON public.datasets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "datasets own insert" ON public.datasets FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "datasets own update" ON public.datasets FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "datasets own delete" ON public.datasets FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.consents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  dataset_id bigint NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'granted' CHECK (status IN ('granted','revoked')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dataset_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own consents" ON public.consents FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

INSERT INTO public.providers (name, type, location) VALUES
('Apollo Hospital','Hospital','Bengaluru'),('Fortis Healthcare','Hospital','Delhi'),('IISc Research','Research','Bengaluru'),
('AIIMS','Hospital','New Delhi'),('NIMHANS','Hospital','Bengaluru'),('Tata Memorial','Hospital','Mumbai'),
('Max Healthcare','Hospital','Delhi'),('Manipal Hospitals','Hospital','Bengaluru'),('CSIR Labs','Research','Hyderabad');

INSERT INTO public.datasets (title, description, provider, price, category, format) VALUES
('Diabetes Patient Cohort','Anonymized FHIR dataset for diabetes research.','Apollo Hospital',200,'Diabetes','FHIR'),
('Cardiology Cases','Heart disease FHIR data for clinical trials.','Fortis Healthcare',350,'Cardiology','FHIR'),
('Oncology Imaging','Anonymized oncology imaging FHIR bundle.','Tata Memorial',500,'Oncology','FHIR'),
('Neuro Study','Neurological disorders registry.','NIMHANS',420,'Neurology','FHIR'),
('Pediatrics Vaccination','Pediatric vaccination records.','AIIMS',180,'Pediatrics','FHIR'),
('Respiratory Cohort','COPD & asthma anonymized data.','Max Healthcare',260,'Respiratory','FHIR'),
('Orthopedics Imaging','MSK imaging with structured metadata.','Manipal Hospitals',310,'Orthopedics','FHIR'),
('Virology Trials','CSIR lab trial datasets.','CSIR Labs',290,'Virology','FHIR');