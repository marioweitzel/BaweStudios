# VISUAL_PATTERN_ADDENDUM.md - BaWe Visual Patterns v5

This addendum enriches `VISUAL_INDEX.md` with implementation-oriented visual traits.
The historical filename is never authority. Use the indexed `REF-*`, the real
content classification and this addendum to select references.

## Audit Result

The 80 PNG files were copied from the V4.9 visual catalog and reviewed as contact
sheets plus representative full-size images.

```yaml
review_status: READY_FOR_ENGINE_USE
blocking_mismatches_found: false
filename_reliability: LOW
index_content_reliability: HIGH
main_gap: the original index classifies content well, but does not give enough
  direct visual-architecture guidance for the developer LLM.
```

## Selection Protocol

Use this catalog only when the product has UI surfaces.

```text
PRD + project-context visual_dna + app route + surface purpose + user role
-> choose 3 to 6 candidate REF ids from VISUAL_INDEX.md
-> inspect only those image files
-> extract structure, density, hierarchy and interaction treatment
-> write the extracted contract into app-structure.json
```

Do not select by filename, color, brand, text, product domain or asset identity.

## Extraction Fields

When a reference is selected, extract only these fields:

```yaml
visual_anatomy:
  - shell/navigation
  - content zones
  - primary/secondary action placement
  - state and feedback placement
  - table/form/card/modal composition
density:
  - sparse
  - balanced
  - dense
  - high_density_operational
surface_rhythm:
  - spacing pattern
  - panel boundaries
  - row/card rhythm
  - use of thin lines and separators
interaction_pattern:
  - filter/search/action bar
  - persistent CTA
  - contextual drawer
  - modal confirmation
  - status badges
  - empty/error/loading/success placeholders when visible
do_not_transfer:
  - colors
  - fonts
  - brand
  - copy
  - icons
  - exact layout
  - exact data
  - domain-specific concepts
```

## Family-Level Use

```yaml
admin_dashboard_dark:
  use_for: dense internal systems, master panels, admin CRUD, audit views
  extract: sidebar shell, dark panel grid, metric rows, status badges, table density
  avoid: copying the BaWe/master-admin identity or exact module names
ERP_dark_operations:
  use_for: operational portals, branches, inventory, sales history, logistics, stock
  extract: top navigation, active module pill, dense data tables, fixed action zones
  avoid: copying CESAR ERP branding or product/SKU data
operations_terminal_dark:
  use_for: POS, workshop terminal, shift/opening flows, operator action grids
  extract: compact action cards, money/status side panel, focused terminal workflow
  avoid: copying cash-register terminology when product is not POS
green_operational_forms:
  use_for: service workflows, requests, task creation, operational forms with pending work
  extract: two-column form plus contextual panel, long form grouping, strong submit bar
  avoid: copying the green/yellow palette as brand truth
admin_light_crud:
  use_for: lighter backoffices, product/category/settings management, empty states
  extract: simple sidebar, table actions, card settings, calm admin density
  avoid: treating it as a header/nav-only reference
ecommerce_light_checkout:
  use_for: product grid, cart drawer, checkout modal, order review
  extract: catalog-to-cart relationship, drawer summary, order confirmation modal
  avoid: copying product imagery, prices or restaurant domain
map_contextual_light:
  use_for: location systems, parking, logistics maps, geospatial dashboards
  extract: full-bleed map canvas, persistent sidebar, floating controls, detail modal
  avoid: copying map tiles or defaulting non-map products to map-first UI
auth_dark_modals:
  use_for: compact login/signup overlays on dark products
  extract: centered form card, dimmed background, simple auth hierarchy
  avoid: social login/provider claims unless product authority requires them
auth_light_modals:
  use_for: public landing auth overlays
  extract: modal over dimmed marketing page, field spacing, error microcopy position
  avoid: copying restaurant copy or yellow CTA styling
landing_families:
  use_for: public pages, brand-first heroes, pricing, services, portfolios
  extract: first-viewport hierarchy, CTA pair, feature card rhythm, footer composition
  avoid: using landing anatomy for operational backoffice screens
footer_minimal:
  use_for: footer detail only
  extract: copyright placement and low visual weight
  avoid: primary visual direction
```

## Per-Reference Visual Addendum

