# Frontend Testing Skill

## Goal

Ensure frontend features are reliable.

## Priorities

Test mainly:

* forms
* authentication
* authorization
* critical navigation
* API integration
* interactive components
* error states
* loading states
* conversion flows

## Unit tests

Use for isolated logic.

## Component tests

Test behavior, not internal implementation.

Prefer:

```text
user sees
user clicks
user fills
user gets feedback
```

instead of testing React internals.

## E2E

Use for critical flows.

Example (only if the product has this flow):

```text
Home
 ↓
Contact
 ↓
Fill
 ↓
Submit
 ↓
Success
```

## Negative tests

Also test:

* invalid data
* API unavailable
* timeout
* auth error
* unauthorized user
* duplicate submit

## Definition of done

A feature is not done only because it works manually.

It must have tests proportional to the risk of the feature. Follow
`quality-gate.mdc`.
