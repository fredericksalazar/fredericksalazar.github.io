import type { ChartDef } from "./types";
import { COLORS, baseLayout } from "../charts";
import type { IdeologiaBloque, PresEleccionData, PresCandidatosData } from "../types";
import { joinCandidatosIdeologia } from "../derivations-elecciones";

const ideoOrder: IdeologiaBloque[] = ["izquierda", "centro", "derecha"];
const ideoToColor = (id: IdeologiaBloque) => COLORS.ideologia[id] ?? COLORS.ideologia.centro;

// Paleta de colores distintos para candidatos (uno por persona)
const CAND_PALETTE = [
  "#dc2626", // rojo
  "#2563eb", // azul
  "#16a34a", // verde
  "#ea580c", // naranja
  "#7c3aed", // violeta
  "#0891b2", // cian
  "#b45309", // ámbar oscuro
  "#be185d", // rosa
  "#065f46", // verde oscuro
  "#1e40af", // azul oscuro
  "#d97706", // amarillo
  "#4338ca", // índigo
  "#0f766e", // teal
  "#a21caf", // fucsia
  "#92400e", // marrón
];

/**
 * Construye un colorscale discreto (step) para N colores.
 * z debe ser un entero en [0, N-1].
 */
function buildStepColorscale(colors: string[]): [number, string][] {
  const N = colors.length;
  if (N === 0) return [[0, "#aaa"], [1, "#aaa"]];
  if (N === 1) return [[0, colors[0]], [1, colors[0]]];
  const eps = 1e-4;
  const scale: [number, string][] = [];
  for (let i = 0; i < N; i++) {
    const lo = i / (N - 1);
    const hi = i < N - 1 ? (i + 1) / (N - 1) - eps : 1;
    scale.push([lo, colors[i]]);
    scale.push([hi, colors[i]]);
  }
  return scale;
}

// ─────────────────────────────────────────────────────────────────────────────
// Builders compartidos
// ─────────────────────────────────────────────────────────────────────────────

function buildComposicion(e: PresEleccionData) {
  const a = e.agregados.nacional;
  return {
    traces: [{
      type: "pie",
      hole: 0.6,
      labels: ["Válidos", "Nulos", "No marcados"],
      values: [a.validos, a.nulos, a.no_marcados],
      marker: { colors: [COLORS.brand, COLORS.textMuted, COLORS.border] },
      textinfo: "percent",
      hoverinfo: "label+value+percent",
    }],
    layout: baseLayout({
      showlegend: true,
      legend: { orientation: "h", y: -0.1 },
      margin: { l: 20, r: 20, t: 20, b: 40 },
    }),
  };
}

function buildVotosCandidato(e: PresEleccionData, candidatos: PresCandidatosData["candidatos"][keyof PresCandidatosData["candidatos"]]) {
  const sorted = [...e.resultados].sort((a, b) => b.votos - a.votos);
  const x = sorted.map(r => r.votos);
  const y = sorted.map(r => candidatos.find(c => c.id === r.id)?.nombre ?? r.id);
  const colors = sorted.map(r => ideoToColor(candidatos.find(c => c.id === r.id)?.ideologia ?? "centro"));
  return {
    traces: [{ type: "bar", orientation: "h", x, y, marker: { color: colors } }],
    layout: baseLayout({
      yaxis: { autorange: "reversed", tickfont: { size: 11, color: COLORS.textMuted }, automargin: true },
      xaxis: { tickformat: ",.0f" },
      margin: { l: 200, r: 24, t: 16, b: 40 },
    }),
  };
}

// Colores específicos para candidatos políticos clave (por consistencia e intuición política)
const CAND_COLORS: Record<string, string> = {
  gustavo_petro: "#dc2626",            // Rojo
  ivan_cepeda: "#dc2626",              // Rojo
  federico_gutierrez: "#2563eb",       // Azul
  abelardo_de_la_espriella: "#2563eb", // Azul
  rodolfo_hernandez: "#eab308",        // Amarillo
};

