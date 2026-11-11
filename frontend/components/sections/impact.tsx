'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, target, { duration: 1.8, ease: [0.16, 1, 0.3, 1] });
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, target, count, rounded]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

const outcomes = [
  {
    metric: 80,
    suffix: '%',
    metricLabel: 'menos retrabalho',
    title: 'Mais eficiência operacional',
    desc: 'Processos mais simples e menos trabalho manual.',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
        <path
          d="M4 18L10 12L16 16L24 6"
          stroke="#BDDA2B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 6H24V12"
          stroke="#BDDA2B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    metric: 3,
    suffix: 'x',
    metricLabel: 'mais velocidade',
    title: 'Melhores decisões',
    desc: 'Dados transformados em informação utilizável.',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
        <rect x="3" y="14" width="5" height="10" rx="1" fill="#BDDA2B" opacity="0.3" />
        <rect x="11" y="9" width="5" height="15" rx="1" fill="#BDDA2B" opacity="0.5" />
        <rect x="19" y="4" width="5" height="20" rx="1" fill="#BDDA2B" opacity="0.8" />
      </svg>
    ),
  },
  {
    metric: 40,
    suffix: '%',
    metricLabel: 'menos custo',
    title: 'Menos desperdício',
    desc: 'Tecnologia aplicada onde existem gargalos reais.',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
        <circle cx="14" cy="14" r="10" stroke="#BDDA2B" strokeWidth="2" opacity="0.3" />
        <path d="M14 4A10 10 0 0 1 24 14" stroke="#BDDA2B" strokeWidth="2" strokeLinecap="round" />
        <circle cx="14" cy="14" r="3" fill="#BDDA2B" />
      </svg>
    ),
  },
  {
    metric: 10,
    suffix: 'x',
    metricLabel: 'mais capacidade',
    title: 'Mais escala',
    desc: 'Sistemas e processos preparados para crescer.',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
        <path
          d="M6 22L14 6L22 22"
          stroke="#BDDA2B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 16H19" stroke="#BDDA2B" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    metric: 100,
    suffix: '%',
    metricLabel: 'visibilidade',
    title: 'Mais controle',
    desc: 'Informação conectada e operação mensurável.',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
        <path
          d="M3 14C3 14 7 6 14 6C21 6 25 14 25 14C25 14 21 22 14 22C7 22 3 14 3 14Z"
          stroke="#BDDA2B"
          strokeWidth="2"
        />
        <circle cx="14" cy="14" r="3.5" stroke="#BDDA2B" strokeWidth="2" />
      </svg>
    ),
  },
];

export function Impact() {
  return (
    <section className="relative overflow-hidden bg-navy py-28 lg:py-36">
      <GridBackdrop />
      <div className="pointer-events-none absolute right-[10%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(189,218,43,0.06)_0%,transparent_60%)] blur-3xl" />
      <div className="pointer-events-none absolute top-[5%] left-[-5%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(80,120,200,0.05)_0%,transparent_60%)] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1320px] px-6 md:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-7">
            <SectionEyebrow>Impacto</SectionEyebrow>
          </div>

          <h2 className="text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.06] font-semibold tracking-[-0.035em] text-white">
            No fim, tecnologia é meio.{' '}
            <span className="italic text-accent">Resultado é o objetivo.</span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mx-auto mt-8 max-w-2xl text-center text-[1.05rem] leading-relaxed font-medium text-text-secondary italic"
        >
          Não medimos tecnologia por linhas de código. Medimos pelo que ela muda no negócio.
        </motion.p>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {outcomes.map((o, i) => (
            <motion.div
              key={o.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="group relative bg-white rounded-[20px] border border-black/[0.04] p-7 transition-all duration-500 hover:shadow-[0_8px_40px_rgba(189,218,43,0.12)] hover:border-accent/20 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle,rgba(189,218,43,0.08)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-tr-[20px]" />

              <div className="relative z-10 w-12 h-12 rounded-xl bg-navy/[0.04] group-hover:bg-accent/[0.08] flex items-center justify-center transition-colors duration-500 mb-5">
                {o.icon}
              </div>

              <div className="relative z-10 mb-4">
                <span className="text-[2rem] font-bold tracking-[-0.04em] text-text-dark group-hover:text-accent transition-colors duration-500">
                  <AnimatedCounter target={o.metric} suffix={o.suffix} />
                </span>
                <p className="text-[0.65rem] font-semibold tracking-[0.1em] text-accent/60 uppercase mt-0.5">
                  {o.metricLabel}
                </p>
              </div>

              <div className="relative z-10">
                <h3 className="text-[0.95rem] font-semibold text-text-dark mb-1.5 leading-snug">
                  {o.title}
                </h3>
                <p className="text-[0.82rem] text-text-dark-secondary leading-relaxed">{o.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
