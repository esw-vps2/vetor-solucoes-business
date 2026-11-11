'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { VetorTrail } from '@/components/sections/vetor-trail';

export function Manifesto() {
  const reduced = useReducedMotion();

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: {
      duration: reduced ? 0 : 0.7,
      delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  });

  return (
    <>
      <section className="relative bg-off-white">
        <div className="mx-auto max-w-[1320px] px-6 pt-24 pb-16 md:px-10 lg:px-14 lg:pt-32 lg:pb-20">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div {...fade(0)} className="mb-8">
              <SectionEyebrow tone="light">Manifesto</SectionEyebrow>
            </motion.div>

            <motion.h2
              {...fade(0.1)}
              className="text-[clamp(2rem,4.8vw,3.8rem)] leading-[1.08] font-semibold tracking-[-0.03em] text-text-dark"
            >
              Não criamos tecnologia para impressionar.{' '}
              <span className="italic text-accent">Criamos para resolver.</span>
            </motion.h2>

            <motion.p
              {...fade(0.2)}
              className="mx-auto mt-7 max-w-2xl text-[1.02rem] leading-[1.8] text-text-dark-secondary"
            >
              Na VETOR, cada projeto começa com uma leitura profunda do negócio. Entendemos a
              operação, identificamos os gargalos e aplicamos software, dados e inteligência
              artificial onde eles realmente podem gerar impacto.
            </motion.p>

            <motion.p {...fade(0.3)} className="mt-6 text-[0.95rem] font-medium text-text-dark">
              A tecnologia é o meio. O resultado é o destino.
            </motion.p>
          </div>
        </div>
      </section>

      <VetorTrail />
    </>
  );
}
