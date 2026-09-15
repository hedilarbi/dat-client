import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dat-client.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/login',
        '/register',
        '/forgot-password',
        '/acheteur/',
        '/vendeur/',
        '/api/',
        '/admin/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
