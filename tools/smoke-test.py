"""Headless smoke test: plays through the main flows and saves screenshots.

    python3 -I tools/smoke-test.py http://localhost:8765/patchpaws/ /tmp/shots

Fails (exit 1) on any console error or page error.
"""
import asyncio, json, sys
from pathlib import Path
from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8765/patchpaws/"
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else "/tmp/shots"); OUT.mkdir(parents=True, exist_ok=True)
ROOT = Path(__file__).resolve().parent.parent
LEVELS = json.loads((ROOT / "data/levels.json").read_text())

def decode(code):
    n, regs, sol = code.split("|")
    return int(n), [ord(ch) - 97 for ch in regs], [int(d) for d in sol]

async def cell_center(page, i):
    box = await page.locator(f'.board-cell[data-i="{i}"]').bounding_box()
    return box["x"] + box["width"] / 2, box["y"] + box["height"] / 2

async def dbl(page, i):
    x, y = await cell_center(page, i)
    await page.mouse.dblclick(x, y)

async def main():
    errors = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, has_touch=False)
        page = await ctx.new_page()
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))
        shot = lambda name: page.screenshot(path=str(OUT / f"{name}.png"))

        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await shot("01-howto-first-run")
        await page.get_by_role("button", name="Classic").click()
        await page.get_by_role("button", name="Cozy").click()
        await page.get_by_role("button", name="Start playing").click()
        await page.wait_for_timeout(600)
        await shot("02-home")

        # ---- Level 1: mistake, hint, then solve ----
        await page.goto(URL + "#/play/1"); await page.wait_for_timeout(250)
        await shot("03-level-stitch-in")
        await page.wait_for_timeout(900)
        n, regs, sol = decode(LEVELS[0])
        wrong = next(i for i in range(n * n) if sol[i // n] != i % n and abs(sol[i // n] - i % n) > 1)
        await dbl(page, wrong); await page.wait_for_timeout(260)
        await shot("04-mistake-mid")
        await page.wait_for_timeout(800)
        await page.get_by_role("button", name="Hint").click(); await page.wait_for_timeout(400)
        await shot("05-hint")
        await page.get_by_role("button", name="Show me").click(); await page.wait_for_timeout(500)
        state = await page.evaluate("JSON.parse(localStorage.getItem('patchpaws:sessions'))")
        cells = state["L1"]["cells"]
        for r in range(n):
            i = r * n + sol[r]
            if cells[i] != 2:
                if cells[i] == 1:  # clear a wrong cross first
                    x, y = await cell_center(page, i); await page.mouse.click(x, y); await page.wait_for_timeout(350)
                await dbl(page, i); await page.wait_for_timeout(420)
        await page.wait_for_timeout(700)
        await shot("06-win-wave")
        await page.wait_for_timeout(1800)
        await shot("07-win-sheet")

        # ---- Level 2 mid-play board with cats + auto marks ----
        await page.get_by_role("button", name="Next: level 2").click(); await page.wait_for_timeout(1300)
        n2, _, sol2 = decode(LEVELS[1])
        for r in (0, 2):
            await dbl(page, r * n2 + sol2[r]); await page.wait_for_timeout(450)
        x, y = await cell_center(page, n2 * (n2 - 1)); await page.mouse.click(x, y)
        await page.wait_for_timeout(500)
        await shot("08-midgame")

        # ---- Lose on level 2 (3 wrong cats) ----
        wrongs = [i for i in range(n2 * n2) if sol2[i // n2] != i % n2]
        placed = 0
        for i in wrongs:
            cells = (await page.evaluate("JSON.parse(localStorage.getItem('patchpaws:sessions'))"))["L2"]["cells"]
            if cells[i] != 0: continue
            await dbl(page, i); await page.wait_for_timeout(900); placed += 1
            if placed == 3: break
        await page.wait_for_timeout(1400)
        await shot("09-lose-sheet")
        await page.get_by_role("button", name="Try again").click(); await page.wait_for_timeout(500)

        # ---- Bigger board, levels, daily, settings ----
        await page.goto(URL + "#/play/150"); await page.wait_for_timeout(1500)
        await shot("10-level-150-9x9")
        await page.goto(URL + "#/levels"); await page.wait_for_timeout(800)
        await shot("11-levels")
        await page.goto(URL + "#/daily"); await page.wait_for_timeout(2500)
        await shot("12-daily")
        await page.goto(URL); await page.wait_for_timeout(1200)
        await page.get_by_role("button", name="Settings").click(); await page.wait_for_timeout(600)
        await shot("13-settings")

        # ---- Reduced motion pass ----
        await page.emulate_media(reduced_motion="reduce")
        await page.goto(URL + "#/play/3"); await page.wait_for_timeout(800)
        n3, _, sol3 = decode(LEVELS[2])
        for r in range(n3):
            await dbl(page, r * n3 + sol3[r]); await page.wait_for_timeout(250)
        await page.wait_for_timeout(1200)
        await shot("14-reduced-motion-win")
        await b.close()
    print("errors:", errors)
    sys.exit(1 if errors else 0)

asyncio.run(main())
