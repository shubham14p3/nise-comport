# ECI voter application preparation — Forms 6 and 8

The supplied signed samples dated July and October 2026 are reference materials for the customer intake and page order. **Do not commit, deploy, or display the signed example PDFs to other customers.** They contain personal data, real ECI acknowledgement numbers, photos and digital signatures.

## Form routing

- `/voter`: choice between new elector (Form 6) and existing elector (Form 8).
- `/voter/form-6`: complete a new voter application preparation worksheet.
- `/voter/form-8`: prepare a correction (maximum four categories), residence shift, replacement EPIC or disability marking.

Both flows use the authenticated encrypted service request intake and the same Nise Comport tracking references. They **do not submit to ECI**.

## Printed page mapping from the supplied signed examples

| Source | Page | Section order |
| --- | --- | --- |
| Form 6 | 1 | Electoral Registration Officer / AC; elector's local and English names; relative and relationship; phone/email; Aadhaar; gender; date of birth; birth-proof tick boxes; photograph |
| Form 6 | 2 | Present ordinary residence; address-proof choices; disability marking; enrolled family member / EPIC; declaration of Indian citizenship and place of birth, ordinary residence since, date/place |
| Form 6 supplementary declaration | 3 | Last SIR elector and relative electoral-roll details; father/mother/spouse name and optional EPIC; citizenship and inclusion declarations; signature, date, place |
| Form 8 | 1 | Header, office/constituency, applicant/EPIC, Aadhaar and contact, request type; residence shifting address and accepted proof |
| Form 8 | 2 | Up to four corrections and proof names; replacement EPIC; disability marking; declaration; official ECI acknowledgement/receipt section |

The declaration page is present in both provided Form 6 example PDFs, but staff must verify whether it applies to a particular applicant.

## Privacy and acknowledgement

1. Customer inputs and uploaded photo/documents are stored using the existing encrypted workflow. Never put Aadhaar, EPIC, photo or completed personal particulars in URLs, email, WhatsApp notifications or unencrypted draft storage.
2. Only an ECI-authorized submission can produce an ECI acknowledgement number, official receipt or digital signature. Draft previews display no invented ECI reference or signature and are watermarked.
3. After staff review and actual external submission, the staff may record the real acknowledgement in the existing request process. Do not derive a synthetic ECI ID from Nise Comport request IDs.

## Visual fidelity and printing

The print renderings follow the structure and two/three-page organization of the samples, with A4 pagination and the same principal fields. They are **not yet a pixel-perfect overlay of original unfilled ECI source PDFs**. The uploaded files were already filled and signed; deploying them as backgrounds would expose real applicants' data. Exact background calibration requires clean, blank ECI Form 6 and Form 8 templates without personal details.

## Manual verification checklist

- Form 6: sample preview opens three pages; blank photo and applicant answers remain blank; date and PIN validation; optional SIR fields appear when needed; proof and photo upload; review confirmation.
- Form 8: correction preview opens two pages; 1–4 selected corrections and supporting proof names; residence/replacement/disability alternatives; photograph change; no official reference fabrication.
- Both: check print to A4 PDF on Chrome desktop and mobile, verify no clipping or duplicated pages, confirm edit path and encrypted request save.
- Verify Nise Comport tracking reference works independently from the official ECI acknowledgement.

## Sign-in-gated filled-preview flow (Form 6 and Form 8)

1. A guest fills the guided form. All required fields (including the Form 6 photo or Form 8 photo correction) must validate before any preview is available.
2. **Sign in to preview** encrypts the completed questionnaire and selected photo/proof attachment bytes with a newly generated AES-256-GCM browser key. Encrypted data is kept in browser IndexedDB; the short-lived decryption key is kept **only in this tab's sessionStorage**. Nothing is placed in cookies, URLs or plaintext localStorage.
3. The browser remembers only the same-origin return route through the existing `rememberReturn` / `takeReturn` login mechanism. On successful sign-in, the user returns to the same form automatically.
4. After authentication, the form restores answers and file attachments and automatically opens the protected two/three-page verification modal. Users can edit and review again before saving a service request.
5. Temporary drafts expire after 30 minutes, cannot be decrypted in another browser tab without that tab's secret key, and are deleted after successfully saving a request. If browser crypto or draft storage is unavailable, sign-in is offered first; the page does not silently discard the entered form.
6. The printable preview is never rendered for guests or incomplete forms. Fictional sample-preview bypasses have been removed from the public form pages.

**Privacy boundary:** Browser encryption protects the residual draft from someone without the tab key. It does not protect against malware or malicious scripts already executing in the same trusted website origin. The encrypted draft is temporary, not a permanent account record.
