import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { businessDate } from "@/lib/clinic-time";

export const Route = createFileRoute("/api/public/jobs/reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const p = await import("@/lib/clinic-push.server");
        const now = new Date();
        const hour = Number(new Intl.DateTimeFormat("en", { timeZone: "Africa/Cairo", hour: "2-digit", hourCycle: "h23" }).format(now));
        if (hour >= 23) return Response.json({ sent: 0 });
        const time = `${String(hour + 1).padStart(2, "0")}:00`;
        const { data: rows } = await db.from("appointments").select("id, name, phone, time").eq("date", businessDate(now)).eq("time", time).eq("status", "confirmed").eq("reminded", false);
        for (const r of rows ?? []) {
          await db.from("appointments").update({ reminded: true }).eq("id", r.id);
          await p.notifyStaff(db, "⏰ ميعاد قرّب", `${r.name} (${r.phone}) - الساعة ${p.fmtHour(r.time)} بعد أقل من ساعة`);
        }
        return Response.json({ sent: rows?.length ?? 0 });
      },
    },
  },
});
