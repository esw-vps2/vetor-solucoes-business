'use client';

import { useRef, useState, useCallback, useSyncExternalStore } from 'react';
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { SurfaceGrain } from '@/components/ui/surface-grain';

const steps = [
  {
    n: '01',
    title: 'Clareza antes do código',
    text: 'Entendemos o problema, o contexto e os objetivos antes de definir qualquer solução.',
    keyword: 'COMPREENDER',
  },
  {
    n: '02',
    title: 'Inteligência aplicada',
    text: 'Usamos software, dados e IA de forma prática, conectados à realidade da operação.',
    keyword: 'CONECTAR',
  },
  {
    n: '03',
    title: 'Impacto mensurável',
    text: 'Cada solução precisa gerar eficiência, crescimento, economia ou vantagem competitiva.',
    keyword: 'AVANÇAR',
  },
];

const signalPts = [
  { x: 50, y: 250 },
  { x: 130, y: 130 },
  { x: 200, y: 300 },
  { x: 280, y: 160 },
  { x: 360, y: 230 },
  { x: 440, y: 80 },
];

const noisePts = [
  { x: 80, y: 50 },
  { x: 160, y: 55 },
  { x: 250, y: 340 },
  { x: 320, y: 55 },
  { x: 410, y: 320 },
  { x: 40, y: 175 },
  { x: 460, y: 195 },
  { x: 285, y: 30 },
];

const connections: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [2, 3],
  [2, 4],
  [3, 4],
  [3, 5],
  [4, 5],
];

const mainPathIdx = [0, 1, 3, 5];

const isMainConnection = (a: number, b: number) => {
  for (let j = 0; j < mainPathIdx.length - 1; j++) {
    const m0 = mainPathIdx[j];
    const m1 = mainPathIdx[j + 1];
    if ((a === m0 && b === m1) || (a === m1 && b === m0)) return true;
  }
  return false;
};

const connectionData = connections.map(([a, b]) => {
  const p1 = signalPts[a];
  const p2 = signalPts[b];
  return {
    d: `M${p1.x},${p1.y} L${p2.x},${p2.y}`,
    len: Math.hypot(p2.x - p1.x, p2.y - p1.y),
    isMain: isMainConnection(a, b),
  };
});

const mainPathD = mainPathIdx
  .map((idx, i) => `${i === 0 ? 'M' : 'L'}${signalPts[idx].x},${signalPts[idx].y}`)
  .join(' ');

const mainPathLen = mainPathIdx.reduce((sum, idx, i) => {
  if (i === 0) return 0;
  const prev = signalPts[mainPathIdx[i - 1]];
  const curr = signalPts[idx];
  return sum + Math.hypot(curr.x - prev.x, curr.y - prev.y);
}, 0);

const lastPt = signalPts[mainPathIdx[mainPathIdx.length - 1]];
const prevPt = signalPts[mainPathIdx[mainPathIdx.length - 2]];
const arrowAngle = Math.atan2(lastPt.y - prevPt.y, lastPt.x - prevPt.x) * (180 / Math.PI);

