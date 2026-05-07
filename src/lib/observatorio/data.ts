import raw from "../../data/observatorio.json";
import type { ObservatorioData, SerieFila } from "./types";

const obs = raw as unknown as ObservatorioData;

export const getObservatorio = (): ObservatorioData => obs;

export const getSerieAscending = (): SerieFila[] => [...obs.serie].reverse();
