import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

const docs = defineCollection({
  type: 'content',
  schema: docsSchema({
    extend: z.object({
      sidebar: z
        .object({
          order: z.number().optional(),
          label: z.string().optional()
        })
        .optional()
    })
  })
});

export const collections = { docs };
