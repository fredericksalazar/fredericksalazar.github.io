# Producto · fredericksalazar.github.io

> **Qué es este documento:** el *por qué* del sitio. Define el objetivo, las
> audiencias, los pilares y las reglas de producto con las que cualquier persona
> o agente de IA debe evaluar un cambio. El *cómo* técnico vive en
> [`ARCHITECTURE.md`](./ARCHITECTURE.md) y el visual en
> [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md).
>
> **Uso en Spec Kit:** toda `spec.md` debe declarar a qué **pilar** (4) y a qué
> **KPI** (7) contribuye. Si no contribuye a ninguno, la feature no se hace.
>
> Las marcas **⚑ DECIDIR** son valores que el autor aún debe fijar.
>
> Versión 0.1.0 · Borrador · 2026-10-14

---

## 1. Visión

Posicionar a **Frederick Salazar** como **uno de los 20 mejores ingenieros y
cientificos de datos de Colombia**, con un sitio que no solo *cuenta* su experiencia sino que la
*demuestra*: plataformas de datos públicas, análisis rigurosos y contenido técnico
útil, construidos y operados por él.

**Propuesta de valor (una frase):**
> El ingeniero y científico de datos colombiano que convierte datos públicos de Colombia en
> plataformas abiertas y análisis que cualquiera puede consultar.

## 2. Identidad de marca

Los datos de identidad (nombre, cargo, empleador, formación, redes, temas) tienen
**una sola fuente de verdad: `personSchema` en `src/lib/seo.ts`**. Este documento
no los repite para que no se desincronicen; cualquier texto del sitio que los
mencione debe ser coherente con ese objeto.

Rasgos de marca que deben sentirse en todo el sitio:

| Rasgo | Se expresa como |
| --- | --- |
| **Experto con evidencia** | Cada afirmación se respalda con un proyecto, una certificación o un dato con fuente. |
| **Constructor** | Mostrar sistemas funcionando (Observatorio, calculadoras), no solo opiniones. |
| **Colombiano y regional** | Datos, ejemplos y problemas de Colombia/LATAM; español es-CO. |
| **Claro y didáctico** | Lo técnico se explica para que lo entienda alguien no técnico. |
| **Riguroso y neutral** | Fuentes oficiales citadas; neutralidad política en temas electorales. |

## 3. Audiencias

| # | Audiencia | Qué busca | Qué debe encontrar | Acción esperada |
| --- | --- | --- | --- | --- |
| A1 | **Reclutadores y headhunters** | Validar seniority rápido | Cargo, años, empresas, certificaciones, stack | Contactar por LinkedIn |
| A2 | **Líderes técnicos / clientes** | Criterio y profundidad técnica | Proyectos, arquitectura, artículos de fondo | Contactar, compartir |
| A3 | **Comunidad de datos** | Aprender, referencias | Tutoriales, guías, opiniones fundamentadas | Leer, volver, enlazar |
| A4 | **Ciudadanos, periodistas, estudiantes** | Entender la economía y la política de Colombia con datos | Observatorio, informes, calculadoras, elecciones | Usar, citar, compartir |
| A5 | **Buscadores y asistentes de IA** | Entidades claras y contenido citable | HTML indexable, JSON-LD, sitemap, `llms.txt` | Indexar, citar al autor |

A1 y A2 son las audiencias que **convierten** (oportunidades profesionales).
A3, A4 y A5 son las que **amplifican** (tráfico, enlaces, autoridad).

## 4. Pilares del producto

### P1 · CV digital

- **Qué:** inicio, experiencia, certificaciones.
- **Objetivo:** que A1 valide el perfil en menos de 30 segundos.
- **Reglas:** la información de mayor peso (cargo, años, empresas top,
  certificaciones cloud) aparece arriba; todo logro es verificable; nada de
  métricas o cargos inflados.

### P2 · Proyectos

- **Qué:** fichas en `src/content/proyectos/` + demos/repos enlazados.
- **Objetivo:** demostrar capacidad de construir de punta a punta.
- **Reglas:** cada proyecto declara problema, solución, stack y resultado; enlaza
  código o demo cuando exista; los proyectos destacados reflejan el posicionamiento
  de *ingeniero de datos* (no proyectos irrelevantes para la marca en primer plano).

### P3 · Observatorio de Datos de Colombia

- **Qué:** dashboards económicos, informes, elecciones presidenciales y
  calculadoras ciudadanas, alimentados por pipelines propios.
- **Objetivo:** ser el **diferenciador**: prueba pública y viva de ingeniería de
  datos, y fuente citable que genere enlaces y autoridad.
- **Reglas:** rigor absoluto en datos (fuente oficial, fecha de corte, metodología
  visible); actualización automática cuando la fuente lo permita; un dato dudoso
  no se publica.

### P4 · Blog (content marketing y SEO)

- **Qué:** artículos en `src/content/blog/` (`.md`/`.mdx`).
- **Objetivo:** atraer tráfico orgánico desde Google y Bing y llevarlo hacia P1–P3.
- **Reglas:** ver sección 5.

**Relación entre pilares:** el blog y el Observatorio **atraen**; proyectos y CV
**convierten**. Toda página debe tener al menos un camino hacia otro pilar.

## 5. Estrategia de contenido y SEO

### 5.1 Clusters temáticos

| Cluster | Ejemplos actuales | Pilar que alimenta |
| --- | --- | --- |
| Ingeniería y arquitectura de datos | ciclo de vida, data lake vs warehouse, kit del data engineer | P1, P2 |
| Gobierno y calidad de datos | data stewards, MDM, calidad de datos, DataCompass | P1, P2 |
| IA y LLM aplicados | agentes de IA, Kimi K3, OllamaFX | P2 |
| Colombia en datos | inflación/tasas mensual, dólar, Colombia vs rival | P3 |
| Elecciones | primera vuelta 2026, congreso 2026 | P3 |

