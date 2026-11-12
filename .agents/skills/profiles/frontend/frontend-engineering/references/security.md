# Frontend Security Skill

## Goal

Ensure every frontend implementation follows modern security practices.

## Threat model

Treat as untrusted:

* user data
* query parameters
* route parameters
* cookies
* external responses
* API content
* user-supplied URLs

## XSS

Never render external HTML directly.

Avoid:

```tsx
dangerouslySetInnerHTML
```

If it is absolutely required, sanitize before rendering.

## Secrets

Never put secrets in:

```text
NEXT_PUBLIC_*
```

Never put private tokens in code.

Never commit:

```text
.env
.env.local
credentials
private keys
API keys
```

## Authentication

Prefer cookies:

```text
HttpOnly
Secure
SameSite
```

when applicable.

Do not store sensitive tokens in localStorage without a strong architectural
justification.

## Authorization

The frontend is not the authorization layer.

Real authorization must happen on the backend.

Do not rely on:

```typescript
if (user.isAdmin)
```

as the only security mechanism.

## Input validation

Validate before sending.

Do not treat frontend validation as system protection.

The backend must validate again.

## URLs

Validate external URLs before using them for navigation or resources.

Avoid open redirects.

## External resources

Assess risk for:

* external scripts
* iframes
* analytics
* external fonts
* external images

Add external resources only when needed.

## Logging

Never log:

* tokens
* passwords
* cookies
* secrets
* unnecessary personal data

## Dependencies

Check for vulnerabilities before adding dependencies.

Avoid abandoned or unnecessary packages.

## Security review

Before finishing a feature, check:

* Is there user-controlled input?
* Is there dynamic HTML?
* Is there an external URL?
* Is there authentication?
* Is there authorization?
* Is there sensitive data?
* Is there a token?
* Is there upload?
* Is there a redirect?

If yes, review the risk explicitly.
