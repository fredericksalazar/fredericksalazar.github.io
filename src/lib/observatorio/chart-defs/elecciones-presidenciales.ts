import type { ChartDef } from "./types";
import { COLORS, baseLayout } from "../charts";
import type { IdeologiaBloque, PresEleccionData, PresCandidatosData } from "../types";
import { joinCandidatosIdeologia } from "../derivations-elecciones";
import { simular2026_2V } from "../simulacion-2026-2v";

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

// ─── 2022 2v: análisis 1V→2V ────────────────────────────────────────────────

export const pres2022_2vMovimientoNacional: ChartDef = {
  id: "pres-2022-2v-movimiento-nacional",
  titulo: "Cómo se movió el electorado entre 1ª y 2ª vuelta",
  pregunta: "¿Qué cambió a nivel nacional entre las dos vueltas?",
  fuenteTexto: "Registraduría Nacional del Estado Civil",
  datasets: ["pres-2022-2v", "pres-2022-1v"],
  height: 480,
  ariaLabel: "Barras agrupadas comparando censo, votos totales, válidos y abstención entre 1ª y 2ª vuelta 2022",
  build({ "pres-2022-2v": e2, "pres-2022-1v": e1 }) {
    if (!e1 || !e2) return { traces: [], layout: baseLayout() };
    const n1 = e1.agregados.nacional;
    const n2 = e2.agregados.nacional;
    const cats = ["Votos totales", "Válidos", "Nulos"];
    const y1 = [n1.total_votos, n1.validos, n1.nulos];
    const y2 = [n2.total_votos, n2.validos, n2.nulos];
    const fmt = (n: number) => new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 2 }).format(n);
    return {
      traces: [
        {
          type: "bar", name: "1ª vuelta", x: cats, y: y1,
          marker: { color: COLORS.border },
          text: y1.map(fmt), textposition: "outside",
          hovertemplate: "<b>%{x}</b><br>1ª vuelta: %{y:,.0f}<extra></extra>",
        },
        {
          type: "bar", name: "2ª vuelta", x: cats, y: y2,
          marker: { color: COLORS.brand },
          text: y2.map(fmt), textposition: "outside",
          hovertemplate: "<b>%{x}</b><br>2ª vuelta: %{y:,.0f}<extra></extra>",
        },
      ],
      layout: baseLayout({
        barmode: "group",
        showlegend: true,
        legend: { orientation: "h", y: -0.15 },
        xaxis: { type: "category" },
        yaxis: { type: "linear", tickformat: ".2s", automargin: true },
        margin: { l: 60, r: 20, t: 60, b: 60 },
      }),
      pregunta: `Participación: ${(n1.participacion*100).toFixed(1)}% → ${(n2.participacion*100).toFixed(1)}% · Abstención: ${(n1.abstencion*100).toFixed(1)}% → ${(n2.abstencion*100).toFixed(1)}% · Δ votos totales: ${fmt(n2.total_votos - n1.total_votos)}`,
    };
  },
};

export const pres2022_2vDeltaValidosDepto: ChartDef = {
  id: "pres-2022-2v-delta-validos-depto",
  titulo: "Δ Votos válidos por departamento (2V − 1V)",
  pregunta: "¿Dónde se activó más electorado entre vueltas?",
  fuenteTexto: "Registraduría Nacional del Estado Civil",
  datasets: ["pres-2022-2v", "pres-2022-1v"],
  height: 720,
  ariaLabel: "Barras horizontales con la variación de votos válidos por departamento entre 1ª y 2ª vuelta 2022",
  build({ "pres-2022-2v": e2, "pres-2022-1v": e1 }) {
    if (!e1 || !e2) return { traces: [], layout: baseLayout() };
    const m1 = new Map(e1.agregados.departamentos.map(d => [d.cod_depto, d]));
    const rows = e2.agregados.departamentos.map(d2 => {
      const d1 = m1.get(d2.cod_depto);
      const delta = d2.total_validos - (d1?.total_validos ?? 0);
      return { nombre: d2.nombre_depto, delta };
    }).sort((a, b) => a.delta - b.delta);
    return {
      traces: [{
        type: "bar", orientation: "h",
        x: rows.map(r => r.delta),
        y: rows.map(r => r.nombre),
        marker: { color: rows.map(r => r.delta >= 0 ? COLORS.brand : COLORS.textMuted) },
        text: rows.map(r => new Intl.NumberFormat("es-CO", { signDisplay: "always" }).format(r.delta)),
        textposition: "auto",
        hovertemplate: "<b>%{y}</b><br>Δ válidos: %{x:,.0f}<extra></extra>",
      }],
      layout: baseLayout({
        xaxis: { title: "Δ votos válidos (2V − 1V)", tickformat: ",.0f", zeroline: true, zerolinecolor: COLORS.textMuted },
        yaxis: { automargin: true, tickfont: { size: 10 } },
        margin: { l: 140, r: 60, t: 16, b: 50 },
      }),
    };
  },
};

