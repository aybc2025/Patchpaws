# python3 -I tools/check_install.py http://localhost:8765/patchpaws/
import sys, json, asyncio
from playwright.async_api import async_playwright

async def main(url):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        ctx = await b.new_context(); page = await ctx.new_page()
        await page.goto(url, wait_until="networkidle"); await page.wait_for_timeout(1500)
        cdp = await ctx.new_cdp_session(page); await cdp.send("Page.enable")
        err = await cdp.send("Page.getInstallabilityErrors")
        man = await cdp.send("Page.getAppManifest")
        print("manifest errors:", [e["message"] for e in man.get("errors", [])])
        print("installability errors:", json.dumps(err["installabilityErrors"]))
        print("manifest url:", man.get("url"))
        print("sw:", await page.evaluate("navigator.serviceWorker.ready.then(r => r.active && r.active.state)"))
        print("caches:", await page.evaluate("caches.keys()"))
        await b.close()

asyncio.run(main(sys.argv[1]))
