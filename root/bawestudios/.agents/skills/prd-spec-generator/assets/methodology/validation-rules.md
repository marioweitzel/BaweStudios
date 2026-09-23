# BAWE PRD VALIDATION RULES
Version: 1.0  
Status: Stable shared validation contract

## PURPOSE

This document defines the validation contract shared by:

```text
prd-spec-generator
→ self-validation before writing the final PRD

prd-validation-gate
→ independent validation after the PRD is written
```

It determines whether `prd.md` is complete, grounded, coherent, scoped, and testable.

`prd-spec-generator` self-validation does not create a validation report file.
`prd-validation-gate` persists its observable state in `.bawe/prd-validation-gate.json`.

Validation findings are written into:

```text
[PROJECT_ROOT]/.bawe/prd-validation-gate.json
```

Audit context remains in:

```text
[PROJECT_ROOT]/prd.md
```

---

## AUTHORITATIVE INPUTS

### Files being validated

```text
[PROJECT_ROOT]/prd.md
```

### Product source

```text
[PROJECT_ROOT]/project-context.md
[PROJECT_ROOT]/log-preguntas.md
```

### Gate state

```text
[PROJECT_ROOT]/.bawe/prd-validation-gate.json
```

### Contracts

```text
base/prd-base.md
base/product-scope-rules.md
base/user-stories.md
base/acceptance-criteria.md

methodology/prd-writing-rules.md
methodology/ambiguity-rules.md
methodology/validation-rules.md
```

`reasoning-order.md` controls creation and is not an obligatory input for the independent
gate. The gate validates the observable result, not the hidden reasoning process.

The specialized project template is not required for a normal gate pass. It may be read
during repair when a finding concerns domain viability.

---

# VALIDATION OUTCOMES

Every validation run ends in exactly one outcome:

```text
PASS
NEEDS_CORRECTION
BLOCKED
```

## PASS

Use only when all mandatory checks pass and no unresolved `ERROR` or `CRITICAL`
finding remains.

Result:

```text
.bawe/prd-validation-gate.json status = PASS
next_node = adn-translator
```

## NEEDS_CORRECTION

Use when the available sources are sufficient, but `prd.md` contains defects that
`prd-spec-generator` can correct without a new client decision.

Examples:

- missing section;
- duplicated requirement;
- inconsistent actor name;
- missing acceptance criteria;
- unsupported optional feature;
- technical implementation leakage;
- unrecorded non-blocking assumption.

Result:

```text
.bawe/prd-validation-gate.json status = NEEDS_CORRECTION
next_node = prd-spec-generator
repair_mode = true
```

## BLOCKED

Use when truthful repair requires information or a decision absent from the sources,
when authoritative sources contradict each other, or when the repair limit is exhausted.

Examples:

- missing product purpose;
- empty requested complete product scope;
- contradictory primary business rule;
- contradictory core scope;
- second validation failure after the final repair attempt.

Result:

```text
.bawe/prd-validation-gate.json status = BLOCKED
next_node = null
pipeline blocked
```

---

# FINDING SEVERITY

Each finding has one severity:

```text
INFO
WARNING
ERROR
CRITICAL
```

## INFO

Audit-only observation. Does not affect PASS.

## WARNING

A non-blocking issue that remains explicit and does not damage traceability,
scope, or testability.

Warnings must not hide missing mandatory content.

## ERROR

A repairable defect that prevents PASS.

## CRITICAL

A source-level, integrity, contradiction, or repair-exhaustion defect that requires
`BLOCKED`.

---

# FINDING SCHEMA

Every non-pass finding must be structured as:

```json
{
  "code": "PRD_SECTION_MISSING",
  "severity": "ERROR",
  "target": "Acceptance Criteria",
  "detail": "The mandatory section is absent.",
  "source_reference": "base/prd-base.md",
  "repairable": true
}
```

Required fields:

```text
code
severity
target
detail
source_reference
repairable
```

Do not return vague messages such as:

```text
Improve the PRD.
Make it more complete.
Add more detail.
```

---

# VALIDATION ORDER

Run checks in this exact order:

