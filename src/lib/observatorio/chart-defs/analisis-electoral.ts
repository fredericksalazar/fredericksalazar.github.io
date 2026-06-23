import type { ChartDef } from "./types";
import { COLORS, baseLayout } from "../charts";
import type { PresEleccionData, PresCandidatosData, IdeologiaBloque } from "../types";

// Colores constantes para candidatos e ideologías
const ABELARDO_COLOR = "#2563eb"; // Azul (Derecha)
const CEPEDA_COLOR = "#dc2626"; // Rojo (Izquierda)
const CENTRO_COLOR = "#16a34a"; // Verde (Centro)

// ─────────────────────────────────────────────────────────────────────────────
// 1. Dinámica Geográfica de Desplazamiento Ideológico (2022 vs 2026)
// ─────────────────────────────────────────────────────────────────────────────
export const presComparativoDesplazamientoIdeologico: ChartDef = {
  id: "pres-comparativo-desplazamiento-ideologico",
  titulo: "Desplazamiento ideológico por departamento (1V 2022 vs 1V 2026)",
  pregunta: "¿Cómo cambió la participación (pp) de cada bloque ideológico entre 2022 y 2026?",
  fuenteTexto: "Registraduría Nacional del Estado Civil",
  datasets: ["pres-2026-1v", "pres-2022-1v", "pres-candidatos"],
  height: 600,
  ariaLabel: "Mapa coroplético interactivo mostrando el cambio en la participación de bloques ideológicos entre 2022 y 2026 por departamento",
  async build({ "pres-2026-1v": e26, "pres-2022-1v": e22 }) {
    if (!e26 || !e22) return { traces: [], layout: baseLayout() };
    const geojson = await fetch("/geo/colombia-departamentos.geo.json").then(r => r.json()).catch(() => null);
    if (!geojson || !geojson.features) return { traces: [], layout: baseLayout() };

    const m22 = new Map(e22.agregados.departamentos.map(d => [d.cod_depto, d]));

    const blocks: { id: IdeologiaBloque; label: string }[] = [
      { id: "derecha", label: "Derecha" },
      { id: "izquierda", label: "Izquierda" },
      { id: "centro", label: "Centro" }
    ];

    type ModeData = {
      locations: string[]; z: number[]; text: string[];
      colorscale: [number, string][]; zmin: number; zmax: number;
    };
    const computedData: Record<string, ModeData> = {};

    const colorscale: [number, string][] = [
      [0.0, "#7f1d1d"],   // Disminución fuerte (rojo oscuro)
      [0.3, "#ef4444"],   // Disminución media (rojo)
      [0.45, "#fee2e2"],  // Disminución leve (rojo claro)
      [0.5, "#f8fafc"],   // Sin cambio (blanco)
      [0.55, "#dbeafe"],  // Aumento leve (azul claro)
      [0.7, "#3b82f6"],   // Aumento medio (azul)
      [1.0, "#1e3a8a"]    // Aumento fuerte (azul oscuro)
    ];

    for (const b of blocks) {
      const locations: string[] = [];
      const z: number[] = [];
      const text: string[] = [];

      for (const d26 of e26.agregados.departamentos) {
        const d22 = m22.get(d26.cod_depto);
        if (!d22) continue;

        const val22 = d22.total_validos ?? 1;
        const val26 = d26.total_validos ?? 1;

        const v22 = d22.votos_por_ideologia[b.id] ?? 0;
        const v26 = d26.votos_por_ideologia[b.id] ?? 0;

        const share22 = (v22 / val22) * 100;
        const share26 = (v26 / val26) * 100;
        const diffPp = share26 - share22;

        locations.push(d26.cod_depto);
        z.push(diffPp);

        const sign = diffPp >= 0 ? "+" : "";
        text.push(
          `<b>${d26.nombre_depto}</b><br>` +
          `Δ Share ${b.label}: <b>${sign}${diffPp.toFixed(2)} pp</b><br>` +
          `1V 2022: ${share22.toFixed(1)}% (${new Intl.NumberFormat("es-CO").format(v22)} votos)<br>` +
          `1V 2026: ${share26.toFixed(1)}% (${new Intl.NumberFormat("es-CO").format(v26)} votos)`
        );
      }

      const maxAbs = Math.max(...z.map(v => Math.abs(v)), 1);

      computedData[b.id] = {
        locations,
        z,
        text,
        colorscale,
        zmin: -maxAbs,
        zmax: maxAbs
      };
    }

    const defData = computedData["derecha"];

    const headerHtml = `
      <div class="tendencia-selector-container">
        <div class="tendencia-tabs">
          ${blocks.map((b, i) =>
            `<button class="tendencia-tab${i === 0 ? " active" : ""}" data-block="${b.id}">${b.label}</button>`
          ).join("")}
        </div>
      </div>
      <script id="data-bloque-desplazamiento" type="application/json">${JSON.stringify(computedData)}</script>
    `;

    const footerHtml = `
      <div class="tendencia-map-footer">
        <span class="tendencia-map-info">* En azul, departamentos donde el bloque seleccionado aumentó su participación (pp). En rojo, departamentos donde disminuyó. El color representa la intensidad de la diferencia.</span>
      </div>
    `;

    return {
      traces: [{
        type: "choroplethmapbox",
        geojson,
        locations: defData.locations,
        z: defData.z,
        featureidkey: "properties.DPTO",
        colorscale: defData.colorscale,
        zmin: defData.zmin,
        zmax: defData.zmax,
        showscale: true,
        text: defData.text,
        hoverinfo: "text",
        colorbar: { title: "Δ Share (pp)", tickformat: "+.0f" },
        marker: { line: { width: 0.6, color: "rgba(15, 23, 42, 0.15)" } },
      }],
      layout: baseLayout({
        mapbox: { style: "white-bg", center: { lat: 4.5, lon: -73.0 }, zoom: 4.2 },
        margin: { l: 0, r: 0, t: 0, b: 0 },
        xaxis: { visible: false },
        yaxis: { visible: false },
      }),
      headerHtml,
      footerHtml,
    };
  },
};

