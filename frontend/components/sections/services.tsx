'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { buildWhatsAppClickToChatUrl } from '@/lib/whatsapp';
import { FeatureRow } from '@/components/ui/feature-row';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';

interface Objective {
  id: number;
  label: string;
  challenge: string;
  applied: string;
  tags: string[];
  impact: string;
  impactWord: string;
}

const objectives: Objective[] = [
  {
    id: 1,
    label: 'Simplificar a operação',
    challenge:
      'Processos manuais, retrabalho e sistemas que não acompanham a realidade da empresa.',
    applied:
      'Software sob medida, plataformas internas, automações e agentes de inteligência artificial.',
    tags: ['Sistemas sob medida', 'Automação', 'Agentes de IA', 'Plataformas internas'],
    impact:
      'Menos tarefas manuais, erros e custos operacionais. Mais velocidade, padronização e controle.',
    impactWord: 'EFICIÊNCIA',
  },
  {
    id: 2,
    label: 'Decidir com clareza',
    challenge:
      'Dados espalhados, indicadores atrasados e decisões importantes tomadas sem uma visão completa.',
    applied:
      'Engenharia de dados, Business Intelligence, analytics e inteligência artificial aplicada à decisão.',
    tags: ['Engenharia de dados', 'Business Intelligence', 'Analytics', 'IA aplicada'],
    impact:
      'Informações confiáveis, visão em tempo real, maior previsibilidade e decisões mais seguras.',
    impactWord: 'CLAREZA',
  },
  {
    id: 3,
    label: 'Conectar o ecossistema',
    challenge: 'ERPs, sistemas, planilhas e plataformas que não conversam entre si.',
    applied: 'APIs, integrações, sincronização de dados e automação de fluxos entre sistemas.',
    tags: ['APIs', 'Integrações', 'ERPs', 'Sincronização de dados'],
    impact:
      'Uma operação conectada, com menos retrabalho, menos inconsistências e informações circulando no momento certo.',
    impactWord: 'CONEXÃO',
  },
  {
    id: 4,
    label: 'Criar novas oportunidades',
    challenge:
      'Uma oportunidade de negócio que ainda precisa ser validada, estruturada e transformada em produto.',
    applied: 'Product discovery, UX/UI, MVPs, plataformas digitais, aplicativos e soluções SaaS.',
    tags: ['Product Discovery', 'UX/UI', 'MVP', 'SaaS', 'Plataformas digitais'],
    impact:
      'Ideias validadas com mais velocidade, lançamentos mais seguros e novos modelos de receita escaláveis.',
    impactWord: 'CRESCIMENTO',
  },
  {
    id: 5,
    label: 'Evoluir e escalar',
    challenge:
      'Soluções que ficaram limitadas, antigas ou já não acompanham o crescimento da operação.',
    applied: 'Modernização de sistemas, arquitetura, cloud, monitoramento e evolução contínua.',
    tags: ['Modernização', 'Arquitetura', 'Cloud', 'Monitoramento'],
    impact:
      'Mais estabilidade, segurança e capacidade para crescer sem transformar a tecnologia em um obstáculo.',
    impactWord: 'ESCALA',
  },
];

function ChallengeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 7V10.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="13.2" r="0.8" fill="currentColor" />
    </svg>
  );
}

function AppliedIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
      <rect x="3.5" y="4" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 8H13M7 11.5H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ImpactIcon() {
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

const contentVariants = {
  enter: { opacity: 0, y: 16 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function ContentPanel({ data }: { data: Objective }) {
  const reduced = useReducedMotion();
  const transition = reduced
    ? { duration: 0 }
    : { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <motion.div
      key={data.id}
      variants={contentVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className="min-h-[320px] space-y-3"
    >
      <FeatureRow title="Desafio" description={data.challenge} icon={<ChallengeIcon />} />
      <FeatureRow title="O que aplicamos" description={data.applied} icon={<AppliedIcon />} />
      <FeatureRow title="Impacto" description={data.impact} icon={<ImpactIcon />} />

      <div className="flex flex-wrap gap-1.5 pt-2">
        {data.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-accent/[0.12] px-3 py-1.5 text-[0.65rem] font-medium text-accent"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="pt-2 text-[1.7rem] leading-none font-bold tracking-[-0.04em] text-accent">
        {data.impactWord}
      </p>
    </motion.div>
  );
}

function AccordionItem({
  data,
  isOpen,
  onToggle,
}: {
  data: Objective;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const reduced = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen]);

  return (
    <div className="border-b border-black/[0.06] last:border-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-4 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-lg transition-colors duration-300"
      >
        <span
          className={`text-[0.65rem] font-bold tracking-wider tabular-nums transition-colors duration-300 ${
            isOpen ? 'text-accent' : 'text-text-dark-secondary'
          }`}
        >
          {String(data.id).padStart(2, '0')}
        </span>
        <span
          className={`text-[1rem] font-semibold transition-colors duration-300 flex-1 ${
            isOpen ? 'text-accent' : 'text-text-dark/55'
          }`}
        >
          {data.label}
        </span>
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.3 }}
          className="shrink-0"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke={isOpen ? '#BDDA2B' : 'rgba(13,19,33,0.35)'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? height : 0, opacity: isOpen ? 1 : 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <div ref={contentRef} className="space-y-3 pb-8 pl-2">
          <FeatureRow title="Desafio" description={data.challenge} icon={<ChallengeIcon />} />
          <FeatureRow title="O que aplicamos" description={data.applied} icon={<AppliedIcon />} />
          <FeatureRow title="Impacto" description={data.impact} icon={<ImpactIcon />} />
          <div className="flex flex-wrap gap-1.5">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent/[0.12] px-2.5 py-1 text-[0.62rem] font-medium text-accent"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="text-[1.5rem] leading-none font-bold tracking-[-0.04em] text-accent">
            {data.impactWord}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export function Services() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const whatsAppHref = buildWhatsAppClickToChatUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
  const challengeCtaHref = whatsAppHref ?? '#contato';

  const handleSelect = useCallback((index: number) => {
    setActive(index);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      setActive((prev) => Math.min(prev + 1, objectives.length - 1));
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setActive((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(objectives.length - 1);
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      id="servicos"
      className="relative overflow-hidden bg-off-white py-28 lg:py-36"
    >
      <div className="pointer-events-none absolute top-[30%] left-[-5%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(189,218,43,0.04)_0%,transparent_60%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-8%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(189,218,43,0.03)_0%,transparent_60%)] blur-3xl" />

      <div className="mx-auto max-w-[1320px] px-6 md:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={reduced ? { duration: 0 } : { duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-6 max-w-4xl text-center"
        >
          <div className="mb-7">
            <SectionEyebrow tone="light">Capacidades</SectionEyebrow>
          </div>
          <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-text-dark">
            O negócio define a direção.{' '}
            <span className="italic text-accent">A tecnologia constrói o caminho.</span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={reduced ? { duration: 0 } : { duration: 0.7, delay: 0.1 }}
          className="mx-auto mb-16 max-w-2xl text-center text-[1rem] leading-relaxed text-text-dark-secondary lg:mb-20"
        >
          Não partimos de uma lista de tecnologias. Partimos do ponto em que a empresa precisa
          ganhar eficiência, clareza ou escala. A partir daí, combinamos produto, software, dados e
          inteligência artificial.
        </motion.p>

        <div className="hidden lg:grid grid-cols-12 gap-12 lg:gap-16">
          <div
            className="col-span-4 xl:col-span-3"
            role="tablist"
            aria-label="Objetivos de negócio"
            onKeyDown={handleKeyDown}
          >
            <div className="relative pl-8">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-navy/[0.08]" />

              <motion.div
                className="absolute left-[-3.5px] w-[8px] h-[8px] rounded-full bg-accent"
                animate={{
                  top: `${active * 88 + 4}px`,
                  boxShadow: '0 0 12px rgba(189,218,43,0.4)',
                }}
                transition={reduced ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />

              <motion.div
                className="absolute left-0 top-0 w-px bg-gradient-to-b from-accent/50 to-accent/10"
                animate={{
                  height: `${active * 88 + 8}px`,
                }}
                transition={reduced ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />

              {objectives.map((obj, i) => (
                <button
                  key={obj.id}
                  role="tab"
                  aria-selected={active === i}
                  aria-controls={`panel-${obj.id}`}
                  tabIndex={active === i ? 0 : -1}
                  onClick={() => handleSelect(i)}
                  className={`group relative w-full text-left py-4 pr-4 transition-all duration-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-r-lg ${
                    i === 0 ? '' : 'mt-4'
                  }`}
                >
                  <div
                    className={`absolute -left-8 top-[18px] w-[5px] h-[5px] rounded-full transition-all duration-400 -translate-x-[0.5px] ${
                      active === i ? 'opacity-0' : 'bg-navy/15'
                    }`}
                  />

                  <span
                    className={`text-[0.6rem] font-bold tracking-[0.15em] tabular-nums block mb-1 transition-colors duration-300 ${
                      active === i ? 'text-accent/60' : 'text-text-dark-secondary/40'
                    }`}
                  >
                    {String(obj.id).padStart(2, '0')}
                  </span>
                  <span
                    className={`text-[1.05rem] font-semibold block transition-all duration-300 ${
                      active === i
                        ? 'text-accent'
                        : 'text-text-dark/40 group-hover:text-text-dark/65'
                    }`}
                  >
                    {obj.label}
                  </span>
                </button>
              ))}

              <div className="mt-10 text-[0.6rem] font-semibold tracking-[0.15em] text-text-dark-secondary/30 tabular-nums">
                {String(active + 1).padStart(2, '0')} <span className="text-text-dark/15">/</span>{' '}
                {String(objectives.length).padStart(2, '0')}
              </div>
            </div>
          </div>

          <div
            className="col-span-8 xl:col-span-9"
            id={`panel-${objectives[active].id}`}
            role="tabpanel"
            aria-labelledby={`tab-${objectives[active].id}`}
          >
            <AnimatePresence mode="wait">
              <ContentPanel data={objectives[active]} />
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:hidden">
          {objectives.map((obj, i) => (
            <AccordionItem
              key={obj.id}
              data={obj}
              isOpen={active === i}
              onToggle={() => handleSelect(active === i ? -1 : i)}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={reduced ? { duration: 0 } : { duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-16 max-w-3xl text-center lg:mt-24"
        >
          <p className="text-[1.05rem] leading-relaxed font-medium text-text-dark">
            Cada capacidade começa em um problema real e termina em uma mudança mensurável no
            negócio.
          </p>

          <div className="mt-8">
            <Button
              variant="inverse"
              size="lg"
              href={challengeCtaHref}
              {...(whatsAppHref
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              Fale sobre o seu desafio
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
