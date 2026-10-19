# Data Model: Automatización de post de análisis de inflación y tasas de interés

**Feature**: `specs/004-automatizacion-post-inflacion`  
**Date**: 2026-10-19  

## 1. Entidad: Ficha de Hechos (`InflationFacts`)

Estructura emitida por `scripts/extract-inflacion-facts.mjs` a partir de `public/data/data_inflacion.json`.

```typescript
interface IndicadorDato {
  valor: number;           // Ej: 6.28
  delta_mes: number;       // Ej: 0.03
  variacion_mes: 'subio' | 'bajo' | 'igual';
  delta_ano: number;       // Ej: 1.10
  variacion_ano: 'subio' | 'bajo' | 'igual';
}

interface PeriodoContexto {
  periodo: string;         // "2026-09"
  mes_num: string;         // "09"
  mes_nombre: string;      // "septiembre"
  anio: string;            // "2026"
  etiqueta: string;        // "Septiembre 2026"
}

interface ComparativoFila {
  indicador: string;       // "Inflación anual", "Inflación mensual", etc.
  valor_ano_anterior: string; // "5,18%"
  valor_mes_anterior: string; // "6,25%"
  valor_actual: string;       // "6,28%"
}

interface InflationFacts {
  status: 'NEEDS_POST' | 'UP_TO_DATE';
  periodo_actual: PeriodoContexto;
  periodo_anterior: PeriodoContexto;
  periodo_interanual: PeriodoContexto;
  indicadores: {
    inflacion_anual: IndicadorDato;
    inflacion_mensual: IndicadorDato;
    tasa_interes: IndicadorDato;
    spread: IndicadorDato;
  };
  efecto_base: {
    mes_saliente_nombre: string; // "septiembre"
    mes_saliente_anio: string;   // "2025"
    inflacion_saliente: number;  // 0.32
    inflacion_entrante: number;  // 0.37
    direccion_efecto: 'alza' | 'baja' | 'neutro';
  };
  contexto: {
    es_maximo_ano: boolean;
    es_minimo_ano: boolean;
    meses_tasa_estable: number; // Ej: 3 meses consecutivos en 12.0%
    tendencia_tasa: 'pausa' | 'subida' | 'bajada';
  };
  comparativo: ComparativoFila[];
  rutas: {
    archivo_post: string;   // "src/content/blog/inflacion-tasas-interes-colombia-septiembre-2026.mdx"
    imagen_cover: string;   // "/images/blog/inflacion-tasas-colombia-septiembre-2026-cover.png"
    url_canonica: string;   // "https://fredericksalazar.github.io/blog/inflacion-tasas-interes-colombia-septiembre-2026/"
  };
}
```

---

## 2. Entidad: Metadatos del Post (`BlogPostFrontmatter`)

Contrato estricto exigido por `src/content.config.ts`:

```typescript
interface BlogPostFrontmatter {
  titulo: string;           // "Inflación en Colombia septiembre 2026: sube a 6,28% y el BanRep mantiene la tasa en 12%"
  tituloSeo: string;        // "Inflación en Colombia septiembre 2026: 6,28% y tasa BanRep 12%"
  fecha: string;            // "2026-10-19" (fecha ISO del post)
  descripcion: string;      // Longitud <= 160 caracteres
  etiquetas: string[];      // ["Inflación", "Colombia", "Economía", "Banco de la República", "Tasas de Interés", "Observatorio de Datos"]
  autor: string;            // "Frederick Salazar"
  imagen: string;           // "/images/blog/inflacion-tasas-colombia-septiembre-2026-cover.png"
  draft: boolean;           // false
  tipo: "analisis";         // "analisis"
  destacado: boolean;       // true
  resumen: string;          // Resumen ejecutivo de 2 a 3 oraciones
}
```

---

## 3. Entidad: Contrato de IndexNow (`IndexNowPayload`)

Esquema de la solicitud HTTP POST hacia `https://api.indexnow.org/indexnow`:

```typescript
interface IndexNowPayload {
  host: "fredericksalazar.github.io";
  key: string;              // "aeb181390d48395bb82bebbb1cb0c903"
  keyLocation: string;      // "https://fredericksalazar.github.io/aeb181390d48395bb82bebbb1cb0c903.txt"
  urlList: string[];        // Lista de URLs a indexar con trailing slash
}
```
