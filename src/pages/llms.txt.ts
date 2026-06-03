import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { absUrls, SITE_URL } from '../lib/urls';

const SITE = SITE_URL;

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.fecha.getTime() - a.data.fecha.getTime());

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);

  const lines: string[] = [];
  lines.push('# Frederick Salazar — Data Engineer & Arquitecto de Datos');
  lines.push('');
  lines.push('> Sitio personal de Frederick Salazar (Senior Data Engineer, Colombia). Contiene artículos técnicos sobre Data Engineering, Big Data, Machine Learning, IA, Azure y Analytics, además de proyectos y portafolio profesional. El contenido es original, en español, citable y referenciable.');
  lines.push('');
  lines.push('## Páginas principales');
  lines.push('');
  lines.push(`- [Inicio](${absUrls.home()}): perfil, experiencia y portafolio.`);
  lines.push(`- [Blog](${absUrls.blog()}): índice de artículos.`);
  lines.push(`- [Proyectos](${absUrls.proyectos()}): proyectos de datos y software.`);
  lines.push(`- [RSS feed](${absUrls.rss()}): feed actualizado de artículos.`);
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
