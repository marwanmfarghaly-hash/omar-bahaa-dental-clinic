import { describe, expect, it } from "vitest";
import { cairoInstant, reminderDue } from "@/lib/clinic-reminders";

const s = { enabled: true, earlyHours: 48, lateHours: 12 };
const at = (date: string, time: string, hoursBefore: number) => new Date(cairoInstant(date, time) - hoursBefore * 3600000);

describe("reminderDue", () => {
  const a = { date: "2026-12-10", time: "18:00", createdAt: at("2026-12-10", "18:00", 24 * 6).toISOString() };
  it("booked 6 days ahead → reminder 2 days before", () => {
    expect(reminderDue(a, at("2026-12-10", "18:00", 49), s)).toBeNull();
    expect(reminderDue(a, at("2026-12-10", "18:00", 47), s)).toBe("early");
  });
  it("booked 1 day ahead → reminder 12 hours before", () => {
    const b = { ...a, createdAt: at("2026-12-10", "18:00", 30).toISOString() };
    expect(reminderDue(b, at("2026-12-10", "18:00", 13), s)).toBeNull();
    expect(reminderDue(b, at("2026-12-10", "18:00", 11), s)).toBe("late");
  });
  it("turned off → no reminder", () => {
    expect(reminderDue(a, at("2026-12-10", "18:00", 47), { ...s, enabled: false })).toBeNull();
  });
});
