// Privacy helpers ported from the original Python backend.

export type PatientInput = {
  patient_id: string | number;
  first_name: string;
  last_name: string;
  gender?: string;
  birth_date?: string;
};

export function patientToFhir(p: PatientInput) {
  if (p == null || p.patient_id == null || !p.first_name || !p.last_name) {
    throw new Error("Patient needs patient_id, first_name and last_name");
  }
  return {
    resourceType: "Patient",
    id: String(p.patient_id),
    name: [{ family: p.last_name, given: [p.first_name] }],
    gender: p.gender ?? null,
    birthDate: p.birth_date ?? null,
  };
}

export function generalizeAge(age: number): string {
  if (age < 20) return "<20";
  if (age < 40) return "20-39";
  if (age < 60) return "40-59";
  return "60+";
}

export function generalizeZip(zip: string): string {
  return String(zip).slice(0, 3) + "XX";
}

export function kAnonymize<T extends Record<string, unknown>>(records: T[]) {
  return records.map((r) => ({
    ...r,
    age: generalizeAge(Number(r["age"] ?? 0)),
    zip_code: generalizeZip(String(r["zip_code"] ?? "00000")),
  }));
}

export function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