```text
1. Source readiness
2. File integrity
3. Metadata and identity
4. Required structure
5. Source fidelity and traceability
6. Terminology and actors
7. Main-flow coverage
8. Functional requirements
9. Business rules
10. User stories
11. Acceptance criteria
12. Scope discipline
13. Non-functional requirements
14. Metrics, risks, and assumptions
15. Technical neutrality
16. Cross-section consistency
17. Final outcome
```

If a `CRITICAL` source-readiness or integrity finding makes later checks meaningless,
record the finding and stop the run.

Otherwise complete all checks so one repair cycle can address all detectable defects.

---

# 1. SOURCE READINESS

Validate that `project-context.md` provides:

```text
project_name
project_type or normalizable type
purpose
primary audience or persona
at least one requested product capability
completed interview status
```

Validate that `project-context.md` identity, when consulted by the generator, does not
contradict the product context.

Validate that `log-preguntas.md`, when present, does not contradict the processed
context on project identity, core scope, actors or explicit product
answers.

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_SOURCE_INCOMPLETE` | CRITICAL | No | Critical source information is missing |
| `PRD_SOURCE_CONTRADICTION` | CRITICAL | No | Authoritative sources conflict on a core decision |
| `PRD_SCOPE_AMBIGUITY` | CRITICAL | No | Core complete product scope cannot be determined |

---

# 2. FILE INTEGRITY

Validate:

```text
prd.md exists
prd.md is readable
prd.md is not empty
prd.md is not only headings
prd.md is not only placeholders
```

Placeholder indicators include:

```text
TODO
TBD
[REQUIRED]
[complete later]
[lorem ipsum]
[insert ...]
```

A placeholder inside an explicitly marked non-blocking open item may be represented
as an open decision, but it must not masquerade as completed mandatory content.

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_FILE_MISSING` | ERROR | Yes | `prd.md` does not exist and sources are complete |
| `PRD_FILE_EMPTY` | ERROR | Yes | `prd.md` has no meaningful content |
| `PRD_PLACEHOLDER_FOUND` | ERROR | Yes | Mandatory content contains unresolved placeholders |
| `PRD_SOURCE_EVIDENCE_MISSING` | ERROR | Yes | Source traceability inside `prd.md` is missing or unusable |

If these errors occur on the second and final attempt, the final outcome becomes
`BLOCKED` with `PRD_REPAIR_EXHAUSTED`.

---

# 3. METADATA AND IDENTITY

Validate that PRD metadata includes:

```text
project name
normalized project type
source reference
template reference
version
```

Validate:

- PRD project name matches the project context.
- Product type is compatible with the normalized registry result.
- The PRD describes the same product as the source context.
- Metadata does not claim a source or template that was not used.

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_METADATA_MISSING` | ERROR | Yes | Required metadata is absent |
| `PRD_IDENTITY_MISMATCH` | CRITICAL | No | PRD represents another project or incompatible product |
| `PRD_TEMPLATE_REFERENCE_INVALID` | ERROR | Yes | Recorded template path or type is inconsistent |

---

# 4. REQUIRED STRUCTURE

Use `base/prd-base.md` as the single source of truth for mandatory sections and order.

Validate that:

- every required section exists;
- each required section contains meaningful content;
- sections are not duplicated under competing names;
- content appears in the appropriate section;
- the document order remains understandable and stable.

Do not validate by searching only five keywords.

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_SECTION_MISSING` | ERROR | Yes | A mandatory section is absent |
| `PRD_SECTION_EMPTY` | ERROR | Yes | A mandatory section has no meaningful content |
| `PRD_SECTION_DUPLICATED` | ERROR | Yes | Competing duplicate sections create inconsistency |
| `PRD_STRUCTURE_INVALID` | ERROR | Yes | Content cannot be mapped to the base contract |

---

# 5. SOURCE FIDELITY AND TRACEABILITY

Validate that the PRD preserves:

```text
purpose
primary problem
primary audience
requested product capabilities
explicit exclusions
explicit constraints
```

For each product capability, validate a traceable chain:

```text
source
→ functional requirement
→ user story
→ acceptance criterion
```

Preferred extended chain:

```text
source
→ actor
→ need
→ flow
→ functional requirement
→ user story
→ acceptance criterion
→ scope
```

Validate that no significant feature appears without one of:

```text
explicit source
necessary domain implication
recorded non-blocking assumption
```

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_SOURCE_OMISSION` | ERROR | Yes | An explicit requested capability is missing |
| `PRD_UNSUPPORTED_FEATURE` | ERROR | Yes | A significant feature has no valid source |
| `PRD_TRACEABILITY_BROKEN` | ERROR | Yes | A product chain cannot be followed |
| `PRD_EXPLICIT_EXCLUSION_VIOLATED` | ERROR | Yes | PRD includes something explicitly excluded |
| `PRD_UNSUPPORTED_INFERENCE` | ERROR | Yes | An inference exceeds ambiguity rules |

If a source omission reveals an actual source contradiction rather than a writing defect,
reclassify as `PRD_SOURCE_CONTRADICTION`.

---

# 6. TERMINOLOGY AND ACTORS

Validate:

- every actor has one canonical name;
- actor names remain stable across sections;
- different actors are not incorrectly merged;
- one actor is not assigned incompatible permissions;
- stories and flows use only defined actors;
- entities and core actions use consistent terminology.

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_ACTOR_UNDEFINED` | ERROR | Yes | A flow or story uses an unknown actor |
| `PRD_ACTOR_INCONSISTENT` | ERROR | Yes | One actor changes name or responsibility |
| `PRD_TERMINOLOGY_CONFLICT` | ERROR | Yes | One concept uses incompatible names |
| `PRD_PERMISSION_CONTRADICTION` | ERROR or CRITICAL | Conditional | Actor permissions conflict |

A permission contradiction is `CRITICAL` only when the source itself is contradictory.
It is `ERROR` when the PRD alone introduced the inconsistency.

---

# 7. MAIN-FLOW COVERAGE

Validate that every product capability participates in at least one
complete flow.

Each main flow must include:

```text
actor
trigger
preconditions when relevant
ordered behavior
decision points when relevant
success result
relevant failure result
end state
```

Validate:

- no main flow is circular or unfinished;
- no flow introduces unsupported actors or features;
- success produces observable user or business value;
- critical error paths are represented.

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_FLOW_MISSING` | ERROR | Yes | product capability has no flow |
| `PRD_FLOW_INCOMPLETE` | ERROR | Yes | Flow lacks start, result, or necessary decision |
| `PRD_FLOW_UNSUPPORTED` | ERROR | Yes | Flow introduces ungrounded scope |
| `PRD_FAILURE_PATH_MISSING` | ERROR | Yes | Critical failure behavior is undefined |

---

# 8. FUNCTIONAL REQUIREMENTS

Validate that requirements are:

```text
atomic
observable
testable
technology-neutral
linked to actors or flows
unique
within declared scope
```

Validate ID integrity:

```text
FR-001
FR-002
...
```

IDs need not follow this exact numeric width if `prd-base.md` defines another stable
format, but they must be unique and consistent.

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_REQUIREMENT_MISSING` | ERROR | Yes | Requested behavior has no requirement |
| `PRD_REQUIREMENT_DUPLICATED` | ERROR | Yes | Same behavior appears multiple times |
| `PRD_REQUIREMENT_NON_ATOMIC` | ERROR | Yes | One requirement combines independent behaviors |
| `PRD_REQUIREMENT_UNTESTABLE` | ERROR | Yes | Requirement cannot produce an observable result |
| `PRD_ID_DUPLICATED` | ERROR | Yes | Requirement, story, rule, or criterion ID repeats |

---

# 9. BUSINESS RULES

Validate that business rules affecting outcomes are explicit.

Check:

- calculations;
- permissions;
- required conditions;
- allowed state transitions;
- validation conditions;
- ownership of actions;
- completion conditions.

Validate that the PRD does not invent:

```text
percentages
prices
thresholds
deadlines
refund rules
commission formulas
approval rules
legal requirements
```

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_BUSINESS_RULE_MISSING` | ERROR or CRITICAL | Conditional | Required result depends on an undefined rule |
| `PRD_BUSINESS_RULE_INVENTED` | ERROR | Yes | PRD fabricated a rule not present in sources |
| `PRD_BUSINESS_RULE_CONFLICT` | CRITICAL | No | Authoritative rules contradict each other |

A missing rule is `CRITICAL` when no truthful product behavior can be defined without
a client decision. It is `ERROR` when the PRD merely failed to write an available rule.

---

# 10. USER STORIES

Use `base/user-stories.md`.

Validate that every product functional requirement has at least one
story.

Each story must have:

```text
unique ID
one canonical actor
one action or goal
one business benefit
scope classification or clear product association
related requirement
```

Validate that stories do not introduce new requirements.

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_STORY_MISSING` | ERROR | Yes | product requirement has no user story |
| `PRD_STORY_INVALID` | ERROR | Yes | Story lacks actor, action, or benefit |
| `PRD_STORY_NON_ATOMIC` | ERROR | Yes | Story combines independent goals |
| `PRD_STORY_UNSUPPORTED` | ERROR | Yes | Story introduces new scope |

