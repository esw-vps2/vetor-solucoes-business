'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { BrowserFrame } from '@/components/ui/browser-frame';
import { FeatureRow } from '@/components/ui/feature-row';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';

const projects = [
  {
    industry: 'Food Service',
    label: 'PRECIFICAI',
    headline: 'De dados espalhados no ERP a decisões de margem.',
    problem:
      'Restaurantes possuem vendas, compras, estoque e fichas técnicas, mas pouca inteligência conectando essas informações.',
    opportunity:
      'Transformar dados operacionais em decisões sobre CMV, preço, margem e rentabilidade.',
    built: 'Integrações + Dados + Software + IA',
    result: 'Uma camada de inteligência sobre a operação.',
    tags: ['Food Service', 'Dados', 'IA', 'Integrações', 'SaaS'],
    image: '/brand/project-precificai.png',
  },
  {
    industry: 'Gestão Condominial',
    label: 'EASYCONDO',
    headline: 'O condomínio organizado, sem depender do WhatsApp.',
    problem:
      'Comunicados, documentos, reservas e financeiro espalhados em grupos de WhatsApp e planilhas sem controle.',
    opportunity:
      'Centralizar a gestão condominial em uma plataforma segura e acessível para síndicos e moradores.',
    built: 'Software + PWA + Automação',
    result: 'Transparência e acesso rápido às informações do condomínio.',
    tags: ['Gestão', 'PWA', 'Software', 'Automação'],
    image: '/brand/project-easycondo.png',
  },
  {
    industry: 'Healthcare',
    label: 'MEDICAL BILLS',
    headline: 'De um ciclo complexo a uma operação mensurável.',
    problem:
      'Produção, faturamento, glosas e recebimento fazem parte do mesmo ciclo, mas frequentemente são analisados separadamente.',
    opportunity: 'Criar visibilidade e inteligência sobre toda a jornada da receita hospitalar.',
    built: 'Regras de negócio + Integrações + Dados + Software',
    result: 'Uma visão integrada do ciclo da receita.',
    tags: ['Healthcare', 'Software', 'Dados', 'Automação'],
    image: '/brand/project-medicalbills.png',
  },
];

function ProblemIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 7V10.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="13.2" r="0.8" fill="currentColor" />
    </svg>
  );
}

function OpportunityIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M4 13L8 9L11.5 12L16 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BuiltIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
      <rect x="3.5" y="4" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 8H13M7 11.5H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ResultIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M5 14.5L10 5.5L15 14.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 11.5H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Projects() {
  return (
    <section id="projetos" className="relative overflow-hidden bg-off-white py-28 lg:py-36">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-16 max-w-3xl text-center lg:mb-20"
        >
          <div className="mb-7">
            <SectionEyebrow tone="light">Projetos</SectionEyebrow>
          </div>
          <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-text-dark">
            Tecnologia construída <span className="italic text-accent">no mundo real.</span>
          </h2>
        </motion.div>

        <div className="space-y-20 lg:space-y-28">
          {projects.map((p, i) => {
            const reverse = i % 2 === 1;

            return (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14`}
              >
                <div className={`lg:col-span-6 ${reverse ? 'lg:order-2' : ''}`}>
                  <SectionEyebrow tone="light">{p.label}</SectionEyebrow>
                  <p className="mt-5 text-[0.72rem] font-semibold tracking-[0.18em] text-accent uppercase">
                    {p.industry}
                  </p>
                  <h3 className="mt-3 text-[clamp(1.6rem,3vw,2.2rem)] leading-snug font-semibold tracking-[-0.02em] text-text-dark">
                    {p.headline}
                  </h3>

                  <div className="mt-6 space-y-3">
                    <FeatureRow title="Problema" description={p.problem} icon={<ProblemIcon />} />
                    <FeatureRow
                      title="Oportunidade"
                      description={p.opportunity}
                      icon={<OpportunityIcon />}
                    />
                    <FeatureRow title="Construímos" description={p.built} icon={<BuiltIcon />} />
                    <FeatureRow title="Resultado" description={p.result} icon={<ResultIcon />} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-navy/[0.04] px-3 py-1.5 text-[0.68rem] text-text-dark-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={`lg:col-span-6 ${reverse ? 'lg:order-1' : ''}`}>
                  <BrowserFrame label={p.label}>
                    <div className="relative aspect-[16/11] bg-navy-50">
                      <Image
                        src={p.image}
                        alt={`Screenshot do projeto ${p.label}`}
                        fill
                        className="object-cover object-left-top"
                        sizes="(max-width: 1024px) 100vw, 45vw"
                      />
                    </div>
                  </BrowserFrame>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
