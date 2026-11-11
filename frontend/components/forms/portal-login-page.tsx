'use client';

import Image from 'next/image';
import { PortalCredentialFlow } from '@/components/forms/portal-credential-flow';
import type { SafeUser } from '@/lib/api/client';

interface PortalLoginPageProps {
  onAuthenticated: (user: SafeUser) => void;
}

const benefits = [
  {
    description: 'Soluções conectadas para maior produtividade.',
    icon: <BarsIcon />,
    title: 'Gestão integrada',
  },
  {
    description: 'Seus dados protegidos em todos os momentos.',
    icon: <ShieldIcon />,
    title: 'Acesso seguro',
  },
  {
    description: 'Tecnologia que simplifica o seu dia a dia.',
    icon: <GearIcon />,
    title: 'Eficiência operacional',
  },
];

export function PortalLoginPage({ onAuthenticated }: PortalLoginPageProps) {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col lg:px-14 lg:py-12">
        <svg aria-hidden="true" className="absolute h-0 w-0" focusable="false">
          <filter id="portal-login-logo-green" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1 1 -2 0 0" />
          </filter>
        </svg>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 right-[-4rem] h-[130%] w-72 rotate-[18deg] bg-gradient-to-b from-accent/30 via-accent/10 to-transparent" />
          <div className="absolute top-28 right-10 h-80 w-44 rotate-[24deg] border border-accent/35" />
          <div className="absolute bottom-[-4rem] left-[-3rem] h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <span className="relative inline-block h-14 shrink-0 self-start">
          <Image
            src="/brand/logo_vetor_dark.png"
            alt="VETOR"
            width={220}
            height={66}
            priority
            className="h-14 w-auto brightness-0 invert"
          />
          <Image
            src="/brand/logo_vetor_dark.png"
            alt=""
            width={220}
            height={66}
            aria-hidden
            className="absolute top-0 left-0 h-14 w-auto"
            style={{ filter: 'url(#portal-login-logo-green)' }}
          />
        </span>
        <div className="relative flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-xl">
            <p className="text-4xl leading-tight font-semibold tracking-tight xl:text-5xl">
              Tecnologia que impulsiona resultados
              <span className="text-accent">.</span>
            </p>
            <p className="mt-5 max-w-md text-base leading-7 text-white/70">
              Acesse seu ambiente de trabalho com segurança e simplicidade.
            </p>
            <div className="mt-8 h-1 w-16 rounded-full bg-accent" />
            <ul className="mt-10 space-y-5">
              {benefits.map((benefit) => (
                <li key={benefit.title} className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-white/5 text-accent">
                    {benefit.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{benefit.title}</span>
                    <span className="mt-1 block text-sm text-white/60">{benefit.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-6 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white px-8 py-10 shadow-[0_24px_60px_-28px_rgba(6,11,24,0.55)] sm:px-10">
          <Image
            src="/brand/logo_vetor.png"
            alt="VETOR"
            width={180}
            height={54}
            priority
            className="mx-auto mb-10 h-12 w-auto lg:hidden"
          />
          <PortalCredentialFlow
            appearance="light"
            headingId="portal-login-title"
            headingLevel="h1"
            onAuthenticated={onAuthenticated}
          />
        </div>
      </section>
    </main>
  );
}

function BarsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 19V10M12 19V5M19 19v-7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 8.5 4.2-1.3 7-4.3 7-8.5V6l-7-3Z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.8 6.6l1.6 1.6M17.6 15.8l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.8 17.4l1.6-1.6M17.6 8.2l1.6-1.6" />
    </svg>
  );
}
