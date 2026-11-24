export const CLINIC_TIME_ZONE = "Africa/Cairo";

export function businessDate(instant: Date, timeZone = CLINIC_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    calendar: "iso8601",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const value = (type: "year" | "month" | "day") => {
    const part = parts.find((item) => item.type === type);
    if (!part) throw new RangeError(`Missing date part: ${type}`);
    return part.value;
  };
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function weekdayIndex(clinicDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clinicDate);
  if (!match) throw new RangeError("Expected a date in YYYY-MM-DD format");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

export function isClinicDateOpen(clinicDate: string, weeklyDayOff = 5, closedDates: string[] = []) {
  return weekdayIndex(clinicDate) !== weeklyDayOff && !closedDates.includes(clinicDate);
}

export function hourlyTimes(opensAt: string, closesAt: string): string[] {
  const openHour = Number(opensAt.slice(0, 2));
  const closeHour = Number(closesAt.slice(0, 2));
  if (
    !/^([01]\d|2[0-3]):00$/.test(opensAt) ||
    !/^([01]\d|2[0-3]):00$/.test(closesAt) ||
    openHour >= closeHour
  ) {
    return [];
  }
  return Array.from({ length: closeHour - openHour }, (_, index) => {
    return `${String(openHour + index).padStart(2, "0")}:00`;
  });
}

export function remainingSeats(occupied: number, capacity = 2): number {
  return Math.max(0, capacity - occupied);
}

export function clinicDateTimeToIso(
  clinicDate: string,
  time: string,
  timeZone = CLINIC_TIME_ZONE,
): string {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clinicDate);
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!dateMatch || !timeMatch) throw new RangeError("Invalid clinic date or time");

  const targetUtc = Date.UTC(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  );
  const localParts = new Intl.DateTimeFormat("en", {
    timeZone,
    calendar: "iso8601",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(targetUtc));
  const partValue = (type: string) => {
    const part = localParts.find((item) => item.type === type);
    if (!part) throw new RangeError(`Missing time part: ${type}`);
    return Number(part.value);
  };
  const representedUtc = Date.UTC(
    partValue("year"),
    partValue("month") - 1,
    partValue("day"),
    partValue("hour"),
    partValue("minute"),
  );
  return new Date(targetUtc - (representedUtc - targetUtc)).toISOString();
}

export function formatClinicDate(isoValue: string, language: "ar" | "en") {
  return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", {
    timeZone: CLINIC_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoValue));
}

export function formatClinicTime(isoValue: string, language: "ar" | "en") {
  return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", {
    timeZone: CLINIC_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoValue));
}

export function dateInputValue(instant: Date, timeZone = CLINIC_TIME_ZONE): string {
  return businessDate(instant, timeZone);
}

export function dateAfterDays(clinicDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clinicDate);
  if (!match) throw new RangeError("Expected a date in YYYY-MM-DD format");
  const day = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`;
}