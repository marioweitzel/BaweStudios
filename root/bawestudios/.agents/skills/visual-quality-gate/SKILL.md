---
name: visual-quality-gate
description: Review professional visual quality for UI surfaces using product intent and optional visual references.
catalog_status: INSTALLED_PATTERN_REFERENCES
---

# Visual Quality Gate

## Purpose

Assess whether a UI surface is professionally presentable for its product type, audience and context.

## Applicability

Use this tool:

- before client review for client-facing UI;
- during whole-product final review when the project has UI;
- when screenshots exist for a changed visual surface;
- when Visual DNA exists in product authority or `.bawe/app-structure.json`
  selected visual references for the surface.

Skip when there is no visual UI in the active objective and this is not a
whole-product final review.

## Inputs

- Screenshot paths.
- PRD and acceptance criteria.
- `project-context.md`.
- `log-preguntas.md` when present.
- `.bawe/build-directives.json`.
- `.bawe/app-structure.json` when it contains `visual_architecture`.
- Relevant
  `.bawe/app-structure.json.visual_architecture.visual_enrichment_opportunities`
  when present for the reviewed surfaces.
- `.agents/visual-references/VISUAL_INDEX.md` when selected references exist.
- `.agents/visual-references/VISUAL_PATTERN_ADDENDUM.md` when selected references exist.
- Selected or newly justified visual reference images only; the index may be
  reread across sessions to confirm fit, but do not load the whole index in one
  unbounded read. Use targeted search by selected `REF-*`, category, family id
  or pattern keyword, then read only bounded rows/ranges. Before using a
  reference, confirm its exact row and image filename exist. Do not infer
  filenames from similar historical names. Image inspection must stay relevant
  to the active objective.
- For whole-product review: screenshots of all primary delivered UI surfaces, or
  the minimum newly captured states needed to judge product-wide coherence.

## Procedure

1. Compare screenshots against product intent and expected state.
2. Review hierarchy, spacing, density, readability, responsiveness and interaction clarity.
3. Check whether the UI feels like a finished product rather than a scaffold.
4. Check visible copy quality: locale, accents, capitalization, role names,
   labels, action text and user-facing error/success messages.
5. Check expected interaction polish for the surface: hover/focus/pressed,
   loading, disabled, validation, reveal/confirm/undo and subtle transition
   behavior where the workflow naturally calls for it.
6. Check product identity and perceived value: the surface should not look like
   a generic admin template, raw spreadsheet, unstyled form or placeholder
   dashboard.
7. Run `CLIENT_PRESENTATION_PASS`: screenshots must not expose test/demo/local
   credentials, QA/readiness/validation data, internal construction copy,
   scaffolding language, future-screen promises, technical proof or validation
   state.
8. Check consistency with `.bawe/app-structure.json.design_system` when present:
   palette, typography, spacing, borders, radius, icon style, motion, component
   primitives and state styles must match the shared product language.
9. Check whether the declared `signature_element` is used where it encodes real
   product state or workflow context, and absent where it would be decoration.
10. Check `restraint_rules`: visual personality is required, but accent colors,
   icons, gradients, shadows, badges and motion must stay intentional and tied
   to product meaning.
11. Check whether visual enrichment opportunities were handled with judgment:
   images, illustrations, patterns, icon systems or microinteractions should
   improve product identity, trust, comprehension, emotional fit or perceived
   value, not merely fill space.
12. If interview, PRD or project context gave a concrete visual or image clue,
   verify that the surface uses it coherently or that the implementation records
   a sound reason for not using it.
13. If an enrichment opportunity was recommended for the reviewed surface,
   verify that it was implemented, replaced with a coherent smaller alternative
   or explicitly skipped for a product reason.
14. If no enrichment was recommended, verify that the surface still avoids a
   raw lines/text/boxes feel when the product type calls for a more specific
   client-presentable experience.
15. If references are available, use only selected `REF-*` ids for structure and
   pattern comparison. Confirm each selected id against its exact index row and
   existing image file before comparing.
16. Before accepting the surface, ask the client-ready question directly:
   "Does this look finished and valuable enough that I would deliver it to a
   paying client as the current product surface?" The answer must be based on
   the screenshots, product intent and expected user workflow, not on code
   passing or console cleanliness.
17. If the answer is not a clear yes, report the visual blockers and concrete
   corrections needed before client review.
18. For whole-product review, compare primary surfaces together. Confirm that
   public pages, auth, dashboards/workspaces, forms, states, mobile views and
   shared components look like one coherent product instead of separately styled
   objectives.
19. Report blockers and concrete visual corrections.

## Minimal Output

- `findings`
- `blockers`
- `client_ready_verdict`
- `whole_product_verdict` when the gate is used for final project review
- `references used`

## Blocking Errors

- UI is generic, scaffold-like or visibly unfinished.
- UI looks like a raw spreadsheet, CRUD skeleton or unbranded admin template
  when the product requires a client-presentable experience.
- Text overlaps, truncates or becomes unreadable.
- User-visible copy has obvious spelling, locale, capitalization or role-name
  mistakes.
- UI exposes test/demo/local credentials, QA/readiness/validation data,
  internal construction copy, scaffolding language, future-screen promises,
  technical proof or validation state.
- Responsive layout fails normal desktop or mobile viewports.
- Expected interaction affordances are missing for the surface and create avoidable
  user friction.
- States exist technically but lack professional feedback, such as weak loading,
  disabled, validation, empty, success or error treatment.
- Critical state is visually wrong.
- The surface introduces an unrelated palette, typography, icon style, spacing
  rhythm or component language that makes it feel like a different product.
- The surface ignores the signature element on a primary domain state where it
  should help recognition or traceability.
- The surface uses accent colors, icons, gradients, shadows, badges or motion as
  decoration instead of information or affordance.
- The surface ignores an explicit image, object, mood or visual preference from
  product authority without a recorded product reason.
- A recommended visual enrichment opportunity is absent, unrelated or replaced
  by a generic decorative element that does not serve the intended product
  value.
- Visual assets fabricate client identity, real people, premises, customers,
  pets, products, logos, approved colors or factual claims not present in
  product authority.
- The surface remains only lines, text and boxes when product authority or app
  structure called for specific visual enrichment to improve identity, trust,
  comprehension or perceived value.
- UI copies a reference's brand, colors, assets, copy, prices or map tiles.
- The surface only passes technical checks but does not look finished, valuable
  or client-ready for the product type and audience.
- The client-ready question cannot be answered with a clear yes from the actual
  screenshots.
- Whole-product review shows inconsistent identity, component language,
  hierarchy, spacing, copy quality or interaction polish across delivered
  surfaces.

## Catalog Status

The V4.9 screenshot catalog is installed as `.agents/visual-references/`.
It is approved only as a pattern reference catalog. It remains desktop-heavy and
does not provide full mobile/tablet/hover/loading/error/focus coverage, so the
gate must still validate responsive and state quality directly from the product.

## Rules

- Do not capture screenshots.
- Do not modify UI.
- Do not close objectives by visual score alone.
- Do not use historical filenames as a selection criterion.
- Do not compare by pixel similarity.
- Do not fail a UI for not matching reference colors, fonts or brand.
- Do not accept "clean", "responsive" or "no console errors" as enough when the
  screen still lacks perceived product quality.
- Do not mark a visual surface ready only because it is functional. Functional
  is expected; the surface must also look intentional, coherent and worth
  delivering to a paying client.