function TrailVisual({ progress, reduced }: { progress: number; reduced: boolean | null }) {
  const phase1 = Math.min(progress / 0.33, 1);
  const phase2 = Math.max(0, Math.min((progress - 0.28) / 0.33, 1));
  const phase3 = Math.max(0, Math.min((progress - 0.61) / 0.34, 1));

  const scanX = phase1 * 500;
  const tr = reduced ? 'none' : undefined;

  return (
    <svg viewBox="0 0 500 380" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id="vt-scanGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#BDDA2B" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#BDDA2B" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vt-pulseGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#BDDA2B" stopOpacity="0.25" />
          <stop offset="80%" stopColor="#BDDA2B" stopOpacity="0" />
        </radialGradient>
        <filter id="vt-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {noisePts.map((p, i) => (
        <circle
          key={`n${i}`}
          cx={p.x}
          cy={p.y}
          r={1.5}
          fill="#F0F2F7"
          opacity={0.1 * (1 - phase2)}
          style={{ transition: tr ?? 'opacity 0.6s ease' }}
        />
      ))}

      {!reduced && phase1 > 0 && phase1 < 1 && (
        <g opacity={Math.max(0, 1 - phase2 * 2)}>
          <line
            x1={scanX}
            y1={0}
            x2={scanX}
            y2={380}
            stroke="#BDDA2B"
            strokeWidth={0.5}
            opacity={0.2}
          />
          <circle cx={scanX} cy={190} r={70} fill="url(#vt-scanGlow)" />
        </g>
      )}

      {signalPts.map((p, i) => {
        const revealAt = (p.x / 500) * 0.28;
        const revealed = progress > revealAt;
        const onMain = mainPathIdx.includes(i);
        const isEnd = i === mainPathIdx[mainPathIdx.length - 1];
        const dotR = phase3 > 0.5 && isEnd ? 4.5 : revealed ? 3 : 1.5;
        const dotOpacity = revealed ? (phase3 > 0 && !onMain ? 0.3 : 0.85) : 0.08;

        return (
          <circle
            key={`s${i}`}
            cx={p.x}
            cy={p.y}
            r={dotR}
            fill={revealed ? '#BDDA2B' : '#F0F2F7'}
            opacity={dotOpacity}
            filter={phase3 > 0.5 && isEnd ? 'url(#vt-glow)' : undefined}
            style={{ transition: tr ?? 'all 0.5s ease' }}
          />
        );
      })}

      {connectionData.map((c, i) => {
        const stagger = i * 0.07;
        const draw = Math.max(0, Math.min((phase2 - stagger) / 0.5, 1));
        const fadeOut = c.isMain ? 1 : Math.max(0.15, 1 - phase3 * 0.85);

        return (
          <path
            key={`c${i}`}
            d={c.d}
            stroke={c.isMain && phase3 > 0 ? '#BDDA2B' : 'rgba(240,242,247,0.15)'}
            strokeWidth={c.isMain && phase3 > 0 ? 1.5 : 0.7}
            fill="none"
            opacity={fadeOut}
            strokeDasharray={c.len}
            strokeDashoffset={c.len * (1 - draw)}
            style={{
              transition:
                tr ??
                'stroke-dashoffset 0.7s ease-out, stroke 0.4s ease, stroke-width 0.4s ease, opacity 0.4s ease',
            }}
          />
        );
      })}

      <path
        d={mainPathD}
        stroke="#BDDA2B"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={phase3}
        strokeDasharray={mainPathLen}
        strokeDashoffset={mainPathLen * (1 - phase3)}
        filter={phase3 > 0.3 ? 'url(#vt-glow)' : undefined}
        style={{ transition: tr ?? 'opacity 0.5s ease, stroke-dashoffset 0.8s ease-out' }}
      />

      {phase3 > 0.4 && (
        <polygon
          points="0,0 -9,-4.5 -9,4.5"
          fill="#BDDA2B"
          opacity={Math.min((phase3 - 0.4) * 2.5, 1)}
          transform={`translate(${lastPt.x}, ${lastPt.y}) rotate(${arrowAngle})`}
          style={{ transition: tr ?? 'opacity 0.4s ease' }}
        />
      )}

      {phase3 > 0.6 && (
        <circle
          cx={lastPt.x}
          cy={lastPt.y}
          r={25}
          fill="url(#vt-pulseGlow)"
          opacity={Math.min((phase3 - 0.6) * 2.5, 0.8)}
          style={{ transition: tr ?? 'opacity 0.5s ease' }}
        >
          {!reduced && (
            <>
              <animate attributeName="r" values="20;32;20" dur="2.5s" repeatCount="indefinite" />
              <animate
                attributeName="opacity"
                values="0.7;0.2;0.7"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </>
          )}
        </circle>
      )}
    </svg>
  );
}

