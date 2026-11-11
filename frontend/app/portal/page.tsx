'use client';

import { PortalPageFrame } from '@/components/layout/portal-page-frame';
import { canViewPainel } from '@/lib/portal-actions';

const portalWelcome = (
  <p className="max-w-3xl text-[clamp(2.4rem,6vw,4.8rem)] leading-[1.05] font-semibold tracking-[-0.04em] text-navy dark:text-white">
    Bem-vindo ao Portal Vector.
  </p>
);

export default function PortalPage() {
  return (
    <PortalPageFrame>
      {(session) => (canViewPainel(session.user) ? portalWelcome : null)}
    </PortalPageFrame>
  );
}