---

# 11. ACCEPTANCE CRITERIA

Use `base/acceptance-criteria.md`.

Validate that every product story has enough criteria to determine
completion.

Criteria must be:

```text
observable
binary
repeatable
non-subjective
linked to a story, requirement, flow, or rule
```

Validate relevant coverage of:

```text
success
invalid input
permission restrictions
business-rule violations
empty or duplicate state
recoverable failure
```

Not every story requires every category. The criterion set must match the actual risk
and behavior.

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_ACCEPTANCE_MISSING` | ERROR | Yes | product story has no criteria |
| `PRD_ACCEPTANCE_AMBIGUOUS` | ERROR | Yes | Criterion uses subjective or non-binary language |
| `PRD_ACCEPTANCE_UNLINKED` | ERROR | Yes | Criterion has no related behavior |
| `PRD_ACCEPTANCE_INCOMPLETE` | ERROR | Yes | Critical success or failure condition is uncovered |
| `PRD_ACCEPTANCE_INVENTED_TARGET` | ERROR | Yes | Criterion fabricates an unsupported threshold |

---

# 12. SCOPE DISCIPLINE

Use `base/product-scope-rules.md`.

Validate that every capability belongs to exactly one:

```text
product delivery
Deferred Scope
Out of Scope
```

Treat the interview's priority answer as implementation ordering. It is a
priority signal, not the full product boundary and not permission to lower
product quality or ship a demo-like, internally worded or
non-client-presentable product.

Validate:

- complete product scope is derived from all product authority, not only from
  the priority answer;
- A5 is preserved as complete functional vision;
- A_PRIORITIES is used only as implementation ordering;
- supported A5 items not named in A_PRIORITIES remain in product scope unless
  contradicted, unsupported or explicitly postponed by source evidence;
- the complete product scope solves the primary problem;
- requested capabilities remain in complete product scope unless contradicted,
  unsupported or explicitly postponed by source evidence;
- necessary enabling behavior is included;
- optional domain features are not promoted without support;
- Deferred Scope does not become an implied product promise;
- Out of Scope prevents likely feature creep;
- no capability appears in multiple scope categories.
- the PRD does not use small scope to justify low quality, visible test/demo
  artifacts, internal construction language or lack of professional product
  finish.

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_SCOPE_COLLISION` | ERROR | Yes | Capability appears in multiple categories |
| `PRD_SCOPE_INCOMPLETE` | ERROR | Yes | complete product scope cannot complete the primary flow |
| `PRD_SCOPE_INFLATED` | ERROR | Yes | complete product scope contains unsupported optional features |
| `PRD_SCOPE_QUALITY_DOWNGRADE` | ERROR | Yes | PRD treats complete product scope as demo/prototype/lower-quality product |
| `PRD_DEFERRED_SCOPE_LEAK` | ERROR | Yes | Deferred item is required by current acceptance |
| `PRD_OUT_OF_SCOPE_MISSING` | ERROR | Yes | Likely expansion remains unbounded |

---

# 13. NON-FUNCTIONAL REQUIREMENTS

Validate that non-functional requirements are:

- relevant to the declared product and expected volume;
- technology-neutral;
- testable or inspectable;
- proportionate to the Complete product scope;
- not disguised architecture decisions.

