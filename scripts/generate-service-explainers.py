#!/usr/bin/env python3
"""
Explainer slides and short videos for service pages.

For each service: three 1200x900 PNG slides (what we help with, how it works, what to bring)
and a 1200x900 silent MP4 that fades through them. Output:
  public/images/explainers/<slug>-1.png, -2.png, -3.png
  public/videos/<slug>.mp4

    python3 scripts/generate-service-explainers.py laptop-repair,desktop-repair,...
Needs Pillow and ffmpeg. Content comes from scripts/service-explainer-data.mts.
"""
import json, os, subprocess, sys, textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "public", "images", "explainers")
VID_DIR = os.path.join(ROOT, "public", "videos")
FONT_BOLD = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/google-fonts/Poppins-Regular.ttf"

DEEP, GREEN, CREAM, PAPER, INK, MUTED, GOLD, LINE = "#14271f", "#24533c", "#f7f5ed", "#fffefa", "#202923", "#5f675d", "#d1aa5b", "#e5e7df"
W, H = 1200, 900
PHONE = "9771219893"
ADDRESS = "Kharangajhar, Telco, Jamshedpur"

def font(path, size):
    return ImageFont.truetype(path, size)

def wrap(draw, text, fnt, width):
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=fnt) <= width:
            line = trial
        else:
            if line: lines.append(line)
            line = word
    if line: lines.append(line)
    return lines

def frame(title_small, title, subtitle_lines):
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 250], fill=DEEP)
    d.rectangle([0, 250, W, 258], fill=GOLD)
    d.text((70, 60), title_small.upper(), font=font(FONT_BOLD, 26), fill=GOLD)
    y = 100
    for line in wrap(d, title, font(FONT_BOLD, 60), W - 140):
        d.text((70, y), line, font=font(FONT_BOLD, 60), fill=PAPER)
        y += 70
    d.rectangle([0, H - 110, W, H], fill=GREEN)
    d.text((70, H - 78), f"NISE COMPORT · {PHONE} · WhatsApp · {ADDRESS}", font=font(FONT_REG, 26), fill=PAPER)
    return img, d

def bullets(d, items, y, marker, fnt, color, max_width=W - 160, gap=16):
    for item in items:
        lines = wrap(d, item, fnt, max_width - 60)
        d.text((80, y), marker, font=font(FONT_BOLD, 34), fill=GREEN)
        for line in lines:
            d.text((140, y + 4), line, font=fnt, fill=color)
            y += 44
        y += gap
    return y

def slide_one(s):
    img, d = frame("What we help with", s["title"], [])
    y = 290
    for line in wrap(d, s["description"], font(FONT_REG, 30), W - 140):
        d.text((70, y), line, font=font(FONT_REG, 30), fill=INK)
        y += 42
    y += 24
    d.text((70, y), "What is covered", font=font(FONT_BOLD, 34), fill=DEEP)
    y += 56
    bullets(d, s["highlights"][:4], y, "•", font(FONT_REG, 30), INK, gap=8)
    return img

def slide_two(s):
    img, d = frame("How it works", s["title"], [])
    y = 310
    for index, step in enumerate(s["steps"][:4], start=1):
        d.ellipse([70, y, 130, y + 60], fill=GREEN)
        d.text((90 if index < 10 else 84, y + 8), str(index), font=font(FONT_BOLD, 34), fill=PAPER)
        lines = wrap(d, step, font(FONT_REG, 34), W - 240)
        ty = y + 4
        for line in lines:
            d.text((160, ty), line, font=font(FONT_REG, 34), fill=INK)
            ty += 46
        y = max(y + 110, ty + 26)
    return img

def slide_three(s):
    img, d = frame("What to bring", s["title"], [])
    y = 300
    d.text((70, y), "Keep these ready", font=font(FONT_BOLD, 36), fill=DEEP)
    y += 60
    bullets(d, s["documents"][:4], y, "•", font(FONT_REG, 30), INK, gap=8)
    d.text((70, H - 170), "Call or WhatsApp us before you visit.", font=font(FONT_BOLD, 34), fill=DEEP)
    return img

def video(slug, slides):
    os.makedirs(VID_DIR, exist_ok=True)
    out = os.path.join(VID_DIR, f"{slug}.mp4")
    inputs, parts = [], []
    for index, path in enumerate(slides):
        inputs += ["-loop", "1", "-t", "6", "-i", path]
    filter_chain = "[0][1]xfade=transition=fade:duration=1:offset=5[v1];[v1][2]xfade=transition=fade:duration=1:offset=10,format=yuv420p[v]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", filter_chain, "-map", "[v]",
                    "-c:v", "libx264", "-r", "25", "-movflags", "+faststart", out], check=True)
    return out

def main():
    slugs = sys.argv[1] if len(sys.argv) > 1 else ""
    data = json.loads(subprocess.check_output(
        ["node", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--experimental-strip-types",
         os.path.join(ROOT, "scripts", "service-explainer-data.mts"), slugs], cwd=ROOT))
    os.makedirs(IMG_DIR, exist_ok=True)
    for s in data:
        paths = []
        for index, slide in enumerate([slide_one(s), slide_two(s), slide_three(s)], start=1):
            path = os.path.join(IMG_DIR, f"{s['slug']}-{index}.png")
            slide.save(path, optimize=True)
            paths.append(path)
        video(s["slug"], paths)
        print("done", s["slug"])

if __name__ == "__main__":
    main()
