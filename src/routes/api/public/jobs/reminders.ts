import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { businessDate } from "@/lib/clinic-time";
import { defaultReminderSettings, reminderDue, type ReminderSettings } from "@/lib/clinic-reminders";

export const Route = createFileRoute("/api/public/jobs/reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const p = await import("@/lib/clinic-push.server");
        const { data: st } = await db.from("clinic_settings").select("reminder_settings").eq("id", 1).single();
        const cfg = { ...defaultReminderSettings, ...((st?.reminder_settings ?? {}) as Partial<ReminderSettings>) };
        if (!cfg.enabled) return Response.json({ sent: 0 });
        const now = new Date();
        const { data: rows } = await db.from("appointments").select("id, name, phone, date, time, created_at")
          .gte("date", businessDate(now)).eq("status", "confirmed").eq("reminded", false).limit(500);
        let sent = 0;
        for (const r of rows ?? []) {
          const kind = reminderDue({ date: r.date, time: r.time, createdAt: r.created_at }, now, cfg);
          if (!kind) continue;
          await db.from("appointments").update({ reminded: true }).eq("id", r.id);
          const when = r.date === businessDate(now) ? "النهارده" : r.date;
          await p.notifyStaff(db, "⏰ الميعاد قرّب", `${r.name} (${r.phone}) - ${when} الساعة ${p.fmtHour(r.time)} - اتواصل معاه لتأكيد الحضور`);
          sent++;
        }
        return Response.json({ sent });
      },
    },
  },
});
