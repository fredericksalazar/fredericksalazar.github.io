/**
 * kpi-lectura.ts — Controlador cliente de lectura sincronizada por fila para
 * el panel "Cómo va Colombia" (spec 008, R4 y contrato §3 y §5).
 *
 * Lógica pura de mapeo píxel ↔ periodo sin APIs internas de Plotly ni `fetch`
 * (REGLAS 8, 9 y 10), más registro idempotente compatible con View Transitions
 * y cambio de tema (ARQ-08).
 */
import { periodoToISODate } from "./charts";
import { lecturaEnPeriodo } from "./derivations";
import type { Periodicidad } from "./home";

export const REGRESO_TACTIL_MS = 2500;

export interface GeometriaGrafico {
  margen: { l: number; r: number; t: number; b: number };
  rangoX: [string, string];
  rangoY: [number, number];
  periodos: string[];
  serie: Map<string, number>;
  periodoVigente: string;
}

export interface RegistroLectura {
  id: string;
  destino: HTMLElement;
  fila: Periodicidad;
  geometria: GeometriaGrafico;
  formatear: {
    /** Valor para el encabezado `[data-kpi-valor]`. */
    valor: (v: number) => string;
    /** Valor con unidad completa para textos descriptivos y ARIA. */
    valorCompleto?: (v: number) => string;
    /** Periodo para `[data-kpi-periodo]`. */
    periodo: (p: string) => string;
    /** Periodo corto sin prefijo para textos descriptivos y ARIA. */
    periodoCorto?: (p: string) => string;
  };
}

/**
 * Traduce una coordenada horizontal `x` (en px respecto de la zona de lectura)
 * al periodo más cercano del eje compartido mediante interpolación lineal sobre
 * el área de dibujo (`ancho - l - r`). Función pura sin DOM.
 */
export function periodoEnX(
  geo: GeometriaGrafico,
  x: number,
  ancho = 300,
): string {
  if (geo.periodos.length === 0) return geo.periodoVigente;
  const plotW = Math.max(1, ancho - geo.margen.l - geo.margen.r);
  const frac = Math.min(1, Math.max(0, (x - geo.margen.l) / plotW));
  const t0 = Date.parse(geo.rangoX[0]);
  const t1 = Date.parse(geo.rangoX[1]);
  const targetMs = t0 + frac * (t1 - t0);

  let mejor = geo.periodos[0];
  let menorDist = Infinity;
  for (const p of geo.periodos) {
    const tp = Date.parse(periodoToISODate(p));
    const dist = Math.abs(tp - targetMs);
    if (dist < menorDist) {
      menorDist = dist;
      mejor = p;
    }
  }
  return mejor;
}

/**
 * Devuelve las coordenadas `{ x, y }` en px dentro de la zona de lectura para
 * un `periodo` y un `valor` dados (`y` es `null` si no hay dato). Función pura.
 */
export function posicionDe(
  geo: GeometriaGrafico,
  periodo: string,
  valor: number | null,
  ancho = 300,
  alto = 150,
): { x: number; y: number | null } {
  const plotW = Math.max(1, ancho - geo.margen.l - geo.margen.r);
  const plotH = Math.max(1, alto - geo.margen.t - geo.margen.b);
  const t0 = Date.parse(geo.rangoX[0]);
  const t1 = Date.parse(geo.rangoX[1]);
  const tp = Date.parse(periodoToISODate(periodo));
  const fracX = t1 !== t0 ? Math.min(1, Math.max(0, (tp - t0) / (t1 - t0))) : 0.5;
  const x = geo.margen.l + fracX * plotW;

  if (valor === null || !Number.isFinite(valor)) {
    return { x, y: null };
  }
  const [y0, y1] = geo.rangoY;
  const fracY = y1 !== y0 ? Math.min(1, Math.max(0, (valor - y0) / (y1 - y0))) : 0.5;
  const y = geo.margen.t + (1 - fracY) * plotH;
  return { x, y };
}

// ───────────────────── Estado y efectos en cliente ─────────────────────

interface SnapshotInicial {
  valorTexto: string;
  periodoTexto: string;
  periodoDatetime: string;
  contextoHtml: string;
}

