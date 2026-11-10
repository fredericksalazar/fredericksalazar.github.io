# Quickstart: Validar el modo claro/oscuro

**Feature**: `007-tema-claro-oscuro` · **Date**: 2026-11-10

Guía para validar la implementación de punta a punta. No requiere dependencias
nuevas.

---

## 1. Requisitos

- Node.js >= 22.12
- npm
- Navegador moderno (Chrome, Firefox, Safari o Edge actuales)
- Opcional: segundo navegador o perfil para probar “primera visita”

---

## 2. Comandos

```bash
npm install
npm run dev        # http://localhost:4321
npx astro check    # tipos
npm run build      # build + verificador de enlaces internos
```

Para probar el build de producción localmente:

```bash
npm run build
npm run preview
```

---

## 3. Pruebas automáticas

| Comando | Esperado |
| --- | --- |
| `npx astro check` | 0 errores nuevos; los existentes deben ser los mismos de antes. |
| `npm run build` | Build exitoso; `check-internal-links.mjs` sin enlaces roto. |
| `npm run preview` | El sitio sirve sin errores de consola. |

---

## 4. Matriz de validación manual

Usa una ventana de incógnito/perfil limpio para la primera visita. Anota el
resultado de cada fila.

### 4.1 Primera visita y sistema

| # | Escenario | Pasos | Esperado |
| --- | --- | --- | --- |
| 1 | Sistema claro, sin preferencia | Incógnito + sistema claro; abrir `/` | Tema claro, sin destello; `data-theme="light"`, `data-theme-preference="auto"`. |
| 2 | Sistema oscuro, sin preferencia | Incógnito + sistema oscuro; abrir `/` | Tema oscuro, sin destello; `data-theme="dark"`. |
| 3 | Cambio del sistema en automático | Con la página abierta en `auto`, cambiar el tema del SO | El sitio cambia sin recargar; se emite `themechange`. |
| 4 | Sistema oscuro sin JS | Desactivar JavaScript + sistema oscuro; abrir `/` | Fondo oscuro y texto legible (fallback CSS). |
| 5 | Storage bloqueado | Bloquear cookies/sitio o usar modo privado estricto; abrir `/` | Sitio en `auto`, sin errores visibles en consola. |

### 4.2 Selector

| # | Escenario | Pasos | Esperado |
| --- | --- | --- | --- |
| 6 | Ubicación | Abrir cualquier página | El selector está debajo del divisor del perfil y antes de los KPIs. |
| 7 | Opciones | Inspeccionar el selector | Exactamente 3 opciones con ícono distinto y texto visible: Automático, Claro, Oscuro. |
| 8 | Estado activo | Elegir cada opción | La opción elegida se distingue visualmente; solo una marcada. |
| 9 | Cambio inmediato | Claro → Oscuro → Claro | Todo el sitio cambia al instante, sin recargar. |
| 10 | Automático | Elegir Oscuro y luego Automático | Vuelve a seguir el sistema; el radio Automático queda marcado. |

### 4.3 Persistencia y navegación

| # | Escenario | Pasos | Esperado |
| --- | --- | --- | --- |
| 11 | Persistencia entre páginas | Elegir Oscuro; navegar a 3 páginas distintas | Todas en oscuro, sin destello, opción Oscuro marcada. |
| 12 | Recarga | Elegir Claro; recargar | Sigue en claro. |
| 13 | Reapertura | Cerrar y abrir el navegador | Conserva la elección. |
| 14 | Borrar datos | Borrar datos del sitio; abrir | Vuelve a Automático. |
| 15 | Valor inválido | En consola: `localStorage.setItem('theme-preference','x')`; recargar | Se normaliza a Automático, sin errores. |
| 16 | Otra pestaña | Cambiar el tema en una pestaña; mirar otra | La otra pestaña se actualiza (evento `storage`). |

### 4.4 Accesibilidad

| # | Escenario | Pasos | Esperado |
| --- | --- | --- | --- |
| 17 | Teclado | Tab hasta el grupo; flechas; Espacio | Se puede recorrer y elegir; foco visible en ambos temas. |
| 18 | Lector de pantalla | Inspeccionar el grupo | Anuncia “Tema de la página”, opción y estado seleccionado. |
| 19 | Reduced motion | Activar reducción de movimiento; cambiar tema | Sin animaciones/transiciones molestas. |
| 20 | Contraste | Medir texto normal, texto grande e íconos en ambos temas | ≥ 4.5:1, ≥ 3:1 y ≥ 3:1 respectivamente. |
| 21 | Móvil | Ancho ≤ 768 px; abrir el sitio | El selector sigue visible y usable en la barra superior. |

### 4.5 Contenido y componentes

