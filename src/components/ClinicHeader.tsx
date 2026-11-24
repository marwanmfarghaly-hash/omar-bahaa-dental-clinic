import { Link } from "@tanstack/react-router";
import { Languages, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallButton } from "@/components/InstallButton";
import type { Language } from "@/lib/clinic-copy";

export function ClinicHeader({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-lg text-primary-foreground">🦷</span>
          <span className="leading-tight">
            <span className="block font-bold">Dental Clinic</span>
            <span className="block text-xs text-muted-foreground">{lang === "ar" ? "د. عمر بهاء الدين" : "Dr. Omar Bahaa El-Din"}</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <InstallButton lang={lang} />
          <Link to="/qr" aria-label="QR" className="hidden sm:inline-flex"><Button size="sm" variant="ghost"><QrCode className="h-4 w-4" /></Button></Link>
          <Button size="sm" variant="ghost" onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="gap-1"><Languages className="h-4 w-4" />{lang === "ar" ? "EN" : "ع"}</Button>
        </div>
      </div>
    </header>
  );
}
