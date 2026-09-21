# NISE platform backend contract

The existing repository is a Vite SPA and its legacy authentication points at an older external API. This folder defines the production backend boundary for the Print pilot without pretending browser localStorage is production persistence.

## Required production services

- Node.js API on the cPanel Node runtime.
- PostgreSQL using schema.sql.
- Private S3-compatible object storage for print documents.
- Payment adapter with server-side verification/webhooks.
- Notification adapter for in-app first, official WhatsApp Business Platform later.
- Scheduled cleanup for expired print files.

## API contract

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/me

POST /api/print/uploads/presign
POST /api/print/quote
POST /api/print/orders
GET /api/print/orders
GET /api/print/orders/:orderNumber
POST /api/print/orders/:orderNumber/payment
POST /api/print/orders/:orderNumber/status

GET /api/staff/print/orders
GET /api/staff/print/orders/:orderNumber
POST /api/staff/print/orders/:orderNumber/status

GET /api/wallet
GET /api/wallet/ledger

All pricing, wallet redemption, payment state, authorization and final order state are server authoritative.
