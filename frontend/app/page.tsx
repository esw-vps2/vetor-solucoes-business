import { headers } from 'next/headers';
import { DedicatedPortalLogin } from '@/components/forms/dedicated-portal-login';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { WhatsAppContact } from '@/components/layout/whatsapp-contact';
import { FinalCta } from '@/components/sections/final-cta';
import { Hero } from '@/components/sections/hero';
import { Impact } from '@/components/sections/impact';
import { Manifesto } from '@/components/sections/manifesto';
import { Origin } from '@/components/sections/origin';
import { Projects } from '@/components/sections/projects';
import { Services } from '@/components/sections/services';
import { isPortalAppHost } from '@/lib/portal-app-host';

export function HomeDocument() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Manifesto />
        <Services />
        <Origin />
        <Projects />
        <Impact />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppContact />
    </>
  );
}

export default async function Home() {
  const requestHeaders = await headers();
  const host = requestHeaders.get('host') ?? '';

  if (isPortalAppHost(host)) {
    return <DedicatedPortalLogin />;
  }

  return <HomeDocument />;
}
