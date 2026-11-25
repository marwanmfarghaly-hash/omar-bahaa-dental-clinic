export type Status = "confirmed" | "completed" | "cancelled";
export type Service = { id: string; ar: string; en: string };
export type ClinicInfo = { phone: string; addressAr: string; addressEn: string; opensAt: string; closesAt: string };
export type Appointment = {
  id: string; name: string; phone: string; serviceId: string; date: string; time: string;
  note: string; status: Status; doctorNotes: string; treatmentPlan: string; createdAt: string;
};

export const SLOT_CAPACITY = 2;

export const defaultInfo: ClinicInfo = { phone: "01286661471", addressAr: "٢٦١ ه‍ شارع الضغط", addressEn: "261 H, El-Daght Street", opensAt: "16:00", closesAt: "22:00" };

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
