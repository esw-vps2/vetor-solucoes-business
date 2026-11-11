'use client';

import { PortalPageFrame } from '@/components/layout/portal-page-frame';
import {
  VetorAgentAccessDenied,
  VetorAgentWorkspace,
} from '@/components/vetor-agent/vetor-agent-workspace';
import type { AiConversationSummary, AiMessage } from '@/lib/api/ai-agent';
import { canUseVetorAgent } from '@/lib/portal-actions';

export function PortalVetorAgentPage({
  initialConversationId = null,
  initialConversations,
  initialMessages,
}: {
  initialConversationId?: string | null;
  initialConversations?: AiConversationSummary[];
  initialMessages?: AiMessage[];
}) {
  return (
    <PortalPageFrame flushMain pageTitle="Inteligência Artificial">
      {(session) =>
        canUseVetorAgent(session.user) ? (
          <VetorAgentWorkspace
            initialConversationId={initialConversationId}
            initialConversations={initialConversations}
            initialMessages={initialMessages}
          />
        ) : (
          <VetorAgentAccessDenied />
        )
      }
    </PortalPageFrame>
  );
}
