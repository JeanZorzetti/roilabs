import type { MetadataRoute } from 'next'

// app.roilabs.com.br is the admin panel — every route is behind /login. Googlebot
// was spending 49 requests per 89 days on it, and nothing here should ever reach
// the index, so keep it out of the crawl entirely.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  }
}
