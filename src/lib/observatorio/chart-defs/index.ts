import {
  inflacionAnual,
  tasaInteres,
  spread,
  frenoAcelerador,
  pibInflacion,
} from "./inflacion";
import {
  crecimientoPib,
  pibTotal,
  pibPerCapita,
  poblacionPib,
  deudaPublica,
  pibComercio,
  leyOkun,
} from "./pib";
import {
  desempleo,
  subempleo,
  tgpToDual,
  brechaLaboral,
} from "./empleo";
import {
  exportaciones,
  importaciones,
  balanzaComercial,
  apertura,
  matrizExportaciones,
  matrizImportaciones,
  productosTradicionales,
} from "./comercio";
import {
  inflacionHistorica,
  pibHistorico,
  desempleoHistorico,
  comercioHistorico,
} from "./historico";
import {
  trmHistorica,
  reservasInternacionales,
  cuentaCorrientePib,
  deudaExternaPib,
  passThroughTrmInflacion,
} from "./externo";
import type { ChartDef } from "./types";

export const CHART_DEFS = {
  [inflacionAnual.id]: inflacionAnual,
  [tasaInteres.id]: tasaInteres,
  [spread.id]: spread,
  [frenoAcelerador.id]: frenoAcelerador,
  [pibInflacion.id]: pibInflacion,
  [crecimientoPib.id]: crecimientoPib,
  [pibTotal.id]: pibTotal,
  [pibPerCapita.id]: pibPerCapita,
  [poblacionPib.id]: poblacionPib,
  [deudaPublica.id]: deudaPublica,
  [pibComercio.id]: pibComercio,
  [leyOkun.id]: leyOkun,
  [desempleo.id]: desempleo,
  [subempleo.id]: subempleo,
  [tgpToDual.id]: tgpToDual,
  [brechaLaboral.id]: brechaLaboral,
  [exportaciones.id]: exportaciones,
  [importaciones.id]: importaciones,
  [balanzaComercial.id]: balanzaComercial,
  [apertura.id]: apertura,
  [matrizExportaciones.id]: matrizExportaciones,
  [matrizImportaciones.id]: matrizImportaciones,
  [productosTradicionales.id]: productosTradicionales,
  [inflacionHistorica.id]: inflacionHistorica,
  [pibHistorico.id]: pibHistorico,
  [desempleoHistorico.id]: desempleoHistorico,
  [comercioHistorico.id]: comercioHistorico,
  [trmHistorica.id]: trmHistorica,
  [reservasInternacionales.id]: reservasInternacionales,
  [cuentaCorrientePib.id]: cuentaCorrientePib,
  [deudaExternaPib.id]: deudaExternaPib,
  [passThroughTrmInflacion.id]: passThroughTrmInflacion,
} as const satisfies Record<string, ChartDef>;

export type ChartId = Extract<keyof typeof CHART_DEFS, string>;

export const getChartDef = (id: string): ChartDef | undefined =>
  (CHART_DEFS as Record<string, ChartDef>)[id];

export type { ChartDef };
