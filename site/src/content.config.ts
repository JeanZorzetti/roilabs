import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog GEO/AEO. faq[] vira <FAQPage> JSON-LD + bloco visível (formato de maior
// impacto em motores de resposta). pubDate/updatedDate alimentam o schema Article
// (recência é fator de citação no Perplexity/Gemini). cover vira a imagem do topo, o
// ImageObject do JSON-LD e o <image:image> do sitemap; seoTitle é o <title> exato (sem o
// sufixo " — ROI Labs"), para quando o H1 passa de ~60 caracteres.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      seoTitle: z.string().optional(),
      description: z.string(),
      eyebrow: z.string().optional(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string().default('Equipe ROI Labs'),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      // Foto de banco: crédito + licença viram creditText/license do ImageObject.
      coverCredit: z
        .object({ name: z.string(), source: z.string(), page: z.string().url(), license: z.string().url() })
        .optional(),
      coverCaption: z.string().optional(),
      faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