export const pres2022_2vDeltaPetroDepto: ChartDef = {
  id: "pres-2022-2v-delta-petro-depto",
  titulo: "Δ Votos Petro por departamento (2V − 1V)",
  pregunta: "¿Qué departamentos le pusieron los votos adicionales a Petro?",
  fuenteTexto: "Registraduría Nacional del Estado Civil",
  datasets: ["pres-2022-2v", "pres-2022-1v"],
  height: 720,
  ariaLabel: "Barras horizontales con la variación de votos por Petro por departamento entre 1ª y 2ª vuelta 2022",
  build({ "pres-2022-2v": e2, "pres-2022-1v": e1 }) {
    if (!e1 || !e2) return { traces: [], layout: baseLayout() };
    const m1 = new Map(e1.agregados.departamentos.map(d => [d.cod_depto, d]));
    const rows = e2.agregados.departamentos.map(d2 => {
      const d1 = m1.get(d2.cod_depto);
      const p2 = d2.votos_por_candidato["gustavo_petro"] ?? 0;
      const p1 = d1?.votos_por_candidato["gustavo_petro"] ?? 0;
      const delta = p2 - p1;
      const base = p1 || 1;
      const pct = ((p2 - p1) / base) * 100;
      return { nombre: d2.nombre_depto, delta, pct, p1, p2 };
    }).sort((a, b) => a.delta - b.delta);

    const totalDelta = rows.reduce((acc, r) => acc + r.delta, 0);

    return {
      traces: [{
        type: "bar", orientation: "h",
        x: rows.map(r => r.delta),
        y: rows.map(r => r.nombre),
        marker: { color: rows.map(r => r.delta >= 0 ? "#dc2626" : "#94a3b8") },
        text: rows.map(r => new Intl.NumberFormat("es-CO", { signDisplay: "always" }).format(r.delta)),
        textposition: "auto",
        customdata: rows.map(r => [r.p1, r.p2, r.pct]),
        hovertemplate: "<b>%{y}</b><br>1V: %{customdata[0]:,.0f}<br>2V: %{customdata[1]:,.0f}<br>Δ: %{x:,.0f} (%{customdata[2]:.1f}%)<extra></extra>",
      }],
      layout: baseLayout({
        xaxis: { title: "Δ votos Petro (2V − 1V)", tickformat: ",.0f", zeroline: true, zerolinecolor: COLORS.textMuted },
        yaxis: { automargin: true, tickfont: { size: 10 } },
        margin: { l: 140, r: 60, t: 16, b: 50 },
      }),
      pregunta: `Petro sumó ${new Intl.NumberFormat("es-CO", { signDisplay: "always" }).format(totalDelta)} votos entre las dos vueltas. Los departamentos en rojo son los que aportaron ese crecimiento.`,
    };
  },
};

