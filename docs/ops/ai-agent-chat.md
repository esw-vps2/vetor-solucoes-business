# AI agent operations

The AI chat uses PostgreSQL as the source of truth and RabbitMQ only as the
command broker. The API process publishes the transactional outbox. The
process in `worker-proxy-agent-ia/` consumes `ai.runs`, calls OpenRouter, and
persists the terminal result. Restarting the worker does not require
restarting the frontend or the API.

## Private network

Compose keeps PostgreSQL, RabbitMQ, and the worker on the `app` network.
The default Compose file does not publish PostgreSQL, AMQP, or the RabbitMQ
management UI. The worker health endpoint listens on port 3002 inside the
container and is not published. It returns 503 until the consumer starts and
200 after that. A missing or placeholder `OPENROUTER_API_KEY` leaves the
worker idle.

Redis remains the Power BI cache. It is not the AI broker.

## Queues

| Name            | Role                                                          |
| --------------- | ------------------------------------------------------------- |
| `ai.commands`   | Durable direct exchange for new runs                          |
| `ai.runs`       | Durable command queue. The name comes from `RABBITMQ_QUEUE`   |
| `ai.runs.retry` | Durable retry queue with the first backoff as its message TTL |
| `ai.dlx`        | Durable dead-letter exchange                                  |
| `ai.runs.dlq`   | Durable dead-letter queue                                     |

Payloads contain `eventId` and `runId` only. Messages are persistent.
Publication waits for a confirm. The consumer uses manual acknowledgement
and a prefetch equal to `AI_MAX_CONCURRENT_RUNS`. Acknowledgement happens
after the terminal row is stored. A retryable failure before any fragment
is negatively acknowledged into the retry queue. An exhausted retryable
failure is copied to the dead-letter queue and then acknowledged.

## Failure modes

- Broker unavailable after commit: the outbox row stays unpublished and the
  publisher retries. The browser does not submit again.
- Duplicate delivery: a completed run is acknowledged without a second
  provider call or a second assistant message.
- Provider failure after a fragment: the run becomes `FAILED` with
  `Não foi possível concluir a operação.` and is not sent to the provider
  again.
- Relationship mismatch: the worker does not call OpenRouter.
- Dev backend rebuild: the worker dev supervisor restarts when
  `backend/dist/modules/ai-agent/ai-worker.module.js` disappears or is
  replaced. A failed import does not leave the consumer waiting only on its
  own entry file.
- SSE disconnect or a missed terminal event: fragments are not replayed. The
  client reloads the run and the message history. While a run is active, the
  chat also reloads that status on an interval.

## Limits

Concurrency, history length, token budget, timeouts, SSE connections, and
the message rate limit are environment values. Conversation creation uses
`AI_CONVERSATION_RATE_LIMIT_MAX` and `AI_CONVERSATION_RATE_LIMIT_WINDOW`.
Message submission uses `AI_MESSAGE_RATE_LIMIT_MAX` and
`AI_MESSAGE_RATE_LIMIT_WINDOW`. Both counters stay in process memory. SSE uses
`AI_MAX_SSE_CONNECTIONS` for the process and
`AI_MAX_SSE_CONNECTIONS_PER_OWNER` for one authenticated owner. Those
counters are not shared across API replicas. The OpenRouter client does not
follow redirects and stops a body larger than
`AI_MAX_PROVIDER_RESPONSE_BYTES`. Row-Level Security is not enabled; every
query still filters by tenant and owner. Provider retention stays on the
OpenRouter account. The application does not send data-policy headers.
