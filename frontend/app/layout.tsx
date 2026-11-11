import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VETOR | Business & Technology',
  description:
    'Software, dados, automação e inteligência artificial construídos a partir de problemas reais de negócio.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VETOR',
  },
  openGraph: {
    title: 'VETOR | Business & Technology',
    description:
      'Software, dados, automação e inteligência artificial construídos a partir de problemas reais de negócio.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className="antialiased" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
