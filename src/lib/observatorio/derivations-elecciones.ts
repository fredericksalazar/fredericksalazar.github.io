// Lógica compartida para joins y cálculos electorales en runtime (si aplica)
import type { PresEleccionData, PresCandidatosData, IdeologiaBloque } from "./types";

export function joinCandidatosIdeologia(
  resultados: PresEleccionData["resultados"],
  candidatos: PresCandidatosData["candidatos"]["2026-1v"] // can be parameterized
) {
  return resultados.map(r => {
    const cat = candidatos.find(c => c.id === r.id);
    return {
      ...r,
      nombre: cat?.nombre ?? r.id,
      ideologia: cat?.ideologia ?? "centro" as IdeologiaBloque
    };
  });
}