function StepItem({
  step,
  isActive,
  isCompleted,
  onClick,
}: {
  step: (typeof steps)[0];
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className={`group relative w-full text-left py-5 lg:py-6 pl-5 lg:pl-6 transition-all duration-500 outline-none focus-visible:ring-1 focus-visible:ring-accent/50 rounded-lg cursor-pointer ${
        isActive ? 'opacity-100' : 'opacity-35 hover:opacity-55'
      }`}
    >
      <div
        className={`absolute left-0 top-5 bottom-5 lg:top-6 lg:bottom-6 w-px transition-all duration-500 ${
          isActive ? 'bg-accent' : isCompleted ? 'bg-accent/25' : 'bg-white/10'
        }`}
      />

      <span
        className={`font-mono text-[0.6rem] tracking-[0.15em] transition-colors duration-500 ${
          isActive ? 'text-accent' : isCompleted ? 'text-accent/35' : 'text-white/20'
        }`}
      >
        {step.n}
        {isCompleted && !isActive && <span className="ml-2 text-accent/30">&#10003;</span>}
      </span>

      <h4
        className={`mt-1.5 font-semibold tracking-[-0.01em] transition-all duration-500 ${
          isActive
            ? 'text-[1.15rem] lg:text-[1.25rem] text-white translate-x-1.5'
            : 'text-[0.95rem] lg:text-[1rem] text-white/60 translate-x-0'
        }`}
      >
        {step.title}
      </h4>

      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          isActive ? 'max-h-32 opacity-100 mt-2.5' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        <p className="text-[0.85rem] lg:text-[0.88rem] text-white/45 leading-[1.7] translate-x-1.5">
          {step.text}
        </p>
      </div>

      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          isActive ? 'max-h-10 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        <span className="font-mono text-[0.62rem] tracking-[0.2em] text-accent/60 translate-x-1.5 inline-block">
          {step.keyword}
        </span>
      </div>

      <div
        className={`overflow-hidden transition-all duration-400 ${
          isActive || isCompleted ? 'max-h-4 mt-3' : 'max-h-0 mt-0'
        }`}
      >
        <div className="translate-x-1.5 w-full h-px bg-white/[0.04] relative">
          <div
            className={`absolute inset-y-0 left-0 bg-accent transition-all duration-700 ${
              isActive ? 'w-full' : isCompleted ? 'w-full opacity-20' : 'w-0'
            }`}
          />
        </div>
      </div>
    </button>
  );
}

function MobileTrail() {
  const reduced = useReducedMotion();

  const fade = (delay = 0) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-40px' },
          transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <div className="bg-navy py-14 px-6">
      <div className="max-w-[600px] mx-auto mb-10">
        <motion.p
          {...fade(0)}
          className="text-[0.68rem] font-medium tracking-[0.04em] text-white/70 mb-3"
        >
          Método
        </motion.p>
        <motion.h3
          {...fade(0.05)}
          className="text-[1.5rem] font-semibold text-white leading-tight tracking-[-0.02em]"
        >
          Da compreensão ao <span className="italic text-accent">impacto.</span>
        </motion.h3>
        <motion.p {...fade(0.1)} className="mt-2.5 text-[0.85rem] text-white/40 leading-[1.7]">
          Cada etapa reduz incertezas e aproxima a tecnologia do resultado que o negócio realmente
          precisa.
        </motion.p>
      </div>

      <div className="max-w-[600px] mx-auto relative">
        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-white/[0.07]" />

        {steps.map((step, i) => (
          <motion.div
            key={step.n}
            {...fade(0.1 + i * 0.1)}
            className="relative pl-9 pb-10 last:pb-0"
          >
            <div className="absolute left-0 top-[3px] w-[11px] h-[11px] rounded-full border border-accent/40 bg-navy flex items-center justify-center">
              <div className="w-[5px] h-[5px] rounded-full bg-accent" />
            </div>

            <span className="font-mono text-[0.58rem] tracking-[0.15em] text-accent/50">
              {step.n}
            </span>
            <h4 className="text-[1.02rem] font-semibold text-white mt-1 mb-1.5 tracking-[-0.01em]">
              {step.title}
            </h4>
            <p className="text-[0.82rem] text-white/40 leading-[1.7]">{step.text}</p>
            <span className="font-mono text-[0.58rem] tracking-[0.2em] text-accent/35 mt-2.5 inline-block">
              {step.keyword}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DesktopTrail() {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null!);
  const [ready, setReady] = useState(false);

  const attachRef = useCallback((node: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    setReady(!!node);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ready ? containerRef : undefined,
    offset: ['start start', 'end end'],
  });
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (!ready) return;
    setProgress(v);
    setActiveStep(v < 0.33 ? 0 : v < 0.66 ? 1 : 2);
  });

  const scrollToStep = (index: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerTop = rect.top + window.scrollY;
    const scrollDist = containerRef.current.offsetHeight - window.innerHeight;
    const target = containerTop + scrollDist * (index * 0.33 + 0.165);
    window.scrollTo({ top: target, behavior: 'smooth' });
  };

  return (
    <div ref={attachRef} className="relative" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen bg-navy overflow-hidden flex items-center isolate">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <SurfaceGrain tone="dark" />

        <div className="relative z-10 mx-auto max-w-[1320px] px-6 md:px-10 lg:px-14 w-full">
          <div className="mb-8 xl:mb-10">
            <p className="mb-2.5 text-[0.68rem] font-medium tracking-[0.04em] text-white/70">
              Método
            </p>
            <h3 className="text-[clamp(1.3rem,2.2vw,1.85rem)] font-semibold tracking-[-0.02em] text-white">
              Da compreensão ao <span className="italic text-accent">impacto.</span>
            </h3>
            <p className="mt-1.5 text-[0.85rem] text-white/35 max-w-md leading-[1.7]">
              Cada etapa reduz incertezas e aproxima a tecnologia do resultado que o negócio
              realmente precisa.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-8 xl:gap-14 items-center">
            <div className="col-span-6 xl:col-span-7">
              <div className="aspect-[5/3.8]">
                <TrailVisual progress={progress} reduced={reduced} />
              </div>
            </div>

            <div className="col-span-6 xl:col-span-5" role="group" aria-label="Princípios VETOR">
              {steps.map((step, i) => (
                <StepItem
                  key={step.n}
                  step={step}
                  isActive={activeStep === i}
                  isCompleted={activeStep > i}
                  onClick={() => scrollToStep(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function subscribeTrailMode(onStoreChange: () => void) {
  const media = window.matchMedia('(min-width: 1024px)');
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function getTrailMode() {
  return window.matchMedia('(min-width: 1024px)').matches ? 'desktop' : 'mobile';
}

function getTrailModeServerSnapshot() {
  return null;
}

export function VetorTrail() {
  const mode = useSyncExternalStore(subscribeTrailMode, getTrailMode, getTrailModeServerSnapshot);

  return (
    <section id="processo">
      {mode === null ? (
        <div className="bg-navy" style={{ height: '300vh' }} />
      ) : mode === 'desktop' ? (
        <DesktopTrail />
      ) : (
        <MobileTrail />
      )}
    </section>
  );
}
