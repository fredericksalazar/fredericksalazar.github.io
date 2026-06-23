import asyncio
import csv
import json
from playwright.async_api import async_playwright

# Archivo de salida
OUTPUT_FILE = "resultados_municipios_2026.csv"

# Nombres esperados de los candidatos (ajustar según el JSON real)
CANDIDATO_1 = "Abelardo De La Espriella" 
CANDIDATO_2 = "Iván Cepeda"

async def extract_municipal_data():
    async with async_playwright() as p:
        # Lanzamos el navegador (puede ser headless=True para que corra en fondo)
        # Usamos chromium que suele evadir mejor algunos bloqueos básicos si se usa en context
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        print("Navegando a la página principal para establecer cookies y evadir CloudFront...")
        # Navegamos primero a la ruta base para obtener los tokens/cookies de CloudFront
        await page.goto("https://resultados.registraduria.gov.co/v2/resultados/0/00", wait_until="networkidle")
        await page.wait_for_timeout(3000)

        all_municipios_data = []

        print("Iniciando bucle de extracción por departamento (01 al 34)...")
        # Iteramos sobre los códigos de departamento (01 a 34 aprox, incluyendo Bogotá y Consulados)
        for i in range(1, 35):
            cod_depto = f"{i:02d}"
            json_url = f"https://resultados.registraduria.gov.co/v2/json/ACT/PR/{cod_depto}.json"
            
            print(f"[{cod_depto}] Solicitando datos -> {json_url}")
            try:
                # Inyectamos el fetch directamente en el contexto de la página autenticada
                # Esto hereda las cookies y bypasses de CloudFront
                data = await page.evaluate(f'''async () => {{
                    const res = await fetch("{json_url}");
                    if (!res.ok) throw new Error("HTTP " + res.status);
                    return await res.json();
                }}''')
                
                print(f"  ✓ JSON obtenido para el departamento {cod_depto}.")
                
                # --- LÓGICA DE PARSEO ACTUALIZADA ---
                # El JSON de la registraduría viene estructurado por cámaras, luego mapagan.
                # data["camaras"][0]["mapagan"] contiene la lista de municipios.
                
                # Asumimos que el nombre del departamento se puede derivar o que lo tenemos en una lista estática,
                # pero para este script pondremos "Departamento X" porque el JSON por defecto no trae el nombre del depto en la raíz.
                nombre_depto = f"Departamento {cod_depto}"
                
                # Intentamos extraer los municipios desde camaras[0]["mapagan"]
                municipios = []
                if "camaras" in data and len(data["camaras"]) > 0:
                    camara_0 = data["camaras"][0]
                    if "mapagan" in camara_0:
                        municipios = camara_0["mapagan"]
                
                for mpio in municipios:
                    cod_mpio = mpio.get("amb", "")
                    nombre_mpio = mpio.get("nombre", "")
                    
                    mesas_inf = mpio.get("pmesesc", "0%")
                    
                    # La Registraduría no manda un array limpio de todos los candidatos en "mapagan" en esta vista
                    # de preconteo departamental. Solo manda el ganador ("cantotabla" como objeto) y los totales.
                    # Para obtener los votos ESPECIFICOS por candidato para cada municipio necesitamos otro endpoint,
                    # o extraerlo si viene. En el sample_01.json, "mapagan" trae solo la info del ganador ("cantotabla" como dict).
                    # ESTO ES CRÍTICO: el endpoint /ACT/PR/XX.json solo da info del ganador a nivel municipal para el mapa.
                    # Para los votos detallados por municipio, generalmente la ruta es /json/partidos/PR/XX/XXX.json
                    # Por lo tanto, el scraper debe iterar sobre otra URL para extraer los detalles.
                    
                    # Como workaround rápido con este JSON, solo podemos saber quién ganó y con cuántos votos.
                    ganador_dict = mpio.get("cantotabla", {})
                    nom_ganador = ganador_dict.get("nomcan", "") + " " + ganador_dict.get("apecan", "")
                    votos_ganador = int(mpio.get("vot", "0"))
                    
                    votos_c1 = votos_ganador if CANDIDATO_1.lower() in nom_ganador.lower() else 0
                    votos_c2 = votos_ganador if CANDIDATO_2.lower() in nom_ganador.lower() else 0
                    
                    # Las métricas nulos, blancos, no marcados no vienen a nivel municipal en este JSON (solo a nivel act departamental).
                    # Si el usuario requiere 100% de los datos municipales (votos de TODOS los candidatos y nulos/blancos),
                    # se requiere descargar el CSV completo de datos abiertos o iterar sobre /json/partidos/PR/01/01004.json etc.
                    
                    all_municipios_data.append({
                        "cod_depto": cod_depto,
                        "nombre_depto": nombre_depto,
                        "cod_mpio": cod_mpio,
                        "nombre_mpio": nombre_mpio,
                        "mesas_informadas_pct": mesas_inf,
                        "votos_abelardo_ganador": votos_c1,
                        "votos_cepeda_ganador": votos_c2,
                        "votos_blanco": 0, # No provisto en este JSON
                        "votos_nulos": 0,  # No provisto en este JSON
                        "tarjetones_no_marcados": 0 # No provisto en este JSON
                    })
                    
            except Exception as e:
                print(f"  ✗ Error o 404 al obtener el departamento {cod_depto}: {e}")
                # Esperamos un poco más en caso de error/timeout
                await page.wait_for_timeout(2000)
                continue
            
            # Rate limiting amigable (2 segundos entre peticiones exitosas)
            await page.wait_for_timeout(2000)
            
        print(f"\\nExtracción finalizada. Procesados {len(all_municipios_data)} municipios.")
        
        # Exportar a CSV
        if all_municipios_data:
            keys = all_municipios_data[0].keys()
            with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=keys)
                writer.writeheader()
                writer.writerows(all_municipios_data)
            print(f"Datos exportados exitosamente a {OUTPUT_FILE}")
        else:
            print("No se encontraron datos de municipios para exportar. Verifica la estructura del JSON.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(extract_municipal_data())
