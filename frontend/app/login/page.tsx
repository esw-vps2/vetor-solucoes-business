import { Suspense } from 'react';
import { DedicatedPortalLogin } from '@/components/forms/dedicated-portal-login';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <DedicatedPortalLogin />
    </Suspense>
  );
}
