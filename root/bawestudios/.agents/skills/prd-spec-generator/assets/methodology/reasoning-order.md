# BAWE PRD REASONING ORDER
Version: 1.0  
Status: Stable methodology contract

## PURPOSE

This document defines the mandatory reasoning sequence used by `prd-spec-generator`
before and during PRD composition.

It controls the order in which product knowledge is derived.

It does **not** define the final Markdown structure.  
It does **not** generate an additional project file.  
It does **not** authorize technical implementation decisions.

The final document structure is defined by `base/prd-base.md`.

---

## SCOPE

This methodology begins only after the interview has been completed and these files exist:

```text
[PROJECT_ROOT]/project-context.md
```

It ends when the generator has enough grounded product information to compose and
self-evaluate:

```text
[PROJECT_ROOT]/prd.md
```

It does not cover:

- architecture;
- technology selection;
- database design;
- API design;
- implementation planning;
- effort estimation;
- code generation;
- deployment.

---

## INPUTS

### Project sources

```text
project-context.md
```

Primary processed source for product content:

- purpose;
- problem;
- audience;
- personas;
- primary actions;
- complete functional vision from A5;
- construction order from A_PRIORITIES;
- brand and visual references;
- expected volume;
- explicit client constraints.

```text
log-preguntas.md
```

Raw source used to:

- verify interview completion;
- recover nuance not preserved in `project-context.md`;
- trace requirements back to explicit user answers;
- detect contradictions with the processed context.

Technical decisions found in `project-context.md` must not be copied into the PRD.

### Motor knowledge

```text
methodology/ambiguity-rules.md
methodology/prd-writing-rules.md
base/product-scope-rules.md
base/user-stories.md
base/acceptance-criteria.md
base/prd-base.md
template-registry.json
project-types/[normalized_type]/prd-template.md
methodology/validation-rules.md
```

---

## OUTPUT

This file produces no independent artifact.

Its output is an internal, temporary product model used to compose `prd.md`.

Conceptually, that model contains:

```text
source_facts
product_identity
problem
actors
needs
main_flows
functional_requirements
business_rules
user_stories
acceptance_criteria
scope
non_functional_requirements
success_metrics
risks
assumptions
source_conflicts
```

Do not create `prd.json`, a reasoning log, a chain-of-thought file, or any other
parallel artifact.

Only decisions that require auditability are recorded in the relevant PRD sections.

---

## GOLDEN SEQUENCE

The generator must reason in this order:

```text
sources
→ product identity
→ problem
→ users and actors
→ user needs
→ product boundary
→ main flows
→ functional requirements
→ business rules
→ user stories
→ acceptance criteria
→ scope
→ non-functional requirements
→ success metrics
→ risks and assumptions
→ PRD composition
→ self-validation
```

Never start with a feature list.

A feature is valid only when it can be derived from a user need, an explicit client
request, or a domain obligation required to make an explicit request viable.

---

# EXECUTION PROTOCOL

## STEP 0 — LOAD AND FREEZE SOURCES

Read all mandatory sources before composing any PRD section.

Create an internal source inventory:

```text
source
field or statement
value
confidence
scope relevance
conflict status
```

Rules:

- Do not write the PRD while sources are still being discovered.
- Do not silently replace one source with another.
- Do not use the project template as a substitute for missing client intent.
- Apply `ambiguity-rules.md` to every missing, unclear, or conflicting item.

### Exit condition

Proceed only when:

```text
project_name is known
project_type is known or can be normalized
purpose is known
at least one primary user or audience is known
at least one requested product capability is known as the priority signal
interview completion is confirmed
```

Otherwise stop with the appropriate blocking code.

---

## STEP 1 — DEFINE PRODUCT IDENTITY

Determine:

```text
project_name
original_project_type
normalized_project_type
purpose
primary value proposition
primary outcome
```

The product identity must answer:

> What product is being requested, for whom, and what result should it create?

Do not describe features yet.

