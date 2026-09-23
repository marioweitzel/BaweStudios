---
name: security-baseline-gate
description: Validate baseline security hygiene for auth, credentials and write-capable backend endpoints.
---

# Security Baseline Gate

## Purpose

Check that authentication, credential storage and user-writable endpoints meet
baseline security hygiene before closure. This is a hygiene floor, not an
exhaustive security audit.

## Applicability

Use this tool when:

- the objective creates or changes login, registration, password reset or
  session/token handling;
- the objective stores or reads user credentials, tokens or secrets;
- the objective adds or changes a write-capable API endpoint (create, update,
  delete) reachable by an authenticated or public client;
- the objective adds or changes role/permission enforcement;
- the objective adds or changes a realtime/WebSocket layer (Socket.IO or
  equivalent).

Skip when the objective has no backend, no auth and no user-writable endpoint,
and record why.

## Inputs

- Active objective.
- Backend route/controller/middleware files for the changed surface.
- Auth/session/token handling code.
- `role-matrix.json` when present.
- `.env.example` and `.bawe/build-directives.json` for declared auth/session
  expectations.
- Do not read `docker-compose-local.yml`/`docker-compose-vps.yml` secret
  handling here; that belongs to `docker-validation-gate`.

## Procedure

1. Check how passwords or credentials are stored: hashed with bcrypt, argon2
   or scrypt, never plain text and never unsalted MD5/SHA1 alone.
2. Check that JWT or session tokens declare an explicit, bounded expiration.
3. Check that login, registration and password-reset endpoints have
   rate-limiting or an equivalent abuse control.
4. Check that write-capable endpoints validate input shape, type and length
   for user-controlled fields (schema/validator library or equivalent
   explicit checks), not just downstream DB constraints.
5. Check that HTTP security headers (helmet or equivalent) are applied on an
   executable backend serving browser clients, including disabling framework
   fingerprint headers (e.g. Express `X-Powered-By`).
6. Check CORS configuration: explicit allowed origins for production/VPS
   delivery, not a wildcard `*` alongside credentialed requests. Check this
   separately for any realtime/WebSocket layer (e.g. Socket.IO's own `cors`/
   `origin` option) — it is a distinct configuration surface from HTTP CORS
   middleware and is not covered by checking the HTTP layer alone.
7. Check that login, registration and password-reset responses do not let a
   client distinguish whether a specific account/email exists: use one
   generic message and status across those paths instead of a distinct
   "email already registered" or "user not found" message.
8. Check that role/permission checks are enforced server-side for protected
   routes and actions, not only hidden or disabled in the UI.
9. Check that endpoints reading or writing user-owned data verify ownership
   or role before returning or modifying it.
10. Check application source files for hardcoded API keys, JWT signing
   secrets or DB credentials as literal strings; this is separate from
   `docker-validation-gate`'s check of compose/env files.
11. Summarize findings and blockers for the changed surface.

## Minimal Output

- `findings`
- `blockers`

## Blocking Errors

- Passwords or credentials stored in plain text, reversible encoding, or
  unsalted MD5/SHA1 alone.
- Login, registration or password-reset endpoint has no rate-limiting or
  equivalent abuse control.
- JWT or session token has no expiration or an effectively unbounded
  lifetime.
- A write-capable endpoint accepts user-controlled input with no shape,
  type or length validation.
- Executable backend serving browser clients has no HTTP security headers, or
  leaves a framework fingerprint header (e.g. `X-Powered-By`) exposed.
- CORS allows a wildcard origin in a production/VPS delivery configuration,
  including a realtime/WebSocket layer's own origin option.
- Login, registration or password-reset response reveals whether a specific
  account/email exists (distinct message or status between "taken"/"not
  found" and the generic case).
- A role-restricted route or action is enforced only in the UI, with no
  server-side check.
- An endpoint returns or modifies another user's data without verifying
  ownership or role.
- An API key, signing secret or DB credential is hardcoded as a literal
  string in application source code.

## Rules

- Do not treat UI-only hiding of a control as access control.
- Do not accept "it works" as security evidence; name the mechanism checked
  (hash algorithm, header present, expiration value, validator used).
- Do not duplicate `docker-validation-gate`'s check of secrets in compose or
  env files; this gate covers application code and runtime security
  behavior.
- Do not block closure for missing enterprise-grade hardening (WAF,
  penetration testing, compliance certification); this gate checks baseline
  hygiene, not an exhaustive audit.
- Do not invent auth/roles that product authority did not request; validate
  what exists against this baseline, do not expand scope.
