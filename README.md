# NISE COMPORT

Mobile-first Next.js application for the independent CSC / Pragya Kendra service centre in Kharangajhar, Jamshedpur.

## Stack

- Next.js App Router, React and TypeScript
- PostgreSQL with Drizzle ORM
- Custom SMTP email OTP verification, Argon2 password hashes and hashed HTTP-only sessions
- Private file storage with PDF page inspection and Word-to-PDF conversion through LibreOffice
- Search metadata, canonical URLs, LocalBusiness structured data, sitemap and robots rules

## Customer journeys

1. Browse the service catalogue and location pages.
2. Create an account with a six-digit email verification code; sign in with email and password.
3. Send a service request and optional supporting document; follow the reference and status in the profile.
4. For printing, upload a PDF, Word file or image. PDF and Word files are page-counted, Word files are converted to PDF when LibreOffice is installed, and the private file can be previewed before ordering.
5. Select page numbers or ranges, copies, B&W/colour mix, paper size, orientation and sides. The server validates the page selection and recalculates prices/coupons.
6. Select pickup or a saved delivery address and a preferred future time. The service team confirms availability and final delivery cost.
7. Follow service and print status from the profile. Staff status updates queue an email notification.

NISE COMPORT is an independent service provider, not a government office. Service charges are separate from government/third-party fees. Customers are responsible for accurate information; approvals and processing times are determined by the relevant authority.

## Local setup

Requires Node.js 22.13+, PostgreSQL 14+, and LibreOffice for Word conversion. The current Next.js lint integration requires ESLint 9 and its TypeScript parser supports TypeScript 6; ESLint 10 and TypeScript 7 currently fail in those plugins.

```bash
npm ci
cp .env.example .env.local
# Set DATABASE_URL and SMTP settings in .env.local
npm run db:generate
npm run db:migrate
npm run dev
```

Set `PRIVATE_UPLOAD_DIR` to persistent storage outside the public web root. In production, keep `.env.local` out of Git and use strong, persistent `OTP_SECRET`, `CRON_SECRET`, SMTP and database credentials. Rotating the OTP secret invalidates codes that have not expired. Configure `PAN_ENCRYPTION_KEY` as 32 random bytes encoded in base64 if PAN import is enabled; back it up separately from the database.

## Staff access and notifications

Create a user through email verification, then promote the first administrator in PostgreSQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'operator@example.com';
```

Staff and admins can use `/admin` to review service/print queues and update statuses. Status emails are queued and delivered by the cleanup route. Call it daily with `POST /api/cron/cleanup` and `Authorization: Bearer <CRON_SECRET>`; this also removes expired private uploads after linked work is closed.

Coupons are managed in the `coupons` table (`discount_type` is `percent` or `fixed`). Print prices: up to 10 B&W pages ₹5/page, 11–50 pages ₹3/page, above 50 pages ₹2/page; colour ₹10/page. No payment is captured online; the team confirms the order and any delivery charge.

## Deployment

- Apply Drizzle migrations before deploying the matching app version.
- Build with `npm run build`; serve with `npm run start` in the hosting Node.js application.
- Make LibreOffice available as `soffice` or set `LIBREOFFICE_BIN` to its executable path. Customers can still upload PDFs if Word conversion is not installed.
- Back up PostgreSQL and the private upload directory in line with the retention policy.
- Confirm the WhatsApp numbers, SMTP sender and canonical domain before publishing.
