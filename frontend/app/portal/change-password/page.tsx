import { Suspense } from 'react';
import { ChangePasswordForm } from '@/components/forms/change-password-form';

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-navy text-text-secondary">
          <p role="status">Carregando...</p>
        </main>
      }
    >
      <ChangePasswordForm />
    </Suspense>
  );
}
