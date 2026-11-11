'use client';

import { motion } from 'framer-motion';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';

const evolution = [
  { label: 'Dados', desc: 'Entender o que aconteceu.' },
  { label: 'Processos', desc: 'Entender por que aconteceu.' },
  { label: 'Software', desc: 'Resolver o problema.' },
  { label: 'Inteligência', desc: 'Melhorar continuamente.' },
];

export function Origin() {
  return (
    <section id="origem" className="relative overflow-hidden bg-navy py-28 lg:py-36">
      <GridBackdrop />
      <div className="absolute top-[18%] right-[8%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(80,120,200,0.05)_0%,transparent_60%)] blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-[1320px] px-6 md:px-10 lg:px-14">
        <div className="mx-auto mb-14 max-w-3xl text-center lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-7"
          >
            <SectionEyebrow>Nossa origem</SectionEyebrow>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(2rem,4vw,3.2rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-white"
          >
            Começamos <span className="italic text-accent">pelos dados.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 text-[1rem] leading-[1.85] text-text-secondary"
          >
            Nossa história começou ajudando empresas a entender melhor seus números. Mas os dados
            revelaram algo maior: muitos problemas não precisavam apenas ser analisados.{' '}
            <strong className="font-semibold text-white">Precisavam ser resolvidos.</strong>
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {evolution.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 + i * 0.08, duration: 0.6 }}
              className="rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-7"
            >
              <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-white/[0.05] text-[0.72rem] font-bold tracking-[0.12em] text-accent">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="text-2xl font-semibold tracking-[-0.02em] text-white">{step.label}</h3>
              <p className="mt-2 text-[0.92rem] text-text-secondary">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          className="mt-10 text-center"
        >
          <p className="text-xl font-semibold text-white">
            Hoje somos <span className="text-accent">VETOR</span>.
          </p>
          <p className="mt-1 text-[0.85rem] text-text-muted">Business &amp; Technology.</p>
        </motion.div>
      </div>
    </section>
  );
}