Un artículo nuevo pertenece a **un** cluster principal. Temas fuera de los
clusters requieren justificación en la spec.

### 5.2 Reglas de publicación

1. **Intención de búsqueda clara:** cada post apunta a una consulta principal.
2. **Metadatos completos:** `titulo`, `descripcion` ≤ 160, `tipo`, `etiquetas`,
   `imagen` (og PNG 1200×630).
3. **Enlazado interno obligatorio:** mínimo un enlace al Observatorio, a un
   proyecto o a otro post del mismo cluster.
4. **Datos con fuente:** toda cifra cita la fuente; si viene del Observatorio,
   se usan sus componentes (`Chart`, marcadores), no imágenes estáticas.
5. **Autoría visible:** el autor y su bio aparecen siempre (señal E-E-A-T).
6. **FAQ** (`FaqSchema`) cuando el post responda preguntas frecuentes reales.
7. **Series recurrentes** (informe mensual, Colombia vs rival) siguen su receta
   documentada y conservan formato entre ediciones.

### 5.3 Cadencia

- Histórico: 10 posts (2023), 6 (2024), 1 (2025), 16 (2026).
- **⚑ DECIDIR:** cadencia mínima objetivo (p. ej. 2 posts/mes: 1 serie
  recurrente + 1 artículo de fondo).

## 6. Voz y tono

- **Español de Colombia**, primera persona, cercano y profesional.
- **Técnico pero accesible:** se define cada término la primera vez.
- **Directo y con criterio:** se opina con argumentos y datos; en series como
  "Colombia vs rival" se permite un tono más desenfadado ("sin anestesia").
- **Neutral en política:** en contenido electoral se describen datos, no se toma
  partido.
- **Prohibido:** clickbait que el contenido no cumpla, cifras sin fuente, lenguaje
  de relleno, emojis en textos formales salvo en series que ya los usan.

## 7. Métricas (KPIs)

| KPI | Mide | Fuente | Meta |
| --- | --- | --- | --- |
| K1 · Impresiones orgánicas | Visibilidad en buscadores | Google Search Console, Bing Webmaster | ⚑ DECIDIR |
| K2 · Ranking de marca | Posición para "Frederick Salazar" e "ingeniero de datos Colombia" | Search Console | Top 3 / ⚑ DECIDIR |
| K3 · Tráfico orgánico | Sesiones desde buscadores | GA4 | ⚑ DECIDIR |
| K4 · Conversiones | Clics a LinkedIn/GitHub y CTAs (`data-ga-event`) | GA4 | ⚑ DECIDIR |
| K5 · Autoridad | Enlaces externos y citas al Observatorio | Search Console (enlaces) | ⚑ DECIDIR |
| K6 · Frescura del Observatorio | Días desde la última actualización de cada dataset | `metadata.ultima_actualizacion` | ≤ 45 días en series mensuales |

## 8. Principios de producto (reglas de decisión)

| ID | Principio |
| --- | --- |
| **PRD-01** | **Toda página refuerza la marca:** identifica al autor y ofrece un camino hacia otro pilar o hacia el contacto. |
| **PRD-02** | **Credibilidad antes que volumen:** mejor no publicar que publicar un dato o logro no verificable. |
| **PRD-03** | **Indexable primero:** el contenido de valor está en el HTML inicial; lo interactivo es mejora, no requisito. |
| **PRD-04** | **Una sola identidad visual:** blanco y azul de marca, Google Sans Flex, según `DESIGN-SYSTEM.md`. |
| **PRD-05** | **Rigor de datos:** fuente oficial, fecha de corte y metodología visibles en todo dato publicado. |
| **PRD-06** | **Neutralidad política** en contenido electoral. |
| **PRD-07** | **Nada inventado sobre el autor:** empresas, cargos, certificaciones y cifras salen de información real del autor. |
| **PRD-08** | **Simplicidad:** sin funcionalidades que no aporten a un pilar o KPI. |

## 9. Fuera de alcance

Mientras no se decida lo contrario mediante una spec:

- Cuentas de usuario, comentarios, formularios con backend o pagos (el sitio es estático).
- Publicidad de terceros.
- Contenido en otros idiomas (⚑ DECIDIR si se quiere versión en inglés para audiencia internacional).

## 10. Oportunidades detectadas (backlog estratégico)

Candidatas a convertirse en specs:

1. **Credenciales en JSON-LD:** agregar `hasCredential` al `personSchema` con las
   certificaciones (K2, A1, A5).
2. **Trayectoria estructurada:** datos estructurados de experiencia laboral en
   `/experiencia/` (K2, A5).
3. **Datos del CV como contenido:** sacar experiencia y certificaciones de las
   páginas `.astro` a una fuente única (colección o `lib/`), y derivar de ahí el
   contador "Certs" del sidebar.
4. **Cadencia del blog:** plan editorial según la sección 5.3.
5. **Página pilar evergreen** del Observatorio que concentre los informes mensuales.
6. **Corrección de contenido:** el post de Ghana dice "octavos" y fue "dieciseisavos".

## 11. Mantenimiento

- Lo actualiza el autor cuando cambie el objetivo, una audiencia, un pilar o un KPI.
- Una spec que contradiga este documento se detiene hasta que el autor decida.
- Versionado: MAJOR si cambia la visión o un pilar; MINOR si se agrega un
  principio, cluster o KPI; PATCH si se aclara un texto.
