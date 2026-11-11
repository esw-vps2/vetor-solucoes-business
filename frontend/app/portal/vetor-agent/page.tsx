import { cookies } from 'next/headers';
import type { AiConversationSummary, AiMessage } from '@/lib/api/ai-agent';
import { PortalVetorAgentPage } from './vetor-agent-page';

function apiOrigin(): string {
  const internal = process.env.API_INTERNAL_URL?.trim();

  if (internal) {
    return internal.replace(/\/$/, '');
  }

  return 'http://127.0.0.1:3001';
}

async function loadInitialChat(accessToken: string): Promise<{
  conversationId: string | null;
  conversations: AiConversationSummary[];
  messages: AiMessage[];
}> {
  const headers = { cookie: `access_token=${accessToken}` };
  const origin = apiOrigin();
  const listResponse = await fetch(`${origin}/api/v1/ai/conversations`, {
    cache: 'no-store',
    headers,
  });

  if (!listResponse.ok) {
    return { conversationId: null, conversations: [], messages: [] };
  }

  const list = (await listResponse.json()) as { items?: AiConversationSummary[] };
  const conversations = list.items ?? [];
  const conversationId = conversations[0]?.id ?? null;

  if (!conversationId) {
    return { conversationId: null, conversations, messages: [] };
  }

  const historyResponse = await fetch(
    `${origin}/api/v1/ai/conversations/${conversationId}/messages`,
    { cache: 'no-store', headers },
  );

  if (!historyResponse.ok) {
    return { conversationId, conversations, messages: [] };
  }

  return {
    conversationId,
    conversations,
    messages: (await historyResponse.json()) as AiMessage[],
  };
}

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const chat = accessToken
    ? await loadInitialChat(accessToken)
    : { conversationId: null, conversations: undefined, messages: undefined };

  return (
    <PortalVetorAgentPage
      initialConversationId={chat.conversationId}
      initialConversations={chat.conversations}
      initialMessages={chat.messages}
    />
  );
}
