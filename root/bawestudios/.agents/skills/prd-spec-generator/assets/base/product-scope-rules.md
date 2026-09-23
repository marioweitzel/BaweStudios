# COMPLETE PRODUCT SCOPE RULES

Version: 1.0

## PURPOSE

The interview's priority answer defines the priority build signal.

It is not the full product boundary. Complete product scope is derived from all
interview answers, recorded inferences and explicit client clarifications.
A5 is the complete functional vision captured during the interview.
A_PRIORITIES only orders construction.
Any supported A5 item not named in A_PRIORITIES remains pending product scope,
not discarded scope.

The delivered product must still be functional, professional and
client-presentable.

Do not use build priorities language to justify a demo-like, unfinished, internally worded or
low-quality product.

---

# product OBJECTIVES

Deliver value quickly.

Reduce uncertainty.

Deliver the requested core business value.

Enable validation without exposing test artifacts to the client.

Support client review as a real product surface.

---

# product delivery MUST INCLUDE

Core user flow.

Critical features.

Basic authentication if required.

Minimum administration.

Error handling.

Basic security.

Basic validations.

Client-presentable copy, data states and visible surfaces.

Objective, coherent product improvements needed for usability, trust,
professional finish or domain clarity.

---

# product delivery MUST NOT INCLUDE BY DEFAULT

Microservices

AI assistants

Analytics

Recommendation engines

Notifications unless critical

Advanced reports

Complex permissions

Integrations without business value

Multi language unless required

Offline mode

Expansion beyond the requested marketplace or directory model

Enterprise scalability

Anything unsupported by client intent, recorded inference or domain necessity.

---

# DECISION RULE

For every feature ask:

Is this feature supported by A5, A7, business rules, explicit client answers,
recorded inference or domain necessity?

YES

Keep it in complete product scope unless contradicted or explicitly postponed.

NO

Move it to Deferred Scope only when it is a valid but unsupported or postponed
idea. Move it to Out of Scope when it is contradicted, unsafe, or likely feature
creep.

Then ask:

Is this feature named in A_PRIORITIES or necessary before another supported
feature can work?

YES

Build earlier.

NO

Keep it as pending product scope; do not discard it.

---

# FEATURE PRIORITY

Critical

Build first because other supported product behavior depends on it or because it
anchors the primary value.

Important

Build after critical behavior while product scope remains supported by sources.

Optional

Deferred Scope only if unsupported, explicitly postponed or blocked by an
unresolved decision.

---

# SUCCESS DEFINITION

The product delivery is successful if:

Users can complete the primary flow.

Business value exists.

Core functionality works.

Acceptance Criteria pass.

Application can be shown to a paying client without looking like a test/demo
environment.

Application can be deployed.

---

# COMMON MISTAKES

Trying to impress.

Adding too many features.

Optimizing too early.

Building for millions of users.

Designing for every future scenario.

Confusing complete product scope with Prototype.

Confusing small scope with low quality.

Leaving visible demo/test credentials, QA/readiness/validation data or internal
construction copy in client-facing UI.

---

# FINAL CHECKLIST

□ Covers the complete supported product scope.

□ Can be reviewed by the client as a real product.

□ Can be deployed.

□ Can be tested.

□ Has clear business value.

□ Uses A_PRIORITIES only to order construction.

□ Moves only unsupported, postponed or blocked items to Deferred Scope.
