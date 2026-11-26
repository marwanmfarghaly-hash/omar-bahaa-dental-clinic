export type ReminderSettings = { enabled: boolean; earlyHours: number; lateHours: number };
export const defaultReminderSettings: ReminderSettings = { enabled: true, earlyHours: 48, lateHours: 12 };
export const EARLY_OPTIONS = [24, 48, 72];
export const LATE_OPTIONS = [3, 6, 12];

/** UTC ms of a clinic-local date + "HH:00" time in Africa/Cairo (DST-aware). */
export function cairoInstant(date: string, time: string): number {
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
  const [h = 0, mi = 0] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const name = new Intl.DateTimeFormat("en", { timeZone: "Africa/Cairo", timeZoneName: "shortOffset" })
    .formatToParts(new Date(guess)).find((p) => p.type === "timeZoneName")?.value ?? "GMT+2";
  const off = Number(/GMT([+-]\d+)/.exec(name)?.[1] ?? 2);
  return guess - off * 3600000;
}

/** Bookings made well ahead get the early reminder; short-notice bookings get the late one. */
export function reminderDue(a: { date: string; time: string; createdAt: string }, now: Date, s: ReminderSettings): "early" | "late" | null {
  if (!s.enabled) return null;
  const start = cairoInstant(a.date, a.time);
  const lead = (start - new Date(a.createdAt).getTime()) / 3600000;
  const left = (start - now.getTime()) / 3600000;
  if (left <= 0) return null;
  if (lead > s.earlyHours) return left <= s.earlyHours ? "early" : null;
  if (lead > s.lateHours) return left <= s.lateHours ? "late" : null;
  return null;
}