async function buildMapaDepto(e: PresEleccionData, candidatos: PresCandidatosData["candidatos"][keyof PresCandidatosData["candidatos"]]) {
  const geojson = await fetch("/geo/colombia-departamentos.geo.json").then(r => r.json()).catch(() => null);
  if (!geojson || !geojson.features) return { traces: [], layout: baseLayout() };

  const ganadorPorDepto = new Map(e.agregados.departamentos.map(d => [d.cod_depto, d]));
  const candidatoMap = new Map(candidatos.map(c => [c.id, c]));

  // Solo los candidatos que ganaron al menos un departamento, ordenados por votos (mayor primero)
  const ganadorIds = [...new Set(e.agregados.departamentos.map(d => d.ganador_id))];
  const ganadores = ganadorIds
    .map(id => ({
      id,
      nombre: candidatoMap.get(id)?.nombre ?? id,
      votos: e.resultados.find(r => r.id === id)?.votos ?? 0,
    }))
    .sort((a, b) => b.votos - a.votos);

  // Asignar índice y color a cada ganador
  const ganadorIndex = new Map(ganadores.map((g, i) => [g.id, i]));
  const palette = ganadores.map((g, i) => CAND_COLORS[g.id] ?? CAND_PALETTE[i % CAND_PALETTE.length]);

  const locations: string[] = [];
  const z: number[] = [];
  const text: string[] = [];

  for (const feat of geojson.features) {
    const cod = String(feat.properties.DPTO || feat.id);
    const agg = ganadorPorDepto.get(cod);
    if (!agg) continue;
    locations.push(cod);
    z.push(ganadorIndex.get(agg.ganador_id) ?? 0);
    const nombreGanador = candidatoMap.get(agg.ganador_id)?.nombre ?? agg.ganador_id;
    text.push(`<b>${agg.nombre_depto}</b><br>Ganador: ${nombreGanador}<br>Participación: ${(agg.participacion*100).toFixed(1)}%`);
  }

  const N = ganadores.length;
  const colorscaleCand = buildStepColorscale(palette);

  // Leyenda candidato → color
  const legendItems = ganadores
    .map((g, i) =>
      `<span class="cand-leg-item"><span class="cand-leg-dot" style="background:${palette[i]}"></span><span class="cand-leg-name">${g.nombre}</span></span>`
    )
    .join("");
  const footerHtml = `<div class="cand-legend">${legendItems}</div>`;

  return {
    traces: [{
      type: "choroplethmapbox",
      geojson,
      locations,
      z,
      featureidkey: "properties.DPTO",
      colorscale: colorscaleCand,
      zmin: 0,
      zmax: Math.max(N - 1, 1),
      showscale: false,
      text,
      hoverinfo: "text",
      marker: { line: { width: 0.5, color: "white" } },
    }],
    layout: baseLayout({
      mapbox: { style: "white-bg", center: { lat: 4.5, lon: -73.0 }, zoom: 4.2 },
      margin: { l: 0, r: 0, t: 0, b: 0 },
      xaxis: { visible: false },
      yaxis: { visible: false },
    }),
    footerHtml,
  };
}

