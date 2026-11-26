import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Appointment, ClinicInfo, Service, Status } from "@/lib/clinic-store";
import { SLOT_CAPACITY } from "@/lib/clinic-store";
import { defaultReminderSettings, type ReminderSettings } from "@/lib/clinic-reminders";

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}
async function push() { return import("@/lib/clinic-push.server"); }

type Row = { id: string; name: string; phone: string; service_id: string; date: string; time: string; note: string; status: string; doctor_notes: string; treatment_plan: string; created_at: string };
const toAppt = (r: Row): Appointment => ({ id: r.id, name: r.name, phone: r.phone, serviceId: r.service_id, date: r.date, time: r.time, note: r.note, status: r.status as Status, doctorNotes: r.doctor_notes, treatmentPlan: r.treatment_plan, createdAt: r.created_at });

export const getPublicClinic = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data: s } = await db.from("clinic_settings").select("info, services, off_days").eq("id", 1).single();
  const today = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const { data: rows } = await db.from("appointments").select("date, time").neq("status", "cancelled").gte("date", today);
  const counts: Record<string, number> = {};
  for (const r of rows ?? []) counts[`${r.date} ${r.time}`] = (counts[`${r.date} ${r.time}`] ?? 0) + 1;
  return { info: s!.info as ClinicInfo, services: s!.services as Service[], offDays: s!.off_days, counts };
});

const bookSchema = z.object({
  name: z.string().trim().min(3).max(100),
  phone: z.string().regex(/^01\d{9}$/),
  serviceId: z.string().min(1).max(64),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):00$/),
  note: z.string().max(500),
});

export const bookAppointment = createServerFn({ method: "POST" })
  .inputValidator((i: z.infer<typeof bookSchema>) => bookSchema.parse(i))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: s } = await db.from("clinic_settings").select("off_days, services").eq("id", 1).single();
    if (s!.off_days.includes(data.date)) return { ok: false as const, error: "closed" };
    const { count } = await db.from("appointments").select("id", { count: "exact", head: true }).eq("date", data.date).eq("time", data.time).neq("status", "cancelled");
    if ((count ?? 0) >= SLOT_CAPACITY) return { ok: false as const, error: "full" };
    const { data: row, error } = await db.from("appointments").insert({ name: data.name, phone: data.phone, service_id: data.serviceId, date: data.date, time: data.time, note: data.note }).select().single();
    if (error || !row) return { ok: false as const, error: "failed" };
    const p = await push();
    const svc = (s!.services as Service[]).find((x) => x.id === data.serviceId)?.ar ?? "";
    await p.notifyStaff(db, "🦷 حجز جديد", `${data.name} - ${data.date} الساعة ${p.fmtHour(data.time)}${svc ? ` - ${svc}` : ""}`);
    return { ok: true as const, appointment: toAppt(row as Row) };
  });

const pw = z.object({ password: z.string().min(1).max(200) });

export const doctorLogin = createServerFn({ method: "POST" })
  .inputValidator((i: z.infer<typeof pw>) => pw.parse(i))
  .handler(async ({ data }) => {
    try { await (await push()).checkPassword(await admin(), data.password); return { ok: true }; } catch { return { ok: false }; }
  });

export const getDoctorData = createServerFn({ method: "POST" })
  .inputValidator((i: z.infer<typeof pw>) => pw.parse(i))
  .handler(async ({ data }) => {
    const db = await admin(); const p = await push();
    await p.checkPassword(db, data.password);
    const { data: s } = await db.from("clinic_settings").select("info, services, off_days, reminder_settings").eq("id", 1).single();
    const { data: rows } = await db.from("appointments").select("*").order("date").order("time");
    const vapid = await p.getVapid(db);
    return { info: s!.info as ClinicInfo, services: s!.services as Service[], offDays: s!.off_days, reminders: { ...defaultReminderSettings, ...((s!.reminder_settings ?? {}) as Partial<ReminderSettings>) }, appointments: (rows ?? []).map((r) => toAppt(r as Row)), vapidPublicKey: vapid.publicKey };
  });

const patchSchema = pw.extend({
  id: z.string().uuid(),
  remove: z.boolean().optional(),
  status: z.enum(["confirmed", "completed", "cancelled"]).optional(),
  doctorNotes: z.string().max(5000).optional(),
  treatmentPlan: z.string().max(5000).optional(),
});
export const updateAppointment = createServerFn({ method: "POST" })
  .inputValidator((i: z.infer<typeof patchSchema>) => patchSchema.parse(i))
  .handler(async ({ data }) => {
    const db = await admin(); await (await push()).checkPassword(db, data.password);
    if (data.remove) { await db.from("appointments").delete().eq("id", data.id); return { ok: true }; }
    const u: { status?: string; doctor_notes?: string; treatment_plan?: string } = {};
    if (data.status) u.status = data.status;
    if (data.doctorNotes !== undefined) u.doctor_notes = data.doctorNotes;
    if (data.treatmentPlan !== undefined) u.treatment_plan = data.treatmentPlan;
    await db.from("appointments").update(u).eq("id", data.id);
    return { ok: true };
  });

const settingsSchema = pw.extend({
  info: z.object({ phone: z.string().max(30), addressAr: z.string().max(300), addressEn: z.string().max(300), opensAt: z.string().max(5), closesAt: z.string().max(5) }).optional(),
  services: z.array(z.object({ id: z.string().max(64), ar: z.string().max(200), en: z.string().max(200) })).max(50).optional(),
  offDays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(500).optional(),
  newPassword: z.string().min(4).max(200).optional(),
  reminders: z.object({ enabled: z.boolean(), earlyHours: z.number().int().min(1).max(168), lateHours: z.number().int().min(1).max(72) }).optional(),
});
export const saveSettings = createServerFn({ method: "POST" })
  .inputValidator((i: z.infer<typeof settingsSchema>) => settingsSchema.parse(i))
  .handler(async ({ data }) => {
    const db = await admin(); const p = await push(); await p.checkPassword(db, data.password);
    const u: { info?: ClinicInfo; services?: Service[]; off_days?: string[]; doctor_password_hash?: string; reminder_settings?: ReminderSettings } = {};
    if (data.reminders) u.reminder_settings = data.reminders;
    if (data.info) u.info = data.info;
    if (data.services) u.services = data.services;
    if (data.offDays) u.off_days = data.offDays;
    if (data.newPassword) u.doctor_password_hash = await p.sha256(data.newPassword);
    await db.from("clinic_settings").update(u).eq("id", 1);
    return { ok: true };
  });

const subSchema = pw.extend({ endpoint: z.string().url().max(1000), p256dh: z.string().max(300), auth: z.string().max(300), test: z.boolean().optional() });
export const savePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((i: z.infer<typeof subSchema>) => subSchema.parse(i))
  .handler(async ({ data }) => {
    const db = await admin(); const p = await push(); await p.checkPassword(db, data.password);
    await db.from("push_subscriptions").upsert({ endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth });
    await p.notifyStaff(db, "✅ تم تفعيل التنبيهات", "هتوصلك إشعارات الحجوزات الجديدة وتذكير لما ميعاد أي مريض يقرّب.");
    return { ok: true };
  });
