# NISE COMPORT deployment

This branch runs the React/Vite frontend and the Node API from one Node process. The production entry point is `server/index.js`.

## 1. Node app

Use Node 20+ (Node 22 recommended).

Install and build:

```bash
npm install
npm run build
```

In cPanel Node.js App, point the application root at the repository directory and set the startup file to:

```
server/index.js
```

The app reads the port supplied by cPanel from `PORT`.

## 2. Environment

Copy values from `.env.example` into the cPanel Node application environment. Do not commit the real `.env`.

Required:
- `DATABASE_URL`
- `JWT_SECRET` (long random value)
- `APP_ORIGIN=https://nisecomport.com`

Recommended:
- `PRIVATE_UPLOAD_DIR` pointing outside the public document root.
- `MAX_UPLOAD_MB=25`
- `FILE_RETENTION_DAYS=7`

## 3. PostgreSQL

After the database exists and `DATABASE_URL` is configured:

```bash
npm run db:init
```

To create the first owner account, temporarily set:
- `SEED_OWNER_NAME`
- `SEED_OWNER_EMAIL` or `SEED_OWNER_MOBILE`
- `SEED_OWNER_PASSWORD`

Run `npm run db:init`, then remove the seed password from the environment.

## 4. Word conversion

PDF/JPG/PNG work with the Node application itself.

For DOC/DOCX page detection, install LibreOffice on the host and set:

```
LIBREOFFICE_BIN=/usr/bin/libreoffice
```

If shared hosting does not expose LibreOffice, customers receive a clear message to upload PDF until a conversion worker is configured. The rest of the Print workflow remains operational.

## 5. Online payments

Pay-at-shop works without payment credentials.

For Razorpay online checkout, configure:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

Configure the Razorpay webhook URL as:

```
https://nisecomport.com/api/payments/razorpay/webhook
```

## 6. WhatsApp status updates

In-app notifications work without external credentials.

For official WhatsApp Cloud API status notifications configure:
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_STATUS_TEMPLATE`
- `WHATSAPP_TEMPLATE_LANGUAGE`

The customer must opt in to WhatsApp operational updates. Marketing consent is stored separately.

## 7. Maintenance cron

Run hourly from cPanel Cron Jobs:

```bash
cd /absolute/path/to/nise-comport && /absolute/path/to/node server/scripts/maintenance.js
```

The job:
- cancels unpaid orders older than two hours;
- releases pickup capacity;
- releases reserved coupon usage;
- reverses reserved NISE Credit;
- deletes expired private print documents.

## 8. Shop QR

The printable SVG is generated at:

```
/api/print/shop-qr.svg
```

It sends customers to `/print?src=shop-qr` so shop-QR acquisition is tracked.

## 9. Health check

```
GET /api/health
```

A healthy response confirms the Node process and PostgreSQL are available.

## 10. Production verification

GitHub Actions workflow `NISE Print Platform CI` verifies:
- dependency installation;
- server syntax;
- Vite production build;
- PostgreSQL schema initialization;
- owner seeding;
- Node API startup;
- customer registration/session;
- print configuration and pickup-slot endpoints.
