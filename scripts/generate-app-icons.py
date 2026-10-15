#!/usr/bin/env python3
"""Generate every app and browser icon from the real NISE COMPORT mark.

Source: logo512.png (the blue swoosh mark used in the header wordmark). The mark is cropped to
its visible bounds, centred on a white tile, and written at each size the site uses:

  src/app/icon.png            512  (Next.js browser icon)
  src/app/apple-icon.png      180  (iOS home screen)
  public/icons/icon-192.png   192  (manifest)
  public/icons/icon-512.png   512  (manifest)
  public/icons/maskable-512.png 512 (manifest, mark kept inside the 80% safe zone)
  public/favicon.ico          16/32/48 (legacy browsers)

Run from the repository root:  python3 scripts/generate-app-icons.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "logo512.png"
WHITE = (255, 255, 255, 255)


def mark() -> Image.Image:
    """The swoosh mark cropped to its visible bounds."""
    image = Image.open(SOURCE).convert("RGBA")
    left, top, right, bottom = image.getchannel("A").getbbox()
    return image.crop((left, top, right, bottom))


def tile(size: int, fill_ratio: float, rounded: bool) -> Image.Image:
    """A white square of `size` with the mark centred inside `fill_ratio` of it."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0) if rounded else WHITE)
    if rounded:
        # Rounded tile for the browser and PWA icons; corners stay transparent.
        radius = int(size * 0.22)
        mask = Image.new("L", (size, size), 0)
        from PIL import ImageDraw
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
        canvas.paste(Image.new("RGBA", (size, size), WHITE), (0, 0), mask)
    art = mark()
    box = int(size * fill_ratio)
    scale = box / max(art.size)
    resized = art.resize((max(1, round(art.width * scale)), max(1, round(art.height * scale))), Image.LANCZOS)
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas


def main() -> None:
    browser = tile(512, 0.78, rounded=True)
    browser.save(ROOT / "src/app/icon.png")
    tile(180, 0.80, rounded=False).convert("RGB").save(ROOT / "src/app/apple-icon.png")
    tile(192, 0.78, rounded=True).save(ROOT / "public/icons/icon-192.png")
    browser.save(ROOT / "public/icons/icon-512.png")
    # Maskable icons are cropped to a circle or squircle by the OS, so keep the mark well inside.
    tile(512, 0.60, rounded=False).convert("RGB").save(ROOT / "public/icons/maskable-512.png")
    browser.save(ROOT / "public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Icons written from", SOURCE.name)


if __name__ == "__main__":
    main()