| # | Escenario | Pasos | Esperado |
| --- | --- | --- | --- |
| 22 | Inicio | Abrir `/` en ambos temas | Hero, KPIs, pills, cards, partners legibles; logos no invertidos. |
| 23 | Experiencia | Abrir `/experiencia` | Timeline, tags, cards y texto legibles. |
| 24 | Proyectos | Abrir `/proyectos` y un detalle | Cards, badges, imágenes y enlaces legibles. |
| 25 | Observatorio | Abrir `/observatorio` y un dashboard | Paneles blueprint, tarjetas, tablas y navegación legibles. |
| 26 | Elecciones | Abrir `/elecciones-presidenciales/2026-segunda-vuelta` | Mapas, gráficos, leyendas y tabs legibles. |
| 27 | Calculadoras | Abrir `/calculadoras` y una calculadora | Inputs, resultados, tablas y botones legibles. |
| 28 | Blog | Abrir `/blog` y un post | Cards, metadatos, bloques de código y tablas legibles. |
| 29 | Informes | Abrir `/observatorio/informes` y un informe | Contenido, popup y descargas legibles. |
| 30 | 404 | Abrir `/ruta-inexistente` | Página legible en ambos temas. |
| 31 | Formularios | Enfocar inputs y selects en ambos temas | Bordes, placeholders y foco visibles. |
| 32 | Tablas | Revisar tablas con encabezados y filas alternas | Contraste y separadores legibles. |
| 33 | Popups | Abrir el popup de informe | Fondo, borde, texto y cierre legibles. |

### 4.6 Gráficos, mapas y código

| # | Escenario | Pasos | Esperado |
| --- | --- | --- | --- |
| 34 | Gráfico de líneas | Abrir un dashboard con gráfico; cambiar tema | Ejes, ticks, grid, leyenda y hover legibles; no se pierde la vista. |
| 35 | Gráfico de barras | Activar “Ver en barras”; cambiar tema | Se mantiene en barras y se recolorea. |
| 36 | Mapa | Abrir un mapa de elecciones en oscuro | Fondo oscuro (`carto-darkmatter`); marcadores y leyenda legibles. |
| 37 | Mapa en claro | Cambiar a claro | Vuelve a `white-bg`. |
| 38 | Código | Abrir un post con bloque de código; cambiar tema | Colores Shiki claros/oscuros correctos; fondo y borde legibles. |
| 39 | Imágenes | Revisar fotos, logos y avatares en oscuro | No invertidos; contenedores ajustados solo si hace falta. |
| 40 | Impresión | `Cmd/Ctrl + P` en oscuro | Impresión en claro, sin selector, contenido legible. |

---

## 5. Inspección rápida en consola

```js
// Estado actual
document.documentElement.dataset.theme;
document.documentElement.dataset.themePreference;
localStorage.getItem('theme-preference');
document.querySelector('meta[name="theme-color"]').content;

// Cambiar preferencia y observar
localStorage.setItem('theme-preference', 'dark');
location.reload();

// Escuchar cambios
document.addEventListener('themechange', (e) => console.log(e.detail));
```

---

## 6. Criterios de aceptación

- [ ] Las 40 filas de la matriz pasan en al menos un navegador de escritorio y
      uno móvil.
- [ ] `npx astro check` y `npm run build` pasan.
- [ ] No hay errores de consola en ninguno de los temas.
- [ ] No hay destello de tema en la primera carga ni en la navegación.
- [ ] El modo claro conserva el aspecto actual.
- [ ] El modo oscuro conserva el azul de marca y usa grises oscuros.
- [ ] El selector es accesible por teclado y lector de pantalla.
- [ ] Los gráficos, mapas y bloques de código se adaptan.
- [ ] Las imágenes y logos no se invierten.
- [ ] `agents/DESIGN-SYSTEM.md`, `agents/PRODUCT.md` y
      `agents/ARCHITECTURE.md` están actualizados.
- [ ] No se agregaron dependencias ni secretos.

---

## 7. Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| Destello claro en primera visita oscura | El script inline no se ejecuta antes del paint o el orden cambió. | Verificar que el script esté en `<head>` antes de `ClientRouter` y que no tenga `type="module"`. |
| El tema se pierde al navegar | Falta re-aplicar en `astro:after-swap`. | Revisar el listener y `data-theme` en `<html>`. |
| El selector no marca la opción | `initTheme()` no se ejecuta o el `name` no coincide. | Revisar el script del componente y el `name="theme-preference"`. |
| Los gráficos siguen claros | `themechange` no se escucha o `chartTheme()` no lee tokens. | Revisar el listener en `Chart.astro` y las variables CSS. |
| El mapa oscuro no carga | `carto-darkmatter` no disponible o sin red. | Verificar la consola; el fallback es `white-bg` con marco claro. |
| El código no cambia | Shiki no tiene temas duales o falta el CSS. | Revisar `astro.config.mjs` y las reglas `.astro-code`. |
| Storage bloqueado lanza errores | Falta `try/catch`. | Revisar `getPreference`/`setPreference`. |
| El selector desaparece en móvil | Regla de `.sidebar__stats` aplicada al contenedor. | Asegurar que el selector no herede `display: none`. |
