# Photo inbox

Drop photos (JPG, PNG, WebP, HEIC…) into a folder here, then run `npm run photos`.

- **Not sure which service a photo belongs to?** Put it in `all-photos/`. It goes into the
  gallery as a general NISE COMPORT photo. You can sort it later (see below).
- **Know the service?** Put it in that service's folder (`pan-card/`, `aadhaar/`, `voter-id/` …).
  It then also shows on that service's page.
- `shop/` = shop front and counter, `team/` = staff photos.

What `npm run photos` does: turns each photo upright, removes GPS/camera data, resizes to
1600 px, saves a small WebP with a search-friendly name in public/images/gallery/photos/,
and lists it in src/lib/gallery-photos.ts. Originals move to `_done/`. Photos are never
uploaded to GitHub from this folder (only the empty folders are).

**Sorting later:** open src/lib/gallery-photos.ts, find the photo and change
`"service": "shop"` to the folder name, e.g. `"service": "pan-card"`. Save, commit, done.