export const pres2022_2vConsolidacionAntiPetro: ChartDef = {
  id: "pres-2022-2v-consolidacion-antipetro",
  titulo: "Consolidación del voto anti-Petro por departamento",
  pregunta: "¿Heredó Hernández el voto de derecha y centro de la 1ª vuelta?",
  fuenteTexto: "Cálculo propio sobre datos de Registraduría",
  datasets: ["pres-2022-2v", "pres-2022-1v"],
  height: 720,
  ariaLabel: "Comparación por departamento entre voto de derecha y centro en 1V y voto por Hernández en 2V",
  build({ "pres-2022-2v": e2, "pres-2022-1v": e1 }) {
    if (!e1 || !e2) return { traces: [], layout: baseLayout() };
    const m2 = new Map(e2.agregados.departamentos.map(d => [d.cod_depto, d]));
    const rows = e1.agregados.departamentos.map(d1 => {
      const d2 = m2.get(d1.cod_depto);
      const antiPetro1v = (d1.votos_por_ideologia.derecha ?? 0) + (d1.votos_por_ideologia.centro ?? 0);
      const hernandez2v = d2?.votos_por_candidato["rodolfo_hernandez"] ?? 0;
      return { nombre: d1.nombre_depto, antiPetro1v, hernandez2v };
    }).sort((a, b) => b.antiPetro1v - a.antiPetro1v);

    return {
      traces: [
        {
          type: "bar", orientation: "h", name: "Derecha + Centro (1V)",
          x: rows.map(r => r.antiPetro1v),
          y: rows.map(r => r.nombre),
          marker: { color: COLORS.border },
          hovertemplate: "<b>%{y}</b><br>Derecha+Centro 1V: %{x:,.0f}<extra></extra>",
        },
        {
          type: "bar", orientation: "h", name: "Hernández (2V)",
          x: rows.map(r => r.hernandez2v),
          y: rows.map(r => r.nombre),
          marker: { color: "#eab308" },
          hovertemplate: "<b>%{y}</b><br>Hernández 2V: %{x:,.0f}<extra></extra>",
        },
      ],
      layout: baseLayout({
        barmode: "group",
        showlegend: true,
        legend: { orientation: "h", y: -0.08 },
        xaxis: { tickformat: ",.0f" },
        yaxis: { autorange: "reversed", automargin: true, tickfont: { size: 10 } },
        margin: { l: 140, r: 30, t: 16, b: 60 },
      }),
    };
  },
};

