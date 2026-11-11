'use client';

import Image from 'next/image';
import { scrollToHash } from '@/lib/scroll-to-hash';

const companyLinks = [
  { label: 'Método', href: '#processo' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Empresa', href: '#origem' },
  { label: 'Projetos', href: '#projetos' },
  { label: 'Contato', href: '#contato' },
];

const serviceLinks = [
  { label: 'Software', href: '#servicos' },
  { label: 'Dados & BI', href: '#servicos' },
  { label: 'Automação & IA', href: '#servicos' },
  { label: 'Integrações', href: '#servicos' },
  { label: 'Produtos Digitais', href: '#servicos' },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-navy pt-20 pb-12">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10 lg:px-14">
        <div className="mx-auto grid max-w-4xl grid-cols-1 justify-items-center gap-14 text-center md:grid-cols-3 md:gap-10">
          <div className="flex flex-col items-center">
            <Image
              src="/brand/logo_vetor_dark.png"
              alt="VETOR"
              width={160}
              height={48}
              className="mb-6 h-10 w-auto brightness-0 invert"
            />
            <p className="max-w-[260px] text-[0.82rem] leading-relaxed text-text-muted">
              O negócio aponta a direção.
              <br />A tecnologia leva mais longe.
            </p>
            <p className="mt-3 text-[0.78rem] text-text-secondary">VETOR — Business & Technology</p>
          </div>

          <div>
            <h4 className="mb-6 text-[0.65rem] font-semibold tracking-[0.25em] text-text-secondary uppercase">
              Empresa
            </h4>
            <ul className="space-y-3">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToHash(l.href);
                    }}
                    className="text-[0.82rem] text-text-muted transition-colors duration-300 hover:text-accent"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-[0.65rem] font-semibold tracking-[0.25em] text-text-secondary uppercase">
              Serviços
            </h4>
            <ul className="space-y-3">
              {serviceLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToHash(l.href);
                    }}
                    className="text-[0.82rem] text-text-muted transition-colors duration-300 hover:text-accent"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
