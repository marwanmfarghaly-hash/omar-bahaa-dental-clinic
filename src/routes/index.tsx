import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarCheck, Clock, MapPin, Phone, Stethoscope, ScanLine, Sparkles, Activity, Crown, Brush, Sun, Bone, CheckCircle2, Download } from "lucide-react";
import { ClinicHeader } from "@/components/ClinicHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useClinicLanguage } from "@/hooks/use-clinic-language";
import { buildIcs, SLOT_CAPACITY, type Appointment } from "@/lib/clinic-store";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { bookAppointment, getPublicClinic } from "@/lib/clinic.functions";

const clinicQuery = queryOptions({ queryKey: ["public-clinic"], queryFn: () => getPublicClinic(), refetchInterval: 60000 });
import { businessDate, dateAfterDays, hourlyTimes, isClinicDateOpen, formatClinicDate, clinicDateTimeToIso } from "@/lib/clinic-time";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dental Clinic | د. عمر بهاء الدين - زراعة وتجميل الأسنان" },
      { name: "description", content: "عيادة د. عمر بهاء الدين، استشاري وماجستير زراعة الأسنان. احجز موعدك أونلاين." },
      { property: "og:title", content: "Dental Clinic | د. عمر بهاء الدين" },
      { property: "og:description", content: "احجز كشفك في عيادة الأسنان - زراعة، تبييض، تركيبات وعلاج جذور." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(clinicQuery),
  component: Home,
});

const icons = [Stethoscope, ScanLine, Sparkles, Activity, Crown, Brush, Sun, Bone];

