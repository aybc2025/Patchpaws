"""Patchpaws icon set.

Concept: the app's own sleeping ginger cat curled on a four-patch quilt square
(rose / butter / mint / cornflower, stitched seams), on the Midnight background,
the same motif as the board. Small sizes use a simplified cat (thicker strokes,
no whiskers or stripes) so it doesn't turn to mush at 32px.

Renders the SVG in headless Chromium at 8x the target size, then downsamples
with LANCZOS for crisp edges.  Run:  python3 -I icon-design/make_icons.py
"""
import asyncio, io, sys
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

OUT = Path(__file__).resolve().parent.parent / "icons"
INK = "#1C1E3D"

def cat(simple=False):
    w = 7 if simple else 5
    stripes = "" if simple else f'<path d="M44 33 L46 41 M50 31.5 V40 M56 33 L54 41" fill="none" stroke="#C8642A" stroke-width="3.2" stroke-linecap="round"/>'
    whiskers = "" if simple else f'''<g stroke="{INK}" stroke-width="2.6" stroke-linecap="round" opacity=".75">
      <path d="M26 69 L10 67"/><path d="M27 74 L12 77"/><path d="M74 69 L90 67"/><path d="M73 74 L88 77"/></g>'''
    mouth = "" if simple else f'<path d="M43 75 q3.5 4 7 0 q3.5 4 7 0" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
    eye_w = 6.5 if simple else 4.6
    return f'''
    <path d="M21 52 L25 13 L47 31 Z" fill="#F08A3C" stroke="{INK}" stroke-width="{w}" stroke-linejoin="round"/>
    <path d="M79 52 L75 13 L53 31 Z" fill="#F08A3C" stroke="{INK}" stroke-width="{w}" stroke-linejoin="round"/>
    <path d="M28 25 L36 33 L29 37 Z M72 25 L64 33 L71 37 Z" fill="#F6A6B9"/>
    <path d="M17 61 C17 39 32 29 50 29 C68 29 83 39 83 61 C83 81 68 91 50 91 C32 91 17 81 17 61 Z" fill="#F08A3C" stroke="{INK}" stroke-width="{w}"/>
    {stripes}
    <g fill="none" stroke="{INK}" stroke-width="{eye_w}" stroke-linecap="round"><path d="M31 58 q7 6 14 0"/><path d="M55 58 q7 6 14 0"/></g>
    <path d="M46 67 h8 l-4 5 z" fill="#E86F86" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>
    {mouth}{whiskers}'''

def icon_svg(size, content_scale, simple=False, quilt=True):
    # Everything is laid out in a 100x100 box, then scaled about the centre.
    q = 64  # quilt square size
    o = (100 - q) / 2
    half = q / 2
    quilt_svg = f'''
      <g transform="rotate(-6 50 50)">
        <rect x="{o}" y="{o+3}" width="{q}" height="{q}" rx="9" fill="#14162E"/>
        <clipPath id="c"><rect x="{o}" y="{o}" width="{q}" height="{q}" rx="9"/></clipPath>
        <g clip-path="url(#c)">
          <rect x="{o}" y="{o}" width="{half}" height="{half}" fill="#F6A6B9"/>
          <rect x="{o+half}" y="{o}" width="{half}" height="{half}" fill="#F8E59A"/>
          <rect x="{o}" y="{o+half}" width="{half}" height="{half}" fill="#A9E3BF"/>
          <rect x="{o+half}" y="{o+half}" width="{half}" height="{half}" fill="#A3BEF4"/>
          <path d="M50 {o} V{o+q} M{o} 50 H{o+q}" stroke="{INK}" stroke-width="{3.4 if simple else 2.6}"/>
          {'' if simple else f'<path d="M50 {o} V{o+q} M{o} 50 H{o+q}" stroke="#fff" stroke-opacity=".6" stroke-width=".9" stroke-dasharray="2.4 2"/>'}
        </g>
        <rect x="{o}" y="{o}" width="{q}" height="{q}" rx="9" fill="none" stroke="{INK}" stroke-width="{4 if simple else 3}"/>
      </g>''' if quilt else ""
    cat_scale = 0.62 if quilt else 0.9
    cat_x = 50 - 50 * cat_scale
    cat_y = (56 if quilt else 52) - 55 * cat_scale
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">
      <rect width="100" height="100" fill="#23264A"/>
      <g transform="translate(50 50) scale({content_scale}) translate(-50 -50)">
        {quilt_svg}
        <g transform="translate({cat_x} {cat_y}) scale({cat_scale})">{cat(simple)}</g>
      </g></svg>'''

async def render(page, svg, size):
    big = size * 8
    await page.set_viewport_size({"width": big, "height": big})
    await page.set_content(f'<html><body style="margin:0;background:#23264A">{svg.replace(f"width=\"{size}\" height=\"{size}\"", f"width=\"{big}\" height=\"{big}\"")}</body></html>')
    png = await page.screenshot(clip={"x": 0, "y": 0, "width": big, "height": big})
    return Image.open(io.BytesIO(png)).convert("RGB").resize((size, size), Image.LANCZOS)

async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        page = await b.new_page()
        jobs = [
            ("icon-512.png", 512, 1.18, False, True),
            ("icon-192.png", 192, 1.18, False, True),
            ("apple-touch-icon.png", 180, 1.12, False, True),
            ("icon-512-maskable.png", 512, 0.86, False, True),   # inside the ~80% safe zone
            ("favicon-32.png", 32, 1.0, True, False),            # simplified cat only
        ]
        for name, size, scale, simple, quilt in jobs:
            img = await render(page, icon_svg(size, scale, simple, quilt), size)
            img.save(OUT / name, optimize=True)
            print("wrote", name, img.size)
        await b.close()

asyncio.run(main())
