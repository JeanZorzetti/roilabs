import type { MetadataRoute } from 'next';

// Installable PWA — "add to home screen" on Duda's phone. No service worker by
// design (admin must always be live data); manifest + icons are all Chrome needs.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ROI Labs Admin',
    short_name: 'ROI Admin',
    start_url: '/admin',
    display: 'standalone',
    background_color: '#f2f1ed',
    theme_color: '#14171d',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