Do not require fabricated numeric targets.

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_NFR_UNSUPPORTED` | ERROR | Yes | Requirement has no contextual basis |
| `PRD_NFR_UNTESTABLE` | ERROR | Yes | Requirement is purely subjective |
| `PRD_NFR_OVERENGINEERED` | ERROR | Yes | Requirement exceeds the declared product context |

---

# 14. METRICS, RISKS, AND ASSUMPTIONS

Validate:

- success metrics relate to product purpose or main flows;
- numeric targets are not invented;
- risks are product or business risks, not generic filler;
- assumptions are clearly distinguished from facts;
- every assumption affecting the PRD is recorded in `prd.md`;
- non-blocking open items do not make acceptance impossible;
- source conflicts are not disguised as assumptions.

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_METRIC_UNRELATED` | ERROR | Yes | Metric does not measure product value |
| `PRD_METRIC_TARGET_INVENTED` | ERROR | Yes | Numeric target lacks source support |
| `PRD_RISK_GENERIC` | WARNING | Yes | Risk adds no project-specific value |
| `PRD_UNTRACKED_ASSUMPTION` | ERROR | Yes | PRD relies on an assumption absent from evidence |
| `PRD_ASSUMPTION_CONTRADICTORY` | CRITICAL | No | Assumption conflicts with an authoritative source |
| `PRD_OPEN_ITEM_BLOCKING` | CRITICAL | No | An unresolved item prevents a coherent primary flow |

---

# 15. TECHNICAL NEUTRALITY

Use `methodology/prd-writing-rules.md`.

Reject implementation decisions when they prescribe how the product must be built
without being an explicit product constraint.

Examples requiring review:

```text
React
Next.js
Vue
PostgreSQL
MongoDB
JWT
REST
GraphQL
Docker
Kubernetes
microservices
controllers
tables
indexes
routes
folder structure
cloud provider
```

A term is not automatically invalid merely because it appears.

Allowed examples:

- the client explicitly requires integration with an existing named system;
- a product constraint genuinely depends on an existing platform;
- a reference is identified as context rather than an implementation prescription.

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_TECHNICAL_LEAK` | ERROR | Yes | PRD prescribes implementation |
| `PRD_ARCHITECTURE_PREEMPTION` | ERROR | Yes | PRD makes a downstream architecture decision |
| `PRD_IMPLEMENTATION_PLAN_FOUND` | ERROR | Yes | PRD includes build milestones or coding plan |

The PRD defines what the product must do, not how the development pipeline will build it.

---

# 16. CROSS-SECTION CONSISTENCY

Validate globally:

```text
one product purpose
stable actor names
stable entity names
stable requirement meaning
no contradictory business rule
no duplicated behavior
no scope overlap
flows match requirements
stories match requirements
criteria match stories and rules
metrics match goals
assumptions match evidence
```

### Findings

| Code | Severity | Repairable | Condition |
|---|---:|---:|---|
| `PRD_CROSS_SECTION_CONTRADICTION` | ERROR or CRITICAL | Conditional | Sections disagree |
| `PRD_DUPLICATED_BEHAVIOR` | ERROR | Yes | Same behavior is defined multiple ways |
| `PRD_ORPHAN_ELEMENT` | ERROR | Yes | Story, criterion, flow, or rule has no valid parent |
| `PRD_COVERAGE_GAP` | ERROR | Yes | Required chain is incomplete |

Use `CRITICAL` only when the contradiction originates in authoritative sources.
Use `ERROR` when the PRD itself introduced the contradiction.

---

# PASS CONDITIONS

A validation run may return `PASS` only when all are true:

```text
[ ] Source readiness passed.
[ ] prd.md is valid.
[ ] Identity matches the project context.
[ ] Every required PRD section is present and meaningful.
[ ] Explicit client requirements are preserved.
[ ] No unsupported significant feature remains.
[ ] Actors and terminology are consistent.
[ ] Every product capability has a complete flow.
[ ] Every product capability has functional requirements.
[ ] Every product requirement has at least one user story.
[ ] Every product story has testable acceptance criteria.
[ ] Business rules affecting outcomes are explicit.
[ ] product delivery, Deferred Scope, and Out of Scope do not overlap.
[ ] Ambiguities and assumptions comply with ambiguity-rules.md.
[ ] No technical implementation plan or architecture decision remains.
[ ] No ERROR or CRITICAL finding remains.
```

Warnings may remain only when they are genuinely non-blocking and explicitly recorded.

---

# GENERATOR SELF-VALIDATION

Before writing the final `prd.md`, `prd-spec-generator` must apply the full contract.

Behavior:

```text
repairable defect
→ repair internally within the same generation attempt
→ rerun all validation categories

