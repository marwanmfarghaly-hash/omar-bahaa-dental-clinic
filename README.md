# Omar Bahaa Dental Clinic

ابني الواجهة والمعاينة الاول ومتبنيش من جديد انت قدامك الملف اهو ووفر الرصيد ولوحة التحكم هتبقى بباسوورد فقط بدون بريد وتبقى للطبيب فقط عشان متسألنيش فيها، وتخرج التطبيق كله برصيد البناء المتاح.

# Build Brief: Dental Clinic - د. عمر بهاء الدين

## Locked
- **Source Code & Assets**: Build using the structure, assets, and code inside the attached `bahaa-smiles-clinic-main (1).zip`. Retain the existing image `dental-clinic-interior.jpg` in public, manifest, icons, and components.
- **Clinic Identity & Contact**:
  * Clinic Name: Dental Clinic
  * Doctor: د. عمر بهاء الدين (Dr. Omar Bahaa El-Din)
  * Title/Specialty: استشاري وماجستير زراعة الأسنان (Consultant & Master of Dental Implantology)
  * Address: ٢٦١ ه‍ شارع الضغط (261 H, El-Daght Street)
  * Hours: السبت إلى الخميس من 4:00 عصراً حتى 10:00 مساءً (الجمعة عطلة أسبوعية) / Saturday – Thursday: 4:00 PM – 10:00 PM (Africa/Cairo time)
  * Phone: 01286661471
  * Languages: Full bilingual Arabic (RTL, default) & English (LTR) with seamless toggle in the header.
  * Visual Style: Luxury modern dental clinic theme (clean white, deep medical teal `#0f766e` / `#0d9488`, slate gray accents, crisp medical icons).
- **8 Medical Services (Strictly NO prices in either language)**:
  1. كشف واستشارة تخصصية (Dental Examination & Consultation)
  2. أشعة الأسنان الديجيتال (Digital Dental X-Ray)
  3. حشو عادي تجميلي (Cosmetic Fillings)
  4. حشو عصب وعلاج جذور ميكروسكوبي (Endodontic & Root Canal Treatment)
  5. تركيبات الأسنان الثابتة والمتحركة (Fixed & Removable Prosthodontics)
  6. تنظيف وتلميع وإزالة الجير (Scaling & Teeth Polishing)
  7. تبييض الأسنان بالليزر (Laser Teeth Whitening)
  8. زراعة الأسنان بأحدث التقنيات (Advanced Dental Implants)
- **Doctor Control Panel (Password Only, NO email)**:
  * Protected exclusively by a password / PIN (default e.g. `doctor123` with ability to update), with NO email signup or login fields.
  * Access reserved for the doctor to:
    - View and filter patient appointments.
    - Change status (مؤكد confirmed / تم الكشف completed / ملغي cancelled).
    - Add/edit doctor clinical notes and treatment plan per patient.
    - Search patient medical history and previous visits by mobile number.
    - Manage clinic emergency off-days (block dates from patient booking).
    - Manage clinic contact info and services.
    - Delete appointments to clear slots.
- **Smart Patient Booking System**:
  * Service picker, date selector (excluding Fridays and doctor-blocked dates).
  * Time slot picker (16:00 to 22:00) enforcing the 2-patients-per-hour limit; fully booked slots are disabled.
  * Patient details: full name, mobile number, notes.
  * Instant confirmation view with download calendar button (`.ics` file) and book-another option.
- **PWA & QR Features**:
  * PWA install prompt button in header (auto-hidden in standalone mode).
  * Step-by-step guidance for iPhone Safari and in-app browsers.
  * Dedicated QR page at `/qr` with downloadable QR code for clinic sharing.

## Open
- Ensure state persistence (using browser localStorage / client state with backend readiness) so preview works immediately without breaking on initial load.
- Ensure all routes, navigation, and mobile responsiveness function smoothly end to end.

Build a real working app, not a clickable prototype; the screen and kit files show layout, content and look and are never code to copy. Build and check each screen, ensuring the preview renders immediately and cleanly.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bcfb220e-7261-42d1-853c-9c883f8b59d9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
