import asyncio
import csv
import json
from playwright.async_api import async_playwright

OUTPUT_FILE = "resultados_100_municipios_2026.csv"
CANDIDATO_1 = "Abelardo De La Espriella"
CANDIDATO_2 = "Iván Cepeda"
CONCURRENCY = 3 # Número de peticiones simultáneas (conservador para no activar WAF)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        print("Navegando a la Registraduría para evadir CloudFront...")
        await page.goto("https://resultados.registraduria.gov.co/v2/resultados/0/00", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # 1. Obtener nomenclador
        print("Descargando nomenclador geográfico...")
        nom_url = "https://resultados.registraduria.gov.co/v2/json/nomenclator.json"
        nomenclator = await page.evaluate(f'''async () => {{
            const res = await fetch("{nom_url}");
            return await res.json();
        }}''')

        # 2. Parsear jerarquía
        ambitos = nomenclator.get("amb", [])[0].get("ambitos", [])
        
        deptos_dict = {} # id_interno -> nombre
        for amb in ambitos:
            if amb.get("l") == 2: # 2 = Departamento
                deptos_dict[amb.get("i")] = amb.get("n")

        municipios_list = []
        for amb in ambitos:
            if amb.get("l") == 3: # 3 = Municipio
                mpio_id = amb.get("co")
                mpio_nombre = amb.get("n")
                
                # Encontrar el depto padre
                depto_nombre = "Desconocido"
                parents = amb.get("p", [])
                if parents:
                    for parent_level in parents:
                        if parent_level.get("l") == 2:
                            depto_id = parent_level.get("p", [])[0]
                            depto_nombre = deptos_dict.get(depto_id, "Desconocido")
                            break
                            
                municipios_list.append({
                    "cod_mpio": mpio_id,
                    "nombre_mpio": mpio_nombre,
                    "cod_depto": mpio_id[:2],
                    "nombre_depto": depto_nombre
                })

        total_mpios = len(municipios_list)
        print(f"Se encontraron {total_mpios} municipios en el nomenclador.")

        # 3. Función para descargar un municipio individual (100% de datos)
        resultados_totales = []
        fallidos = []
        
        sem = asyncio.Semaphore(CONCURRENCY)

        async def fetch_municipio(mpio_info):
            async with sem:
                cod_mpio = mpio_info["cod_mpio"]
                url = f"https://resultados.registraduria.gov.co/v2/json/ACT/PR/{cod_mpio}.json"
                try:
                    data = await page.evaluate(f'''async () => {{
                        const res = await fetch("{url}");
                        if (!res.ok) throw new Error(res.status);
                        return await res.json();
                    }}''')
                    
                    # Parsear datos
                    totales = data.get("totales", {}).get("act", {})
                    camara_0 = data.get("camaras", [{}])[0]
                    partidos = camara_0.get("partotabla", [])
                    
                    mesas_inf = totales.get("pmesesc", "0%")
                    blancos = totales.get("votblan", "0")
                    nulos = totales.get("votnul", "0")
                    no_marcados = totales.get("votnma", "0")
                    
                    votos_c1 = 0
                    votos_c2 = 0
                    
                    for partido in partidos:
                        act = partido.get("act", {})
                        candidatos = act.get("cantotabla", [])
                        for cand in candidatos:
                            nom_cand = cand.get("nomcan", "") + " " + cand.get("apecan", "")
                            votos = int(cand.get("vot", "0"))
                            
                            if CANDIDATO_1.lower() in nom_cand.lower():
                                votos_c1 += votos
                            elif CANDIDATO_2.lower() in nom_cand.lower():
                                votos_c2 += votos

                    resultados_totales.append({
                        "cod_depto": mpio_info["cod_depto"],
                        "nombre_depto": mpio_info["nombre_depto"],
                        "cod_mpio": cod_mpio,
                        "nombre_mpio": mpio_info["nombre_mpio"],
                        "mesas_informadas_pct": mesas_inf,
                        "votos_abelardo": votos_c1,
                        "votos_cepeda": votos_c2,
                        "votos_blanco": blancos,
                        "votos_nulos": nulos,
                        "tarjetones_no_marcados": no_marcados
                    })
                except Exception as e:
                    fallidos.append(cod_mpio)

                # Pequeña pausa para no saturar
                await asyncio.sleep(0.5)

        # Batch procesing
        print("Iniciando descargas granulares (puede tardar unos minutos)...")
        tasks = [fetch_municipio(mpio) for mpio in municipios_list]
        
        # Para dar reporte de progreso visual si corre interactivo
        batch_size = 50
        for i in range(0, len(tasks), batch_size):
            batch = tasks[i:i+batch_size]
            await asyncio.gather(*batch)
            print(f"Progreso: {min(i+batch_size, total_mpios)} / {total_mpios} municipios procesados...")
            
        print(f"\\nDescarga finalizada. {len(resultados_totales)} exitosos, {len(fallidos)} fallidos.")

        # Exportar a CSV
        if resultados_totales:
            keys = resultados_totales[0].keys()
            with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=keys)
                writer.writeheader()
                writer.writerows(resultados_totales)
            print(f"Datos exportados a {OUTPUT_FILE}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