// Delegación global para los tabs del mapa de desplazamiento ideológico.
if (typeof document !== "undefined") {
  document.addEventListener("click", (ev) => {
    const btn = (ev.target as HTMLElement | null)?.closest?.(
      ".tendencia-tab[data-block]"
    ) as HTMLButtonElement | null;
    if (!btn) return;
    const root = btn.closest<HTMLElement>("[data-chart-root]");
    if (!root) return;
    const target = root.querySelector<HTMLElement>(
      "#chart-pres-comparativo-desplazamiento-ideologico"
    );
    if (!target) return;
    const script = root.querySelector("#data-bloque-desplazamiento");
    if (!script || !(window as any).Plotly) return;
    let data: Record<string, any>;
    try { data = JSON.parse(script.textContent || "{}"); } catch { return; }
    const block = btn.dataset.block!;
    const d = data[block];
    if (!d) return;
    root.querySelectorAll(".tendencia-tab[data-block]").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    (window as any).Plotly.restyle(target, {
      z: [d.z],
      text: [d.text],
      colorscale: [d.colorscale],
      zmin: [d.zmin],
      zmax: [d.zmax],
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Análisis de Transferencia de Votos / Endosos (2026 1V -> 2V)
// ─────────────────────────────────────────────────────────────────────────────
export const pres2026_2vTransferenciaEndosos: ChartDef = {
  id: "pres-2026-2v-transferencia-endosos",
  titulo: "Composición Estimada del Caudal en Segunda Vuelta",
  pregunta: "¿De dónde provienen los votos finales de cada candidato?",
  fuenteTexto: "Estimación analítica a partir de datos de Registraduría",
  datasets: ["pres-2026-2v", "pres-2026-1v", "pres-candidatos"],
  height: 420,
  ariaLabel: "Gráfico de barras acumuladas horizontales mostrando la procedencia estimada de los votos de los dos candidatos",
  build({ "pres-2026-2v": e2, "pres-2026-1v": e1, "pres-candidatos": cat }) {
    if (!e1 || !e2 || !cat) return { traces: [], layout: baseLayout() };

    const candidates1v = cat.candidatos["2026-1v"];
    const findIdeo = (id: string) => candidates1v.find(c => c.id === id)?.ideologia ?? "centro";

    let baseAbe1v = 0;
    let baseCep1v = 0;
    let otrosDer1v = 0;
    let otrosIzq1v = 0;
    let centro1v = 0;

    for (const r of e1.resultados) {
      if (r.id === "abelardo_de_la_espriella") baseAbe1v = r.votos;
      else if (r.id === "ivan_cepeda") baseCep1v = r.votos;
      else {
        const ideo = findIdeo(r.id);
        if (ideo === "derecha") otrosDer1v += r.votos;
        else if (ideo === "izquierda") otrosIzq1v += r.votos;
        else centro1v += r.votos;
      }
    }

    const totalAbe2v = e2.resultados.find(r => r.id === "abelardo_de_la_espriella")?.votos ?? 1;
    const totalCep2v = e2.resultados.find(r => r.id === "ivan_cepeda")?.votos ?? 1;

    const cepEndosoIzq = otrosIzq1v * 0.90;
    const cepEndosoCentro = centro1v * 0.57;
    const cepNuevos = totalCep2v - (baseCep1v + cepEndosoIzq + cepEndosoCentro);

    const abeEndosoDer = otrosDer1v * 0.90;
    const abeEndosoCentro = centro1v * 0.43;
    const abeNuevos = totalAbe2v - (baseAbe1v + abeEndosoDer + abeEndosoCentro);

    const labels = ["Iván Cepeda (2V)", "Abelardo de la Espriella (2V)"];

    return {
      traces: [
        {
          y: labels,
          x: [baseCep1v, baseAbe1v],
          type: "bar",
          orientation: "h",
          name: "Votos Propios (1ª Vuelta)",
          marker: { color: "#6b7280" },
          hovertemplate: "%{x:,.0f} votos propios de 1V<extra></extra>"
        },
        {
          y: labels,
          x: [cepEndosoIzq, abeEndosoDer],
          type: "bar",
          orientation: "h",
          name: "Endosos Ideológicos Directos",
          marker: { color: "#374151" },
          hovertemplate: "%{x:,.0f} endosos del propio bloque<extra></extra>"
        },
        {
          y: labels,
          x: [cepEndosoCentro, abeEndosoCentro],
          type: "bar",
          orientation: "h",
          name: "Endosos del Centro",
          marker: { color: CENTRO_COLOR },
          hovertemplate: "%{x:,.0f} votos captados del Centro<extra></extra>"
        },
        {
          y: labels,
          x: [cepNuevos, abeNuevos],
          type: "bar",
          orientation: "h",
          name: "Movilización (Nuevos Votantes / Fugas)",
          marker: { color: "#eab308" },
          hovertemplate: "%{x:,.0f} votos nuevos de movilización<extra></extra>"
        }
      ],
      layout: baseLayout({
        barmode: "stack",
        xaxis: { title: "Votos Totales", tickformat: ",.0f" },
        yaxis: { type: "category", automargin: true },
        showlegend: true,
        legend: { orientation: "h", y: -0.25 },
        margin: { l: 150, r: 24, t: 20, b: 60 }
      })
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Análisis del Voto No Positivo / Descontento (2026 2V)
// ─────────────────────────────────────────────────────────────────────────────
export const pres2026_2vVotoNoPositivo: ChartDef = {
  id: "pres-2026-2v-voto-no-positivo",
  titulo: "Evolución de la Desafectación Electoral (1V vs 2V)",
  pregunta: "¿Cómo se comportó la abstención, nulos y no marcados entre vueltas?",
  fuenteTexto: "Registraduría Nacional del Estado Civil (preconteo)",
  datasets: ["pres-2026-2v", "pres-2026-1v"],
  height: 380,
  ariaLabel: "Barras agrupadas mostrando el peso de la abstención, votos nulos y no marcados sobre el censo electoral",
  build({ "pres-2026-2v": e2, "pres-2026-1v": e1 }) {
    if (!e1 || !e2) return { traces: [], layout: baseLayout() };

    const n1 = e1.agregados.nacional;
    const n2 = e2.agregados.nacional;

    const abs1 = n1.abstencion * 100;
    const nul1 = (n1.nulos / n1.censo) * 100;
    const nm1 = (n1.no_marcados / n1.censo) * 100;

    const abs2 = n2.abstencion * 100;
    const nul2 = (n2.nulos / n2.censo) * 100;
    const nm2 = (n2.no_marcados / n2.censo) * 100;

    const categories = ["Abstención Absoluta", "Votos Nulos", "Tarjetas No Marcadas"];

    return {
      traces: [
        {
          x: categories,
          y: [abs1, nul1, nm1],
          type: "bar",
          name: "1ª Vuelta",
          marker: { color: COLORS.border },
          text: [abs1, nul1, nm1].map(v => `${v.toFixed(2)}%`),
          textposition: "outside",
          hovertemplate: "1ª Vuelta: %{y:.3f}% del censo<extra></extra>"
        },
        {
          x: categories,
          y: [abs2, nul2, nm2],
          type: "bar",
          name: "2ª Vuelta (Balotaje)",
          marker: { color: "#475569" },
          text: [abs2, nul2, nm2].map(v => `${v.toFixed(2)}%`),
          textposition: "outside",
          hovertemplate: "2ª Vuelta: %{y:.3f}% del censo<extra></extra>"
        }
      ],
      layout: baseLayout({
        barmode: "group",
        xaxis: { type: "category" },
        yaxis: { title: "Porcentaje sobre el Censo (%)", ticksuffix: "%", tickformat: ".1f" },
        showlegend: true,
        legend: { orientation: "h", y: -0.18 },
        margin: { l: 50, r: 24, t: 20, b: 50 }
      })
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. ¿Dónde se ganó? — Cascada de aporte neto al margen nacional (2026 2V)
// ─────────────────────────────────────────────────────────────────────────────
export const pres2026_2vAporteNetoMargen: ChartDef = {
  id: "pres-2026-2v-aporte-neto-margen",
  titulo: "Dónde se ganó la elección: aporte neto de cada departamento al margen",
  pregunta: "¿Qué departamentos construyeron la ventaja final y cuáles la erosionaron?",
  fuenteTexto: "Registraduría Nacional del Estado Civil (preconteo)",
  datasets: ["pres-2026-2v"],
  height: 660,
  ariaLabel: "Gráfico de cascada que descompone el margen nacional de victoria en el aporte neto de votos de cada departamento, ordenado del más favorable a De la Espriella al más favorable a Cepeda",
  build({ "pres-2026-2v": e }) {
    if (!e) return { traces: [], layout: baseLayout() };

    const ABE = "abelardo_de_la_espriella";
    const CEP = "ivan_cepeda";
    const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(Math.round(n));
    const signo = (n: number) => (n >= 0 ? "+" : "−") + fmt(Math.abs(n));

    // Aporte neto por departamento = votos De la Espriella − votos Cepeda.
    const items = e.agregados.departamentos.map(d => ({
      nombre: d.nombre_depto,
      net: (d.votos_por_candidato[ABE] ?? 0) - (d.votos_por_candidato[CEP] ?? 0),
    }));

    // El desglose departamental (32 deptos + Bogotá) NO incluye el voto en el
    // exterior, que sí está en el resultado nacional. Lo reconstruimos como
    // (nacional − suma departamental) por candidato para que la cascada cierre
    // exactamente en el margen nacional y el voto consular quede explícito.
    const natAbe = e.resultados.find(r => r.id === ABE)?.votos ?? 0;
    const natCep = e.resultados.find(r => r.id === CEP)?.votos ?? 0;
    const sumDepAbe = items.reduce((s, _, i) => s + (e.agregados.departamentos[i].votos_por_candidato[ABE] ?? 0), 0);
    const sumDepCep = items.reduce((s, _, i) => s + (e.agregados.departamentos[i].votos_por_candidato[CEP] ?? 0), 0);
    const exteriorNet = (natAbe - sumDepAbe) - (natCep - sumDepCep);
    if (Math.round(exteriorNet) !== 0) {
      items.push({ nombre: "Exterior (consulados)", net: exteriorNet });
    }

    // Orden: del mayor aporte pro-De la Espriella al mayor aporte pro-Cepeda.
    items.sort((a, b) => b.net - a.net);

    // La suma de los aportes netos es exactamente el margen nacional (natAbe − natCep).
    const margen = items.reduce((s, it) => s + it.net, 0);

    let acumulado = 0;
    const running = items.map(it => (acumulado += it.net));

    const labels = [...items.map(it => it.nombre), "Margen final"];
    const values = [...items.map(it => it.net), margen];
    const measure = [...items.map(() => "relative"), "total"];

    const text = [...items.map(it => signo(it.net)), signo(margen)];

    const hovertext = [
      ...items.map((it, i) =>
        `<b>${it.nombre}</b><br>` +
        `Aporte neto: <b>${signo(it.net)}</b> votos (${it.net >= 0 ? "De la Espriella" : "Cepeda"})<br>` +
        `Margen acumulado: ${signo(running[i])}`
      ),
      `<b>Margen nacional final</b><br>De la Espriella +${fmt(margen)} votos`,
    ];

    return {
      traces: [{
        type: "waterfall",
        orientation: "h",
        y: labels,
        x: values,
        measure,
        text,
        textposition: "outside",
        textfont: { size: 10 },
        hovertext,
        hoverinfo: "text",
        connector: { line: { color: COLORS.border, width: 1 } },
        increasing: { marker: { color: ABELARDO_COLOR } },
        decreasing: { marker: { color: CEPEDA_COLOR } },
        totals: { marker: { color: "#475569" } },
      }],
      layout: baseLayout({
        waterfallgap: 0.3,
        xaxis: {
          title: "Votos netos (De la Espriella − Cepeda)",
          tickformat: ",.0f",
          zeroline: true,
          zerolinecolor: COLORS.border,
        },
        yaxis: { autorange: "reversed", automargin: true },
        margin: { l: 130, r: 70, t: 16, b: 50 },
        showlegend: false,
      }),
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. El retroceso de la izquierda — swing Petro (2022-2V) → Cepeda (2026-2V)
// ─────────────────────────────────────────────────────────────────────────────
export const pres2026_2vRetrocesoIzquierda: ChartDef = {
  id: "pres-2026-2v-retroceso-izquierda",
  titulo: "Realineamiento territorial por departamento (balotaje 2022 vs 2026)",
  pregunta: "¿Qué bloque ganó terreno en cada departamento desde la victoria de la izquierda en 2022?",
  fuenteTexto: "Registraduría Nacional del Estado Civil",
  datasets: ["pres-2026-2v", "pres-2022-2v"],
  height: 600,
  ariaLabel: "Mapa coroplético del realineamiento territorial entre los balotajes de 2022 y 2026: en azul los departamentos donde la derecha ganó terreno y en rojo donde lo ganó la izquierda, medido por el cambio de cuota de la izquierda sobre votos válidos",
  async build({ "pres-2026-2v": e26, "pres-2022-2v": e22 }) {
    if (!e26 || !e22) return { traces: [], layout: baseLayout() };
    const geojson = await fetch("/geo/colombia-departamentos.geo.json").then(r => r.json()).catch(() => null);
    if (!geojson || !geojson.features) return { traces: [], layout: baseLayout() };

    const CEP = "ivan_cepeda";
    const PETRO = "gustavo_petro";
    const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(n);
    const m22 = new Map(e22.agregados.departamentos.map(d => [d.cod_depto, d]));

    const locations: string[] = [];
    const z: number[] = [];
    const text: string[] = [];

    for (const d26 of e26.agregados.departamentos) {
      const d22 = m22.get(d26.cod_depto);
      if (!d22) continue;

      const val26 = d26.total_validos || 1;
      const val22 = d22.total_validos || 1;
      const cep = d26.votos_por_candidato[CEP] ?? 0;
      const pet = d22.votos_por_candidato[PETRO] ?? 0;

      const share26 = (cep / val26) * 100;
      const share22 = (pet / val22) * 100;
      const diff = share26 - share22;

      locations.push(d26.cod_depto);
      z.push(diff);

      // En un balotaje, validos = los dos candidatos, así que la cuota de la
      // derecha es el complemento exacto de la de la izquierda.
      const ganador = diff >= 0 ? "Izquierda" : "Derecha";
      text.push(
        `<b>${d26.nombre_depto}</b><br>` +
        `Ganó terreno: <b>${ganador} +${Math.abs(diff).toFixed(1)} pp</b><br>` +
        `Izquierda: ${share22.toFixed(1)}% (2022) → ${share26.toFixed(1)}% (2026)<br>` +
        `Derecha: ${(100 - share22).toFixed(1)}% (2022) → ${(100 - share26).toFixed(1)}% (2026)`
      );
    }

    const maxAbs = Math.max(...z.map(v => Math.abs(v)), 1);
    const tickMax = Math.floor(maxAbs);

    // Diverging centrado en 0 (blanco). Azul = la izquierda retrocedió (la
    // derecha ganó terreno); rojo = la izquierda avanzó. Coherente con la
    // convención del dashboard (De la Espriella azul, Cepeda rojo).
    const colorscale: [number, string][] = [
      [0.0, "#1e3a8a"],   // retroceso fuerte (azul oscuro)
      [0.3, "#3b82f6"],
      [0.46, "#dbeafe"],
      [0.5, "#f8fafc"],   // sin cambio
      [0.54, "#fee2e2"],
      [0.7, "#ef4444"],
      [1.0, "#7f1d1d"],   // avance fuerte (rojo oscuro)
    ];

    return {
      traces: [{
        type: "choroplethmapbox",
        geojson,
        locations,
        z,
        featureidkey: "properties.DPTO",
        colorscale,
        zmin: -maxAbs,
        zmax: maxAbs,
        showscale: true,
        text,
        hoverinfo: "text",
        colorbar: {
          title: { text: "Quién ganó terreno (pp)", side: "right" },
          tickmode: "array",
          tickvals: [-tickMax, 0, tickMax],
          ticktext: [`Derecha +${tickMax}`, "0", `Izquierda +${tickMax}`],
          ticks: "outside",
        },
        marker: { line: { width: 0.6, color: "rgba(15, 23, 42, 0.15)" } },
      }],
      layout: baseLayout({
        mapbox: { style: "white-bg", center: { lat: 4.5, lon: -73.0 }, zoom: 4.2 },
        margin: { l: 0, r: 0, t: 0, b: 0 },
        xaxis: { visible: false },
        yaxis: { visible: false },
      }),
      footerHtml: `
        <div class="tendencia-map-footer">
          <span class="tendencia-map-info">* La métrica es el cambio en la cuota de la izquierda sobre votos válidos (Cepeda 2026 − Petro 2022); en un balotaje la derecha es su complemento exacto. Azul: la derecha ganó terreno frente a 2022; rojo: la izquierda lo ganó. Los avances de la izquierda se concentran en la Orinoquía/Amazonía de baja población y no compensan su retroceso en el Caribe, el Pacífico y Bogotá.</span>
        </div>
      `,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. El voto en el exterior — diáspora vs electorado doméstico (2026 2V)
// ─────────────────────────────────────────────────────────────────────────────
export const pres2026_2vVotoExterior: ChartDef = {
  id: "pres-2026-2v-voto-exterior",
  titulo: "El peso del voto en el exterior (consulados)",
  pregunta: "¿Cómo votó la diáspora frente al electorado dentro del país?",
  fuenteTexto: "Registraduría Nacional del Estado Civil (preconteo)",
  datasets: ["pres-2026-2v"],
  height: 300,
  ariaLabel: "Barras apiladas al 100% comparando el reparto de votos entre De la Espriella y Cepeda dentro de Colombia, en el exterior y en el total nacional",
  build({ "pres-2026-2v": e }) {
    if (!e) return { traces: [], layout: baseLayout() };

    const ABE = "abelardo_de_la_espriella";
    const CEP = "ivan_cepeda";
    const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(Math.round(n));

    // El desglose departamental no incluye el exterior; lo reconstruimos como
    // (nacional − suma departamental). Ver [[pres-datasets-exterior-gap]].
    const sA = e.agregados.departamentos.reduce((s, d) => s + (d.votos_por_candidato[ABE] ?? 0), 0);
    const sC = e.agregados.departamentos.reduce((s, d) => s + (d.votos_por_candidato[CEP] ?? 0), 0);
    const nA = e.resultados.find(r => r.id === ABE)?.votos ?? 0;
    const nC = e.resultados.find(r => r.id === CEP)?.votos ?? 0;
    const eA = nA - sA, eC = nC - sC;

    const grupos = [
      { label: "Dentro de Colombia", a: sA, c: sC },
      { label: "Exterior (consulados)", a: eA, c: eC },
      { label: "Total nacional", a: nA, c: nC },
    ];

    const cats = grupos.map(g => g.label);
    const shA = grupos.map(g => (g.a / (g.a + g.c)) * 100);
    const shC = grupos.map(g => (g.c / (g.a + g.c)) * 100);

    return {
      traces: [
        {
          y: cats, x: shA, type: "bar", orientation: "h",
          name: "Abelardo de la Espriella", marker: { color: ABELARDO_COLOR },
          text: shA.map(v => `${v.toFixed(1)}%`), textposition: "inside", insidetextanchor: "middle",
          hovertext: grupos.map(g => `<b>${g.label}</b><br>De la Espriella: ${((g.a / (g.a + g.c)) * 100).toFixed(1)}% (${fmt(g.a)} votos)`),
          hoverinfo: "text",
        },
        {
          y: cats, x: shC, type: "bar", orientation: "h",
          name: "Iván Cepeda", marker: { color: CEPEDA_COLOR },
          text: shC.map(v => `${v.toFixed(1)}%`), textposition: "inside", insidetextanchor: "middle",
          hovertext: grupos.map(g => `<b>${g.label}</b><br>Cepeda: ${((g.c / (g.a + g.c)) * 100).toFixed(1)}% (${fmt(g.c)} votos)`),
          hoverinfo: "text",
        },
      ],
      layout: baseLayout({
        barmode: "stack",
        xaxis: { ticksuffix: "%", range: [0, 100], showgrid: false, zeroline: false },
        yaxis: { type: "category", automargin: true, autorange: "reversed" },
        showlegend: true,
        legend: { orientation: "h", y: -0.3 },
        margin: { l: 10, r: 16, t: 10, b: 40 },
      }),
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. Las dos Colombias — distribución del margen por departamento (2026 2V)
// ─────────────────────────────────────────────────────────────────────────────
export const pres2026_2vPolarizacionTerritorial: ChartDef = {
  id: "pres-2026-2v-polarizacion-territorial",
  titulo: "Las dos Colombias: distribución del margen por departamento",
  pregunta: "¿Fue un país dividido por la mitad o dos bloques territoriales que se cancelan?",
  fuenteTexto: "Registraduría Nacional del Estado Civil (preconteo)",
  datasets: ["pres-2026-2v"],
  height: 380,
  ariaLabel: "Histograma de la distribución del margen de victoria por departamento, separando los ganados por Cepeda de los ganados por De la Espriella",
  build({ "pres-2026-2v": e }) {
    if (!e) return { traces: [], layout: baseLayout() };

    const ABE = "abelardo_de_la_espriella";
    const CEP = "ivan_cepeda";

    // Margen con signo: positivo = De la Espriella, negativo = Cepeda (en pp).
    const margins = e.agregados.departamentos.map(d => {
      const a = d.votos_por_candidato[ABE] ?? 0;
      const c = d.votos_por_candidato[CEP] ?? 0;
      return (a - c) / (d.total_validos || 1) * 100;
    });
    const cepWon = margins.filter(m => m < 0);
    const abeWon = margins.filter(m => m >= 0);

    const xbins = { start: -70, end: 60, size: 10 };

    return {
      traces: [
        {
          type: "histogram", x: cepWon, name: "Ganó Cepeda",
          marker: { color: CEPEDA_COLOR, line: { color: "white", width: 1 } },
          xbins, hovertemplate: "Margen %{x} pp<br>%{y} departamentos<extra>Cepeda</extra>",
        },
        {
          type: "histogram", x: abeWon, name: "Ganó De la Espriella",
          marker: { color: ABELARDO_COLOR, line: { color: "white", width: 1 } },
          xbins, hovertemplate: "Margen %{x} pp<br>%{y} departamentos<extra>De la Espriella</extra>",
        },
      ],
      layout: baseLayout({
        barmode: "overlay",
        bargap: 0.04,
        xaxis: {
          title: "Margen del ganador en el departamento (pp) — ◄ Cepeda · De la Espriella ►",
          zeroline: true, zerolinecolor: COLORS.border, zerolinewidth: 2,
        },
        yaxis: { title: "N.º de departamentos", dtick: 1 },
        showlegend: true,
        legend: { orientation: "h", y: -0.28 },
        margin: { l: 50, r: 20, t: 16, b: 70 },
      }),
    };
  },
};
