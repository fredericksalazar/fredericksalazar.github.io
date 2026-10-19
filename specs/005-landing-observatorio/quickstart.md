# Quickstart · Verificar la Home del Observatorio

Guía para comprobar de punta a punta que la feature cumple la spec. Contratos en
[`contracts/home-page.md`](./contracts/home-page.md); entidades en
[`data-model.md`](./data-model.md).

## Requisitos previos

- Node `>=22.12`, dependencias instaladas (`npm install`).
- `public/data/*.json` sincronizados desde `odc-data-pipeline`.

## 1. Compuertas de calidad

```bash
npx astro check
```

```bash
npm run build
```

**Esperado:** 0 errores nuevos de tipos; build exitoso y link-checker con
0 enlaces rotos (valida el movimiento a `/observatorio/inflacion/`).

## 2. Contenido en el HTML inicial (FR-009, US1 escenario 4)

```bash
grep -o "6,28\|6.28" dist/observatorio/index.html | head -1
```

**Esperado:** los valores, periodos y fuentes de los 8 indicadores aparecen en
`dist/observatorio/index.html` sin ejecutar JS. Repetir con el valor vigente de
cada indicador en `public/data/` (los valores cambian con cada corte).

## 3. Revisión visual

```bash
npm run dev
```

En `http://localhost:4321/observatorio/`:

| # | Comprobación | Spec |
|---|---|---|
| 1 | El panel "Cómo va Colombia" se ve sin bajar más de una pantalla bajo el hero en 1366×768 | SC-003 |
| 2 | A 375 px no hay desplazamiento horizontal; tarjetas en 1 columna | SC-003 |
| 3 | Cada tarjeta: valor, unidad, periodo, cambio, referencia, explicación, fuente, enlace | FR-004 |
| 4 | Cambios y referencias en gris neutro, sin rojo/verde | FR-006, FR-007 |
| 5 | Las 8 sparklines se pintan en azul de marca y quedan en estado `ready` | R5 |
| 6 | Con JS desactivado, la página sigue mostrando todas las cifras | FR-009 |
| 7 | Un clic en cada tarjeta lleva a su dashboard; la grilla de dominios cubre los 9 destinos | FR-008, FR-010, SC-004 |
| 8 | "Lo más reciente" muestra el último informe de inflación | FR-011 |
| 9 | `/observatorio/inflacion/` muestra el dashboard anterior completo y enlaza de vuelta a la Home | FR-001, FR-001a |
| 10 | El menú tiene "Inicio" activo en la Home e "Inflación vs Tasa" activo en la subpágina | Contrato sección 4 |

## 4. Integridad de datos (SC-002, FR-017, REGLA 2)

1. Cambiar a mano un valor de `serie` en `public/data/data_empleo.json`, recargar
   en dev: la sparkline del desempleo refleja el cambio sin recompilar.
2. Poner `null` en `indicadores.tasa_desempleo.actual.valor` y recompilar: la
   tarjeta desaparece y el build registra un aviso. **Revertir el JSON.**
3. Revisar que no hay cifras escritas a mano:

```bash
grep -nE "[0-9]+,[0-9]{2} ?%" src/pages/observatorio/index.astro src/lib/observatorio/home.ts
```

**Esperado:** sin coincidencias.

## 5. SEO y descubrimiento (US4)

1. Validar el JSON-LD de `dist/observatorio/index.html` en la prueba de
   resultados enriquecidos de Google (pegando el HTML): `DataCatalog` y 7
   `Dataset` sin errores (SC-005).
2. `dist/sitemap-0.xml` contiene `/observatorio/` y `/observatorio/inflacion/`.
3. `dist/llms.txt` incluye la línea del Observatorio.
4. `og:image` apunta a un PNG de 1200×630.

## 6. Rendimiento y accesibilidad (SC-006)

```bash
npm run preview
```

Lighthouse (móvil) sobre `http://localhost:4321/observatorio/`: Accesibilidad
≥ 90, SEO ≥ 90, LCP < 2,5 s. Revisar un solo `h1`, foco visible en tarjetas y
`aria-label` en cada sparkline.

## 7. Después del deploy (lo hace el autor)

- Inspeccionar `/observatorio/` y `/observatorio/inflacion/` en Search Console y
  confirmar el aviso de IndexNow.
- Prueba de 5 personas (SC-001) y seguimiento de K1/K4 a los 90 días (SC-007).