interface ItemRegistrado {
  reg: RegistroLectura;
  card: HTMLElement;
  zona: HTMLElement;
  valorEl: HTMLElement | null;
  periodoEl: HTMLElement | null;
  contextoEl: HTMLElement | null;
  cursorEl: HTMLElement | null;
  lineaEl: HTMLElement | null;
  puntoEl: HTMLElement | null;
  tooltipEl: HTMLElement | null;
  tooltipLecturaEl: HTMLElement | null;
  tooltipPeriodoEl: HTMLElement | null;
  tooltipPuntoEl: HTMLElement | null;
  inicial: SnapshotInicial;
}

interface EstadoFila {
  indice: number | null;
  timerTactil: number | null;
  items: Map<string, ItemRegistrado>;
}

const filas = new Map<Periodicidad, EstadoFila>();

function obtenerEstadoFila(fila: Periodicidad): EstadoFila {
  let est = filas.get(fila);
  if (!est) {
    est = { indice: null, timerTactil: null, items: new Map() };
    filas.set(fila, est);
  }
  return est;
}

function limpiarTimerTactil(est: EstadoFila) {
  if (est.timerTactil !== null && typeof window !== "undefined") {
    window.clearTimeout(est.timerTactil);
    est.timerTactil = null;
  }
}

function periodosPropiosOrdenados(geo: GeometriaGrafico): string[] {
  return Array.from(geo.serie.keys()).sort();
}

function sincronizarAriaReposo(item: ItemRegistrado) {
  const { geo, fmt } = { geo: item.reg.geometria, fmt: item.reg.formatear };
  const propios = periodosPropiosOrdenados(geo);
  const maxIdx = Math.max(0, propios.length - 1);
  const valVigente = geo.serie.get(geo.periodoVigente);
  const fmtVal = fmt.valorCompleto ?? fmt.valor;
  const fmtPer = fmt.periodoCorto ?? fmt.periodo;
  item.zona.setAttribute("aria-valuemin", "0");
  item.zona.setAttribute("aria-valuemax", String(maxIdx));
  item.zona.setAttribute("aria-valuenow", String(maxIdx));
  if (valVigente !== undefined) {
    item.zona.setAttribute(
      "aria-valuetext",
      `${fmtPer(geo.periodoVigente)}: ${fmtVal(valVigente)}`,
    );
  }
}

function posicionarTooltipDebajo(
  tooltipEl: HTMLElement | null,
  posX: number,
  cursorY: number,
  ancho: number,
): void {
  if (!tooltipEl) return;
  const tipW = tooltipEl.offsetWidth || 156;
  const left = Math.min(Math.max(4, posX - tipW / 2), Math.max(4, ancho - tipW - 4));
  const top = Math.max(0, cursorY) + 14;
  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}

/**
 * Pasa la fila `fila` al estado `leyendo(indice)` o a `reposo` (`null`) y
 * actualiza las 4 tarjetas. Es idempotente cuando el periodo no cambia (salvo
 * actualizar la coordenada vertical bajo el puntero en la tarjeta activa).
 */
