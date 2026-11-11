import { buildWhatsAppClickToChatUrl, WHATSAPP_READY_SPEECH } from '@/lib/whatsapp';

interface WhatsAppContactProps {
  number?: string;
}

function RobotMark() {
  return (
    <svg role="img" aria-label="Robô" viewBox="0 0 64 72" className="h-16 w-14">
      <circle cx="32" cy="7" r="4" fill="#BDDA2B" />
      <rect x="30.5" y="11" width="3" height="8" rx="1.5" fill="#8892A6" />
      <rect x="10" y="20" width="44" height="36" rx="14" fill="#F0F2F7" />
      <rect x="18" y="28" width="28" height="16" rx="8" fill="#0E1628" />
      <circle cx="24" cy="36" r="3.2" fill="#BDDA2B" />
      <circle cx="40" cy="36" r="3.2" fill="#BDDA2B" />
      <path
        d="M24 48c3.4 4 12.6 4 16 0"
        fill="none"
        stroke="#0E1628"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
      <rect x="20" y="58" width="24" height="12" rx="6" fill="#141E35" />
    </svg>
  );
}

export function WhatsAppContact({
  number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
}: WhatsAppContactProps) {
  const href = buildWhatsAppClickToChatUrl(number);

  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`WhatsApp. ${WHATSAPP_READY_SPEECH}`}
      className="fixed right-6 bottom-6 z-40 flex flex-col items-end gap-2 sm:right-10 sm:bottom-10 sm:flex-row lg:right-14 lg:bottom-14 focus-visible:rounded-3xl focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
    >
      <span className="max-w-[13.5rem] rounded-2xl bg-off-white px-3.5 py-2.5 text-left text-sm leading-5 font-medium text-text-dark shadow-[0_12px_32px_rgba(6,11,24,0.28)]">
        {WHATSAPP_READY_SPEECH}
      </span>
      <span className="whatsapp-ready-motion flex min-h-11 min-w-11 items-end">
        <RobotMark />
      </span>
    </a>
  );
}
