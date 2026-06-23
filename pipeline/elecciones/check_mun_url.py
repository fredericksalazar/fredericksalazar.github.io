import asyncio
import json
from playwright.async_api import async_playwright

async def check_mun_url():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        await page.goto("https://resultados.registraduria.gov.co/v2/resultados/0/00", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # Test municipal ACT json
        url = "https://resultados.registraduria.gov.co/v2/json/ACT/PR/01004.json"
        print(f"Obteniendo {url} ...")
        try:
            data = await page.evaluate(f'''async () => {{
                const res = await fetch("{url}");
                if (!res.ok) return {{"error": "HTTP " + res.status}};
                return await res.json();
            }}''')
            
            with open("sample_01004.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print("Guardado en sample_01004.json")
        except Exception as e:
            print(f"Error con {url}: {e}")
                
        await browser.close()

if __name__ == "__main__":
    asyncio.run(check_mun_url())
