# BAWE PRD AMBIGUITY RULES
Version: 1.0  
Status: Stable methodology contract

## PURPOSE

This document defines how `prd-spec-generator` must handle missing, unclear,
conflicting, implicit, or domain-dependent information while generating a PRD.

Its objective is to prevent two opposite failures:

```text
inventing product scope
```

and:

```text
blocking the pipeline for every minor unknown
```

This document does not generate a PRD section and does not create an additional file.

All audit-relevant resolutions are recorded in:

```text
[PROJECT_ROOT]/prd.md
```

---

## CORE PRINCIPLE

Unknown information is not permission to invent.

A domain template may explain what is possible or necessary, but it cannot override
client intent or add optional scope.

Every ambiguity must be classified as exactly one of:

```text
BLOCKING
RESOLVABLE
NON_BLOCKING
```

---

# SOURCE PRECEDENCE

When two sources provide information about the same product decision, use this order:

```text
1. log-preguntas.md explicit interview answer, when directly available
2. project-context.md processed canonical context
3. Explicit user clarification in the current session
4. Selected project-type template
5. Base rules
6. Generic fallback
```

Rules:

- A lower source may complete a missing detail but may never overwrite a higher source.
- Technical fields are not product requirements unless the client explicitly made them product constraints.
- A template provides domain constraints, not client authorization.
- Generic fallback is used only when no specialized template applies.
- A contradiction affecting purpose, actors, primary scope, or requested priority features
  must not be resolved silently.

---

# DEFINITIONS

## Explicit fact

A value or decision directly stated by the client or present in the client product context.

Examples:

```text
The business has two locations.
Employees receive commission per completed service.
The complete product scope must include monthly employee closing.
```

## Required domain implication

A behavior that is logically indispensable to make an explicit requested capability work.

Example:

```text
Explicit request: users purchase products online.
Required implication: the product must support order confirmation.
```

It is not the same as a common optional feature.

## Assumption

A temporary, explicitly recorded interpretation used to complete a non-critical detail
without changing the product's core scope.

## Contradiction

Two authoritative statements that cannot both be true in the same product definition.

## Omission

Information absent from all available sources.

## Terminology variance

Different words that may refer to the same actor, entity, action, or concept.

---

# CLASSIFICATION

## 1. BLOCKING

An ambiguity is `BLOCKING` when the PRD cannot be truthful, coherent, or usable without
a product decision that the available sources do not support.

Typical blocking areas:

```text
product purpose
primary user or audience
primary problem
project type when no safe normalization exists
at least one requested priority capability
ownership of a core action
contradictory primary scope
contradictory actor permissions
unknown business rule required to define the main flow
```

Examples:

- One source says customers pay online and another says the product must never process payments.
- The context does not identify who performs the primary action.
- A commission calculation is required, but no rule indicates whether it is fixed,
  percentage-based, or service-specific.
- The requested priority feature list is empty.
- `log-preguntas.md` and `project-context.md` refer to different projects.

### Required action

```text
do not generate a falsely complete PRD
→ record the conflict or missing field
→ set the appropriate blocking code
→ halt
```

Primary codes:

```text
PRD_SOURCE_INCOMPLETE
PRD_SOURCE_CONTRADICTION
PRD_SCOPE_AMBIGUITY
```

---

## 2. RESOLVABLE

An ambiguity is `RESOLVABLE` only when all conditions are true:

```text
[ ] An explicit requested capability exists.
[ ] The missing behavior is necessary to make that capability viable.
[ ] The smallest valid interpretation can be chosen.
[ ] The interpretation does not contradict a higher-priority source.
[ ] The interpretation does not add an independent business capability.
[ ] The resolution can be stated and audited in prd.md.
```

Examples:

### Valid resolution

```text
Explicit request: ecommerce with online purchasing.
Missing detail: order confirmation behavior.
Resolution: define confirmation after a valid purchase flow.
Reason: the requested transaction cannot finish without an observable result.
```

### Invalid resolution

```text
Explicit request: product catalog.
Missing detail: loyalty program.
Resolution: add points and rewards.
```

A loyalty program is common in some ecommerce products, but it is not required for a catalog.

### Required action

```text
choose the simplest supported interpretation
→ record source, decision, and rationale in prd.md
→ include only the required behavior
```

Use the label:

```text
RESOLVABLE
```

---

## 3. NON_BLOCKING

