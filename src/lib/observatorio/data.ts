import raw from "../../data/data_inflacion.json";
import rawEmpleo from "../../data/data_empleo.json";
import rawComercio from "../../data/data_comercio.json";
import type {
  ObservatorioData,
  SerieFila,
  EmpleoData,
  EmpleoSerieFila,
  ComercioData,
  ComercioSerieFila,
} from "./types";

const obs = raw as unknown as ObservatorioData;
const emp = rawEmpleo as unknown as EmpleoData;
const com = rawComercio as unknown as ComercioData;

export const getObservatorio = (): ObservatorioData => obs;

export const getSerieAscending = (): SerieFila[] => [...obs.serie].reverse();

export const getEmpleo = (): EmpleoData => emp;

export const getEmpleoSerieAscending = (): EmpleoSerieFila[] =>
  [...emp.serie].reverse();

export const getComercio = (): ComercioData => com;

export const getComercioSerieAscending = (): ComercioSerieFila[] =>
  [...com.serie].reverse();