export function leer(
  fila: Periodicidad,
  indice: number | null,
  origen?: { id: string; x: number; y: number },
): void {
  const est = obtenerEstadoFila(fila);
  if (est.indice === indice) {
    if (indice !== null && origen) {
      const itemActivo = est.items.get(origen.id);
      if (itemActivo && itemActivo.tooltipEl) {
        const ancho = itemActivo.zona.clientWidth || 300;
        const alto = itemActivo.zona.clientHeight || 150;
        const geo = itemActivo.reg.geometria;
        const periodo = geo.periodos[indice];
        const pos = posicionDe(geo, periodo, geo.serie.get(periodo) ?? null, ancho, alto);
        posicionarTooltipDebajo(itemActivo.tooltipEl, pos.x, origen.y, ancho);
      }
    }
    return;
  }
  est.indice = indice;

  for (const item of est.items.values()) {
    const {
      reg,
      valorEl,
      periodoEl,
      contextoEl,
      cursorEl,
      lineaEl,
      puntoEl,
      tooltipEl,
      tooltipLecturaEl,
      tooltipPeriodoEl,
      tooltipPuntoEl,
      zona,
      inicial,
    } = item;
    const { geometria: geo, formatear: fmt } = reg;
    const fmtValCompleto = fmt.valorCompleto ?? fmt.valor;
    const fmtPerCorto = fmt.periodoCorto ?? fmt.periodo;

    if (indice === null || indice < 0 || indice >= geo.periodos.length) {
      if (valorEl) valorEl.textContent = inicial.valorTexto;
      if (periodoEl) {
        periodoEl.textContent = inicial.periodoTexto;
        if (inicial.periodoDatetime) periodoEl.setAttribute("datetime", inicial.periodoDatetime);
      }
      if (contextoEl) contextoEl.innerHTML = inicial.contextoHtml;
      if (cursorEl) cursorEl.hidden = true;
      sincronizarAriaReposo(item);
      continue;
    }

    const periodo = geo.periodos[indice];
    const propios = periodosPropiosOrdenados(geo);
    const primerPeriodo = propios[0] ?? geo.periodoVigente;
    const resultado = lecturaEnPeriodo(geo.serie, periodo, geo.periodoVigente, primerPeriodo);

    if (periodoEl) {
      periodoEl.textContent = fmt.periodo(periodo);
      periodoEl.setAttribute("datetime", periodo);
    }

    const valVigente = geo.serie.get(geo.periodoVigente);
    const textoVigente = valVigente !== undefined ? fmtValCompleto(valVigente) : inicial.valorTexto;
    const perVigenteTexto = fmtPerCorto(geo.periodoVigente);

    let valorNumerico: number | null = null;
    if (resultado.tipo === "vigente") {
      valorNumerico = resultado.valor;
      if (valorEl) valorEl.textContent = fmt.valor(resultado.valor);
      if (contextoEl) contextoEl.textContent = "Es el dato vigente";
    } else if (resultado.tipo === "dato") {
      valorNumerico = resultado.valor;
      if (valorEl) valorEl.textContent = fmt.valor(resultado.valor);
      if (contextoEl) contextoEl.textContent = `Dato vigente: ${textoVigente} · ${perVigenteTexto}`;
    } else if (resultado.tipo === "sin-publicar") {
      if (valorEl) valorEl.textContent = "—";
      if (contextoEl) contextoEl.textContent = "Aún sin dato publicado para esta fecha";
    } else {
      if (valorEl) valorEl.textContent = "—";
      if (contextoEl) contextoEl.textContent = "Fuera de la ventana de esta serie";
    }

    const ancho = zona.clientWidth || 300;
    const alto = zona.clientHeight || 150;
    const pos = posicionDe(geo, periodo, valorNumerico, ancho, alto);

    if (cursorEl && lineaEl) {
      cursorEl.hidden = false;
      lineaEl.style.left = `${pos.x}px`;
      lineaEl.style.top = `${geo.margen.t}px`;
      lineaEl.style.height = `${Math.max(0, alto - geo.margen.t - geo.margen.b)}px`;
    }
    if (puntoEl) {
      if (pos.y !== null) {
        puntoEl.hidden = false;
        puntoEl.style.left = `${pos.x}px`;
        puntoEl.style.top = `${pos.y}px`;
      } else {
        puntoEl.hidden = true;
      }
    }
    if (tooltipLecturaEl) {
      if (resultado.tipo === "vigente") {
        tooltipLecturaEl.hidden = true;
      } else {
        tooltipLecturaEl.hidden = false;
        if (tooltipPeriodoEl) tooltipPeriodoEl.textContent = fmtPerCorto(periodo);
        if (tooltipPuntoEl) {
          tooltipPuntoEl.textContent = valorNumerico !== null ? fmt.valor(valorNumerico) : "—";
        }
      }
    }
    if (tooltipEl) {
      const cursorY =
        origen && origen.id === reg.id
          ? origen.y
          : pos.y !== null
            ? pos.y
            : alto * 0.55;
      posicionarTooltipDebajo(tooltipEl, pos.x, cursorY, ancho);
    }

    const idxPropio = propios.indexOf(periodo);
    if (idxPropio >= 0) {
      zona.setAttribute("aria-valuenow", String(idxPropio));
    }
    const textoAriaValor = valorNumerico !== null ? fmtValCompleto(valorNumerico) : "sin dato";
    zona.setAttribute("aria-valuetext", `${fmtPerCorto(periodo)}: ${textoAriaValor}`);
  }
}