An ambiguity is `NON_BLOCKING` when the PRD can remain coherent and testable without
settling the exact value during this stage.

Typical examples:

- final marketing copy;
- final image assets;
- exact success target not supplied by the client;
- optional future integration provider;
- final legal text supplied later;
- minor display preferences not affecting a main flow;
- a named content item that can be represented as configurable content.

### Required action

Choose one:

```text
A. Leave the value explicitly open in the PRD.
B. Record a conservative assumption in prd.md.
C. Move the undecided capability to Deferred Scope.
D. Mark the item Out of Scope.
```

The chosen action must not alter the core product scope.

Use the label:

```text
NON_BLOCKING
```

---

# DECISION PROCEDURE

For every unclear item, follow this sequence:

```text
1. Is the value explicitly stated?
   ├── YES → use it.
   └── NO

2. Do authoritative sources contradict each other?
   ├── YES → BLOCKING: PRD_SOURCE_CONTRADICTION.
   └── NO

3. Is the value necessary to understand the product purpose, actor, main flow,
   core business rule, or requested Confirmed Product Scope?
   ├── YES
   │    ├── Can it be derived as the smallest necessary domain implication?
   │    │    ├── YES → RESOLVABLE.
   │    │    └── NO → BLOCKING.
   │    └──
   └── NO

4. Can the exact value remain open without changing product behavior?
   ├── YES → NON_BLOCKING.
   └── NO

5. Is the item merely common or attractive for this project type?
   ├── YES → do not add it.
   └── NO → classify using the previous rules.
```

---

# ALLOWED INFERENCE

The generator may infer only the supported behavior needed to complete an explicitly
requested capability.

Allowed inference must be:

```text
necessary
minimal
technology-neutral
non-contradictory
auditable
within the declared scope
```

Examples:

- A booking request requires an observable confirmation or rejection state.
- A login capability requires a way to reject invalid credentials.
- A multi-location operational report requires identifying the relevant location.
- An online order requires an observable order state.
- A record-editing capability requires selecting an existing record.

These are enabling behaviors, not new independent modules.

---

# FORBIDDEN INFERENCE

Do not infer these merely because they are common:

- authentication;
- social login;
- multiple roles;
- administrator panels;
- online payments;
- coupons;
- loyalty programs;
- email or push notifications;
- analytics dashboards;
- recommendation engines;
- ratings and reviews;
- chat;
- export to PDF or spreadsheet;
- audit logs;
- multi-language support;
- offline mode;
- subscriptions;
- invoicing;
- maps;
- third-party integrations;
- AI features;
- advanced search;
- complex permissions;
- enterprise scalability.

They may be included only when:

```text
explicitly requested
OR
strictly required by an explicit capability
```

If they are useful but unnecessary, place them in Deferred Scope only when the source
or template provides a grounded reason. Otherwise omit them entirely.

---

# BUSINESS RULE AMBIGUITY

Business rules require stricter treatment because they change outcomes.

Never invent:

- percentages;
- prices;
- commissions;
- thresholds;
- deadlines;
- status transitions;
- cancellation windows;
- refund rules;
- approval rules;
- required fields;
- permission ownership;
- inventory behavior;
- tax behavior;
- legal obligations.

Classification:

```text
Rule required for primary flow + no safe supported path
→ BLOCKING

Rule not required for primary flow
→ NON_BLOCKING or Out of Scope

Rule has one minimal, domain-inherent result
→ RESOLVABLE only when all conditions are met
```

Example:

```text
Known: commission depends on the performed service.
Unknown: exact percentage for each service.
Result: BLOCKING if the complete product scope must calculate payout amounts.
```

The generator must not choose an arbitrary percentage.

---

# TERMINOLOGY NORMALIZATION

Terminology variance is resolvable when the concepts are semantically identical.

Procedure:

```text
collect terms
→ compare responsibilities and actions
→ choose one canonical term
→ preserve distinct terms only when they represent distinct actors or entities
→ record normalization in prd.md
```

Example:

```text
"customer", "client", and "buyer"
→ canonical term: Customer
```

Do not merge terms when their permissions or goals differ.

Example:

```text
Visitor
Customer
Administrator
```

These remain separate actors.

---

# SOURCE CONFLICT RULES

## Non-conflicting enrichment

A lower-priority source adds a detail not addressed by a higher source and does not
change its meaning.

Result:

