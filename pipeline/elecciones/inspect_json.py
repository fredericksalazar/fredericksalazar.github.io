import asyncio
import json
from playwright.async_api import async_playwright

async def inspect_json():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        print("Navegando a la Registraduría para cookies...")
        await page.goto("https://resultados.registraduria.gov.co/v2/resultados/0/00", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        url = "https://resultados.registraduria.gov.co/v2/json/ACT/PR/01.json"
        print(f"Obteniendo {url} ...")
        
        data = await page.evaluate(f'''async () => {{
            const res = await fetch("{url}");
            return await res.json();
        }}''')
        
        with open("sample_01.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print("Muestra guardada en sample_01.json")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect_json())
