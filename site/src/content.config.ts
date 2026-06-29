import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog GEO/AEO. faq[] vira <FAQPage> JSON-LD + bloco visível (formato de maior
// impacto em motores de resposta). pubDate/updatedDate alimentam o schema Article
// (recência é fator de citação no Perplexity/Gemini).
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    eyebrow: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Equipe ROI Labs'),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
