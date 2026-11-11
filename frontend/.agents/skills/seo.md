# SEO Skill

## Goal

Make public pages crawlable, indexable, and semantically correct. Metadata
and terms: `docs/product.md`. Visual/canonical: `docs/design.md`.

If title, description, or an extra route is `TBD`, **ask**. Do not invent
keywords or pages just for SEO.

## Metadata

Every public page must have:

* title
* description
* canonical when needed
* Open Graph
* social metadata

Values come from `docs/product.md` (SEO). If `TBD`, ask.

## URLs

Document and optimize only the routes confirmed in `docs/product.md`. Do not
create routes only for SEO. Do not use a query string as a page (`/?id=123`).

## Sitemap

Include MVP routes. Dynamic content only when the product has it.

## Robots

Configure robots correctly.

Do not accidentally block public pages.

## Structured data

Use Schema.org when it adds value and the type is in the product.

Possible types (only if the product confirms): Organization, WebSite,
Article, BreadcrumbList, Service.

## Headings

Use a correct hierarchy:

```text
h1
  h2
    h3
```

Do not use headings only for visual appearance.

## Performance

SEO must consider Core Web Vitals.

Avoid:

* CLS
* excess JS
* heavy images
* unnecessary rendering

## Content

Content must be semantically relevant and not duplicated.

Do not generate artificial copy only for SEO.
