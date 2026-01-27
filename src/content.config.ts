import { defineCollection } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

const docs = defineCollection({
  schema: docsSchema(),
  // @ts-ignore - MDX extension is supported by Starlight
  extension: '.mdx',
});

export const collections = { docs };