```yaml
REF-001:
  verified_content: terminal opening dashboard with amount panel
  extract: split workflow canvas, compact action grid, right-side financial/status panel
  density: high_density_operational
  priority: high
REF-002:
  verified_content: centered dark success/status modal
  extract: dimmed backdrop, single compact status card, one clear recovery/continue CTA
  density: sparse
  priority: medium
REF-003:
  verified_content: dark media catalog cards
  extract: equal-height product cards, image-led vertical cards, small pricing/action row
  density: balanced
  priority: medium
REF-004:
  verified_content: pricing cards plus social/footer band
  extract: three-plan comparison rhythm, secondary social/contact cluster
  density: balanced
  priority: medium
REF-005:
  verified_content: media landing hero with content list
  extract: editorial hero plus below-fold list, brand/content separation
  density: balanced
  priority: medium
REF-006:
  verified_content: media landing with bottom player
  extract: persistent bottom player, hero-to-playlist transition
  density: balanced
  priority: low
REF-007:
  verified_content: dark ecommerce product grid
  extract: top nav, category chips, product grid, floating/support action
  density: balanced
  priority: high
REF-008:
  verified_content: restaurant/about contact section
  extract: two-column story/contact anatomy, icon facts, media placeholder block
  density: balanced
  priority: medium
REF-009:
  verified_content: contact form with info column
  extract: contact facts column plus message form, aligned fields, footer context
  density: balanced
  priority: high
REF-010:
  verified_content: CTA band with footer columns
  extract: bold final CTA band, multi-column footer, legal/social lower row
  density: balanced
  priority: medium
REF-011:
  verified_content: dark master admin overview
  extract: fixed sidebar shell, four KPI cards, action-card grid, activity panel
  density: dense
  priority: high
REF-012:
  verified_content: dark admin data table
  extract: sidebar shell, search/action header, compact rows, status badges, row actions
  density: high_density_operational
  priority: high
REF-013:
  verified_content: roles and permissions panel
  extract: two-column admin settings, role list, permission toggles grouped by domain
  density: dense
  priority: high
REF-014:
  verified_content: audit/logs table
  extract: filterable log table, pagination footer, low-drama evidence surface
  density: dense
  priority: high
REF-015:
  verified_content: system settings panel
  extract: sectioned settings stack, toggle rows, save action in header
  density: dense
  priority: high
REF-016:
  verified_content: finance landing with dashboard preview
  extract: hero copy with metric row and product-preview card
  density: balanced
  priority: medium
REF-017:
  verified_content: light approval modal
  extract: dimmed admin context, narrow form modal, vertical fields, single submit action
  density: balanced
  priority: medium
REF-018:
  verified_content: light admin settings form
  extract: left sidebar, tabbed settings sections, wide form rows, calm whitespace
  density: balanced
  priority: high
REF-019:
  verified_content: light product grid with cart drawer
  extract: product grid, right cart drawer, sticky total/action zone
  density: balanced
  priority: high
REF-020:
  verified_content: product creation modal over cart/catalog
  extract: compact create/edit modal, select fields, dimmed transactional background
  density: balanced
  priority: medium
REF-021:
  verified_content: order review modal
  extract: order lines, payment summary, dual action footer
  density: balanced
  priority: high
REF-022:
  verified_content: terminal category grid
  extract: grouped action cards, small status labels, terminal top nav
  density: dense
  priority: high
REF-023:
  verified_content: terminal action grid
  extract: multi-group action card layout, strong scan rhythm, active category label
  density: dense
  priority: high
REF-024:
  verified_content: blocked terminal state
  extract: terminal-wide state message, status card, recovery CTA, red severity cue
  density: sparse
  priority: high
REF-025:
  verified_content: opening shift form
  extract: numeric input grid, right amount summary, action stack, operator focus
  density: dense
  priority: high
REF-026:
  verified_content: opening shift form variant
  extract: same as REF-025 with alternate amount state
  density: dense
  priority: low
REF-027:
  verified_content: light admin overview
  extract: light sidebar shell, KPI row, recent orders/products panels
  density: balanced
  priority: high
REF-028:
  verified_content: light product admin table
  extract: table management header, row thumbnails, edit/delete affordances, status pills
  density: dense
  priority: high
REF-029:
  verified_content: light category admin table
  extract: simple CRUD rows, secondary numeric metadata, compact row actions
  density: balanced
  priority: high
REF-030:
  verified_content: light admin feature-card grid
  extract: settings cards with icon, price/status microdata, edit/delete controls
  density: balanced
  priority: medium
REF-031:
  verified_content: light orders empty/filter state
  extract: filter header, empty state centered in data region, sidebar context
  density: sparse
  priority: high
REF-032:
  verified_content: restaurant hero with offer
  extract: brand-first hero, CTA pair, metric facts under offer
  density: balanced
  priority: medium
REF-033:
  verified_content: dark branch selector
  extract: top module navigation, branch cards, status indicators, per-branch actions
  density: dense
  priority: high
REF-034:
  verified_content: dark sales history table
  extract: filters over table, total summary chip, dense transaction rows
  density: high_density_operational
  priority: high
REF-035:
  verified_content: dark task/activity dashboard
  extract: metric cards over activity table/list, status dots, operational scan pattern
  density: high_density_operational
  priority: high
REF-036:
  verified_content: very wide operational stock table
  extract: horizontal-scroll data grid, fixed top metrics, persistent bottom action/status bar
  density: high_density_operational
  priority: high
REF-037:
  verified_content: dark analytics dashboard
  extract: KPI row, chart panel, performance side panel, sidebar shell
  density: dense
  priority: high
REF-038:
  verified_content: green branded auth landing
  extract: public hero plus centered auth entry area
  density: balanced
  priority: medium
REF-039:
  verified_content: compact green data table
  extract: centered admin table card, toggle/actions column, small top nav
  density: dense
  priority: high
REF-040:
  verified_content: centered green registration form
  extract: single-column form on marketing shell, long textarea, full-width submit
  density: balanced
  priority: medium
REF-041:
  verified_content: booking calendar view
  extract: calendar as primary surface, top nav pills, centered wide content area
  density: balanced
  priority: high
REF-042:
  verified_content: calendar plus event list
  extract: calendar with lower event/status lists, split read/write scheduling context
  density: dense
  priority: high
REF-043:
  verified_content: green operational table
  extract: grouped table sections, status chips, compact row actions
  density: dense
  priority: high
REF-044:
  verified_content: dark product admin grid with editor/sidebar
  extract: product card grid plus right editor/cart panel, search/filter top row
  density: dense
  priority: high
REF-045:
  verified_content: dark payment/order modal
  extract: dimmed background, side-by-side pending order cards, amount emphasis, pay action
  density: balanced
  priority: high
REF-046:
  verified_content: dark sales history table
  extract: dense transactional table, monetary summary, compact filters
  density: high_density_operational
  priority: high
REF-047:
  verified_content: dark order/status card grid
  extract: many compact status cards, readable card rhythm, status badges
  density: high_density_operational
  priority: high
REF-048:
  verified_content: terminal with amount summary
  extract: operator form grid, right amount/action column, top terminal navigation
  density: dense
  priority: high
REF-049:
  verified_content: dark ecommerce checkout drawer
  extract: product catalog background, right sticky checkout drawer, total emphasis
  density: balanced
  priority: high
REF-050:
  verified_content: compact dark login card
  extract: centered auth card, minimal fields, branded backdrop, one primary CTA
  density: sparse
  priority: medium
REF-051:
  verified_content: dark signup modal
  extract: centered modal with social option, dimmed product backdrop, auth microcopy
  density: balanced
  priority: medium
REF-052:
  verified_content: green login overlay
  extract: small auth card over branded landing, secondary links below form
  density: balanced
  priority: medium
REF-053:
  verified_content: locked admin panel
  extract: disabled/blocked dashboard state, minimal accessible modules, status counters
  density: dense
  priority: high
REF-054:
  verified_content: service landing with large cards
  extract: brand hero, three large service cards, card shadows and central CTA rhythm
  density: balanced
  priority: medium
REF-055:
  verified_content: two-column service request form
  extract: form panel plus pending/actions panel, grouped input blocks, strong submit button
  density: dense
  priority: high
REF-056:
  verified_content: task assignment form with list panel
  extract: left creation form, right operational list/status panel, split workload view
  density: dense
  priority: high
REF-057:
  verified_content: checklist and notes form
  extract: checklist toggles, long notes section, grouped maintenance/config panels
  density: high_density_operational
  priority: high
REF-058:
  verified_content: multi-section operational form
  extract: stacked long-form sections, full-width final action, complex configuration layout
  density: high_density_operational
  priority: high
REF-059:
  verified_content: dark product landing/catalog
  extract: hero-to-catalog transition, search bar, horizontal product card row
  density: balanced
  priority: medium
REF-060:
  verified_content: personal portfolio hero
  extract: full-bleed photographic hero, centered identity text, single CTA
  density: sparse
  priority: medium
REF-061:
  verified_content: service form with pending panel
  extract: two-column form/pending layout, urgency list, operational action button
  density: dense
  priority: high
REF-062:
  verified_content: quote form with cart panel
  extract: left quote form, right cart/selection summary, final create action
  density: dense
  priority: high
REF-063:
  verified_content: order form with summary
  extract: compact order form and empty summary panel; useful for initial/empty state
  density: balanced
  priority: medium
REF-064:
  verified_content: operational form with pending panel
  extract: compact form plus empty work panel, minimal state handling
  density: balanced
  priority: medium
REF-065:
  verified_content: green payment form with summary
  extract: payment fields with adjacent summary/completed panel
  density: balanced
  priority: high
REF-066:
  verified_content: light login modal over restaurant page
  extract: dimmed public page, centered white auth card, inline error placement
  density: sparse
  priority: medium
REF-067:
  verified_content: light register modal
  extract: tall centered account form, required field markers, submit bar
  density: balanced
  priority: medium
REF-068:
  verified_content: green branded login card
  extract: auth card integrated into branded landing, form grouping, secondary links
  density: balanced
  priority: low
REF-069:
  verified_content: dark client signup modal
  extract: dark form modal, multiple compact fields, social option at bottom
  density: balanced
  priority: medium
REF-070:
  verified_content: map with fixed sidebar
  extract: full-bleed map, left nav rail, floating location/search controls, zoom controls
  density: balanced
  priority: high
REF-071:
  verified_content: minimal copyright footer
  extract: single-line legal/footer placement only
  density: sparse
  priority: low
REF-072:
  verified_content: dark branded footer bar
  extract: low-height brand/legal strip only
  density: sparse
  priority: low
REF-073:
  verified_content: light finance expense dashboard
  extract: sidebar, top tabs, two financial summary cards, progress/detail rows
  density: balanced
  priority: medium
REF-074:
  verified_content: light finance income dashboard
  extract: same financial card rhythm as REF-073 with alternate metric semantics
  density: balanced
  priority: low
REF-075:
  verified_content: map detail modal
  extract: modal over dimmed map, colored status header, contextual action button
  density: balanced
  priority: high
REF-076:
  verified_content: tabbed map detail modal
  extract: modal tabs, grouped info rows, primary action footer
  density: dense
  priority: high
REF-077:
  verified_content: entity info modal over map
  extract: structured info rows, map backdrop, compact operational detail form
  density: dense
  priority: medium
REF-078:
  verified_content: green copyright footer
  extract: color/footer detail only
  density: sparse
  priority: low
REF-079:
  verified_content: dark copyright footer
  extract: color/footer detail only
  density: sparse
  priority: low
REF-080:
  verified_content: dark pricing comparison cards
  extract: three-tier pricing comparison, highlighted plan, CTA per plan
  density: balanced
  priority: medium
```

## App-Structure Output Contract

`software-product-architect` should write visual guidance in `.bawe/app-structure.json`
without creating a separate state file.

```json
{
  "visual_reference_selection": {
    "catalog": ".agents/visual-references/VISUAL_INDEX.md",
    "selected_refs": ["REF-011", "REF-012"],
    "selection_reason": "References selected for dense admin/workflow surfaces, not for brand or colors.",
    "rejected_refs": [
      {
        "ref": "REF-032",
        "reason": "Landing restaurant pattern does not match internal operations portal."
      }
    ],
    "do_not_transfer": ["colors", "fonts", "brand", "copy", "exact layout", "domain concepts"]
  },
  "visual_architecture": {
    "overall_direction": "Operational, dense, role-aware product UI with restrained hierarchy.",
    "surface_contracts": [
      {
        "surface_id": "work_orders",
        "selected_refs": ["REF-012", "REF-036", "REF-055"],
        "extract": ["dense table rows", "status badges", "right contextual action panel"],
        "avoid": ["exact columns", "exact palette", "reference brand"]
      }
    ]
  }
}
```

The selected references are a visual starting point. They are not acceptance
criteria by themselves; later screenshots must be judged against product intent,
not against pixel similarity.
