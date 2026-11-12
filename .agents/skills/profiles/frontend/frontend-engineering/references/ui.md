# UI implementation skill

## Goal

Implement confirmed product interfaces accessibly, following and extending
the consolidating visual system.

## Sources of truth

1. `docs/product.md` for routes, copy, behavior, and product scope
2. `docs/design.md` for Figma references, tokens, assets, and responsive
   decisions
3. `docs/conventions.md` for component and API-client placement

If a required business or security decision is empty or `TBD`, ask before
creating it. Decide visual treatment from `docs/design.md` without asking.

## Implementation

- Use a Figma reference when `docs/design.md` provides one.
- Without a Figma file, extend the consolidating visual system: reuse tokens
  and primitives, decide layout and visual states, and promote repeated
  choices into `docs/design.md` in the same delivery.
- Do not invent branding, marketing sections, or a competing color system.
  Do not invent PWA assets unless the product requires them.
- Reuse a component when a repeated product or visual pattern already exists
  or is being consolidated here.
- Use Tailwind CSS by default. Add UI libraries only when a documented
  requirement justifies them.

## Responsiveness and accessibility

- Follow the viewports and interaction states defined in the design or product
  contract.
- Use semantic HTML, keyboard support, focus states, labels, contrast, and
  meaningful alternative text.
- Keep content usable at the viewports required by the product.

## Verification

- Compare against `docs/design.md` and the consolidating UI pattern.
- Test interactive behavior and user-visible feedback.
- Check the relevant responsive and accessibility requirements before
  completion.
