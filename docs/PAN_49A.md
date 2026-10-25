# PAN Form 49A — archived application worksheet

## Scope and regulatory status

This is a **legacy Form 49A reference/verification worksheet**, not an official PAN application or a direct government submission. The Income Tax Department replaced Forms 49A/49AA for new applications with Forms 93–96 effective **1 April 2026**. Do not describe its output as a currently accepted government filing. Check current Protean/UTIITSL instructions before any actual submission.

All work is isolated to branch `pan-49a`, forked from `dev`; existing PAN, passport and voter intake flows remain.

## Where to review

- `/pan/49a`: authenticated PAN assistance wizard, including legacy 49A collection and final two-page preview.
- `/services/pan-card`: link to legacy preview.
- `/profile#requests`: customer can inspect saved request and 49A preview.
- Admin dashboard request detail: staff can inspect saved request, with existing permission checks.

The wizard collects key details plus the original's sixteen sections; data is validated client-side and server-side, stored using the existing `RECORDS_ENCRYPTION_KEY` AES-GCM vault in PostgreSQL-backed request details. Do not remove the encryption requirement, send Aadhaar in notifications, or log sensitive answers.

## Browser testing / preview modal

1. In GitHub select the `pan-49a` branch (all changes are in this single branch).
2. Locally: `git fetch origin && git switch pan-49a && npm run dev -- -p 3020`. A remote-tracking branch may be created automatically on the first switch.
3. Open `http://localhost:3020/pan/49a`. Guests can use **Show filled sample in modal**, which loads fictional values and never submits data.
4. The modal provides two page tabs, Next page, Edit details, Print / Save PDF, and Escape/close support. On an authenticated request, data is validated and stored through the existing secured PAN API.
5. While editing, **Preview filled Form 49A** opens the modal without waiting for form submission; the Review step includes **Open final preview**.
6. Verify keyboard focus trapping, mobile sizing, page navigation and print-preview showing both pages before merging.

## One-time step to enable **original PDF background for all users**

The user-supplied PDF cannot be committed as a binary through the available GitHub connector. Until committed, the branch displays a built-in printable reference recreation. Users can also choose the exact source PDF through the local browser upload picker, which stays on their device.

For automatic pixel-aligned overlay on the **original** form: use the GitHub web UI to upload `49A_Form_Updated.pdf` onto this branch at

`public/forms/pan-49a.pdf`

Create the `public/forms` folder if absent. The preview auto-loads that URL when present. The source-viewer verifies its SHA-256 fingerprint to prevent applying a coordinate mapping to an incompatible PDF:

`f0692dd49744e62ce2cfe3c1da4a6a07dea1e4a885d7e746ed7d7563d3bbf2fd`

The original sample is 2 pages, each 594 × 846 PDF points. A different layout or updated version requires its own checked coordinate map; it cannot silently use the existing map.

## Verification before production

1. Run `npm test`, `npm run lint`, and `npm run build` with Node >= 22.13, and fix errors before merging.
2. Complete a sample valid application, test invalid Aadhaar/AO code/date/income combinations, and confirm the review screen blocks incomplete submissions.
3. Verify sample applicant names, parent fields, residence/office address, dates, checkboxes, and document proofs against the two-page PDF at 100% print scale. Adjust SVG overlay coordinates for anything misaligned.
4. Print to A4 PDF from desktop Chrome; inspect page breaks, character boxes, and two-page output. Check mobile horizontal scrolling and access to verification buttons.
5. Submit while signed in and verify existing PostgreSQL request creation, encryption, customer + admin retrieval and authorization, no Aadhaar exposure in alerts or application logs. Verify `RECORDS_ENCRYPTION_KEY` configured.
6. Re-test existing new PAN, correction/reprint, voter and passport flows for regressions.

**Not yet implemented as official-document features:** source photo upload, actual signature capture, field-position calibration for other PAN templates, real Form 93/94 generation, official API submission. Source-template PDF upload in the wizard is browser-local, not an attachment to submitted request.
