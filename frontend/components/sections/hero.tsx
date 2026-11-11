'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BrowserFrame } from '@/components/ui/browser-frame';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { SurfaceGrain } from '@/components/ui/surface-grain';
import { DesktopFlow, MobileFlow } from '@/components/sections/hero-flow';

const methodPoints = [
  'Entendemos — negócio, operação, pessoas, sistemas, dados e objetivos',
  'Diagnosticamos — gargalos e onde tecnologia gera impacto',
  'Construímos — software, integrações, automações, dados ou IA',
];

const heroMetrics = [
  { value: '80%', label: 'menos retrabalho' },
  { value: '3x', label: 'mais velocidade' },
  { value: '40%', label: 'menos custo' },
];

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 size-4 shrink-0 text-accent"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 8.2L6.4 11.1L12.5 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy">
      <GridBackdrop />
      <div className="absolute inset-0">
        <div className="absolute top-[-18%] right-[-8%] h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle,rgba(189,218,43,0.07)_0%,transparent_52%)] blur-3xl" />
        <div className="absolute bottom-[-24%] left-[-8%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(80,120,200,0.05)_0%,transparent_52%)] blur-3xl" />
      </div>
      <SurfaceGrain tone="dark" />

      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-6 pt-36 pb-20 md:px-10 lg:px-14 lg:pt-44 lg:pb-16">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-8"
            >
              <SectionEyebrow>
                <span className="mr-2 size-1.5 rounded-full bg-accent" aria-hidden="true" />
                Business &amp; Technology
              </SectionEyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(2.6rem,5.6vw,4.6rem)] leading-[1.05] font-semibold tracking-[-0.035em] text-white"
            >
              Antes do código, <span className="italic text-accent">entendemos o negócio.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-6 max-w-xl text-[1.05rem] leading-[1.75] text-text-secondary"
            >
              Estratégia, software, dados e inteligência artificial construídos a partir de
              problemas reais de negócio.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.68 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button variant="primary" size="lg" href="#contato">
                Fale sobre seu desafio
              </Button>
              <Button variant="secondary" size="lg" href="#processo">
                Como trabalhamos
              </Button>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.82 }}
              className="mt-8 space-y-2.5"
            >
              {methodPoints.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[0.92rem] text-white/70">
                  <CheckIcon />
                  <span>{point}</span>
                </li>
              ))}
            </motion.ul>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.95 }}
              className="mt-7 max-w-[28rem] text-[1rem] leading-[1.55] font-medium text-white/55"
            >
              Quem não <span className="font-semibold text-accent">constrói o futuro</span>,
              constrói o presente com as{' '}
              <span className="text-white/85">ferramentas do passado</span>.
            </motion.p>

            <div className="mt-10 lg:hidden">
              <BrowserFrame label="Método">
                <div className="px-5 py-6">
                  <MobileFlow />
                </div>
              </BrowserFrame>
            </div>
          </div>

          <motion.div
            className="hidden lg:col-span-6 lg:block"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
          >
            <BrowserFrame label="Método">
              <div className="px-6 py-8 lg:px-8">
                <DesktopFlow />
              </div>
            </BrowserFrame>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/[0.06] bg-navy-50/80">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 divide-y divide-white/[0.06] px-6 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-10 lg:px-14">
          {heroMetrics.map((metric) => (
            <div key={metric.label} className="px-2 py-8 text-center md:py-10">
              <p className="text-[clamp(2rem,4vw,3.2rem)] leading-none font-semibold tracking-[-0.04em] text-white">
                {metric.value}
              </p>
              <p className="mt-2 text-[0.85rem] text-text-secondary">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
