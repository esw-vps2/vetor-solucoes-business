'use client';

import { TenantAiPricingSettings } from '@/components/admin/tenant-ai-pricing-settings';
import { TenantMfaSettings } from '@/components/admin/tenant-mfa-settings';
import { PortalPageFrame } from '@/components/layout/portal-page-frame';

export default function PortalAdministradorPage() {
  return (
    <PortalPageFrame pageTitle="Administrador">
      {(session) =>
        session.user.profile === 'Administrador' ? (
          <>
            <TenantMfaSettings />
            <TenantAiPricingSettings />
          </>
        ) : null
      }
    </PortalPageFrame>
  );
}