export const pres2022_2vMapaVariacionCandidato: ChartDef = {
  id: "pres-2022-2v-mapa-variacion-candidato",
  titulo: "Variación de votos por candidato y departamento (1V → 2V)",
  pregunta: "¿Dónde creció más cada candidato entre vueltas?",
  fuenteTexto: "Registraduría · GeoJSON departamentos",
  datasets: ["pres-2022-2v", "pres-2022-1v"],
  height: 640,
  ariaLabel: "Mapa interactivo de Colombia con selector por candidato (Petro o Hernández) mostrando la variación de votos por departamento entre 1ª y 2ª vuelta 2022",
  async build({ "pres-2022-2v": e2, "pres-2022-1v": e1 }) {
    if (!e1 || !e2) return { traces: [], layout: baseLayout() };

    const geojson = await fetch("/geo/colombia-departamentos.geo.json").then(r => r.json()).catch(() => null);
    if (!geojson || !geojson.features) return { traces: [], layout: baseLayout() };

    const m1 = new Map(e1.agregados.departamentos.map(d => [d.cod_depto, d]));
    const m2 = new Map(e2.agregados.departamentos.map(d => [d.cod_depto, d]));

    const candColors: Record<string, string> = {
      gustavo_petro: "#dc2626",
      rodolfo_hernandez: "#eab308",
    };
    const candNames: Record<string, string> = {
      gustavo_petro: "Gustavo Petro",
      rodolfo_hernandez: "Rodolfo Hernández",
    };

    const modes = [
      { id: "gustavo_petro", label: "Petro", kind: "variacion" as const,
        colorscale: [
          [0, "#fee2e2"], [0.2, "#fca5a5"], [0.4, "#f87171"],
          [0.6, "#ef4444"], [0.8, "#dc2626"], [1, "#7f1d1d"],
        ] as [number, string][],
      },
      { id: "rodolfo_hernandez", label: "Hernández", kind: "variacion" as const,
        colorscale: [
          [0, "#fef9c3"], [0.2, "#fde68a"], [0.4, "#fcd34d"],
          [0.6, "#f59e0b"], [0.8, "#d97706"], [1, "#78350f"],
        ] as [number, string][],
      },
      { id: "ganador", label: "Ganador", kind: "ganador" as const,
        colorscale: [
          [0, candColors.gustavo_petro], [0.4999, candColors.gustavo_petro],
          [0.5, candColors.rodolfo_hernandez], [1, candColors.rodolfo_hernandez],
        ] as [number, string][],
      },
    ];

    type ModeData = {
      locations: string[]; z: number[]; text: string[];
      colorscale: [number, string][]; zmin: number; zmax: number;
      showscale: boolean; colorbar: Record<string, unknown> | null;
    };
    const computedData: Record<string, ModeData> = {};

    const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(n);

    for (const mode of modes) {
      const locations: string[] = [];
      const z: number[] = [];
      const text: string[] = [];

      for (const feat of geojson.features) {
        const cod = String(feat.properties.DPTO || feat.id);
        const d2 = m2.get(cod);
        const d1 = m1.get(cod);
        if (!d2) continue;
        locations.push(cod);

        if (mode.kind === "variacion") {
          const candId = mode.id;
          const v2 = d2.votos_por_candidato[candId] ?? 0;
          const v1 = d1?.votos_por_candidato[candId] ?? 0;
          const delta = v2 - v1;
          const pct = v1 > 0 ? (delta / v1) * 100 : 0;
          z.push(delta);
          const sD = delta >= 0 ? "+" : "";
          const sP = pct >= 0 ? "+" : "";
          text.push(
            `<b>${d2.nombre_depto}</b><br>` +
            `1ª vuelta: ${fmt(v1)} votos<br>` +
            `2ª vuelta: <b>${fmt(v2)}</b> votos<br>` +
            `Δ: <b>${sD}${fmt(delta)}</b> (${sP}${pct.toFixed(1)}%)`
          );
        } else {
          const ganadorId = d2.ganador_id;
          const idx = ganadorId === "gustavo_petro" ? 0 : 1;
          z.push(idx);
          const vPetro = d2.votos_por_candidato.gustavo_petro ?? 0;
          const vHern = d2.votos_por_candidato.rodolfo_hernandez ?? 0;
          text.push(
            `<b>${d2.nombre_depto}</b><br>` +
            `Ganador: <b>${candNames[ganadorId] ?? ganadorId}</b><br>` +
            `Petro: ${fmt(vPetro)} votos<br>` +
            `Hernández: ${fmt(vHern)} votos`
          );
        }
      }

      const zmin = mode.kind === "variacion" ? Math.min(...z) : 0;
      const zmax = mode.kind === "variacion" ? Math.max(...z) : 1;
      computedData[mode.id] = {
        locations, z, text,
        colorscale: mode.colorscale,
        zmin, zmax,
        showscale: mode.kind === "variacion",
        colorbar: mode.kind === "variacion" ? { title: "Δ votos", tickformat: ",.0f" } : null,
      };
    }

    const defData = computedData["gustavo_petro"];

    const headerHtml = `
      <div class="tendencia-selector-container">
        <div class="tendencia-tabs">
          ${modes.map((m, i) =>
            `<button class="tendencia-tab${i === 0 ? " active" : ""}" data-cand="${m.id}">${m.label}</button>`
          ).join("")}
        </div>
      </div>
      <script id="data-cand-2022-2v" type="application/json">${JSON.stringify(computedData)}</script>
    `;

    const footerHtml = `
      <div class="tendencia-map-footer">
        <span class="tendencia-map-info">* «Petro» y «Hernández»: el color representa el Δ absoluto de votos entre 1V y 2V (más oscuro = mayor crecimiento). «Ganador»: color del candidato que ganó cada departamento.</span>
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
        showscale: defData.showscale,
        text: defData.text,
        hoverinfo: "text",
        colorbar: defData.colorbar ?? {},
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

// Delegación global para los tabs del mapa de variación por candidato 2022 2V.
// Se hace a nivel document porque algunos charts (mapbox) no resuelven el await
// de Plotly.newPlot y por tanto el hook onMount no se invoca.
if (typeof document !== "undefined") {
  document.addEventListener("click", (ev) => {
    const btn = (ev.target as HTMLElement | null)?.closest?.(
      ".tendencia-tab[data-cand]"
    ) as HTMLButtonElement | null;
    if (!btn) return;
    const root = btn.closest<HTMLElement>("[data-chart-root]");
    if (!root) return;
    const target = root.querySelector<HTMLElement>(
      "#chart-pres-2022-2v-mapa-variacion-candidato"
    );
    if (!target) return;
    const script = root.querySelector("#data-cand-2022-2v");
    if (!script || !(window as any).Plotly) return;
    let data: Record<string, any>;
    try { data = JSON.parse(script.textContent || "{}"); } catch { return; }
    const cand = btn.dataset.cand!;
    const d = data[cand];
    if (!d) return;
    root.querySelectorAll(".tendencia-tab[data-cand]").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    (window as any).Plotly.restyle(target, {
      z: [d.z],
      text: [d.text],
      colorscale: [d.colorscale],
      zmin: [d.zmin],
      zmax: [d.zmax],
      showscale: [d.showscale],
    });
  });
}

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

    // Escala única por bloque: 3 tonos (claro → medio → oscuro) coherentes con
    // el color identitario de cada tendencia. Más oscuro = mayor crecimiento.
    const colorScales = {
      izquierda: [
        [0, "#fee2e2"],
        [0.5, "#ef4444"],
        [1, "#7f1d1d"],
      ] as [number, string][],
      centro: [
        [0, "#d1fae5"],
        [0.5, "#10b981"],
        [1, "#064e3b"],
      ] as [number, string][],
      derecha: [
        [0, "#dbeafe"],
        [0.5, "#2563eb"],
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

// ─────────────────────────────────────────────────────────────────────────────
// Pronóstico 2026 2ª vuelta — basado en simulación modelada con datos 2022
// ─────────────────────────────────────────────────────────────────────────────

const CEPEDA_COLOR = "#dc2626";
const ABELARDO_COLOR = "#2563eb";

export const pres2026_2vPronosticoComposicion: ChartDef = {
  id: "pres-2026-2v-pronostico-composicion",
  titulo: "Pronóstico 2V 2026 — composición nacional proyectada",
  pregunta: "¿Cómo se reparten los votos proyectados a nivel nacional?",
  fuenteTexto: "Simulación propia · datos Registraduría 2022 + 2026 1V",
  datasets: ["pres-2026-1v", "pres-2022-1v", "pres-2022-2v", "pres-candidatos"],
  height: 380,
  ariaLabel: "Gráfico de dona con el pronóstico de votación nacional para la segunda vuelta presidencial 2026",
  build({ "pres-2026-1v": e26, "pres-2022-1v": e22_1v, "pres-2022-2v": e22_2v, "pres-candidatos": cat }) {
    if (!e26 || !e22_1v || !e22_2v || !cat) return { traces: [], layout: baseLayout() };
    const sim = simular2026_2V(e26, e22_1v, e22_2v, cat);
    const total = sim.nacional.cepeda + sim.nacional.abelardo;
    const sharCep = (sim.nacional.cepeda / total) * 100;
    const sharAbe = (sim.nacional.abelardo / total) * 100;
    return {
      traces: [{
        type: "pie",
        hole: 0.55,
        labels: ["Iván Cepeda", "Abelardo de la Espriella"],
        values: [sim.nacional.cepeda, sim.nacional.abelardo],
        marker: { colors: [CEPEDA_COLOR, ABELARDO_COLOR] },
        textinfo: "label+percent",
        hovertemplate: "<b>%{label}</b><br>%{value:,.0f} votos (%{percent})<extra></extra>",
      }],
      layout: baseLayout({
        showlegend: false,
        margin: { l: 20, r: 20, t: 20, b: 20 },
      }),
      pregunta: `Ganador proyectado: ${sim.nacional.ganador === "cepeda" ? "Iván Cepeda" : "Abelardo de la Espriella"} · margen ${Math.abs(sim.nacional.margenPp).toFixed(2)} pp (${new Intl.NumberFormat("es-CO", { signDisplay: "always" }).format(sim.nacional.margenAbs)} votos)`,
    };
  },
};

export const pres2026_2vPronosticoMargenDepto: ChartDef = {
  id: "pres-2026-2v-pronostico-margen-depto",
  titulo: "Pronóstico 2V 2026 — margen por departamento (Cepeda − Abelardo)",
  pregunta: "¿En qué departamentos se decide la elección?",
  fuenteTexto: "Simulación propia",
  datasets: ["pres-2026-1v", "pres-2022-1v", "pres-2022-2v", "pres-candidatos"],
  height: 720,
  ariaLabel: "Barras horizontales con el margen proyectado por departamento en la segunda vuelta 2026",
  build({ "pres-2026-1v": e26, "pres-2022-1v": e22_1v, "pres-2022-2v": e22_2v, "pres-candidatos": cat }) {
    if (!e26 || !e22_1v || !e22_2v || !cat) return { traces: [], layout: baseLayout() };
    const sim = simular2026_2V(e26, e22_1v, e22_2v, cat);
    const rows = [...sim.departamentos].sort((a, b) => a.margen - b.margen);
    return {
      traces: [{
        type: "bar",
        orientation: "h",
        x: rows.map(r => r.margen),
        y: rows.map(r => r.nombre),
        marker: { color: rows.map(r => r.ganador === "cepeda" ? CEPEDA_COLOR : ABELARDO_COLOR) },
        text: rows.map(r => new Intl.NumberFormat("es-CO", { signDisplay: "always" }).format(r.margen)),
        textposition: "auto",
        customdata: rows.map(r => [r.cepedaProj, r.abelardoProj]),
        hovertemplate: "<b>%{y}</b><br>Cepeda: %{customdata[0]:,.0f}<br>Abelardo: %{customdata[1]:,.0f}<br>Margen: %{x:,.0f}<extra></extra>",
      }],
      layout: baseLayout({
        xaxis: { title: "Margen proyectado (Cepeda − Abelardo)", tickformat: ",.0f", zeroline: true, zerolinecolor: COLORS.textMuted },
        yaxis: { automargin: true, tickfont: { size: 10 } },
        margin: { l: 140, r: 60, t: 16, b: 50 },
      }),
    };
  },
};

export const pres2026_2vPronosticoMapaGanador: ChartDef = {
  id: "pres-2026-2v-pronostico-mapa-ganador",
  titulo: "Pronóstico 2V 2026 — ganador proyectado por departamento",
  pregunta: "¿Cómo se ve el mapa en el balotaje proyectado?",
  fuenteTexto: "Simulación propia · GeoJSON departamentos",
  datasets: ["pres-2026-1v", "pres-2022-1v", "pres-2022-2v", "pres-candidatos"],
  height: 600,
  ariaLabel: "Mapa de Colombia con el ganador proyectado por departamento en la segunda vuelta 2026",
  async build({ "pres-2026-1v": e26, "pres-2022-1v": e22_1v, "pres-2022-2v": e22_2v, "pres-candidatos": cat }) {
    if (!e26 || !e22_1v || !e22_2v || !cat) return { traces: [], layout: baseLayout() };
    const sim = simular2026_2V(e26, e22_1v, e22_2v, cat);
    const geojson = await fetch("/geo/colombia-departamentos.geo.json").then(r => r.json()).catch(() => null);
    if (!geojson || !geojson.features) return { traces: [], layout: baseLayout() };

    const byCod = new Map(sim.departamentos.map(d => [d.cod, d]));
    const locations: string[] = [];
    const z: number[] = [];
    const text: string[] = [];
    const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(n);
    for (const feat of geojson.features) {
      const cod = String(feat.properties.DPTO || feat.id);
      const d = byCod.get(cod);
      if (!d) continue;
      locations.push(cod);
      z.push(d.ganador === "cepeda" ? 0 : 1);
      const winner = d.ganador === "cepeda" ? "Iván Cepeda" : "Abelardo de la Espriella";
      text.push(
        `<b>${d.nombre}</b><br>` +
        `Ganador proyectado: <b>${winner}</b><br>` +
        `Cepeda: ${fmt(d.cepedaProj)} · Abelardo: ${fmt(d.abelardoProj)}<br>` +
        `Margen: ${new Intl.NumberFormat("es-CO", { signDisplay: "always" }).format(d.margen)}`
      );
    }
    return {
      traces: [{
        type: "choroplethmapbox",
        geojson,
        locations, z, text,
        featureidkey: "properties.DPTO",
        colorscale: [[0, CEPEDA_COLOR], [0.4999, CEPEDA_COLOR], [0.5, ABELARDO_COLOR], [1, ABELARDO_COLOR]],
        zmin: 0, zmax: 1, showscale: false,
        hoverinfo: "text",
        marker: { line: { width: 0.5, color: "white" } },
      }],
      layout: baseLayout({
        mapbox: { style: "white-bg", center: { lat: 4.5, lon: -73.0 }, zoom: 4.2 },
        margin: { l: 0, r: 0, t: 0, b: 0 },
        xaxis: { visible: false },
        yaxis: { visible: false },
      }),
      footerHtml: `<div class="cand-legend"><span class="cand-leg-item"><span class="cand-leg-dot" style="background:${CEPEDA_COLOR}"></span><span class="cand-leg-name">Iván Cepeda</span></span><span class="cand-leg-item"><span class="cand-leg-dot" style="background:${ABELARDO_COLOR}"></span><span class="cand-leg-name">Abelardo de la Espriella</span></span></div>`,
    };
  },
};