function engancharListenersZona(item: ItemRegistrado) {
  const { zona } = item;
  if (zona.dataset.lecturaBound === "true") return;
  zona.dataset.lecturaBound = "true";

  const leerDesdePuntero = (clientX: number, clientY: number) => {
    const actual = filas.get(item.reg.fila)?.items.get(item.reg.id);
    if (!actual) return;
    const rect = zona.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const periodo = periodoEnX(actual.reg.geometria, x, rect.width || zona.clientWidth || 300);
    const idx = actual.reg.geometria.periodos.indexOf(periodo);
    if (idx >= 0) {
      leer(actual.reg.fila, idx, { id: actual.reg.id, x, y });
    }
  };

  zona.addEventListener("pointerdown", (ev: PointerEvent) => {
    const est = obtenerEstadoFila(item.reg.fila);
    limpiarTimerTactil(est);
    leerDesdePuntero(ev.clientX, ev.clientY);
  });

  zona.addEventListener("pointermove", (ev: PointerEvent) => {
    const est = obtenerEstadoFila(item.reg.fila);
    limpiarTimerTactil(est);
    leerDesdePuntero(ev.clientX, ev.clientY);
  });

  zona.addEventListener("pointerleave", (ev: PointerEvent) => {
    if (ev.pointerType === "touch") return;
    const est = obtenerEstadoFila(item.reg.fila);
    limpiarTimerTactil(est);
    leer(item.reg.fila, null);
  });

  const programarRegresoTactil = (ev: PointerEvent) => {
    if (ev.pointerType !== "touch") return;
    const est = obtenerEstadoFila(item.reg.fila);
    limpiarTimerTactil(est);
    est.timerTactil = window.setTimeout(() => {
      est.timerTactil = null;
      leer(item.reg.fila, null);
    }, REGRESO_TACTIL_MS);
  };

  zona.addEventListener("pointerup", programarRegresoTactil);
  zona.addEventListener("pointercancel", programarRegresoTactil);

  zona.addEventListener("blur", () => {
    const est = obtenerEstadoFila(item.reg.fila);
    limpiarTimerTactil(est);
    leer(item.reg.fila, null);
  });

  zona.addEventListener("keydown", (ev: KeyboardEvent) => {
    const actual = filas.get(item.reg.fila)?.items.get(item.reg.id);
    if (!actual) return;
    const est = obtenerEstadoFila(actual.reg.fila);
    const geo = actual.reg.geometria;
    const propios = periodosPropiosOrdenados(geo);
    if (propios.length === 0) return;

    const periodoActual =
      est.indice !== null && geo.periodos[est.indice]
        ? geo.periodos[est.indice]
        : geo.periodoVigente;

    if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") {
      ev.preventDefault();
      limpiarTimerTactil(est);
      let candidato = propios[0];
      for (let i = propios.length - 1; i >= 0; i--) {
        if (propios[i] < periodoActual) {
          candidato = propios[i];
          break;
        }
      }
      const idxEje = geo.periodos.indexOf(candidato);
      if (idxEje >= 0) leer(actual.reg.fila, idxEje);
      return;
    }

    if (ev.key === "ArrowRight" || ev.key === "ArrowUp") {
      ev.preventDefault();
      limpiarTimerTactil(est);
      let candidato = propios[propios.length - 1];
      for (let i = 0; i < propios.length; i++) {
        if (propios[i] > periodoActual) {
          candidato = propios[i];
          break;
        }
      }
      const idxEje = geo.periodos.indexOf(candidato);
      if (idxEje >= 0) leer(actual.reg.fila, idxEje);
      return;
    }

    if (ev.key === "Home") {
      ev.preventDefault();
      limpiarTimerTactil(est);
      const idxEje = geo.periodos.indexOf(propios[0]);
      if (idxEje >= 0) leer(actual.reg.fila, idxEje);
      return;
    }

    if (ev.key === "End") {
      ev.preventDefault();
      limpiarTimerTactil(est);
      const idxEje = geo.periodos.indexOf(propios[propios.length - 1]);
      if (idxEje >= 0) leer(actual.reg.fila, idxEje);
      return;
    }

    if (ev.key === "Escape") {
      ev.preventDefault();
      limpiarTimerTactil(est);
      leer(actual.reg.fila, null);
    }
  });
}

