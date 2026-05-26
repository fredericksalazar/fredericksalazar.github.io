/**
 * content.config.ts  (raíz del proyecto — requerido por Astro v6)
 *
 * Define las Content Collections con la nueva Content Layer API de Astro v5+/v6.
 * Cada colección usa el loader `glob` para leer archivos Markdown/MDX.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ─── Colección: Blog ──────────────────────────────────────────────────────────
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string(),
    tituloSeo: z.string().optional(),
    fecha: z.coerce.date(),
    descripcion: z.string().max(160, 'La descripción SEO no debe superar 160 caracteres.'),
    etiquetas: z.array(z.string()).default([]),
    autor: z.string().default('Frederick Salazar'),
    imagen: z.string().optional(),
    draft: z.boolean().default(false),
    tipo: z.enum(['tutorial', 'analisis', 'opinion', 'caso-estudio', 'referencia']).default('analisis'),
    resumen: z.string().optional(),
    destacado: z.boolean().default(false),
  }),
});

// ─── Colección: Proyectos ─────────────────────────────────────────────────────
const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/proyectos' }),
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string(),
    tecnologias: z.array(z.string()),
    categoria: z.enum(['data-analysis', 'ml', 'software', 'data-engineering']).default('software'),
    fecha: z.coerce.date().optional(),
    github: z.string().refine(v => v === '' || /^https?:\/\//.test(v), { message: 'Debe ser una URL válida o estar vacío.' }).optional().default(''),
    demo: z.string().refine(v => v === '' || /^https?:\/\//.test(v), { message: 'Debe ser una URL válida o estar vacío.' }).optional().default(''),
    imagen: z.string().optional(),
    destacado: z.boolean().default(false),
    orden: z.number().int().default(99),
  }),
});

export const collections = { blog, proyectos };
