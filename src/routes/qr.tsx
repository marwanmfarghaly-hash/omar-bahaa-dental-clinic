import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Share2 } from "lucide-react";
import { ClinicHeader } from "@/components/ClinicHeader";
import { Button } from "@/components/ui/button";
import { useClinicLanguage } from "@/hooks/use-clinic-language";

export const Route = createFileRoute("/qr")({
  head: () => ({
    meta: [
      { title: "كود QR للعيادة | Dental Clinic" },
      { name: "description", content: "امسح كود QR لفتح موقع عيادة د. عمر بهاء الدين والحجز مباشرة." },
      { property: "og:title", content: "كود QR | Dental Clinic" },
      { property: "og:description", content: "شارك موقع العيادة بكود QR قابل للتنزيل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QrPage,
});

function QrPage() {
  const { language: lang, setLanguage } = useClinicLanguage();
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(window.location.origin), []);
  const ar = lang === "ar";
  const download = () => {
    const c = document.getElementById("clinic-qr") as HTMLCanvasElement | null;
    if (!c) return;
    const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = "dental-clinic-qr.png"; a.click();
  };
  return (
    <div className="min-h-screen bg-muted/50">
      <ClinicHeader lang={lang} setLang={setLanguage} />
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-3xl font-bold">{ar ? "كود الوصول إلى العيادة" : "Clinic QR code"}</h1>
        <p className="mt-2 text-muted-foreground">{ar ? "امسح الرمز لفتح الموقع أو احفظه لمشاركته." : "Scan to open the site, or save it to share."}</p>
        <div className="mx-auto mt-8 inline-block rounded-3xl border bg-card p-6 shadow-sm">
          {url && <QRCodeCanvas id="clinic-qr" value={url} size={260} fgColor="#0f766e" marginSize={2} />}
          <p dir="ltr" className="mt-3 break-all text-xs text-muted-foreground">{url}</p>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={download} className="gap-2"><Download className="h-4 w-4" />{ar ? "تنزيل كود QR" : "Download QR"}</Button>
          <Button variant="outline" className="gap-2" onClick={() => (navigator.share ? navigator.share({ title: "Dental Clinic", url }) : navigator.clipboard.writeText(url))}><Share2 className="h-4 w-4" />{ar ? "مشاركة" : "Share"}</Button>
        </div>
      </main>
    </div>
  );
}
