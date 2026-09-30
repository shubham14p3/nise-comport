#!/usr/bin/env python3
"""
Generates 1200x630 PNG share images (WhatsApp, Facebook, LinkedIn, X) and app icons.
SVG share images don't show on WhatsApp/Facebook, so every page gets a PNG.

Run after adding services or guides:
    pip install pillow            # needs Pillow with libraqm for Hindi text
    python3 scripts/generate-og-images.py
"""
import json, os, subprocess, textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
FONT_DIR = os.path.join(ROOT, "legacy", "assets", "fonts", "metropolis")
DEVANAGARI = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
DEVANAGARI_REGULAR = "/usr/share/fonts/truetype/google-fonts/Poppins-Regular.ttf"
LOGO = os.path.join(ROOT, "logo512.png")
DEEP, GREEN, CREAM, PAPER, INK, MUTED, GOLD, LINE = "#14271f", "#24533c", "#f7f5ed", "#fffefa", "#202923", "#5f675d", "#d1aa5b", "#e5e7df"
ADDRESS = "Kharangajhar, Telco, Jamshedpur  |  +91 97712 19893"

def font(weight, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, f"Metropolis-{weight}.woff"), size)

def logo(size):
    mark = Image.open(LOGO).convert("RGBA")
    mark.thumbnail((size, size), Image.LANCZOS)
    return mark

def wrap(draw, text, fnt, width):
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=fnt) <= width: line = trial
        else:
            if line: lines.append(line)
            line = word
    if line: lines.append(line)
    return lines

def card(path, title, eyebrow, hindi=False):
    img = Image.new("RGB", (1200, 630), CREAM)
    d = ImageDraw.Draw(img)
    d.ellipse((860, -260, 1460, 340), fill="#e9ede3")
    d.ellipse((930, -190, 1390, 270), outline="#d9e0d3", width=3)
    mark = logo(88)
    img.paste(mark, (72, 60), mark)
    d.text((176, 78), "NISE COMPORT", font=font("Bold", 40), fill=INK)
    d.text((178, 124), "CSC  |  PRAGYA KENDRA  |  JAMSHEDPUR", font=font("SemiBold", 18), fill=GREEN)
    eyebrow_font = ImageFont.truetype(DEVANAGARI_REGULAR, 26) if hindi else font("SemiBold", 24)
    d.text((72, 206), eyebrow.upper() if not hindi else eyebrow, font=eyebrow_font, fill=GREEN)
    size = 64
    while True:
        tf = ImageFont.truetype(DEVANAGARI, size) if hindi else font("Bold", size)
        lines = wrap(d, title, tf, 1000)
        if len(lines) <= 3 or size <= 40: break
        size -= 4
    y = 250
    for line in lines[:3]:
        d.text((72, y), line, font=tf, fill=INK)
        y += int(size * (1.35 if hindi else 1.15))
    d.rectangle((0, 540, 1200, 630), fill=DEEP)
    d.text((72, 568), ADDRESS, font=font("SemiBold", 26), fill=PAPER)
    pill = font("Bold", 24)
    label = "Visit us"
    width = d.textlength(label, font=pill)
    d.rounded_rectangle((1128 - width - 48, 562, 1128, 608), radius=23, fill=GOLD)
    d.text((1128 - width - 24, 585), label, font=pill, fill=DEEP, anchor="lm")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG", optimize=True)

def icons():
    os.makedirs(os.path.join(PUBLIC, "icons"), exist_ok=True)
    os.makedirs(os.path.join(PUBLIC, "brand"), exist_ok=True)
    src = Image.open(LOGO).convert("RGBA")
    square = Image.new("RGBA", (max(src.size),) * 2, (255, 255, 255, 0))
    square.paste(src, ((square.width - src.width) // 2, (square.height - src.height) // 2), src)
    square.resize((512, 512), Image.LANCZOS).save(os.path.join(PUBLIC, "brand", "nise-comport-logo.png"), optimize=True)
    for size in (192, 512):
        bg = Image.new("RGBA", (size, size), PAPER)
        mark = square.resize((int(size * 0.84),) * 2, Image.LANCZOS)
        bg.paste(mark, ((size - mark.width) // 2, (size - mark.height) // 2), mark)
        bg.convert("RGB").save(os.path.join(PUBLIC, "icons", f"icon-{size}.png"), optimize=True)
    maskable = Image.new("RGBA", (512, 512), PAPER)
    mark = square.resize((330, 330), Image.LANCZOS)
    maskable.paste(mark, (91, 91), mark)
    maskable.convert("RGB").save(os.path.join(PUBLIC, "icons", "maskable-512.png"), optimize=True)
    apple = Image.new("RGBA", (180, 180), PAPER)
    mark = square.resize((150, 150), Image.LANCZOS)
    apple.paste(mark, (15, 15), mark)
    apple.convert("RGB").save(os.path.join(ROOT, "src", "app", "apple-icon.png"), optimize=True)
    icon = Image.new("RGBA", (512, 512), (255, 255, 255, 0))
    mark = square.resize((500, 500), Image.LANCZOS)
    icon.paste(mark, (6, 6), mark)
    icon.save(os.path.join(ROOT, "src", "app", "icon.png"), optimize=True)

def main():
    data = json.loads(subprocess.check_output(["node", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--disable-warning=ExperimentalWarning", "--experimental-strip-types", os.path.join(ROOT, "scripts", "og-data.mts")], cwd=ROOT))
    icons()
    card(os.path.join(PUBLIC, "og", "default.png"), "PAN, Aadhaar, certificates, banking & printing help", "Your local CSC service desk")
    card(os.path.join(PUBLIC, "og", "hi.png"), "जमशेदपुर में CSC और प्रज्ञा केंद्र सेवाएँ", "खरंगाझार, टेल्को", hindi=True)
    for item in data["services"]:
        card(os.path.join(PUBLIC, "og", "services", f"{item['slug']}.png"), item["title"], item["category"])
    for item in data["guides"]:
        card(os.path.join(PUBLIC, "og", "guides", f"{item['slug']}.png"), item["title"], f"Guide  |  {item['category']}")
    for item in data["hindi"]:
        card(os.path.join(PUBLIC, "og", "hi", "services", f"{item['slug']}.png"), item["title"], "खरंगाझार, टेल्को, जमशेदपुर", hindi=True)
    print(f"Generated {2 + len(data['services']) + len(data['guides']) + len(data['hindi'])} share images and app icons.")

if __name__ == "__main__":
    main()
