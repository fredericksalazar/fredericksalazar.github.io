import raw from "../../data/observatorio.json";
import type { ObservatorioData, SerieFila } from "./types";

const obs = raw as unknown as ObservatorioData;

export const getObservatorio = (): ObservatorioData => obs;

export const getSerieAscending = (): SerieFila[] => [...obs.serie].reverse();

export const getCommitUrl = (): string =>
  "https://github.com/fredericksalazar/fredericksalazar.github.io/commits/main/src/data/observatorio.json";
