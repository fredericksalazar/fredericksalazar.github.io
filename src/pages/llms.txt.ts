import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { absUrls } from '../lib/urls';
import { DATASETS_PUBLICADOS } from '../lib/observatorio/home';
import { INFORMES } from '../lib/observatorio/informes';

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.fecha.getTime() - a.data.fecha.getTime());

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);

  const lines: string[] = [];
  lines.push('# Frederick Salazar — Data Engineer & Arquitecto de Datos');
  lines.push('');
  lines.push('> Sitio personal de Frederick Salazar (Senior Data Engineer, Colombia) y sede del Observatorio de Datos de Colombia: plataforma abierta de indicadores macroeconómicos, sociales y territoriales (DANE, Banco de la República, Banco Mundial) con actualización automática y licencia CC BY 4.0.');
  lines.push('');
  lines.push('## Páginas principales');
  lines.push('');
  lines.push(`- [Inicio](${absUrls.home()}): perfil, experiencia y portafolio.`);
  lines.push(`- [Observatorio de Datos de Colombia](${absUrls.observatorio()}): indicadores económicos clave de Colombia con fuente oficial y actualización automática.`);
  lines.push(`- [Acerca del Observatorio](${absUrls.observatorioSub('acerca')}): misión, visión, capacidades, metodología y fuentes oficiales.`);
  lines.push(`- [Calculadoras interactivas](${absUrls.calculadoras()}): herramientas con datos oficiales (Sueldo vs Inflación, Cuánto ganas frente al país, En qué Colombia naciste).`);
  lines.push(`- [Blog](${absUrls.blog()}): índice de artículos y análisis de datos.`);
  lines.push(`- [Proyectos](${absUrls.proyectos()}): proyectos de datos y software.`);
  lines.push(`- [RSS feed](${absUrls.rss()}): feed actualizado de artículos.`);
  lines.push('');
  lines.push('## Observatorio de Datos de Colombia · Dashboards e Informes');
  lines.push('');
  for (const d of DATASETS_PUBLICADOS) {
    lines.push(`- [${d.nombre}](${d.url}) — ${d.descripcion} Variables: ${d.variables.join(', ')}.`);
  }
  for (const inf of INFORMES) {
    lines.push(`- [Informe: ${inf.titulo}](${absUrls.observatorioInforme(inf.slug)}) — ${inf.resumen}`);
  }
  lines.push('');
  lines.push('## Artículos del blog');
  lines.push('');
  for (const p of posts) {
    const url = absUrls.blogPost(p.id);
    const summary = p.data.resumen ?? p.data.descripcion;
    lines.push(`- [${p.data.titulo}](${url}) — ${formatDate(p.data.fecha)} · ${p.data.tipo} — ${summary}`);
  }
  lines.push('');
  lines.push('## Autor');
  lines.push('');
  lines.push('Frederick Adolfo Salazar Sánchez — Senior Data Engineer & Arquitecto de Datos con más de 11 años de experiencia. Cali, Colombia.');
  lines.push('LinkedIn: https://www.linkedin.com/in/fredericksalazar');
  lines.push('GitHub: https://github.com/fredericksalazar');
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
