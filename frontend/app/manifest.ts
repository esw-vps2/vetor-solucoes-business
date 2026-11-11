import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: '#060b18',
    display: 'standalone',
    icons: [
      {
        sizes: 'any',
        src: '/brand/logo_vetor.png',
        type: 'image/png',
      },
    ],
    name: 'VETOR',
    short_name: 'VETOR',
    start_url: '/',
    theme_color: '#060b18',
  };
}