```text
may be used, subject to scope and inference rules
```

## Correctable wording difference

Sources describe the same decision with different non-exclusive wording.

Result:

```text
normalize terminology
```

## Core contradiction

Sources disagree about:

- purpose;
- primary actor;
- required priority feature;
- ownership of a critical action;
- business rule affecting the result;
- inclusion versus explicit exclusion.

Result:

```text
BLOCKING
PRD_SOURCE_CONTRADICTION
```

Do not choose the most convenient statement.

## Technical-versus-product conflict

`project-context.md` contains a technical default that appears inconsistent with
product wording.

Result:

```text
product context controls product requirements
technical default is ignored for PRD generation
```

Architecture will resolve implementation later.

---

# TEMPLATE USAGE RULES

The selected project-type template can classify items as:

```text
domain-required
conditional
optional
Not-included-by-default
```

Apply them as follows:

## Domain-required

Include only when the corresponding explicit product capability activates the requirement.

## Conditional

Include only when its stated condition exists in the project context.

## Optional

Do not place in complete product scope without explicit client support.

## Not-included-by-default

Place in Deferred Scope only when the client requested or clearly anticipated it.
Otherwise omit it.

A template is never a feature checklist to copy.

---

# RECORDING CONTRACT — prd.md

Every ambiguity resolution that affects the generated PRD must record:

```text
id
topic
classification
source
missing_or_conflicting_information
decision
rationale
affected_prd_elements
attempt
```

Recommended format:

```markdown
## Ambiguity Resolutions

### AMB-001
- Topic: Customer-facing access
- Classification: NON_BLOCKING
- Source: project-context.md
- Missing information: No customer account was requested.
- Decision: Do not include customer authentication in complete product scope.
- Rationale: The primary operational flow can be completed without it.
- Affected elements: Confirmed Product Scope, Out of Scope
- Attempt: 1
```

For contradictions:

```markdown
## Source Conflicts

### CONFLICT-001
- Topic: Payment handling
- Sources: log-preguntas.md / project-context.md
- Conflict: Online payment required vs payment explicitly excluded.
- Result: PRD_SOURCE_CONTRADICTION
```

Do not create another ambiguity file.

---

# ERROR CODES

## `PRD_SOURCE_INCOMPLETE`

Use when a critical source field is absent and cannot be safely resolved.

Examples:

- missing purpose;
- missing primary audience;
- empty priority capability list;
- incomplete interview state.

## `PRD_SOURCE_CONTRADICTION`

Use when authoritative sources contain mutually exclusive core decisions.

## `PRD_SCOPE_AMBIGUITY`

Use when a capability cannot be reliably classified as complete product scope, Deferred Scope, or Out of Scope
and the decision materially changes the product delivery.

## `PRD_UNSUPPORTED_INFERENCE`

Use when the draft contains a feature or rule not supported by a source or necessary
domain implication.

Normally repairable by removing or rewriting the unsupported element.

## `PRD_UNTRACKED_ASSUMPTION`

Use when the draft relies on an assumption not recorded in `prd.md`.

Normally repairable by recording, revising, or removing the assumption.

## `PRD_TERMINOLOGY_CONFLICT`

Use when one concept is represented by incompatible names or two distinct actors were
incorrectly merged.

Normally repairable.

---

# REPAIR RULES

When `prd-validation-gate` returns an ambiguity-related repairable error:

```text
read the finding
→ locate the affected source chain
→ reapply this document
→ change only the affected PRD elements
→ update prd.md
→ rerun complete validation
```

Do not:

- regenerate valid sections;
- add scope during repair;
- solve a blocking source contradiction with an assumption;
- create a new user-facing question for a repairable defect;
- exceed the two-attempt policy.

After the second failed generation or repair attempt:

```text
PRD_REPAIR_EXHAUSTED
→ HARD_HALT
```

---

# FINAL CHECK

Before accepting any ambiguity resolution:

```text
[ ] Did a higher-priority source explicitly decide this?
[ ] Is there a real contradiction?
[ ] Is the information required for the primary product flow?
[ ] Is the inference the smallest possible one?
[ ] Does it add a new independent capability?
[ ] Does it alter Confirmed Product Scope?
[ ] Is it recorded in prd.md?
[ ] Can prd-validation-gate verify the decision?
```

---

## FINAL RULE

When evidence is weak, reduce scope.

Do not increase certainty by inventing detail.