/**
 * Registra o actualiza un gráfico `kpi-*` en su fila y engancha una sola vez
 * los listeners de su zona de lectura (`[data-kpi-lectura]`). Al re-renderizar
 * por cambio de tema, actualiza la geometría y devuelve la fila a `reposo`.
 */
export function registrarLectura(reg: RegistroLectura): void {
  const card = reg.destino.closest<HTMLElement>("[data-indicador]");
  if (!card) return;
  const zona = card.querySelector<HTMLElement>("[data-kpi-lectura]");
  if (!zona) return;

  const filaSection = card.closest<HTMLElement>("[data-fila-indicadores]");
  const pista = filaSection?.querySelector<HTMLElement>("[data-kpi-pista]");
  if (pista) pista.hidden = false;

  const est = obtenerEstadoFila(reg.fila);
  const previo = est.items.get(reg.id);

  // Si ya estaba registrado en el mismo nodo de tarjeta (re-render por cambio de tema),
  // restablecemos la fila a reposo antes de actualizar la geometría.
  if (previo && previo.card === card) {
    limpiarTimerTactil(est);
    leer(reg.fila, null);
    previo.reg = reg;
    sincronizarAriaReposo(previo);
    return;
  }

  const valorEl = card.querySelector<HTMLElement>("[data-kpi-valor]");
  const periodoEl = card.querySelector<HTMLElement>("[data-kpi-periodo]");
  const contextoEl = card.querySelector<HTMLElement>("[data-kpi-contexto]");
  const cursorEl = zona.querySelector<HTMLElement>("[data-kpi-cursor]");
  const lineaEl = zona.querySelector<HTMLElement>("[data-kpi-cursor-linea]");
  const puntoEl = zona.querySelector<HTMLElement>("[data-kpi-cursor-punto]");
  const tooltipEl = zona.querySelector<HTMLElement>("[data-kpi-tooltip]");
  const tooltipLecturaEl = zona.querySelector<HTMLElement>("[data-kpi-tooltip-lectura]");
  const tooltipPeriodoEl = zona.querySelector<HTMLElement>("[data-kpi-tooltip-periodo]");
  const tooltipPuntoEl = zona.querySelector<HTMLElement>("[data-kpi-tooltip-punto]");

  const inicial: SnapshotInicial = {
    valorTexto: valorEl?.textContent ?? "",
    periodoTexto: periodoEl?.textContent ?? "",
    periodoDatetime: periodoEl?.getAttribute("datetime") ?? "",
    contextoHtml: contextoEl?.innerHTML ?? "",
  };

  const item: ItemRegistrado = {
    reg,
    card,
    zona,
    valorEl,
    periodoEl,
    contextoEl,
    cursorEl,
    lineaEl,
    puntoEl,
    tooltipEl,
    tooltipLecturaEl,
    tooltipPeriodoEl,
    tooltipPuntoEl,
    inicial,
  };

  est.items.set(reg.id, item);
  sincronizarAriaReposo(item);
  engancharListenersZona(item);
}

type WindowConLectura = Window & { __kpiLecturaBound?: boolean };

export function initKpiLectura(): void {
  if (typeof window === "undefined") return;
  const w = window as WindowConLectura;
  if (!w.__kpiLecturaBound) {
    w.__kpiLecturaBound = true;
    document.addEventListener("astro:page-load", () => {
      for (const [ritmo, est] of filas.entries()) {
        limpiarTimerTactil(est);
        // Si las tarjetas cambiaron tras navegar con View Transitions, limpiar entradas huérfanas.
        for (const [id, item] of est.items.entries()) {
          if (!document.body.contains(item.card)) {
            est.items.delete(id);
          }
        }
        if (est.items.size > 0) {
          leer(ritmo, null);
        }
      }
    });
  }
}
