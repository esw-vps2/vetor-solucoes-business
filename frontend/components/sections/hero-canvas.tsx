'use client';

import { useEffect, useRef } from 'react';

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -1000, y: -1000 });
  const raf = useRef(0);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let w = 0,
      h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = w;
      c.height = h;
    };
    resize();
    window.addEventListener('resize', resize);
    const onMouse = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouse);

    const orbs = Array.from({ length: 4 }, (_, i) => ({
      x: w * (0.3 + i * 0.15),
      y: h * (0.3 + (i % 2) * 0.3),
      r: 200 + i * 80,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.1,
      hue: i % 2 === 0 ? '189,218,43' : '100,140,220',
      opacity: 0.025 + (i % 2) * 0.008,
    }));

    let t = 0;
    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.002;

      for (const o of orbs) {
        o.x += o.vx + Math.sin(t + o.r) * 0.3;
        o.y += o.vy + Math.cos(t * 0.7 + o.r) * 0.2;
        if (o.x < -o.r || o.x > w + o.r) o.vx *= -1;
        if (o.y < -o.r || o.y > h + o.r) o.vy *= -1;

        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${o.hue}, ${o.opacity})`);
        g.addColorStop(0.6, `rgba(${o.hue}, ${o.opacity * 0.3})`);
        g.addColorStop(1, `rgba(${o.hue}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const m = mouse.current;
      if (m.x > 0) {
        const mg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 180);
        mg.addColorStop(0, 'rgba(189,218,43,0.03)');
        mg.addColorStop(1, 'rgba(189,218,43,0)');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 180, 0, Math.PI * 2);
        ctx.fill();
      }

      raf.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}
