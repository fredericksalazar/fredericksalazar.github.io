# Quickstart · Validación del refinamiento gráfico

## Requisitos

- Node >= 22.12, dependencias instaladas (`npm install`).

## Verificación automática

```bash
npx astro check
```

```bash
npm run build
```

Ambos sin errores nuevos. El pipeline no se toca, así que `pytest` no aplica.

## Verificación visual (`npm run dev`)

| # | Dónde | Qué comprobar | Requisito |
|---|---|---|---|
| 1 | `/observatorio/empleo/` panel 01 | "Máx", "Mín" y "Prom" en gris, a la izquierda, con 2 decimales y `%` | FR-001–004, SC-001 |
| 2 | `/observatorio/comercio/` paneles 01, 02, 03 | Tres líneas en cada uno; en 03 se conserva la línea de cero y el Mín queda bajo cero | FR-001, FR-006 |
| 3 | `/observatorio/pib/` panel 04 | Tres líneas; bandas y anotación "Pandemia" intactas; "Máx" y "Pandemia" no se tapan; las líneas siguen en vista barras | FR-005, FR-006 |
| 4 | `/observatorio/demografia/` panel 03 | Sin líneas estadísticas (fuera de alcance) | Clarifications |
| 5 | Cualquier gráfico con máx/mín (p. ej. inflación en `/observatorio/` y un post del blog que la incruste) | Líneas grises con etiquetas "Máx"/"Mín"/"Prom", sin rojo ni verde; meta BanRep sigue verde punteada | FR-004a, SC-006 |
| 6 | Todos los gráficos con "Color por presidente" (ver inventario en `research.md` R3) | Cargan en color por defecto, interruptor apagado, leyenda oculta; al encender se colorea | FR-007, FR-008, SC-002 |
| 7 | Cualquier gráfico con `vistas` | Interruptor "Ver en barras" apagado; encendido = barras; mismo estilo que "Color por presidente" | FR-010–012, SC-003 |
| 8 | Teclado (Tab + Espacio) y VoiceOver | Foco visible; anuncia "Ver en barras, interruptor, desactivado/activado" | FR-013, SC-004 |
| 9 | Ancho 375 px | Los textos de los interruptores se ven; la cabecera envuelve sin desbordar | R2 |
| 10 | Salario mínimo · variación | Vista línea: no se ve "Color por presidente"; en barras aparece apagado; al volver a línea se apaga | Edge cases |

## Comprobaciones rápidas en código

```bash
grep -rn "Coloread" src/lib/observatorio/chart-defs src/pages/observatorio
```

No debe devolver textos que afirmen que el gráfico carga coloreado.

```bash
grep -rn "defaultOn\|bindPresidenteToggle\|chart-toggle__btn" src
```

Sin resultados.
