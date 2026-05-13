import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.fecha.getTime() - a.data.fecha.getTime());

  return rss({
    title: 'Blog · Frederick Salazar',
    description:
      'Artículos sobre Data Engineering, Big Data, Machine Learning, Azure y Analytics por Frederick Salazar.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.titulo,
      pubDate: post.data.fecha,
      description: post.data.resumen ?? post.data.descripcion,
      link: `/blog/${post.id}/`,
      categories: post.data.etiquetas,
      author: 'fsalazars@uoc.edu (Frederick Salazar)',
    })),
    customData: '<language>es-CO</language>',
  });
}
