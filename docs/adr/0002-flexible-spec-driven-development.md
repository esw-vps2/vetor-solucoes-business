# ADR 0002: Flexible Spec-Driven Development core

## Status

Accepted

## Context

The template is reused by projects with different request channels. A project
may receive feature requests through human prompts, GitHub Issues, Kanban
cards, or another product-management system.

Coupling the template to one channel would require credentials, workflow
configuration, and operational decisions that do not apply to every project.
Removing the delivery model entirely, however, leaves agent responsibilities
and implementation scope ambiguous.

## Decision

The template uses the installed, channel-agnostic SDD skills:

- versioned feature specifications under `tasks/specs/`;
- `spec-driven-development` for clarification, specification, and approval;
- `planning-and-task-breakdown` for implementation plans and tasks;
- `sdd-implement` for delivery after approval;
- verification and review skills for evidence and completion.

The only supported intake channel is a human prompt in an agent conversation.
The template does not include active GitHub, Kanban, Cursor Cloud, webhook, or
credential-based automations.

The global product, design, API, and data-model documents remain durable
contracts. Specifications describe a feature's delta and promote approved,
cross-feature decisions into those contracts.

## Consequences

- A project can adopt or change its request channel without changing the
  installed SDD skills.
- Delivery agents have one approved, versioned source for feature scope and
  acceptance criteria.
- Human approval remains a required control before product behavior changes.
- Structural specification validation is handled through the installed SDD
  workflow and applicable repository quality checks.
