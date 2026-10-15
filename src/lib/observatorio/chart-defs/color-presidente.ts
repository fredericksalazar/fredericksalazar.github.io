/**
 * Interruptor "Color por presidente" para recetas de gráficos (ARQ-19: una sola
 * implementación). Redibuja con `ctx.render`, así respeta la vista Línea | Barras
 * que gestiona Chart.astro.
 */
import type { Presidente } from "../presidentes-client";
import type { ChartContext } from "./types";

/** HTML del interruptor; arranca siempre apagado. `oculto` = solo se muestra en vista de barras. */
export function presToggleHtml(prefix: string, oculto = false): string {
  return `
    <label class="pres-toggle" data-${prefix}-presidente-toggle${oculto ? ' style="display: none;"' : ""}>
      <span class="pres-toggle__label">Color por presidente</span>
      <input type="checkbox" class="pres-toggle__input" role="switch" aria-label="Color por presidente" />
      <span class="pres-toggle__switch" aria-hidden="true"><span class="pres-toggle__knob"></span></span>
    </label>
  `;
}

/** Leyenda de presidentes (oculta hasta activar el interruptor). */
export function presLeyendaHtml(prefix: string, presidentes: Presidente[]): string {
  return `
    <div class="pres-legend" data-${prefix}-presidente-legend data-visible="false" aria-label="Presidentes representados en el gráfico">
      ${presidentes.map((p) => `
        <span class="pres-chip">
          <span class="pres-chip__dot" style="background:${p.color}"></span>
          <span class="pres-chip__name">${p.nombre}</span>
          <span class="pres-chip__period">${new Date(p.inicio).getFullYear()}–${new Date(p.fin).getFullYear()}</span>
        </span>
      `).join("")}
    </div>
  `;
}

/**
 * Vincula el interruptor. Con `soloEnBarras`, se muestra únicamente en vista de
 * barras y se apaga al volver a línea.
 */
export function bindColorPresidente(opts: {
  target: HTMLElement;
  ctx: ChartContext;
  prefix: string;
  traza: (conPresidente: boolean) => Record<string, unknown>;
  soloEnBarras?: boolean;
}): void {
  const { target, ctx, prefix, traza, soloEnBarras = false } = opts;
  const root = target.closest<HTMLElement>("[data-chart-root]");
  const toggle = root?.querySelector<HTMLElement>(`[data-${prefix}-presidente-toggle]`);
  const input = toggle?.querySelector<HTMLInputElement>(".pres-toggle__input");
  if (!root || !toggle || !input || input.dataset.bound === "true") return;
  input.dataset.bound = "true";
  const legend = root.querySelector<HTMLElement>(`[data-${prefix}-presidente-legend]`);

  const aplicar = (conPresidente: boolean) => {
    input.checked = conPresidente;
    legend?.setAttribute("data-visible", conPresidente ? "true" : "false");
    ctx.render([traza(conPresidente)]);
  };
  input.addEventListener("change", () => aplicar(input.checked));

  if (soloEnBarras) {
    ctx.alCambiarVista((vista) => {
      toggle.style.display = vista === "barras" ? "" : "none";
      if (vista === "linea" && input.checked) aplicar(false);
    });
  }
}
