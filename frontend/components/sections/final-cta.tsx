'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GridBackdrop } from '@/components/ui/grid-backdrop';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { buildWhatsAppClickToChatUrl } from '@/lib/whatsapp';

export function FinalCta() {
  const whatsAppHref = buildWhatsAppClickToChatUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
  const challengeCtaHref = whatsAppHref ?? 'mailto:contato@vetor.tech';
  return (
    <section id="contato" className="relative bg-off-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10 lg:px-14">
        <div className="relative overflow-hidden rounded-[36px] bg-navy px-6 py-16 text-center md:px-12 lg:px-20 lg:py-24">
          <GridBackdrop />
          <div className="absolute bottom-[-20%] left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(189,218,43,0.08)_0%,transparent_55%)] blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7 }}
              className="mb-7"
            >
              <SectionEyebrow>Contato</SectionEyebrow>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(2rem,5vw,3.8rem)] leading-[1.08] font-semibold tracking-[-0.035em] text-white"
            >
              Qual problema do seu negócio{' '}
              <span className="italic text-accent">a tecnologia ainda não resolveu?</span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.7 }}
              className="mt-7 space-y-1.5"
            >
              <p className="text-[1rem] text-text-secondary">
                Talvez você já saiba qual solução precisa.
              </p>
              <p className="text-[1rem] text-text-secondary">
                Talvez ainda esteja tentando entender o problema.
              </p>
              <p className="mt-4 text-[0.95rem] font-medium text-text-muted">
                Podemos começar por aí.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <motion.a
                href={challengeCtaHref}
                {...(whatsAppHref
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="group inline-flex items-center gap-3 rounded-full bg-accent px-10 py-4 text-[0.95rem] font-bold text-navy transition-all duration-500 hover:shadow-[0_0_48px_rgba(189,218,43,0.25)]"
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Conte seu desafio
                <svg
                  className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </motion.a>
              <Button variant="secondary" size="lg" href="#processo">
                Como trabalhamos
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45 }}
              className="mt-7 text-[0.78rem] text-text-muted"
            >
              Sem pitch pronto. Primeiro queremos entender o negócio.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