### Exit condition

The identity can be stated in one clear paragraph without implementation language.

---

## STEP 2 — DEFINE THE PROBLEM

Derive the problem from the client context.

Separate:

```text
current situation
pain or limitation
affected users
business or operational consequence
desired improvement
```

Rules:

- Do not rewrite the requested solution as the problem.
- Do not create a problem merely to justify a common feature.
- Do not broaden the problem beyond the interview evidence.

Bad:

> The client needs a dashboard because dashboards are modern.

Good:

> The manager currently calculates employee commissions manually, which consumes
> time and creates risk of monthly calculation errors.

### Exit condition

Every later product feature can be connected to the stated problem.

---

## STEP 3 — IDENTIFY USERS AND ACTORS

Create the canonical actor list.

For each actor determine:

```text
canonical_name
goal
responsibility
primary_actions
permissions explicitly required
source
```

Rules:

- One actor must have one stable name.
- Do not use synonyms for the same actor.
- Do not create roles only because a template contains them.
- Distinguish a user from a stakeholder.
- Distinguish a primary actor from a secondary actor.

If the context says “client”, “customer”, and “buyer” but they represent the same
person, choose one canonical term and register the normalization in `prd.md`.

### Exit condition

Every requested action belongs to a known actor.

---

## STEP 4 — DERIVE USER NEEDS

For every actor, derive needs before features.

Use this chain:

```text
actor
→ current obstacle
→ desired outcome
→ required product behavior
```

A need describes an outcome, not a screen or technical component.

Bad:

> The administrator needs a CRUD.

Good:

> The administrator needs to create, update, and deactivate services so the
> operational catalog remains current.

### Exit condition

Every proposed product behavior is justified by at least one need.

---

## STEP 5 — DEFINE THE PRODUCT BOUNDARY

Establish what the product is responsible for and what remains outside it.

Determine:

```text
core responsibility
primary transaction or action
system boundary
human actions that remain manual
external systems explicitly involved
excluded responsibilities
```

Use the selected project-type template to identify domain necessities, but apply
`ambiguity-rules.md` before incorporating them.

The template may reveal that a requested capability requires another behavior.

Example:

```text
Explicit request: sell products online
Necessary enabling behavior: checkout
```

The template may not add unrelated capabilities.

Example:

```text
No promotions requested
→ coupons are not added merely because the project is ecommerce
```

### Exit condition

The generator can explain what the product owns and what it does not own.

---

## STEP 6 — BUILD MAIN USER FLOWS

Construct complete end-to-end flows for the primary outcomes.

Each flow must include:

```text
flow_id
actor
trigger
preconditions
ordered actions
decision points
success result
relevant failure paths
end state
source requirement
```

Rules:

- A flow must end in observable value.
- Do not create isolated screens as flows.
- Do not omit required failure paths.
- Do not include infrastructure or code behavior.
- Do not create circular or unfinished flows.

### Exit condition

Every product capability participates in at least one complete flow.

---

## STEP 7 — DERIVE FUNCTIONAL REQUIREMENTS

Convert grounded product behaviors into atomic requirements.

Each requirement must contain:

```text
requirement_id
actor
required behavior
business value
source
related_flow
scope_candidate
```

Rules:

- One requirement describes one behavior.
- Requirements must be observable and testable.
- Avoid UI-specific wording unless the interface behavior is itself required.
- Do not define endpoints, tables, frameworks, or components.
- Do not duplicate the same behavior under different names.

Use stable IDs:

```text
FR-001
FR-002
FR-003
```

### Exit condition

Every requested product feature is represented by one or more functional
requirements.

---

## STEP 8 — DERIVE BUSINESS RULES

Identify rules that constrain or calculate product behavior.

Examples:

- who may perform an action;
- which status transitions are valid;
- how a commission is calculated;
- when an order is considered complete;
- what information is required before confirmation;
- what conditions prevent an action.

Each rule must contain:

```text
rule_id
statement
affected_actor_or_flow
source
validation consequence
```

Use stable IDs:

```text
BR-001
BR-002
```

Rules:

- Do not invent policies, percentages, limits, or thresholds.
- If a value is unknown and required, apply `ambiguity-rules.md`.
- Keep business rules separate from technical validations.

### Exit condition

Flows and requirements do not depend on hidden rules.

---

## STEP 9 — CREATE USER STORIES

Apply `base/user-stories.md`.

Each story must derive from an existing requirement.

Required linkage:

```text
US-001
→ actor
→ need
→ FR-001
→ business value
```

Rules:

- Do not create stories with no requirement.
- Do not combine unrelated actions.
- Do not use stories as a place to introduce new scope.
- Preserve canonical actor names.

### Exit condition

Every product functional requirement is represented by at least one user
story.

---

## STEP 10 — CREATE ACCEPTANCE CRITERIA

Apply `base/acceptance-criteria.md`.

Each criterion must derive from a story, requirement, flow, or business rule.

Required linkage:

```text
AC-001
→ US-001
→ FR-001
→ observable pass/fail result
```

Cover, when relevant:

```text
success
invalid input
permission restriction
empty state
duplicate action
business-rule violation
recoverable failure
```

Rules:

- Do not invent numeric targets.
- Do not use subjective adjectives.
- Do not accept “works correctly” as a criterion.
- Criteria must be usable by future testing skills.

### Exit condition

Every product story has sufficient criteria to determine whether it is
complete.

---

## STEP 11 — CLASSIFY SCOPE

Apply `base/product-scope-rules.md`.

Treat the priority answer as implementation ordering, not as the complete
product boundary. Derive complete product scope from all product authority. The
declared scope must still describe a functional, professional and
client-presentable product. Do not remove objective, coherent improvements
needed for usability, trust, domain clarity or professional presentation.

A5 is the complete functional vision. A_PRIORITIES only orders construction.
Any supported A5 item not named in A_PRIORITIES remains pending product scope,
not discarded scope.

Every capability must belong to exactly one category:

```text
product delivery
Deferred Scope
Out of Scope
```

Classification order:

1. Is it explicitly requested as a must-have?
2. Is it necessary to complete the primary flow?
3. Is it required to prevent the product delivery from being unusable, invalid or
   not client-presentable?
4. Can the primary problem still be solved without it?
5. Is it unsupported, contradictory, explicitly postponed, or merely common
   without product evidence?

Rules:

- A feature cannot exist in more than one scope.
- Domain-common does not mean complete product scope.
- An unresolved optional feature enters Deferred Scope only when it is
  unsupported, explicitly postponed, or blocked by unresolved decisions.
- Deferred scope preserves valid ideas only when they are unsupported, explicitly postponed, or blocked by unresolved decisions.
- Out of Scope must explicitly block likely scope expansion.

### Exit condition

The complete product scope forms a coherent, client-presentable product and
contains no unsupported optional expansion.

---

## STEP 12 — DEFINE NON-FUNCTIONAL REQUIREMENTS

Add only non-functional requirements supported by:

- explicit client context;
- expected volume;
- basic product viability;
- mandatory safety, privacy, accessibility, or localization needs;
- the selected domain template when truly applicable.

Possible categories:

```text
usability
accessibility
privacy
security behavior
performance expectation
availability expectation
localization
data retention
compatibility
```

Rules:

- Stay technology-neutral.
- Do not invent exact performance targets when none were provided.
- Use qualitative, testable expectations when exact thresholds are unavailable.
- Do not add enterprise-scale requirements to a small complete product scope.

### Exit condition

The product has the professional quality constraints needed for its declared
context.

---

## STEP 13 — DEFINE SUCCESS METRICS

Metrics must reflect whether the product solves the stated problem.

Each metric must have:

```text
metric_name
measured outcome
relationship to product goal
available target or target_status
```

Rules:

- Do not fabricate numeric targets.
- When the client did not provide a target, define what should be measured and mark
  the target as `to be established`, not as a hidden assumption.
- Avoid vanity metrics unrelated to the problem.

Examples:

```text
time required to close monthly commissions
percentage of completed booking flows
number of successfully processed orders
reduction in manual reconciliation steps
```

### Exit condition

Every metric connects to the product purpose or primary flow.

---

## STEP 14 — IDENTIFY RISKS AND ASSUMPTIONS

Separate:

```text
product risks
business risks
dependency risks
source assumptions
non-blocking unknowns
```

Rules:

- Do not present assumptions as confirmed requirements.
- Record every accepted non-blocking assumption in `prd.md`.
- Do not hide source conflicts in the risk section.
- Blocking contradictions must halt generation.

### Exit condition

No decision affecting scope, actors, or main flows remains implicit.

---

## STEP 15 — COMPOSE THE PRD

Only after Steps 0–14 are complete, render the content using `base/prd-base.md`.

Composition rules:

- Use `methodology/prd-writing-rules.md`.
- Preserve IDs and canonical terminology.
- Preserve traceability between requirements, stories, and criteria.
- Do not expose the internal reasoning process.
- Do not add new features during prose generation.
- Do not include technical implementation.

---

## STEP 16 — SELF-VALIDATE

Apply `methodology/validation-rules.md` before writing the final file.

If a repairable defect is found:

```text
repair the affected element
→ rerun the relevant reasoning step
→ rerun complete self-validation
```

If a non-repairable source defect is found:

```text
do not fabricate completion
→ halt with the corresponding blocking code
```

Only write `prd.md` after self-validation passes.

---

# TRACEABILITY CONTRACT

The preferred complete chain is:

```text
source fact
→ actor
→ need
→ flow
→ functional requirement
→ user story
→ acceptance criterion
→ scope
```

Minimum valid product chain:

```text
source fact
→ functional requirement
→ user story
→ acceptance criterion
```

No product feature may exist without this minimum chain.

Traceability may be represented through IDs and references in the PRD. It does not
require a separate traceability file.

---

# CONTROLLED BACKTRACKING

Backtracking is allowed only when a later step exposes a defect in an earlier step.

Examples:

```text
Acceptance criterion cannot be written
→ return to the related requirement or business rule.

Story has no business value
→ return to the user need.

Flow requires an unknown role
→ return to actors and apply ambiguity rules.

product delivery is not client-presentable
→ return to product boundary and scope.
```

Do not restart the entire document when only one chain is defective.

Do not expand scope during repair.

---

# FORBIDDEN REASONING PATTERNS

Never:

- begin with a generic feature checklist;
- treat the selected template as client authorization;
- infer implementation from familiar technology patterns;
- create actors to justify features;
- create stories before requirements;
- create acceptance criteria before behavior is defined;
- introduce a requirement while writing prose;
- treat branding preferences as functional scope;
- confuse expected volume with an instruction to over-engineer;
- convert every unknown into a user question;
- silently resolve a source contradiction;
- leave an unsupported assumption undocumented.

---

# COMPLETION CHECK

The reasoning process is complete only when all are true:

```text
[ ] Product identity is grounded.
[ ] Problem is distinct from the proposed solution.
[ ] Canonical actors are stable.
[ ] Every behavior solves a documented need.
[ ] Every product capability participates in a complete flow.
[ ] Every product capability has functional requirements.
[ ] Every product requirement has at least one user story.
[ ] Every product story has testable acceptance criteria.
[ ] Business rules are explicit.
[ ] Scope categories do not overlap.
[ ] Metrics relate to product value.
[ ] Risks and assumptions are explicit.
[ ] Ambiguities follow ambiguity-rules.md.
[ ] No implementation decisions entered the PRD.
[ ] validation-rules.md passes.
```

---

## FINAL RULE

Do not optimize for document length.

Optimize for a traceable chain from client intent to testable product behavior.
