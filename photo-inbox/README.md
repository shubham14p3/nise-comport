# Photo inbox

Drop photos (JPG, PNG, WebP, HEIC…) into a folder here and run `npm run photos`.
That's all: the photos are converted, added to the website and saved to GitHub (commit + push).

**Which folder?**
- `all-photos/` – not sure? Put it here. It shows as a general photo of the centre; you can move
  it to the right category later in Admin → Gallery photos.
- Our centre: `shop/`, `team/`, `camps/` (service camps), `training/` (computer classes).
- Festivals & days: `diwali/`, `holi/`, `durga-puja/`, `ganesh-puja/`, `chhath-puja/`, `christmas/`,
  `independence-day/`, `republic-day/`, `makar-sankranti/`, `saraswati-puja/`, `raksha-bandhan/`,
  `eid/`, `new-year/`, `karma-puja/`, `sarhul/` … (one folder each).
- Services (photo also shows on that service's page): `pan-card/`, `aadhaar/`, `voter-id/`,
  `bike-insurance/`, `printing-scanning/`, `computer-repair/`, `jeevan-pramaan/` … (one folder each).

**What happens:** each photo is turned upright, GPS/camera data removed, resized to 1600 px and
saved as a small WebP with a search-friendly name (e.g. `diwali-nise-comport-telco-jamshedpur-3.webp`).
Originals move to `_done/`. Running it again skips photos already added.
Add `-- --no-git` to convert without committing.

**Without the PC:** staff with the "Site content" permission can upload from any computer or phone
in Admin → Gallery photos (also converted to WebP automatically) and change any photo's category.
