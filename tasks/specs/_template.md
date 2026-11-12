---
id: PROJECT-001
title: Feature title
status: draft
source_kind: human_prompt
source_reference: chat-YYYY-MM-DD-feature-slug
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
---

# Feature title

## Context

TBD

## Desired outcome

TBD

## In scope

- TBD

## Out of scope

- TBD

## Acceptance criteria

- AC-001: TBD

## User experience

Record the visual treatment for confirmed screens. The specification agent
decides layout, tokens, composition, and visual states as a senior engineer
from `docs/design.md` and the implemented UI. Do not ask the human for those
details. Promote recurring visual decisions into `docs/design.md` on approved
delivery. Ask only when copy, branding, a new page, or a new product route is
missing.

TBD

## API and integrations

If this feature adds or changes an HTTP endpoint, record the method, path,
payload, response, errors, and authentication. The specification agent
decides these technical details as a senior engineer when the product
surface is already known. Ask only when the HTTP change would add or remove
product behavior or change security policy. Approved delivery must update
Swagger, `openapi.yaml`, and `docs/api.md` in the same change.

TBD

## Data impact

Record persistence choices needed to realize the business scope. Do not
leave table, column, or migration design as a business question.

TBD

## Security

Record authentication, authorization, data exposure, and trust-boundary
choices. Ask the human about missing security policy and leave those items
`TBD`. Do not invent or weaken security controls. Applying already-recorded
rules (input validation, hashed passwords, omitting sensitive fields) is
implementation, not a new policy.

TBD

## Testing

TBD

## Delivery

TBD

## Traceability

TBD

## Implementation evidence

- Changed: TBD
- Tests: TBD

## Validation evidence

- AC-001: TBD
