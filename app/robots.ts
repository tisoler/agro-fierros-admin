import type { MetadataRoute } from 'next';

// Panel interno: nunca indexar.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  };
}