function buildIdeologia(e: PresEleccionData, candidatos: PresCandidatosData["candidatos"][keyof PresCandidatosData["candidatos"]]) {
  const joined = joinCandidatosIdeologia(e.resultados, candidatos);
  const sum = joined.reduce((acc, c) => {
    acc[c.ideologia] = (acc[c.ideologia] || 0) + c.votos;
    return acc;
  }, {} as Record<string, number>);
  const labels = Object.keys(sum);
  return {
    traces: [{
      type: "pie",
      hole: 0.5,
      labels,
      values: labels.map(k => sum[k]),
      marker: { colors: labels.map(k => ideoToColor(k as IdeologiaBloque)) },
    }],
    layout: baseLayout(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2026 1ª vuelta
// ─────────────────────────────────────────────────────────────────────────────

export const pres2026ComposicionVotos: ChartDef = {
  id: "pres-2026-composicion-votos",
  titulo: "Composición de la votación — 2026 1ª vuelta",
  pregunta: "¿Qué proporción de los votos fueron válidos, nulos o no marcados?",
  fuenteTexto: "Registraduría Nacional del Estado Civil",
  datasets: ["pres-2026-1v"],
  height: 380,
  ariaLabel: "Composición de votos válidos, nulos y no marcados en 2026 1ª vuelta",
  build({ "pres-2026-1v": e }) {
    if (!e) return { traces: [], layout: baseLayout() };
    return buildComposicion(e);
  },
};

export const pres2026ParticipacionHistorico: ChartDef = {
  id: "pres-2026-participacion-historico",
  titulo: "Participación histórica 1ª vuelta",
  pregunta: "¿Cómo se compara la participación de 2026 frente a 2022?",
  fuenteTexto: "Registraduría Nacional del Estado Civil",
  datasets: ["pres-2026-1v", "pres-2022-1v"],
  height: 380,
  ariaLabel: "Gráfico de barras comparando la participación electoral entre 2022 y 2026",
  build({ "pres-2026-1v": e26, "pres-2022-1v": e22 }) {
    if (!e26 || !e22) return { traces: [], layout: baseLayout() };
    const p22 = e22.agregados.nacional.participacion * 100;
    const p26 = e26.agregados.nacional.participacion * 100;
    return {
      traces: [{
        type: "bar",
        x: ["2022", "2026"],
        y: [p22, p26],
        marker: { color: [COLORS.border, COLORS.brand] },
        text: [`${p22.toFixed(1)}%`, `${p26.toFixed(1)}%`],
        textposition: "auto",
      }],
      layout: baseLayout({
        yaxis: { title: "Participación (%)", range: [0, 100] },
      }),
    };
  },
};

export const pres2026VotosCandidato: ChartDef = {
  id: "pres-2026-votos-candidato",
  titulo: "Votos por candidato — 2026 1ª vuelta",
  pregunta: "¿Cómo se distribuyeron los votos válidos entre los candidatos?",
  fuenteTexto: "Registraduría Nacional del Estado Civil",
  datasets: ["pres-2026-1v", "pres-candidatos"],
  height: 480,
  ariaLabel: "Barras horizontales con votos por candidato presidencial Colombia 2026 primera vuelta",
  build({ "pres-2026-1v": e, "pres-candidatos": cat }) {
    if (!e || !cat) return { traces: [], layout: baseLayout() };
    return buildVotosCandidato(e, cat.candidatos["2026-1v"]);
  },
};

export const pres2026MapaDeptoGanador: ChartDef = {
  id: "pres-2026-mapa-depto-ganador",
  titulo: "Ganador por departamento — 2026 1ª vuelta",
  pregunta: "¿Quién ganó en cada departamento?",
  fuenteTexto: "Registraduría · GeoJSON departamentos",
  datasets: ["pres-2026-1v", "pres-candidatos"],
  height: 600,
  ariaLabel: "Mapa coroplético de Colombia con el bloque ideológico ganador por departamento en 2026",
  async build({ "pres-2026-1v": e, "pres-candidatos": cat }) {
    if (!e || !cat) return { traces: [], layout: baseLayout() };
    return await buildMapaDepto(e, cat.candidatos["2026-1v"]);
  },
};

export const presIdeologia2026: ChartDef = {
  id: "pres-ideologia-2026",
  titulo: "Bloques ideológicos — 2026",
  pregunta: "¿Cómo votó el país según espectro político?",
  fuenteTexto: "Cálculo propio sobre datos de Registraduría",
  datasets: ["pres-2026-1v", "pres-candidatos"],
  height: 360,
  ariaLabel: "Gráfico de dona mostrando votos por ideología en 2026",
  build({ "pres-2026-1v": e, "pres-candidatos": cat }) {
    if (!e || !cat) return { traces: [], layout: baseLayout() };
    return buildIdeologia(e, cat.candidatos["2026-1v"]);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2022 1ª vuelta
// ─────────────────────────────────────────────────────────────────────────────

export const pres2022_1vComposicionVotos: ChartDef = {
  id: "pres-2022-1v-composicion-votos",
  titulo: "Composición de la votación — 2022 1ª vuelta",
  pregunta: "¿Qué proporción de los votos fueron válidos, nulos o no marcados?",
  fuenteTexto: "Registraduría Nacional del Estado Civil",
  datasets: ["pres-2022-1v"],
  height: 380,
  ariaLabel: "Composición de votos válidos, nulos y no marcados en 2022 1ª vuelta",
  build({ "pres-2022-1v": e }) {
    if (!e) return { traces: [], layout: baseLayout() };
    return buildComposicion(e);
  },
};

export const pres2022_1vVotosCandidato: ChartDef = {
  id: "pres-2022-1v-votos-candidato",
  titulo: "Votos por candidato — 2022 1ª vuelta",
  pregunta: "¿Cómo se distribuyeron los votos válidos entre los candidatos?",
  fuenteTexto: "Registraduría Nacional del Estado Civil",
  datasets: ["pres-2022-1v", "pres-candidatos"],
  height: 420,
  ariaLabel: "Barras horizontales con votos por candidato en 2022 primera vuelta",
  build({ "pres-2022-1v": e, "pres-candidatos": cat }) {
    if (!e || !cat) return { traces: [], layout: baseLayout() };
    return buildVotosCandidato(e, cat.candidatos["2022-1v"]);
  },
};

export const pres2022_1vMapaDeptoGanador: ChartDef = {
  id: "pres-2022-1v-mapa-depto-ganador",
  titulo: "Ganador por departamento — 2022 1ª vuelta",
  pregunta: "¿Quién ganó en cada departamento?",
  fuenteTexto: "Registraduría · GeoJSON departamentos",
  datasets: ["pres-2022-1v", "pres-candidatos"],
  height: 600,
  ariaLabel: "Mapa coroplético con el bloque ideológico ganador por departamento en 2022 1ª vuelta",
  async build({ "pres-2022-1v": e, "pres-candidatos": cat }) {
    if (!e || !cat) return { traces: [], layout: baseLayout() };
    return await buildMapaDepto(e, cat.candidatos["2022-1v"]);
  },
};

export const presIdeologia2022: ChartDef = {
  id: "pres-ideologia-2022",
  titulo: "Bloques ideológicos — 2022",
  pregunta: "¿Cómo se distribuyeron los votos por bloque ideológico en 2022?",
  fuenteTexto: "Cálculo propio sobre datos de Registraduría",
  datasets: ["pres-2022-1v", "pres-candidatos"],
  height: 360,
  ariaLabel: "Gráfico de dona mostrando votos por ideología en 2022",
  build({ "pres-2022-1v": e, "pres-candidatos": cat }) {
    if (!e || !cat) return { traces: [], layout: baseLayout() };
    return buildIdeologia(e, cat.candidatos["2022-1v"]);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2022 2ª vuelta
// ─────────────────────────────────────────────────────────────────────────────

export const pres2022_2vComposicionVotos: ChartDef = {
  id: "pres-2022-2v-composicion-votos",
  titulo: "Composición de la votación — 2022 2ª vuelta",
  pregunta: "¿Qué proporción de los votos fueron válidos, nulos o no marcados?",
  fuenteTexto: "Registraduría Nacional del Estado Civil",
  datasets: ["pres-2022-2v"],
  height: 380,
  ariaLabel: "Composición de votos válidos, nulos y no marcados en 2022 2ª vuelta",
  build({ "pres-2022-2v": e }) {
    if (!e) return { traces: [], layout: baseLayout() };
    return buildComposicion(e);
  },
};

export const pres2022_2vVotosCandidato: ChartDef = {
  id: "pres-2022-2v-votos-candidato",
  titulo: "Votos por candidato — 2022 2ª vuelta",
  pregunta: "¿Cómo se distribuyó el balotaje?",
  fuenteTexto: "Registraduría Nacional del Estado Civil",
  datasets: ["pres-2022-2v", "pres-candidatos"],
  height: 320,
  ariaLabel: "Barras horizontales con votos del balotaje 2022",
  build({ "pres-2022-2v": e, "pres-candidatos": cat }) {
    if (!e || !cat) return { traces: [], layout: baseLayout() };
    return buildVotosCandidato(e, cat.candidatos["2022-2v"]);
  },
};

export const pres2022_2vMapaDeptoGanador: ChartDef = {
  id: "pres-2022-2v-mapa-depto-ganador",
  titulo: "Ganador por departamento — 2022 2ª vuelta",
  pregunta: "¿Cómo se reconfiguró el mapa en el balotaje?",
  fuenteTexto: "Registraduría · GeoJSON departamentos",
  datasets: ["pres-2022-2v", "pres-candidatos"],
  height: 600,
  ariaLabel: "Mapa coroplético con el bloque ideológico ganador por departamento en 2022 2ª vuelta",
  async build({ "pres-2022-2v": e, "pres-candidatos": cat }) {
    if (!e || !cat) return { traces: [], layout: baseLayout() };
    return await buildMapaDepto(e, cat.candidatos["2022-2v"]);
  },
};

export const pres2026MapaVariacionTendencia: ChartDef = {
  id: "pres-2026-mapa-variacion-tendencia",
  titulo: "Variación de votos por tendencia política (2022 vs 2026)",
  pregunta: "¿Cómo varió el apoyo a cada tendencia política por departamento?",
  fuenteTexto: "Registraduría · GeoJSON departamentos",
  datasets: ["pres-2026-1v", "pres-2022-1v"],
  height: 600,
  ariaLabel: "Mapa interactivo mostrando la variación del voto por tendencia política entre 2022 y 2026",
  async build({ "pres-2026-1v": e26, "pres-2022-1v": e22 }) {
    if (!e26 || !e22) return { traces: [], layout: baseLayout() };

    const geojson = await fetch("/geo/colombia-departamentos.geo.json").then(r => r.json()).catch(() => null);
    if (!geojson || !geojson.features) return { traces: [], layout: baseLayout() };

    const depto26Map = new Map(e26.agregados.departamentos.map(d => [d.cod_depto, d]));
    const depto22Map = new Map(e22.agregados.departamentos.map(d => [d.cod_depto, d]));

    const tendencies = ["izquierda", "centro", "derecha"] as const;
    const computedData: Record<string, {
      locations: string[];
      z: number[];
      text: string[];
      colorscale: [number, string][];
    }> = {};

    // Color scales for each tendency
    const colorScales = {
      izquierda: [
        [0, "#fee2e2"],
        [0.2, "#fca5a5"],
        [0.4, "#f87171"],
        [0.6, "#ef4444"],
        [0.8, "#dc2626"],
        [1, "#991b1b"],
      ] as [number, string][],
      centro: [
        [0, "#a7f3d0"], // Emerald-200 (mucho más visible)
        [0.2, "#6ee7b7"],
        [0.4, "#34d399"],
        [0.6, "#059669"],
        [0.8, "#047857"],
        [1, "#064e3b"],
      ] as [number, string][],
      derecha: [
        [0, "#dbeafe"],
        [0.2, "#bfdbfe"],
        [0.4, "#93c5fd"],
        [0.6, "#60a5fa"],
        [0.8, "#2563eb"],
        [1, "#1e3a8a"],
      ] as [number, string][],
    };

    for (const tend of tendencies) {
      const locations: string[] = [];
      const z: number[] = [];
      const text: string[] = [];

      for (const feat of geojson.features) {
        const cod = String(feat.properties.DPTO || feat.id);
        const agg26 = depto26Map.get(cod);
        const agg22 = depto22Map.get(cod);
        if (!agg26) continue;

        const v26 = agg26.votos_por_ideologia[tend] ?? 0;
        const v22 = agg22?.votos_por_ideologia[tend] ?? 0;
        const sh26 = v26 / (agg26.total_validos || 1);
        const sh22 = v22 / (agg22?.total_validos || 1);

        const deltaVotes = v26 - v22;
        const pctVar = v22 > 0 ? (deltaVotes / v22) * 100 : 0;
        const deltaPp = (sh26 - sh22) * 100;

        locations.push(cod);
        z.push(pctVar);

        const fmtM = (n: number) => new Intl.NumberFormat("es-CO").format(n);
        const sign = pctVar >= 0 ? "+" : "";
        const signPp = deltaPp >= 0 ? "+" : "";

        text.push(
          `<b>${agg26.nombre_depto}</b><br>` +
          `Votos 2026: <b>${fmtM(v26)}</b> (${(sh26*100).toFixed(1)}%)<br>` +
          `Votos 2022: ${fmtM(v22)} (${(sh22*100).toFixed(1)}%)<br>` +
          `Variación Votos: <b>${sign}${pctVar.toFixed(1)}%</b><br>` +
          `Variación Share: <b>${signPp}${deltaPp.toFixed(2)} pp</b>`
        );
      }

      computedData[tend] = {
        locations,
        z,
        text,
        colorscale: colorScales[tend],
      };
    }

    const defData = computedData["izquierda"];

    const headerHtml = `
      <div class="tendencia-selector-container">
        <div class="tendencia-tabs">
          <button class="tendencia-tab active" data-tendencia="izquierda">Izquierda</button>
          <button class="tendencia-tab" data-tendencia="centro">Centro</button>
          <button class="tendencia-tab" data-tendencia="derecha">Derecha</button>
        </div>
      </div>
      <script id="data-tendencias-2026" type="application/json">${JSON.stringify(computedData)}</script>
    `;

    const footerHtml = `
      <div class="tendencia-map-footer">
        <span class="tendencia-map-info">* El color representa el % de variación de votos respecto a 2022 (colores más oscuros indican mayor crecimiento).</span>
      </div>
    `;

    const onMount = (target: HTMLElement) => {
      const container = target.closest('[data-chart-root]');
      if (!container) return;

      const tabs = container.querySelectorAll('.tendencia-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          const tend = btn.dataset.tendencia as "izquierda" | "centro" | "derecha";

          tabs.forEach(t => t.classList.remove('active'));
          btn.classList.add('active');

          const script = container.querySelector('#data-tendencias-2026');
          if (!script || !window.Plotly) return;

          const data = JSON.parse(script.textContent || '{}');
          const tendData = data[tend];
          if (!tendData) return;

          window.Plotly.restyle(target, {
            z: [tendData.z],
            text: [tendData.text],
            colorscale: [tendData.colorscale],
            zmin: [Math.min(...tendData.z)],
            zmax: [Math.max(...tendData.z)],
          });
        });
      });
    };

    return {
      traces: [{
        type: "choroplethmapbox",
        geojson,
        locations: defData.locations,
        z: defData.z,
        featureidkey: "properties.DPTO",
        colorscale: defData.colorscale,
        zmin: Math.min(...defData.z),
        zmax: Math.max(...defData.z),
        showscale: true,
        text: defData.text,
        hoverinfo: "text",
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
      onMount,
    };
  }
};