function Home() {
  const { language: lang, setLanguage } = useClinicLanguage();
  const { data } = useSuspenseQuery(clinicQuery);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const ar = lang === "ar";
  const t = (a: string, e: string) => (ar ? a : e);

  const today = businessDate(new Date());
  const dates = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; out.length < 14 && i < 40; i++) {
      const d = dateAfterDays(today, i);
      if (isClinicDateOpen(d, 5, data.offDays)) out.push(d);
    }
    return out;
  }, [today, data.offDays]);

  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<Appointment | null>(null);

  const nowHour = Number(new Intl.DateTimeFormat("en", { timeZone: "Africa/Cairo", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  const times = hourlyTimes(data.info.opensAt, data.info.closesAt);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) return setError(t("اختر الخدمة المطلوبة.", "Choose a service."));
    if (name.trim().length < 3) return setError(t("اكتب الاسم بالكامل.", "Enter your full name."));
    if (!/^01\d{9}$/.test(phone.replace(/\s/g, ""))) return setError(t("اكتب رقم موبايل صحيحاً (11 رقم).", "Enter a valid 11-digit mobile number."));
    if (!date || !time) return setError(t("اختر اليوم والوقت.", "Choose a day and time."));
    setBusy(true);
    try {
      const res = await bookAppointment({ data: { name: name.trim(), phone: phone.replace(/\s/g, ""), serviceId, date, time, note: note.trim() } });
      await qc.invalidateQueries({ queryKey: ["public-clinic"] });
      if (!res.ok) return setError(res.error === "full" ? t("هذا الوقت اكتمل، اختر وقتاً آخر.", "This time is full, choose another.") : t("تعذر الحجز، حاول مرة أخرى.", "Booking failed, please try again."));
      setError(""); setDone(res.appointment);
    } catch { setError(t("تعذر الاتصال، حاول مرة أخرى.", "Connection failed, please try again.")); } finally { setBusy(false); }
  };

  const svcName = (id: string) => { const s = data.services.find((x) => x.id === id); return s ? (ar ? s.ar : s.en) : ""; };
  const fmtTime = (tm: string) => { const h = Number(tm.slice(0, 2)); return `${h > 12 ? h - 12 : h}:00 ${t("م", "PM")}`; };
  const address = ar ? data.info.addressAr : data.info.addressEn;

  const downloadIcs = (a: Appointment) => {
    const blob = new Blob([buildIcs(a, svcName(a.serviceId), address)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "dental-appointment.ics"; link.click(); URL.revokeObjectURL(url);
  };
  const reset = () => { setDone(null); setTime(""); setNote(""); setServiceId(""); setDate(""); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ClinicHeader lang={lang} setLang={setLanguage} />

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{t("عيادة أسنان متخصصة", "Specialist dental care")}</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">{t("د. عمر بهاء الدين", "Dr. Omar Bahaa El-Din")}</h1>
            <p className="mt-2 text-lg font-semibold text-primary">{t("استشاري وماجستير زراعة الأسنان", "Consultant & Master of Dental Implantology")}</p>
            <p className="mt-4 max-w-md text-muted-foreground">{t("خبرة تخصصية في زراعة وتجميل الأسنان، ورعاية دقيقة تبدأ بالاستماع وتنتهي بخطة واضحة لك.", "Specialist experience in implants and cosmetic dentistry, with attentive care and a clear plan made for you.")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#booking"><Button size="lg" className="gap-2"><CalendarCheck className="h-5 w-5" />{t("احجز كشفك الآن", "Book your visit")}</Button></a>
              <a href={`tel:${data.info.phone}`}><Button size="lg" variant="outline" className="gap-2"><Phone className="h-5 w-5" />{data.info.phone}</Button></a>
            </div>
          </div>
          <div className="relative">
            <img src="/dental-clinic-interior.jpg" alt={t("داخل العيادة", "Clinic interior")} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl" />
            <div className="absolute -bottom-5 start-5 rounded-2xl bg-card p-4 shadow-lg">
              <div className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4 text-primary" />{t("السبت – الخميس", "Sat – Thu")}</div>
              <div className="text-xs text-muted-foreground">{t("٤:٠٠ عصراً – ١٠:٠٠ مساءً", "4:00 PM – 10:00 PM")}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-muted/50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">{t("خدماتنا", "Our services")}</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">{t("من الفحص الدقيق إلى الحلول التخصصية، نرافقك في كل خطوة.", "From a thoughtful examination to specialist treatment, we guide each step.")}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.services.map((s, i) => { const Icon = icons[i % icons.length] ?? Stethoscope; return (
              <div key={s.id} className="rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-lg">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-bold">{ar ? s.ar : s.en}</h3>
              </div>); })}
          </div>
        </div>
      </section>

      <section id="booking" className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-bold">{t("احجز زيارتك بكل سهولة", "Book a visit with ease")}</h2>
          <p className="mt-2 text-center text-muted-foreground">{t("مريضان كحد أقصى في كل ساعة لضمان رعاية هادئة.", "Up to two patients per hour for calm, focused care.")}</p>
          {done ? (
            <div className="mt-8 rounded-3xl border bg-card p-8 text-center shadow-sm">
              <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
              <h3 className="mt-3 text-2xl font-bold">{t("تم تأكيد موعدك", "Your visit is confirmed")}</h3>
              <dl className="mx-auto mt-5 max-w-sm space-y-2 text-start text-sm">
                <Row k={t("الاسم", "Name")} v={done.name} />
                <Row k={t("الخدمة", "Service")} v={svcName(done.serviceId)} />
                <Row k={t("اليوم", "Day")} v={formatClinicDate(clinicDateTimeToIso(done.date, done.time), lang)} />
                <Row k={t("الوقت", "Time")} v={fmtTime(done.time)} />
                <Row k={t("العنوان", "Address")} v={address} />
              </dl>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button onClick={() => downloadIcs(done)} className="gap-2"><Download className="h-4 w-4" />{t("إضافة إلى التقويم", "Add to calendar")}</Button>
                <Button variant="outline" onClick={reset}>{t("حجز موعد آخر", "Book another")}</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-6 rounded-3xl border bg-card p-6 shadow-sm md:p-8">
              <Field label={t("الخدمة المطلوبة", "Service")}>
                <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">{t("اختر الخدمة", "Choose a service")}</option>
                  {data.services.map((s) => <option key={s.id} value={s.id}>{ar ? s.ar : s.en}</option>)}
                </select>
              </Field>
              <Field label={t("اليوم المناسب (الجمعة عطلة)", "Preferred day (closed Fridays)")}>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {dates.map((d) => { const dt = new Date(`${d}T12:00:00Z`); return (
                    <button type="button" key={d} onClick={() => { setDate(d); setTime(""); }} className={`min-w-[72px] rounded-xl border px-3 py-2 text-center text-sm transition ${date === d ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`}>
                      <div className="text-xs opacity-80">{dt.toLocaleDateString(ar ? "ar-EG" : "en-US", { weekday: "short", timeZone: "UTC" })}</div>
                      <div className="font-bold">{dt.toLocaleDateString(ar ? "ar-EG" : "en-US", { day: "numeric", month: "short", timeZone: "UTC" })}</div>
                    </button>); })}
                </div>
              </Field>
              <Field label={t("الوقت المتاح", "Available time")}>
                {!date ? <p className="text-sm text-muted-foreground">{t("اختر اليوم لعرض الأوقات المتاحة.", "Choose a day to see available times.")}</p> : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {times.map((tm) => {
                      const left = SLOT_CAPACITY - (data.counts[`${date} ${tm}`] ?? 0);
                      const past = date === today && Number(tm.slice(0, 2)) <= nowHour;
                      const disabled = left <= 0 || past;
                      return (
                        <button type="button" key={tm} disabled={disabled} onClick={() => setTime(tm)} className={`rounded-xl border px-2 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${time === tm ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`}>
                          <div className="font-bold">{fmtTime(tm)}</div>
                          <div className="text-[10px]">{left <= 0 ? t("مكتمل", "Full") : past ? t("انتهى", "Passed") : t(`متاح ${left}`, `${left} left`)}</div>
                        </button>);
                    })}
                  </div>
                )}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("الاسم بالكامل", "Full name")}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label={t("رقم الموبايل", "Mobile number")}><Input dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" /></Field>
              </div>
              <Field label={t("ملاحظات (اختياري)", "Notes (optional)")}><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? t("جارٍ الحجز...", "Booking...") : t("تأكيد الحجز", "Confirm appointment")}</Button>
            </form>
          )}
        </div>
      </section>

      <footer className="border-t bg-muted/50 py-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 text-sm sm:grid-cols-3">
          <div className="flex items-start gap-2"><MapPin className="h-5 w-5 text-primary" />{address}</div>
          <div className="flex items-start gap-2"><Clock className="h-5 w-5 text-primary" />{t("السبت إلى الخميس 4:00 عصراً – 10:00 مساءً · الجمعة عطلة", "Sat – Thu 4:00 PM – 10:00 PM · Closed Fridays")}</div>
          <div className="flex items-start gap-2"><Phone className="h-5 w-5 text-primary" /><a href={`tel:${data.info.phone}`} dir="ltr">{data.info.phone}</a></div>
        </div>
        <div className="mx-auto mt-6 flex max-w-6xl justify-between px-4 text-xs text-muted-foreground">
          <span>© Dental Clinic</span>
          <span className="flex gap-4"><Link to="/qr">QR</Link><Link to="/doctor">{t("دخول الطبيب", "Doctor")}</Link></span>
        </div>
      </footer>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><span className="block text-sm font-semibold">{label}</span>{children}</div>;
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4 border-b pb-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>;
}
