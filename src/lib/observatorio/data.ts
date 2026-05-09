import raw from "../../data/data_inflacion.json";
import rawEmpleo from "../../data/data_empleo.json";
import type {
  ObservatorioData,
  SerieFila,
  EmpleoData,
  EmpleoSerieFila,
} from "./types";

const obs = raw as unknown as ObservatorioData;
const emp = rawEmpleo as unknown as EmpleoData;

export const getObservatorio = (): ObservatorioData => obs;

export const getSerieAscending = (): SerieFila[] => [...obs.serie].reverse();

export const getEmpleo = (): EmpleoData => emp;

export const getEmpleoSerieAscending = (): EmpleoSerieFila[] =>
  [...emp.serie].reverse();
