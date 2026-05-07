import raw from "../../data/data_inflacion.json";
import type { ObservatorioData, SerieFila } from "./types";

const obs = raw as unknown as ObservatorioData;

export const getObservatorio = (): ObservatorioData => obs;

export const getSerieAscending = (): SerieFila[] => [...obs.serie].reverse();