critical source defect
→ do not write a falsely complete PRD
→ halt with the source-level code
```

The generator may write `prd.md` with the blocking evidence when the full PRD
cannot be truthfully completed.

Self-validation does not replace `prd-validation-gate`.

---

# INDEPENDENT GATE VALIDATION

`prd-validation-gate` must:

- read the final files independently;
- rerun the complete contract;
- never trust the generator's self-reported result;
- never modify `prd.md`;
- emit structured findings;
- write `.bawe/prd-validation-gate.json` on every outcome;
- set `next_node = adn-translator` only on PASS;
- route repairable failures back to `prd-spec-generator`;
- halt on critical source defects or exhausted repair attempts.

---

# REPAIR PROTOCOL

On `NEEDS_CORRECTION`:

```text
1. Persist all findings.
2. Set blocking_reason = PRD_REPAIR_REQUIRED.
3. Invoke prd-spec-generator in mode=repair.
4. Read:
   - current prd.md
   - project-context.md
   - log-preguntas.md when present
   - validation_errors
   - base rules
   - ambiguity-rules.md
   - prd-writing-rules.md
   - validation-rules.md
5. Modify only affected elements.
6. Do not expand scope.
7. Update prd.md with repair decisions.
8. Rerun full validation.
```

Do not ask the user whether to continue without a PRD.

---

# ATTEMPT LIMIT

The complete generation cycle supports a maximum of two attempts:

```text
Attempt 1
→ initial generation and gate validation

Attempt 2
→ targeted repair and final gate validation
```

If Attempt 2 does not produce PASS:

```text
code = PRD_REPAIR_EXHAUSTED
severity = CRITICAL
repairable = false
outcome = BLOCKED
```

Do not enter an automatic third cycle.

---

# STATE CONTRACT

## PASS

The gate writes:

```json
{
  "gate_id": "prd-validation-gate",
  "owner": "prd-validation-gate",
  "status": "PASS",
  "validated_artifacts": ["prd.md", "project-context.md", "log-preguntas.md"],
  "next_node": "adn-translator",
  "findings": [],
  "created_at": "[ISO8601]"
}
```

## NEEDS_CORRECTION

```json
{
  "gate_id": "prd-validation-gate",
  "owner": "prd-validation-gate",
  "status": "NEEDS_CORRECTION",
  "validated_artifacts": ["prd.md", "project-context.md", "log-preguntas.md"],
  "next_node": "prd-spec-generator",
  "repair_mode": true,
  "findings": [
    {
      "code": "PRD_ACCEPTANCE_MISSING",
      "severity": "ERROR",
      "target": "US-003",
      "detail": "The product story has no acceptance criteria.",
      "source_reference": "base/acceptance-criteria.md",
      "repairable": true
    }
  ],
  "created_at": "[ISO8601]"
}
```

## BLOCKED

```json
{
  "gate_id": "prd-validation-gate",
  "owner": "prd-validation-gate",
  "status": "BLOCKED",
  "validated_artifacts": ["prd.md", "project-context.md", "log-preguntas.md"],
  "next_node": null,
  "blocking_reason": "PRD_REPAIR_EXHAUSTED",
  "findings": [
    {
      "code": "PRD_REPAIR_EXHAUSTED",
      "severity": "CRITICAL",
      "target": "prd.md",
      "detail": "The final permitted repair attempt did not pass validation.",
      "source_reference": "methodology/validation-rules.md",
      "repairable": false
    }
  ],
  "created_at": "[ISO8601]"
}
```

Canonical routing after this gate comes from `.bawe/prd-validation-gate.json`.

---

# BUILD LOG CONTRACT

PASS:

```text
[ISO8601] prd-validation-gate | PASS | evidence: .bawe/prd-validation-gate.json | Next: adn-translator
```

NEEDS_CORRECTION:

```text
[ISO8601] prd-validation-gate | NEEDS_CORRECTION | findings=[count] | Next: prd-spec-generator mode=repair
```

BLOCKED:

```text
[ISO8601] prd-validation-gate | BLOCKED | code=[code] | Requires: source correction or manual intervention
```

---

# FINAL RULE

Validation must reduce uncertainty, not reward document length.

A PRD passes only when client intent can be traced to complete, scoped, and testable
product behavior.
