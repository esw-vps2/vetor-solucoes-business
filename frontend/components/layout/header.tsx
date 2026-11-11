'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { scrollToHash } from '@/lib/scroll-to-hash';
import { buildWhatsAppClickToChatUrl } from '@/lib/whatsapp';
import { isStandaloneDisplay, subscribeStandaloneDisplay } from '@/lib/pwa';

const links = [
  { label: 'Método', href: '#processo' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Empresa', href: '#origem' },
  { label: 'Projetos', href: '#projetos' },
];

const sectionIds = ['processo', 'servicos', 'origem', 'projetos', 'contato'];

export function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const whatsAppHref = buildWhatsAppClickToChatUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
  const standalone = useSyncExternalStore(
    subscribeStandaloneDisplay,
    isStandaloneDisplay,
    () => false,
  );

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);

      let current = '';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 200) {
          current = id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (href: string) => {
    scrollToHash(href);
    if (href.startsWith('#') && href.length > 1) {
      setActiveSection(href.slice(1));
    } else {
      setActiveSection('');
    }
    setOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!standalone) {
      return;
    }

    if (window.location.pathname.startsWith('/portal')) {
      return;
    }

    router.push('/portal');
  }, [router, standalone]);

  const isActive = (href: string) => href === `#${activeSection}`;

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 right-0 left-0 z-50 bg-navy/92 backdrop-blur-xl transition-all duration-500 ${
          scrolled ? 'border-b border-white/[0.06] py-3' : 'py-5'
        }`}
      >
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 md:px-10 lg:px-14">
          <a
            href="#"
            className="relative z-10 shrink-0"
            onClick={(event) => {
              event.preventDefault();
              goTo('#');
            }}
          >
            <Image
              src="/brand/logo_vetor_dark.png"
              alt="VETOR"
              width={180}
              height={54}
              className="h-14 w-auto brightness-0 invert lg:h-16"
              priority
            />
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(event) => {
                  event.preventDefault();
                  goTo(l.href);
                }}
                className={`relative px-4 py-2 text-[0.82rem] transition-colors duration-300 ${
                  isActive(l.href) ? 'text-white' : 'text-white/55 hover:text-white'
                }`}
              >
                {l.label}
                {isActive(l.href) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute bottom-0 left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-accent"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </a>
            ))}
          </nav>

          {whatsAppHref ? (
            <div className="hidden items-center gap-2 lg:flex">
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[0.78rem] font-semibold text-navy-100 transition-all duration-500 hover:shadow-[0_0_40px_rgba(189,218,43,0.25)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                Fale conosco
              </a>
            </div>
          ) : null}

          <button
            onClick={() => setOpen(!open)}
            className="relative z-10 flex h-10 w-10 flex-col items-center justify-center gap-[5px] lg:hidden"
            aria-label="Menu"
          >
            <span
              className={`h-[1.5px] w-5 bg-white transition-all duration-300 ${open ? 'translate-y-[6.5px] rotate-45' : ''}`}
            />
            <span
              className={`h-[1.5px] w-5 bg-white transition-all duration-300 ${open ? 'opacity-0' : ''}`}
            />
            <span
              className={`h-[1.5px] w-5 bg-white transition-all duration-300 ${open ? '-translate-y-[6.5px] -rotate-45' : ''}`}
            />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-start justify-center bg-navy/95 px-10 backdrop-blur-3xl"
          >
            <nav className="flex w-full flex-col gap-1">
              {links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={(event) => {
                    event.preventDefault();
                    goTo(l.href);
                  }}
                  className="py-3 text-3xl font-light text-white/90 transition-colors hover:text-accent"
                >
                  {l.label}
                </motion.a>
              ))}
              {whatsAppHref ? (
                <motion.a
                  href={whatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: links.length * 0.05 }}
                  onClick={() => setOpen(false)}
                  className="py-3 text-left text-3xl font-light text-white/90 transition-colors hover:text-accent"
                >
                  Fale conosco
                </motion.a>
              ) : null}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
