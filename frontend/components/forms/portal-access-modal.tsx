'use client';

import { PortalCredentialFlow } from '@/components/forms/portal-credential-flow';
import { Modal } from '@/components/ui/modal';

interface PortalAccessModalProps {
  onAuthenticated: () => void;
  onClose: () => void;
  open: boolean;
}

export function PortalAccessModal({ onAuthenticated, onClose, open }: PortalAccessModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="portal-modal-title" tone="light">
      {open ? (
        <PortalCredentialFlow
          appearance="light"
          headingId="portal-modal-title"
          headingLevel="h2"
          onAuthenticated={() => {
            onAuthenticated();
            onClose();
          }}
        />
      ) : (
        <h2 id="portal-modal-title" className="sr-only">
          Portal Vector
        </h2>
      )}
    </Modal>
  );
}
