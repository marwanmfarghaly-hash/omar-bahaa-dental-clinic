import { buildPushPayload } from "@block65/webcrypto-web-push";

type Admin = (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"];

const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function getVapid(admin: Admin) {
  const { data } = await admin.from("clinic_settings").select("vapid_public, vapid_private").eq("id", 1).single();
  if (data?.vapid_public && data.vapid_private) return { publicKey: data.vapid_public, privateKey: data.vapid_private };
  const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const publicKey = b64url((await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer);
  const jwk = (await crypto.subtle.exportKey("jwk", pair.privateKey)) as JsonWebKey;
  const privateKey = jwk.d!;
  await admin.from("clinic_settings").update({ vapid_public: publicKey, vapid_private: privateKey }).eq("id", 1);
  return { publicKey, privateKey };
}

export async function notifyStaff(admin: Admin, title: string, body: string) {
  const vapid = await getVapid(admin);
  const { data: subs } = await admin.from("push_subscriptions").select("*");
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      const payload = await buildPushPayload(
        { data: { title, body }, options: { ttl: 3600, urgency: "high" } },
        { endpoint: s.endpoint, expirationTime: null, keys: { p256dh: s.p256dh, auth: s.auth } },
        { subject: "mailto:clinic@dental-clinic-2026.lovable.app", ...vapid },
      );
      const res = await fetch(s.endpoint, payload);
      if (res.status === 404 || res.status === 410) await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
    } catch (e) { console.error("push failed", e); }
  }));
}

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function checkPassword(admin: Admin, password: string) {
  const { data } = await admin.from("clinic_settings").select("doctor_password_hash").eq("id", 1).single();
  if (!data || data.doctor_password_hash !== (await sha256(password))) throw new Error("WRONG_PASSWORD");
}

export function fmtHour(time: string) {
  const h = Number(time.slice(0, 2));
  return `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? "م" : "ص"}`;
}
