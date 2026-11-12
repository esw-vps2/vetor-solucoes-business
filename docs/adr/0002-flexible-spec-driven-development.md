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

The template provides a channel-agnostic SDD core:

- versioned feature specifications under `tasks/specs/`;
- a lifecycle that requires human approval before implementation;
- defined role responsibilities and authority limits;
- an adapter contract that normalizes project-specific intake;
- local validation of specification structure and approval readiness.

Projects choose and configure their intake adapter in
`.agents/sdd/configuration.md`. The template does not include active GitHub,
Kanban, Cursor Cloud, webhook, or credential-based automations.

The global product, design, API, and data-model documents remain durable
contracts. Specifications describe a feature's delta and promote approved,
cross-feature decisions into those contracts.

## Consequences

- A project can adopt or change its request channel without changing the SDD
  lifecycle.
- Delivery agents have one approved, versioned source for feature scope and
  acceptance criteria.
- Human approval remains a required control before product behavior changes.
- Projects that need intake automation must implement it as a project-owned
  adapter.
