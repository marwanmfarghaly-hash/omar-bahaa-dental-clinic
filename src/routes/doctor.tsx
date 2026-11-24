import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Lock, LogOut, Search, Trash2, CalendarX, Settings, ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useClinicData, type Appointment, type Status } from "@/lib/clinic-store";
import { businessDate } from "@/lib/clinic-time";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "لوحة الطبيب | Dental Clinic" },
      { name: "description", content: "لوحة تحكم د. عمر بهاء الدين لإدارة المواعيد والمرضى." },
      { property: "og:title", content: "لوحة الطبيب | Dental Clinic" },
      { property: "og:description", content: "إدارة مواعيد وسجلات مرضى العيادة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DoctorPage,
});

const SESSION = "dental-doctor-unlocked";
const statusLabel: Record<Status, string> = { confirmed: "مؤكد", completed: "تم الكشف", cancelled: "ملغي" };
const statusCls: Record<Status, string> = { confirmed: "bg-accent text-accent-foreground", completed: "bg-primary text-primary-foreground", cancelled: "bg-destructive/15 text-destructive" };

function DoctorPage() {
  const { data, ready, update } = useClinicData();
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [tab, setTab] = useState<"appts" | "history" | "off" | "settings">("appts");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"" | Status>("");
  const [q, setQ] = useState("");
  useEffect(() => { setUnlocked(window.sessionStorage.getItem(SESSION) === "1"); }, []);

  useEffect(() => { document.documentElement.dir = "rtl"; document.documentElement.lang = "ar"; }, []);

  if (!ready) return null;
  if (!unlocked) {
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center bg-muted/50 px-4">
        <form onSubmit={(e) => { e.preventDefault(); if (pw === data.doctorPassword) { window.sessionStorage.setItem(SESSION, "1"); setUnlocked(true); } else setErr(true); }} className="w-full max-w-sm space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
          <Lock className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-center text-xl font-bold">لوحة تحكم الطبيب</h1>
          <Input type="password" autoFocus placeholder="كلمة المرور" value={pw} onChange={(e) => { setPw(e.target.value); setErr(false); }} />
          {err && <p className="text-sm text-destructive">كلمة المرور غير صحيحة</p>}
          <Button type="submit" className="w-full">دخول</Button>
          <Link to="/" className="block text-center text-xs text-muted-foreground">العودة للموقع</Link>
        </form>
      </div>
    );
  }

  const tabs = [
    { id: "appts", label: "المواعيد", icon: ClipboardList },
    { id: "history", label: "سجل المرضى", icon: Search },
    { id: "off", label: "أيام الإجازة", icon: CalendarX },
    { id: "settings", label: "الإعدادات والخدمات", icon: Settings },
  ] as const;

  return (
    <div dir="rtl" className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div><div className="font-bold">لوحة د. عمر بهاء الدين</div><div className="text-xs text-muted-foreground">Dental Clinic</div></div>
          <Button size="sm" variant="ghost" onClick={() => { window.sessionStorage.removeItem(SESSION); setUnlocked(false); setPw(""); }} className="gap-1"><LogOut className="h-4 w-4" />خروج</Button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {tabs.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}><t.icon className="h-4 w-4" />{t.label}</button>)}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === "appts" && <Appointments />}
        {tab === "history" && <History />}
        {tab === "off" && <OffDays />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );

  function svc(id: string) { return data.services.find((s) => s.id === id)?.ar ?? id; }
  function patch(id: string, p: Partial<Appointment>) { update((d) => ({ ...d, appointments: d.appointments.map((a) => (a.id === id ? { ...a, ...p } : a)) })); }

  function Card({ a }: { a: Appointment }) {
    const [notes, setNotes] = useState(a.doctorNotes);
    const [plan, setPlan] = useState(a.treatmentPlan);
    const [open, setOpen] = useState(false);
    return (
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="font-bold">{a.name} <span dir="ltr" className="text-sm font-normal text-muted-foreground">{a.phone}</span></div>
            <div className="text-sm text-muted-foreground">{svc(a.serviceId)} · {a.date} · {a.time}</div>
            {a.note && <div className="mt-1 text-sm">ملاحظة المريض: {a.note}</div>}
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusCls[a.status]}`}>{statusLabel[a.status]}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(statusLabel) as Status[]).map((s) => <Button key={s} size="sm" variant={a.status === s ? "default" : "outline"} onClick={() => patch(a.id, { status: s })}>{statusLabel[s]}</Button>)}
          <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>الملاحظات وخطة العلاج</Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("حذف الموعد؟")) update((d) => ({ ...d, appointments: d.appointments.filter((x) => x.id !== a.id) })); }}><Trash2 className="h-4 w-4" /></Button>
        </div>
        {open && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Textarea placeholder="ملاحظات الطبيب" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Textarea placeholder="خطة العلاج" value={plan} onChange={(e) => setPlan(e.target.value)} />
            <Button size="sm" className="sm:col-span-2" onClick={() => patch(a.id, { doctorNotes: notes, treatmentPlan: plan })}>حفظ</Button>
          </div>
        )}
      </div>
    );
  }

  function Appointments() {
    const today = businessDate(new Date());
    const list = useMemo(() => data.appointments
      .filter((a) => (!date || a.date === date) && (!status || a.status === status) && (!q || a.name.includes(q) || a.phone.includes(q)))
      .sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time)), [date, status, q, data.appointments]);
    const todayCount = data.appointments.filter((a) => a.date === today && a.status !== "cancelled").length;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat n={todayCount} l="مواعيد اليوم" /><Stat n={data.appointments.filter((a) => a.status === "confirmed").length} l="مؤكد" /><Stat n={data.appointments.length} l="الإجمالي" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
          <select value={status} onChange={(e) => setStatus(e.target.value as "" | Status)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">كل الحالات</option>{(Object.keys(statusLabel) as Status[]).map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
          </select>
          <Input placeholder="بحث بالاسم أو الرقم" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Button variant="outline" onClick={() => { setDate(""); setStatus(""); setQ(""); }}>مسح</Button>
        </div>
        {list.length === 0 ? <p className="py-10 text-center text-muted-foreground">لا توجد مواعيد</p> : list.map((a) => <Card key={a.id} a={a} />)}
      </div>
    );
  }

  function History() {
    const [phone, setPhone] = useState("");
    const visits = phone.length >= 4 ? data.appointments.filter((a) => a.phone.includes(phone)).sort((x, y) => (y.date + y.time).localeCompare(x.date + x.time)) : [];
    return (
      <div className="space-y-4">
        <Input dir="ltr" placeholder="رقم موبايل المريض" value={phone} onChange={(e) => setPhone(e.target.value)} className="max-w-sm" />
        {phone.length >= 4 && (visits.length ? <><p className="text-sm text-muted-foreground">{visits.length} زيارة</p>{visits.map((a) => (
          <div key={a.id}><Card a={a} />{(a.doctorNotes || a.treatmentPlan) && <div className="-mt-2 rounded-b-2xl border border-t-0 bg-accent/40 p-3 text-sm">{a.doctorNotes && <p>📝 {a.doctorNotes}</p>}{a.treatmentPlan && <p>🦷 {a.treatmentPlan}</p>}</div>}</div>
        ))}</> : <p className="text-muted-foreground">لا يوجد سجل لهذا الرقم</p>)}
      </div>
    );
  }

  function OffDays() {
    const [d, setD] = useState("");
    return (
      <div className="max-w-md space-y-4">
        <p className="text-sm text-muted-foreground">الأيام المحددة هنا لن تظهر للمرضى عند الحجز.</p>
        <div className="flex gap-2">
          <Input type="date" value={d} onChange={(e) => setD(e.target.value)} />
          <Button onClick={() => { if (d) { update((x) => ({ ...x, offDays: Array.from(new Set([...x.offDays, d])).sort() })); setD(""); } }}><Plus className="h-4 w-4" />إضافة</Button>
        </div>
        {data.offDays.map((o) => (
          <div key={o} className="flex items-center justify-between rounded-xl border bg-card px-4 py-2">
            <span>{o}</span>
            <Button size="sm" variant="ghost" onClick={() => update((x) => ({ ...x, offDays: x.offDays.filter((y) => y !== o) }))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    );
  }

  function SettingsTab() {
    const [info, setInfo] = useState(data.info);
    const [services, setServices] = useState(data.services);
    const [newPw, setNewPw] = useState("");
    const [msg, setMsg] = useState("");
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="font-bold">بيانات التواصل</h2>
          <Input dir="ltr" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} placeholder="الهاتف" />
          <Input value={info.addressAr} onChange={(e) => setInfo({ ...info, addressAr: e.target.value })} placeholder="العنوان بالعربية" />
          <Input dir="ltr" value={info.addressEn} onChange={(e) => setInfo({ ...info, addressEn: e.target.value })} placeholder="Address (English)" />
          <Button onClick={() => { update((d) => ({ ...d, info })); setMsg("تم الحفظ"); }}>حفظ البيانات</Button>
          <h2 className="pt-4 font-bold">تغيير كلمة المرور</h2>
          <div className="flex gap-2">
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="كلمة مرور جديدة (4 أحرف على الأقل)" />
            <Button onClick={() => { if (newPw.length >= 4) { update((d) => ({ ...d, doctorPassword: newPw })); setNewPw(""); setMsg("تم تغيير كلمة المرور"); } }}>تغيير</Button>
          </div>
          {msg && <p className="text-sm text-primary">{msg}</p>}
        </section>
        <section className="space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="font-bold">الخدمات</h2>
          {services.map((s, i) => (
            <div key={s.id} className="flex gap-2">
              <Input value={s.ar} onChange={(e) => setServices(services.map((x, j) => (j === i ? { ...x, ar: e.target.value } : x)))} />
              <Input dir="ltr" value={s.en} onChange={(e) => setServices(services.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)))} />
              <Button size="icon" variant="ghost" onClick={() => setServices(services.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setServices([...services, { id: crypto.randomUUID(), ar: "خدمة جديدة", en: "New service" }])}><Plus className="h-4 w-4" />إضافة خدمة</Button>
            <Button onClick={() => { update((d) => ({ ...d, services })); setMsg("تم حفظ الخدمات"); }}>حفظ الخدمات</Button>
          </div>
        </section>
      </div>
    );
  }
}

function Stat({ n, l }: { n: number; l: string }) {
  return <div className="rounded-2xl border bg-card p-4 text-center"><div className="text-2xl font-bold text-primary">{n}</div><div className="text-xs text-muted-foreground">{l}</div></div>;
}
