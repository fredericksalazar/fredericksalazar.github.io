import asyncio
import json
from playwright.async_api import async_playwright

async def inspect_detailed_json():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        await page.goto("https://resultados.registraduria.gov.co/v2/resultados/0/00", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        urls = {
            "nomenclator": "https://resultados.registraduria.gov.co/v2/json/nomenclator.json",
            "mun_act": "https://resultados.registraduria.gov.co/v2/json/ACT/PR/01/01004.json",
            "mun_partidos": "https://resultados.registraduria.gov.co/v2/json/partidos/PR/01/01004.json"
        }
        
        for name, url in urls.items():
            print(f"Obteniendo {url} ...")
            try:
                data = await page.evaluate(f'''async () => {{
                    const res = await fetch("{url}");
                    if (!res.ok) return {{"error": "HTTP " + res.status}};
                    return await res.json();
                }}''')
                
                with open(f"sample_{name}.json", "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"Guardado en sample_{name}.json")
            except Exception as e:
                print(f"Error con {url}: {e}")
                
        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect_detailed_json())
