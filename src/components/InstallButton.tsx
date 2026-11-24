import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/clinic-copy";

type BIP = Event & { prompt: () => Promise<void> };

export function InstallButton({ lang }: { lang: Language }) {
  const [standalone, setStandalone] = useState(true);
  const [evt, setEvt] = useState<BIP | null>(null);
  const [open, setOpen] = useState(false);
  const [env, setEnv] = useState<"ios" | "inapp" | "other">("other");
  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true);
    const ua = nav.userAgent;
    setEnv(/FBAN|FBAV|Instagram|Line|Messenger|TikTok|Snapchat/i.test(ua) ? "inapp" : /iPhone|iPad|iPod/i.test(ua) ? "ios" : "other");
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIP); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  if (standalone) return null;
  const ar = lang === "ar";
  const click = async () => { if (evt) { await evt.prompt(); setEvt(null); } else setOpen(true); };
  return (
    <>
      <Button size="sm" variant="outline" onClick={click} className="gap-1.5"><Download className="h-4 w-4" />{ar ? "تثبيت التطبيق" : "Install App"}</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">{ar ? "خذ العيادة معك" : "Keep the clinic close"}</h3>
              <button onClick={() => setOpen(false)} aria-label="close"><X className="h-5 w-5" /></button>
            </div>
            {env === "inapp" ? (
              <div className="space-y-3 text-sm">
                <p>{ar ? "افتح هذا الرابط في Safari أو Chrome لتثبيت التطبيق." : "Open this link in Safari or Chrome to install the app."}</p>
                <Button className="w-full" onClick={() => navigator.clipboard.writeText(window.location.href)}>{ar ? "نسخ الرابط" : "Copy link"}</Button>
              </div>
            ) : env === "ios" ? (
              <ol className="list-decimal space-y-2 ps-5 text-sm">
                <li>{ar ? "اضغط زر المشاركة في شريط Safari." : "Tap the Share button in Safari."}</li>
                <li>{ar ? "اختر «إضافة إلى الشاشة الرئيسية»." : "Choose “Add to Home Screen”."}</li>
                <li>{ar ? "اضغط «إضافة» في الأعلى." : "Tap “Add” at the top."}</li>
              </ol>
            ) : (
              <p className="text-sm">{ar ? "من قائمة المتصفح (⋮) اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»." : "Open the browser menu (⋮) and choose Install app or Add to Home Screen."}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
