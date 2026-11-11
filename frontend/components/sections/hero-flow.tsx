'use client';

import { useRef, useState, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  animate as fmAnimate,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion';

const flowSteps = [
  {
    n: '01',
    title: 'IMERSÃO',
    desc: 'Entendemos o negócio.',
    micro: 'Operação, contexto e gargalos reais.',
  },
  {
    n: '02',
    title: 'DIREÇÃO',
    desc: 'Definimos a estratégia.',
    micro: 'Prioridades claras e decisões inteligentes.',
  },
  {
    n: '03',
    title: 'CONSTRUÇÃO',
    desc: 'Aplicamos tecnologia.',
    micro: 'Software, dados e IA conectados à operação.',
  },
  {
    n: '04',
    title: 'IMPACTO',
    desc: 'Geramos resultado.',
    micro: 'Eficiência, crescimento e impacto mensurável.',
  },
];

const X_OFFSETS = [22, 36, 12, 30];

function buildCurve(wps: { x: number; y: number }[]): string {
  if (wps.length < 2) return '';
  let d = `M${wps[0].x},${wps[0].y}`;
  for (let i = 0; i < wps.length - 1; i++) {
    const c = wps[i],
      n = wps[i + 1];
    const my = (c.y + n.y) / 2;
    d += ` C${c.x},${my} ${n.x},${my} ${n.x},${n.y}`;
  }
  return d;
}

export function DesktopFlow() {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const stepEls = useRef<(HTMLElement | null)[]>([]);
  const pathEl = useRef<SVGPathElement>(null);

  const [wps, setWps] = useState<{ x: number; y: number }[]>([]);
  const [cH, setCH] = useState(420);
  const [animDone, setAnimDone] = useState(!!reduced);
  const [active, setActive] = useState(reduced ? 3 : -1);
  const [reached, setReached] = useState<Set<number>>(reduced ? new Set([0, 1, 2, 3]) : new Set());

  const prog = useMotionValue(reduced ? 1 : 0);

  useEffect(() => {
    const measure = () => {
      const c = containerRef.current;
      if (!c || c.offsetHeight === 0) return;
      const cr = c.getBoundingClientRect();
      const pts = stepEls.current.map((el, i) => {
        if (!el) return { x: X_OFFSETS[i], y: i * 110 + 14 };
        const r = el.getBoundingClientRect();
        return { x: X_OFFSETS[i], y: r.top - cr.top + 14 };
      });
      setWps(pts);
      setCH(cr.height);
    };
    const t = setTimeout(measure, 80);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    if (reduced || wps.length < 4) return;
    const ctrl = fmAnimate(prog, 1, {
      duration: 2.8,
      delay: 1.0,
      ease: [0.22, 0.68, 0.36, 1],
      onComplete: () => {
        setAnimDone(true);
        setActive(3);
      },
    });
    return () => ctrl.stop();
  }, [wps, reduced, prog]);

  useMotionValueEvent(prog, 'change', (v) => {
    if (animDone) return;
    setActive(v < 0.02 ? -1 : v < 0.3 ? 0 : v < 0.6 ? 1 : v < 0.9 ? 2 : 3);
    const s = new Set<number>();
    if (v >= 0.02) s.add(0);
    if (v >= 0.3) s.add(1);
    if (v >= 0.6) s.add(2);
    if (v >= 0.9) s.add(3);
    setReached(s);
  });

  const onEnter = (i: number) => {
    if (animDone) setActive(i);
  };
  const onLeave = () => {
    if (animDone) setActive(3);
  };

  const wp = wps.length === 4 ? wps : X_OFFSETS.map((x, i) => ({ x, y: i * 110 + 14 }));
  const pathD = buildCurve(wp);
  const vb = `0 0 48 ${cH}`;
  const dotWp = wp[Math.max(active, 0)];

  const aDotX = useTransform(prog, [0, 0.3, 0.6, 0.9, 1], wp.map((w) => w.x).concat(wp[3].x));
  const aDotY = useTransform(prog, [0, 0.3, 0.6, 0.9, 1], wp.map((w) => w.y).concat(wp[3].y));
  const aPathLen = useTransform(prog, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className="relative pl-16">
      <svg
        className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none overflow-visible"
        viewBox={vb}
        preserveAspectRatio="xMidYMin meet"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="hf-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#BDDA2B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#BDDA2B" stopOpacity="0" />
          </radialGradient>
          <filter id="hf-softglow">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {wp.map((p, i) => (
          <g key={`m${i}`}>
            <line
              x1="0"
              y1={p.y}
              x2="48"
              y2={p.y}
              stroke="white"
              strokeOpacity="0.025"
              strokeDasharray="2 6"
            />
            <text
              x="46"
              y={p.y - 5}
              fontSize="5"
              fill="white"
              fillOpacity="0.06"
              fontFamily="monospace"
              textAnchor="end"
            >
              {flowSteps[i].n}
            </text>
          </g>
        ))}

        <path d={pathD} stroke="white" strokeWidth={0.7} fill="none" strokeOpacity={0.05} />

        <motion.path
          ref={pathEl}
          d={pathD}
          stroke="#BDDA2B"
          strokeWidth={1.2}
          fill="none"
          strokeLinecap="round"
          strokeOpacity={0.45}
          style={{ pathLength: aPathLen }}
        />

        {wp.map((p, i) => {
          const isAct = active === i;
          const isR = reached.has(i);
          return (
            <motion.circle
              key={`d${i}`}
              cx={p.x}
              cy={p.y}
              animate={{
                r: isAct ? 5 : isR ? 3 : 1.8,
                fillOpacity: isAct ? 1 : isR ? 0.45 : 0.12,
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              fill={isR ? '#BDDA2B' : '#fff'}
              filter={isAct ? 'url(#hf-softglow)' : undefined}
            />
          );
        })}

        {active >= 0 && reached.has(active) && (
          <motion.circle
            cx={wp[active].x}
            cy={wp[active].y}
            r={16}
            fill="url(#hf-glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 0.4 }}
          />
        )}

        {!animDone && (
          <motion.circle
            r={3}
            fill="#BDDA2B"
            filter="url(#hf-softglow)"
            style={{ cx: aDotX, cy: aDotY }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
          />
        )}

        {animDone && (
          <motion.circle
            r={3.5}
            fill="#BDDA2B"
            filter="url(#hf-softglow)"
            animate={{ cx: dotWp.x, cy: dotWp.y }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        )}

        {reached.has(3) && (
          <motion.polygon
            points={`${wp[3].x},${wp[3].y + 14} ${wp[3].x - 4},${wp[3].y + 8} ${wp[3].x + 4},${wp[3].y + 8}`}
            fill="#BDDA2B"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ delay: animDone ? 0 : 0.3, duration: 0.4 }}
          />
        )}

        {active === 3 && reached.has(3) && (
          <motion.circle
            key="pulse"
            cx={wp[3].x}
            cy={wp[3].y}
            initial={{ r: 6, opacity: 0 }}
            animate={{ r: 28, opacity: [0, 0.6, 0] }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            fill="url(#hf-glow)"
          />
        )}
      </svg>

      <div className="flex flex-col gap-2">
        {flowSteps.map((step, i) => {
          const isAct = active === i;
          const isR = reached.has(i);
          const isDone = isR && !isAct;

          return (
            <button
              key={step.n}
              ref={(el) => {
                stepEls.current[i] = el;
              }}
              onMouseEnter={() => onEnter(i)}
              onMouseLeave={onLeave}
              onClick={() => onEnter(i)}
              onFocus={() => onEnter(i)}
              onBlur={onLeave}
              tabIndex={0}
              aria-pressed={isAct}
              className={`group text-left min-h-[88px] py-3 transition-all duration-500 outline-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded cursor-pointer ${
                isAct
                  ? 'opacity-100 translate-x-1'
                  : isR
                    ? 'opacity-45 hover:opacity-65'
                    : 'opacity-20'
              }`}
            >
              <span
                className={`font-mono text-[0.56rem] tracking-[0.15em] transition-colors duration-400 ${
                  isAct ? 'text-accent' : isDone ? 'text-accent/25' : 'text-white/12'
                }`}
              >
                {step.n}
                {isDone && <span className="ml-1.5 text-accent/20">&#10003;</span>}
              </span>

              <p
                className={`mt-0.5 font-semibold tracking-[0.04em] uppercase transition-all duration-400 ${
                  isAct ? 'text-[0.98rem] text-white' : 'text-[0.8rem] text-white/40'
                }`}
              >
                {step.title}
              </p>

              <div
                className={`overflow-hidden transition-all duration-500 ease-out ${
                  isAct ? 'max-h-20 opacity-100 mt-1.5' : 'max-h-0 opacity-0 mt-0'
                }`}
              >
                <p className="text-[0.78rem] text-white/50 leading-relaxed">{step.desc}</p>
                <p className="text-[0.68rem] text-white/20 mt-0.5 font-mono tracking-wide">
                  {step.micro}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MobileFlow() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced) {
      return;
    }
    let step = 0;
    const iv = setInterval(() => {
      step++;
      if (step >= 4) {
        clearInterval(iv);
        return;
      }
      setActive(step);
    }, 700);
    return () => clearInterval(iv);
  }, [reduced]);

  const current = reduced ? 3 : active;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.0 }}
    >
      <div className="flex items-center justify-center">
        {flowSteps.map((_, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => setActive(i)}
              aria-pressed={current === i}
              aria-label={flowSteps[i].title}
              className={`relative w-2.5 h-2.5 rounded-full transition-all duration-400 cursor-pointer ${
                current === i
                  ? 'bg-accent scale-125 shadow-[0_0_8px_rgba(189,218,43,0.3)]'
                  : i <= current
                    ? 'bg-accent/35'
                    : 'bg-white/12'
              }`}
            />
            {i < 3 && (
              <div
                className={`w-7 h-px transition-colors duration-400 ${
                  i < current ? 'bg-accent/25' : 'bg-white/[0.06]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-center mt-2.5 font-mono text-[0.52rem] text-white/16 tracking-[0.15em]">
        {flowSteps[current].n} / 04
      </p>

      <div className="mt-3 text-center min-h-[56px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={reduced ? {} : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? {} : { opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-[0.82rem] font-semibold text-white tracking-[0.03em] uppercase">
              {flowSteps[current].title}
            </p>
            <p className="text-[0.75rem] text-white/45 mt-0.5">{flowSteps[current].desc}</p>
            <p className="text-[0.62rem] text-white/20 mt-0.5 font-mono tracking-wide">
              {flowSteps[current].micro}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
