import asyncio
from playwright.async_api import async_playwright

async def test_network():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        async def handle_response(response):
            if "json" in response.headers.get("content-type", "").lower() or ".json" in response.url:
                print(f"JSON interceptado: {response.url}")

        page.on("response", handle_response)

        print("Visitando https://resultados.registraduria.gov.co/v2/resultados/0/00")
        await page.goto("https://resultados.registraduria.gov.co/v2/resultados/0/00", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        
        print("Visitando https://resultados.registraduria.gov.co/v2/resultados/0/01/")
        await page.goto("https://resultados.registraduria.gov.co/v2/resultados/0/01/", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_network())
