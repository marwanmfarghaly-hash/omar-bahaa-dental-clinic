import { useEffect, useState } from "react";

export type Status = "confirmed" | "completed" | "cancelled";
export type Service = { id: string; ar: string; en: string };
export type Appointment = {
  id: string; name: string; phone: string; serviceId: string; date: string; time: string;
  note: string; status: Status; doctorNotes: string; treatmentPlan: string; createdAt: string;
};
export type ClinicData = {
  info: { phone: string; addressAr: string; addressEn: string; opensAt: string; closesAt: string };
  services: Service[]; appointments: Appointment[]; offDays: string[]; doctorPassword: string;
};

export const SLOT_CAPACITY = 2;
const KEY = "dental-clinic-data-v1";

export const defaultServices: Service[] = [
  { id: "exam", ar: "كشف واستشارة تخصصية", en: "Dental Examination & Consultation" },
  { id: "xray", ar: "أشعة الأسنان الديجيتال", en: "Digital Dental X-Ray" },
  { id: "fill", ar: "حشو عادي تجميلي", en: "Cosmetic Fillings" },
  { id: "endo", ar: "حشو عصب وعلاج جذور ميكروسكوبي", en: "Endodontic & Root Canal Treatment" },
  { id: "prosth", ar: "تركيبات الأسنان الثابتة والمتحركة", en: "Fixed & Removable Prosthodontics" },
  { id: "scale", ar: "تنظيف وتلميع وإزالة الجير", en: "Scaling & Teeth Polishing" },
  { id: "white", ar: "تبييض الأسنان بالليزر", en: "Laser Teeth Whitening" },
  { id: "implant", ar: "زراعة الأسنان بأحدث التقنيات", en: "Advanced Dental Implants" },
];

export function defaultData(): ClinicData {
  return {
    info: { phone: "01286661471", addressAr: "٢٦١ ه‍ شارع الضغط", addressEn: "261 H, El-Daght Street", opensAt: "16:00", closesAt: "22:00" },
    services: defaultServices, appointments: [], offDays: [], doctorPassword: "doctor123",
  };
}

export function loadData(): ClinicData {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...defaultData(), ...(JSON.parse(raw) as Partial<ClinicData>) };
  } catch { /* ignore */ }
  return defaultData();
}

export function saveData(d: ClinicData) {
  window.localStorage.setItem(KEY, JSON.stringify(d));
  window.dispatchEvent(new Event("clinic-data"));
}

export function useClinicData() {
  const [data, setData] = useState<ClinicData>(() => defaultData());
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setData(loadData());
    sync(); setReady(true);
    window.addEventListener("clinic-data", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("clinic-data", sync); window.removeEventListener("storage", sync); };
  }, []);
  const update = (fn: (d: ClinicData) => ClinicData) => saveData(fn(loadData()));
  return { data, ready, update };
}

export function occupiedCount(appts: Appointment[], date: string, time: string) {
  return appts.filter((a) => a.date === date && a.time === time && a.status !== "cancelled").length;
}

export function buildIcs(a: Appointment, serviceName: string, address: string) {
  const [h] = a.time.split(":");
  const d = a.date.replace(/-/g, "");
  const end = String(Number(h) + 1).padStart(2, "0");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dental Clinic//AR", "BEGIN:VEVENT",
    `UID:${a.id}@dental-clinic`, `DTSTART;TZID=Africa/Cairo:${d}T${h}0000`, `DTEND;TZID=Africa/Cairo:${d}T${end}0000`,
    `SUMMARY:Dental Clinic - ${serviceName}`, `LOCATION:${address}`, "DESCRIPTION:د. عمر بهاء الدين", "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}
