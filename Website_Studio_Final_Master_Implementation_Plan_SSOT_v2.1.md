# Website Studio — Final Master Implementation Plan (SSOT)
**Version:** 2.1  
**Status:** Implementation-ready product, architecture, and delivery specification  
**Date:** 21 October 2026  
**Authority:** This document is the single source of truth for the greenfield Website Studio project.

---

# 0. Executive implementation directive

Build **Website Studio as a structured website-generation engine with a visual editor**, not as a prompt box that asks an AI model to write an entire website.

The engine must take a very small business brief, infer the business and its goals, plan the website, compose a distinctive design from the full validated BrandScalers design library, generate only the content that benefits from Google Gemini, render a real responsive preview, allow direct editing, and validate the result.

## Locked decisions

1. **AI generation-cost target: ₹8 or less per initial website generation.** This is a measured target, not an assumed fact. The accounting method must record actual model usage and the model's current pricing. Hosting and other infrastructure are tracked separately.
2. **Publishing customer websites is deferred.** Do not build customer-domain setup, production deployment, SSL automation, or customer-site publishing in the initial generation-engine milestone.
3. **Generation efficiency comes first.** The first release must prove business understanding, design composition, distinctiveness, responsive rendering, editing, persistence, QA, and cost control before production publishing is considered.
4. **Google Gemini remains the AI provider.** Do not switch providers as a shortcut.
5. **Greenfield only.** Do not copy code, components, configuration, tests, deployment setup, or architecture from an existing repository. Create the implementation from these requirements.
6. **All seven product requirements remain mandatory.** Deferring publishing does not defer responsive generation, distinctiveness, comprehensive editing, or the cost target.

## The seven non-negotiable requirements

- **R1 — Minimal questions:** ordinarily three required initial inputs and no more than three or four total question interactions.
- **R2 — Business understanding:** infer the business context, plan the sitemap and visitor journey, and propose a coherent design system.
- **R3 — Distinctiveness:** prevent template duplication and detect/remediate near-identical overall compositions.
- **R4 — Full library use:** make every validated BrandScalers library entry available to the composition engine and create a business-appropriate design direction and tone for each project. Include the agreed source-library inventory (initially described as 98 pieces and 292 looks) in the ingestion audit; verify those counts against the actual source rather than assuming they are still correct.
- **R5 — Real output:** create non-generic, responsive, accessible preview sites with working essential interactions—not static mockups.
- **R6 — Comprehensive editing:** let customers directly edit every meaningful property supported by the product, with saved changes, undo/redo, and version recovery.
- **R7 — Cost-efficient engine:** perform predictable work locally, use Gemini only where beneficial, and validate actual AI generation cost against ₹8.

---

# 1. What “done” means

A website-generation run is **not complete** just because a screen looks good or the model returned text.

For the initial generation milestone, a project is considered ready for customer evaluation only when:

- the brief has been converted into a validated business profile;
- the plan and assumptions are recorded;
- the design system and composition manifest are valid;
- only approved/validated components are rendered;
- generated content is schema-valid and unsupported claims are not invented;
- the preview renders at supported desktop, tablet, and mobile sizes;
- essential navigation, links, and configured forms behave correctly;
- direct editing works without Gemini for routine changes;
- edits persist after reload and can be undone/restored;
- structural, responsive, accessibility, content, functional, and similarity checks have run;
- actual Gemini usage and estimated AI cost are recorded;
- errors are recoverable without losing the project;
- the run's quality and cost results are available for the benchmark report.

Customer-site publishing is explicitly outside this initial definition of done.

---

# 2. Product scope and boundaries

## 2.1 In scope for the initial generation-engine release

- minimal onboarding and adaptive clarification;
- deterministic business-context inference;
- website plan and visitor-journey generation;
- BrandScalers library ingestion, metadata validation, and coverage reporting;
- design-system generation;
- composition and similarity evaluation;
- Google Gemini integration for bounded content/semantic tasks;
- structured website rendering and local/in-app preview;
- responsive behavior and essential interactions;
- comprehensive visual editor;
- autosave, project persistence, undo/redo, and version history;
- cost telemetry and the ₹8 target benchmark;
- automated tests and QA gates;
- security and tenant-isolation foundations;
- failure recovery and diagnostics.

## 2.2 Explicitly deferred

- production deployment of customer websites;
- customer custom domains and DNS configuration;
- customer-site SSL lifecycle;
- one-click publishing;
- external hosting/export workflows;
- payment checkout and complex commerce;
- broad third-party CRM/booking integrations unless selected as a deliberately limited pilot;
- unrestricted AI-generated source code;
- AI calls for routine editing operations.

The builder application itself still needs a development/test environment and a deployment process for engineering use. This is separate from publishing the websites customers create.

## 2.3 Non-goals

Do not:
- create a static demo and label it as the full product;
- rely on a single template with only name/color/copy substitutions;
- ask users to choose implementation technologies;
- send the whole task to Gemini and trust unvalidated output;
- make fake Save, Preview, Form Submit, or Publish controls;
- generate arbitrary executable code from model output;
- claim literal zero similarity between all websites;
- claim ₹8 cost compliance without measurement;
- silently remove hard requirements because they are difficult.

---

# 3. Recommended technical baseline

These choices make the plan actionable. They are greenfield recommendations and must be implemented from scratch, not copied from a prior repository.

| Layer | Initial choice | Reason |
|---|---|---|
| Application | Next.js App Router with React and TypeScript | One typed application for onboarding, editor, server routes, and preview |
| Styling | CSS variables/design tokens with a consistent utility/style approach | Dynamic themes and editable tokens must be first-class |
| Validation | Zod or an equivalent runtime schema validator | Validate user input, manifests, model output, and persisted structures |
| Database | PostgreSQL | Durable project, version, generation-run, and usage records |
| Data access | Prisma or a typed SQL layer | Versioned schema and maintainable data access |
| AI | Google Gemini API behind a server-side adapter | Keep provider-specific code isolated and cost-visible |
| Asset storage | Storage-provider interface with local development adapter | Avoid coupling project logic to a single storage vendor |
| Testing | Unit, integration, browser E2E, accessibility, visual regression, and cost tests | Validate the full product, not just components |
| Observability | Structured logs, generation-run IDs, usage ledger, and metrics | Trace quality, failures, latency, and costs |
| Background work | Persisted job/state abstraction; use a queue when measured need warrants it | Long operations must be resumable without unnecessary infrastructure early |

Before locking package versions, choose current stable compatible releases and pin them. Keep lockfiles and run CI from a clean install. Do not copy package manifests or configuration from an old project.

### 3.1 Architecture rule

Keep the initial architecture modular even if it starts as a **modular monolith**. Do not split into microservices until measured load or operational needs justify it.

### 3.2 Model-output rule

Gemini must return structured data for defined tasks. Never accept model-generated arbitrary JavaScript, JSX, CSS, shell commands, or server code as the trusted website implementation. The renderer uses validated manifests and a controlled component registry.

---

# 4. Repository and module structure

Create a new repository with a structure equivalent to the following. Names can change if the same separation of responsibilities remains intact.

```text
website-studio/
  app/
    (product)/
      new/
      projects/
      editor/[projectId]/
    api/
      projects/
      onboarding/
      plans/
      generations/
      edits/
      versions/
      quality/
      usage/
    layout.tsx
    page.tsx
  components/
    onboarding/
    plan-review/
    editor/
    preview/
    quality-panel/
    shared/
  engine/
    context/
    questions/
    planning/
    library/
    design-system/
    composition/
    similarity/
    content/
    rendering/
    quality/
    cost/
  registry/
    components/
    schemas/
    tokens/
  server/
    auth/
    db/
    storage/
    gemini/
    jobs/
    telemetry/
    security/
  lib/
    schemas/
    errors/
    ids/
    logging/
  prisma/
    schema.prisma
    migrations/
  tests/
    unit/
    integration/
    e2e/
    visual/
    accessibility/
    cost/
    fixtures/
  docs/
    decisions/
    runbooks/
    benchmarks/
  scripts/
    library-audit/
    benchmark-generation/
    verify-env/
  .env.example
  README.md
```

The folder structure is a guide to module boundaries, not a requirement to create empty folders before their functionality exists. Keep dependencies one-directional: UI calls application services; application services orchestrate engine modules; engine modules depend on schemas and interfaces rather than UI code.

---

# 5. Core data contracts

Create versioned schemas before building the generation pipeline. Store structured state, not a single giant prompt or a generated HTML string as the only source of truth.

## 5.1 `BusinessProfile`

Required fields:
- `schemaVersion`
- `businessName`
- `businessCategory`
- `offerings[]`
- `primaryGoal`
- `primaryConversion`
- `audience[]`
- `locationOrServiceArea` (optional)
- `brandTone`
- `requiredPages[]`
- `requiredFeatures[]`
- `confirmedFacts[]`
- `assumptions[]`
- `openQuestions[]`
- `confidenceByField`
- `createdAt`, `updatedAt`

Each assumption records its value, confidence, evidence, risk if incorrect, and whether confirmation is required.

## 5.2 `SitePlan`

Fields:
- `schemaVersion`
- `projectId`
- `goalSummary`
- `sitemap[]`
- `navigation`
- `visitorJourneys[]`
- `pagePlans[]`
- `featurePlan[]`
- `designBrief`
- `missingAssets[]`
- `risks[]`
- `assumptions[]`
- `planVersion`

Each page plan records page purpose, audience intent, section sequence, content objective, CTA destinations, and responsive notes.

## 5.3 `DesignSystem`

Fields:
- `schemaVersion`
- `designSystemId`
- `conceptName`
- `conceptRationale`
- `colorTokens`
- `typographyTokens`
- `spacingTokens`
- `containerAndGridRules`
- `borderRadiusTokens`
- `shadowTokens`
- `imageArtDirection`
- `iconStyle`
- `motionRules`
- `responsiveRules`
- `voiceAndTone`
- `accessibilityResults`
- `version`

All color and typography roles must map to tokens. Components should not independently invent incompatible design values unless the user deliberately overrides them.

## 5.4 `CompositionManifest`

Fields:
- `schemaVersion`
- `projectId`
- `libraryVersion`
- `engineVersion`
- `compositionSeed`
- `designSystemVersion`
- `pages[]`
- `componentInstances[]`
- `compositionFingerprint`
- `similarityScores`
- `qualityStatus`

A component instance includes a stable library/component ID, supported variant, validated props, content references, responsive settings, and interaction configuration.

## 5.5 `ContentBlock`

Fields:
- `id`
- `type`
- `purpose`
- `content`
- `cta` (optional)
- `assetRefs[]`
- `sourceStatus` (`customer_confirmed`, `generated`, `placeholder`, `needs_review`)
- `claimEvidence[]`
- `locale`
- `updatedAt`

## 5.6 `GenerationRun`

Fields:
- `id`
- `projectId`
- `status`
- `stage`
- `startedAt`
- `completedAt`
- `inputSnapshotHash`
- `engineVersion`
- `libraryVersion`
- `modelAndPromptVersions`
- `aiCallCount`
- `inputTokens`
- `outputTokens`
- `estimatedAiCostINR`
- `qualityResults`
- `errorCode`
- `recoverableCheckpoint`

Use explicit state transitions and persist progress after each major stage.

## 5.7 `ProjectVersion`

Store a snapshot or safe, reversible change set for:
- business profile;
- plan;
- design system;
- composition;
- content;
- editor changes;
- engine/library versions;
- quality report.

Never overwrite the only recoverable project state during regeneration.

---

# 6. Database model and persistence

At minimum, define tables/entities for:

- `User` or the chosen account identity;
- `Project`;
- `ProjectVersion`;
- `BusinessProfile`;
- `SitePlan`;
- `DesignSystem`;
- `CompositionManifest`;
- `ContentBlock`;
- `Asset`;
- `GenerationRun`;
- `GenerationStage`;
- `AiUsageLedger`;
- `QualityReport`;
- `LibraryEntry`;
- `LibraryVersion`;
- `EditOperation`;
- `AuditEvent`.

Normalize high-value queryable fields and store versioned JSON only for structured subdocuments where that trade-off is deliberate. Add indexes for project ownership, project update time, generation status, and usage queries.

### Persistence requirements

- Every project belongs to an authenticated owner or explicitly authorized workspace.
- Every protected query enforces ownership/authorization on the server.
- Save project state at safe checkpoints.
- Autosave must debounce frequent editor changes while preventing data loss.
- Use optimistic concurrency or version checks to avoid silent overwrites.
- Provide recovery from interrupted generation and editing.
- Keep an audit trail for important state changes.
- Define deletion/export and retention behavior before production use.

---

# 7. API and service contracts

Use typed request/response schemas and consistent error objects. Names below are proposed contracts; adjust routing conventions without changing behavior.

| Operation | Responsibility | Expected result |
|---|---|---|
| `POST /api/projects` | Create a blank project | Project ID and initial state |
| `POST /api/onboarding/infer` | Infer a profile from the minimal brief | Validated profile, confidence, assumptions |
| `POST /api/onboarding/questions` | Select next high-impact question | Zero or one next question plus reason |
| `POST /api/plans` | Create/update site plan | Versioned plan and design brief |
| `POST /api/generations` | Start or resume generation | Generation run ID and status |
| `GET /api/generations/:id` | Read run progress and diagnostics | Current stage, safe status, cost so far |
| `POST /api/edits` | Persist a validated edit operation | Updated project version/state |
| `POST /api/versions/:id/restore` | Restore a prior version | New current version based on selected snapshot |
| `POST /api/quality/:projectId/run` | Run relevant QA checks | Quality report and blockers |
| `GET /api/usage/:projectId` | Read cost and AI usage | Calls, tokens, estimated INR, budget status |

Security and behavior:
- validate every request and response;
- authenticate and authorize server-side;
- rate-limit generation and expensive operations;
- use idempotency keys for generation starts and other retriable mutations;
- never expose Gemini API keys;
- return actionable errors without leaking secrets or internal stack traces;
- do not create duplicate runs or charges on client retries.

Do not implement production publishing endpoints in the initial scope.

---

# 8. Minimal onboarding and adaptive questioning

## 8.1 Three required inputs

1. Business/brand name.
2. Business category/type, including “I’m not sure.”
3. What the business offers and what the website should achieve, in one natural-language response.
4. Existing Logo or Demo, link to a website. (Optional) 
5. Reference or Personal Website link. (Optional) 
Do not split these into redundant screens or demand technical design choices.

## 8.2 Question-selection algorithm

For each missing field:
1. estimate how much it could change the plan/design/functionality;
2. estimate the cost of a wrong assumption;
3. check whether a safe default exists;
4. ask only if the expected impact exceeds a configured threshold;
5. select the single highest-value question;
6. stop when remaining uncertainty is low-risk or reversible.

Record why a question was asked. A standard business brief should ordinarily require no more than three or four question interactions in total. Complex cases can exceed this only with a clear reason.

## 8.3 Acceptance tests

- A brief with sufficient information asks no redundant follow-up.
- “I’m not sure” does not dead-end the user.
- The engine uses safe defaults for low-impact unknowns.
- Corrections update the profile and downstream plan.
- Technical implementation questions are never asked of the customer.

---

# 9. Context inference and site planning

## 9.1 Business taxonomy

Create a versioned taxonomy for category/subcategory, typical goals, audience needs, common page purposes, useful features, visitor objections, trust requirements, content risks, and suitable design directions. The taxonomy guides composition but does not prescribe a fixed template.

## 9.2 Inference order

1. Parse direct customer facts.
2. Match category/subcategory and goal using deterministic rules.
3. infer likely audience and journey from validated category guidance;
4. identify uncertainty and potential risks;
5. use Gemini only if a meaningful ambiguity remains;
6. validate the structured profile;
7. preserve confirmed facts separately from assumptions.

## 9.3 Site-plan generation

Create:
- sitemap and navigation;
- purpose and audience intent for each page;
- section sequence and objective;
- visitor journeys and CTA destinations;
- trust-building approach;
- required interactions;
- content and asset needs;
- responsive considerations;
- design direction;
- assumptions and missing information.

The plan must be editable before generation, but review should be concise and optional for low-risk changes.

---

# 10. BrandScalers design-library ingestion

The complete library must be usable by the engine. A manifest of IDs is only an inventory, not proof of functional implementation.

## 10.1 Ingestion workflow

1. Parse source entries into a raw inventory.
2. Assign stable IDs and source/version provenance.
3. Extract name, group, layout, variants, content slots, dependencies, and interaction metadata.
4. Verify actual structure against the inventory.
5. create a normalized component contract;
6. implement or adapt the component in the new renderer;
7. test desktop/tablet/mobile behavior;
8. test keyboard and semantic accessibility;
9. record preview and compatibility metadata;
10. mark the entry validated only after all required checks pass.

Each entry must be marked `validated`, `pending_review`, `blocked`, or `deprecated`.

## 10.2 Coverage report

Show counts for source entries, parsed entries, validated entries, rendered components, blocked entries, missing metadata, accessibility failures, responsive failures, and usage frequency.

Do not silently omit difficult library entries. Resolve them, document a blocker, or explicitly deprecate them with a reason.

## 10.3 Component contract

Each registered component must define:
- stable ID and version;
- allowed props and schema;
- content slots;
- supported variants;
- responsive behavior;
- token dependencies;
- accessibility requirements;
- interaction contract;
- compatibility constraints;
- test fixtures and preview.

## 10.4 Versioning

Generated projects record the library version and component versions. Updates must be tested against saved project fixtures before rollout.

---

# 11. Design-system engine

The engine proposes a coherent visual system for each project using business context and validated library metadata.

It must select:
- concept and rationale;
- color roles and accessible combinations;
- typography pairing/scale;
- spacing and grid;
- containers and section rhythm;
- borders, corners, and shadows;
- imagery direction and crop behavior;
- icon style;
- interaction and motion rules;
- content density;
- navigation and CTA patterns;
- responsive transformations;
- tone of voice.

Use a scored decision model rather than random styling. Factors should include business fit, conversion goal, accessibility, visual coherence, library compatibility, performance, and distinctiveness. Store score weights and version them.

The user should be able to adjust the proposed system later through direct editor controls.

---

# 12. Composition and distinctiveness engine

## 12.1 Composition process

1. Start with the approved site plan.
2. retrieve library candidates matching each page/section purpose;
3. filter candidates by context, accessibility, responsive support, and compatibility;
4. select a design-system/token set;
5. compose sections with hierarchy and conversion goals;
6. assign content and asset references;
7. validate component props and interactions;
8. compute the composition fingerprint;
9. compare with prior compositions;
10. recompose if similarity or coherence thresholds fail;
11. save the versioned manifest and evaluation.

## 12.2 Distinctiveness dimensions

Compare:
- sitemap/page structure;
- section order and sequence;
- layout families;
- component and variant sequence;
- typography/color-token signatures;
- content density and block types;
- standardized screenshots at fixed viewports;
- asset reuse where comparison is appropriate.

## 12.3 Similarity policy

No system can guarantee zero shared visual characteristics across all sites, nor should it avoid standard usable patterns. The enforceable target is **no unapproved duplicate template or near-identical overall composition**.

If similarity exceeds the configured threshold:
- identify which dimensions drive the score;
- preserve business-critical functions;
- change high-impact layout/composition choices;
- rerun responsive, accessibility, and coherence tests;
- compare again;
- record the before/after scores and remediation.

Do not change only colors or wording to evade a similarity check.

## 12.4 Controlled variation

Store a composition seed and all relevant versions so a result can be reproduced. Regeneration may intentionally change the composition but must preserve the old version for rollback.

---

# 13. Google Gemini integration and cost control

## 13.1 Allowed AI tasks

Use Gemini for:
- bounded interpretation of ambiguous natural-language input;
- first-draft, business-specific content based on confirmed facts;
- constrained creative alternatives;
- explicit AI-assisted rewriting requested by the user.

Prefer deterministic code for:
- schema validation and normalization;
- taxonomy matching;
- standard site planning;
- library filtering;
- component compatibility;
- design-token selection;
- page composition;
- responsive rules;
- similarity scoring;
- QA;
- routine editor changes;
- persistence and workflow state.

## 13.2 Call contract

Every Gemini call must specify:
- purpose and prompt version;
- minimal relevant context;
- exact output schema;
- maximum input/output budget;
- timeout and retry policy;
- validation and fallback;
- model/version and usage logging.

Never send all library content or the full project on every request. Retrieve only the metadata relevant to the current task.

## 13.3 Cost ledger

For every call, record:
- generation run and stage;
- model/version;
- input and output token usage when available;
- pricing version/rate used for estimate;
- estimated cost in INR;
- retry/failure status;
- latency;
- prompt/schema version.

If usage or current pricing cannot be verified, mark the cost estimate as incomplete rather than inventing a precise value.

## 13.4 ₹8 budget policy

The **₹8 target applies to AI generation cost per initial website generation**, not to hosting, storage, customer-site publishing, or all lifetime operating costs.

- Establish the exact cost-accounting formula from the chosen Gemini model's current pricing.
- Track cost per generation and per edit separately.
- Set a hard internal budget guard with a warning threshold below ₹8.
- Avoid duplicate requests through idempotency and persisted generation state.
- Use safe caching only for matching inputs/model/prompt/context versions; never cross-contaminate customer data.
- Do not regenerate the whole site for a small change.
- If the run approaches the budget, skip optional generation tasks before compromising essential correctness.
- If the budget is exceeded, mark the run as an over-budget benchmark result, identify the cause, and optimize before claiming target compliance.

The ₹8 target is achieved only when representative measured runs meet the defined budget methodology while passing quality gates. A cheap but broken or generic website does not count as success.

## 13.5 Model outage

If Gemini is unavailable or returns invalid output:
- retry only within the configured limit;
- validate each response;
- use deterministic fallback content where safe;
- mark uncertain content for review;
- retain the project and completed stages;
- never discard edits or silently report success.

---

# 14. Generation workflow and state machine

Persist each run as a sequence of recoverable stages:

1. `brief_received`
2. `profile_inferred`
3. `clarification_needed` or `profile_ready`
4. `plan_created`
5. `design_system_created`
6. `composition_created`
7. `content_created`
8. `manifest_validated`
9. `preview_rendered`
10. `quality_checks_running`
11. `ready_for_review` or `needs_fixes`
12. `completed` or `failed_recoverable`

Each transition must validate prerequisites, persist its result, emit telemetry, and be safe to retry. A retry must resume from the last valid checkpoint when possible.

Do not run all generation work inside a single fragile browser request. The UI should poll or subscribe to persisted progress and show understandable status, not internal stack traces.

---

# 15. Renderer and preview runtime

The renderer takes a validated `CompositionManifest`, `DesignSystem`, and content records and renders them through a controlled registry.

Requirements:
- responsive page layout;
- semantic headings and landmarks;
- functional navigation and links;
- CTA behavior;
- working mobile menu;
- validated forms with truthful success/error states;
- keyboard operation and visible focus;
- optimized images/fonts;
- no unresolved component IDs;
- no arbitrary executable model output;
- meaningful loading, empty, and error states;
- stable preview after refresh;
- clear indication that the site is a preview and is not publicly deployed.

A visible feature must be in one of these states: `working_in_preview`, `requires_setup`, `not_supported`, or `future`. Never display a false success state.

---

# 16. Comprehensive visual editor

## 16.1 Required editing surface

The editor must provide:
- canvas preview;
- page/section navigator;
- selectable element/section outline;
- contextual property panel;
- desktop/tablet/mobile preview;
- clear selection/focus state;
- undo/redo;
- autosave status;
- version history and restore;
- quality issue panel.

## 16.2 Editable properties

For supported components and pages, allow direct editing of:
- business/site settings;
- page creation, deletion, duplication, and order;
- navigation labels/destinations;
- section addition, removal, duplication, order, and variant;
- headings, paragraphs, labels, buttons, links, and content;
- colors, typography, spacing, width, alignment, backgrounds, borders, corners, shadows;
- images, alt text, crop, and focal point;
- responsive visibility and supported breakpoint adjustments;
- form fields, validation, destination, and consent text;
- SEO/social metadata and favicon;
- motion settings and reduced-motion behavior;
- accessibility labels;
- supported feature/integration settings.

The editor must expose all meaningful properties supported by the product, not promise arbitrary access to internal code.

## 16.3 Editing rules

- Routine editing is deterministic and does not call Gemini.
- Global token changes update dependent components consistently.
- Local overrides are possible but visible and reversible.
- All edits are schema-validated.
- Autosave is debounced but safe; display `saving`, `saved`, or `save_failed`.
- Undo/redo must reverse the correct operation.
- Reload/reopen must restore the latest saved state.
- Failed edits must not corrupt the last valid version.
- Regeneration must never silently erase manual edits.

---

# 17. Quality engine

Run quality checks after initial generation and after relevant edits.

## 17.1 Structural checks
- all pages/sections match the plan;
- component IDs and props validate;
- required content slots are present;
- assets resolve;
- internal links target valid pages;
- no malformed manifest.

## 17.2 Functional checks
- nav and CTA actions work;
- form validation and result states work;
- mobile navigation works;
- links are safe and have destinations;
- edit/save/reload works;
- no primary control is inert.

## 17.3 Responsive and visual checks
- fixed representative viewports;
- no overflow, clipping, overlap, missing assets, or broken hierarchy;
- design tokens are applied consistently;
- page rhythm and readability remain usable;
- screenshot regression comparison;
- similarity score and remediation status.

## 17.4 Content checks
- no fabricated factual claims;
- placeholders are clearly marked;
- no repetitive filler or duplicate sections;
- CTAs have meaningful destinations;
- heading hierarchy and metadata are valid;
- generated claims are distinguishable from customer-confirmed facts.

## 17.5 Accessibility checks
- automated audit;
- keyboard navigation;
- focus order/visibility;
- labels and form errors;
- color contrast;
- reduced motion;
- manual review of critical journeys.

## 17.6 Release blocking
Block “ready for review” status for critical data loss, malformed manifests, severe responsive breakage, broken primary interactions, security defects, or untrusted content execution. Show non-critical warnings with clear remediation.

---

# 18. Security, privacy, and abuse prevention

Implement:
- server-side authentication and authorization;
- strict project ownership checks;
- tenant isolation;
- request and response validation;
- safe rendering of untrusted content;
- rate limits for expensive operations;
- secure secret management;
- safe file upload/URL handling;
- protection against XSS, CSRF where applicable, SSRF, injection, and unauthorized access;
- dependency scanning;
- audit events for sensitive changes;
- minimal sensitive logging;
- defined retention/export/deletion behavior.

Generated model output must never gain privileged execution access. A preview renderer must use an allowlisted component registry and validated data. API keys must not appear in client code, logs, or generated manifests.

---

# 19. Testing strategy and benchmark suite

## 19.1 Test layers

1. Unit: inference, question selection, scoring, schema validation, token assignment, cost accounting.
2. Property-based: malformed inputs, missing fields, compatibility invariants, edit operation sequences.
3. Integration: database, Gemini adapter, storage, generation-stage persistence, editor saves.
4. End-to-end: brief → plan → generation → preview → edit → save/reload → QA.
5. Visual regression: fixed viewport screenshots for representative business briefs.
6. Accessibility: automated and manual keyboard/screen-reader checks.
7. Security: authorization, tenant isolation, unsafe content, secrets, rate limits.
8. Cost: bounded calls, budget accounting, retry behavior, no Gemini calls for routine edits.
9. Similarity: near-duplicates detected; meaningfully different designs remain accepted.
10. Failure/recovery: model outage, invalid output, interrupted generation, failed save, missing asset.

## 19.2 Benchmark brief set

Create a versioned benchmark set with:
- different business categories;
- different business goals;
- short and ambiguous briefs;
- businesses with and without locations;
- service and product businesses;
- different levels of content completeness;
- common features such as contact forms and booking links;
- adversarial/injection-like inputs to test safe handling.

Do not tune the engine against only one demonstration business.

## 19.3 Benchmark report

For each run, record:
- input brief and engine/library/model versions;
- number of questions;
- generation duration;
- AI calls/tokens/estimated INR;
- quality pass/fail by category;
- similarity score before/after remediation;
- edit/save/reload outcome;
- known limitations and manual review notes.

---

# 20. Metrics and pass/fail targets

The following are mandatory measurements. Where a numeric quality threshold is not yet established, set it before the release benchmark and record the rationale; do not invent a claim of current performance.

| Area | Metric | Initial pass rule |
|---|---|---|
| Customer effort | Question interactions | Target ≤4 for ordinary benchmark briefs |
| AI cost | Estimated Gemini cost per initial generation | Target ≤₹8 under documented pricing/accounting |
| AI efficiency | Gemini calls for routine editor changes | 0 |
| Recovery | Project lost after recoverable failure | 0 in tested failure scenarios |
| Editing | Changes survive reload | 100% of tested supported edit operations |
| Rendering | Invalid component/manifest | 0 accepted into ready-for-review state |
| Functionality | Broken primary controls | 0 in release benchmark |
| Responsive | Critical overflow/clipping defects | 0 in release benchmark |
| Distinctiveness | Known near-duplicate test cases | Must be detected and remediated |
| Accessibility | Critical accessibility blockers | 0 in release benchmark |
| Security | Cross-tenant access in test suite | 0 |
| Telemetry | Generation runs with cost/status record | 100% of completed benchmark runs |

Cost pass/fail must be evaluated alongside quality. A run does not pass by staying under ₹8 if it fails critical quality gates.

---

# 21. Implementation phases and exit criteria

## Phase 0 — Freeze requirements and baseline
**Build:** schemas draft, decision records, benchmark briefs, ₹8 accounting method, risk register.  
**Exit:** all requirements are traceable to modules, tests, and metrics; greenfield boundary is explicit.

## Phase 1 — Create the new application foundation
**Build:** new repository, pinned compatible dependencies, app shell, environment validation, database/migrations, structured logging, CI, type checking, tests, secure configuration.  
**Exit:** clean setup succeeds; migrations and CI pass; no secrets are committed.

## Phase 2 — Project model and minimal onboarding
**Build:** project creation, three required inputs, profile schema, inference, confidence/assumptions, adaptive question selection, plan summary.  
**Exit:** standard benchmark briefs reach a useful plan within the question target; edits to the brief update the plan.

## Phase 3 — Design-library registry
**Build:** ingestion parser, stable IDs, metadata schema, coverage report, component contracts, validated component registry.  
**Exit:** every source entry is accounted for and has a status; only validated entries can be selected for rendering.

## Phase 4 — Design-system and composition engine
**Build:** token generation, candidate scoring, compatibility rules, composition manifests, fingerprints, similarity checks, remediation.  
**Exit:** coherent compositions render; known duplicate cases are detected; outputs are reproducible.

## Phase 5 — Renderer and preview
**Build:** controlled component renderer, responsive pages, essential interactions, preview state, error boundaries, visual fixtures.  
**Exit:** benchmark previews work across required viewports; no arbitrary model code is executed.

## Phase 6 — Gemini and cost ledger
**Build:** server-side Gemini adapter, bounded prompts, output schemas, usage ledger, retries, fallbacks, cost guards.  
**Exit:** each run reports actual available usage and estimated cost; no unbounded calls; model failure is recoverable.

## Phase 7 — Comprehensive editor and persistence
**Build:** canvas, navigator, property panel, direct edits, responsive preview, undo/redo, autosave, versions, restore.  
**Exit:** supported edits survive reload; routine edits use zero Gemini calls; failed edits preserve the last valid version.

## Phase 8 — Quality engine and benchmark
**Build:** structural, functional, visual, responsive, accessibility, content, similarity, security, and cost tests.  
**Exit:** representative benchmark suite passes all critical gates; over-budget or failed cases are recorded and fixed.

## Phase 9 — Generation-efficiency gate
Evaluate the engine using the benchmark set. **Do not proceed to publishing work until all conditions below are met:**
1. the documented AI cost method shows the ₹8 target is met for the agreed benchmark, with outliers disclosed;
2. generated outputs pass critical quality gates;
3. distinctiveness detection and remediation work;
4. editing and persistence are reliable;
5. failures recover without losing work;
6. cost and quality telemetry is complete.

If any condition fails, optimize the engine and repeat the benchmark. Do not raise the budget or weaken core requirements without explicit approval.

## Phase 10 — Publishing decision, not automatic implementation
Only after Phase 9 passes and the product owner approves, create a separate plan for customer-site hosting, domains, SSL, deployment verification, rollback, and operational cost. Publishing remains deferred until then.

---

# 22. Cost optimization playbook

When the measured cost exceeds ₹8, use this order:

1. Remove duplicate/redundant calls and make generation idempotent.
2. Reduce context to only the fields needed for the task.
3. Replace deterministic tasks incorrectly routed to Gemini with local logic.
4. Cache safe repeated results using exact versioned keys.
5. Reduce unnecessary retries and set per-stage output limits.
6. Generate only the missing or invalid content instead of regenerating the entire site.
7. Benchmark the quality after each optimization.
8. Record the measured savings and any quality impact.

Never optimize cost by:
- skipping essential QA;
- reusing another customer's private content;
- generating a generic site and calling it distinctive;
- omitting responsive behavior;
- hiding failed tasks;
- fabricating usage or pricing estimates.

---

# 23. Failure states and recovery

For each stage, define timeout, retry policy, idempotency, user-visible status, checkpoint, fallback, and telemetry.

| Failure | Required behavior |
|---|---|
| Invalid customer input | Explain what is missing; preserve entered values |
| Gemini timeout/outage | Retry within limits; use safe deterministic fallback where possible |
| Invalid Gemini schema | Reject, log safely, and retry only within budget |
| Invalid library component | Exclude it and select a validated compatible alternative |
| Similarity threshold exceeded | Recompose affected areas and rerun checks |
| Asset unavailable | Preserve project and show replacement action |
| Autosave failure | Show unsaved state and retry; never claim saved |
| Generation interrupted | Resume from last valid checkpoint |
| Cost budget exceeded | Mark over-budget, stop optional work, record cause |
| Quality gate failure | Show actionable issues and keep project editable |
| Version restore failure | Preserve current version and report failure |

No recoverable error should erase the user's brief or last valid saved edits.

---

# 24. Security and privacy acceptance checklist

Before allowing real customer data:
- [ ] Every protected endpoint enforces server-side ownership checks.
- [ ] Cross-project access tests pass.
- [ ] Gemini API keys are server-side only.
- [ ] Secrets are absent from logs and client bundles.
- [ ] User text and model output are validated and safely rendered.
- [ ] Generated output cannot execute arbitrary privileged code.
- [ ] Uploads and URLs are validated.
- [ ] Rate limits protect expensive endpoints.
- [ ] Error messages do not leak stack traces or secrets.
- [ ] Retention and deletion behavior is documented.
- [ ] Dependency and secret scans run in CI.

---

# 25. Engineering workflow and change control

For every feature:
1. link it to one or more requirements R1–R7;
2. define its schema and API contract;
3. implement the smallest complete vertical slice;
4. add tests at the appropriate layers;
5. verify cost impact where AI is involved;
6. run responsive/accessibility/security checks where relevant;
7. update documentation and metrics;
8. verify the feature in a clean environment.

Maintain architecture decision records for consequential choices. Every decision record must include context, options, decision, rationale, consequences, owner, and date.

Do not create broad abstractions without a real use case. Do not defer validation until the end. Build a working vertical slice through onboarding → plan → composition → preview early, then deepen the editor and quality system.

---

# 26. Required project documents

Maintain these documents alongside the code:
- `README.md` — setup, scripts, environment, and project overview;
- `docs/architecture.md` — module boundaries and data flow;
- `docs/data-contracts.md` — schema versions and migration rules;
- `docs/design-library.md` — ingestion, coverage, and component validation;
- `docs/generation-pipeline.md` — stages, state machine, retries, fallbacks;
- `docs/cost-accounting.md` — ₹8 target formula, pricing assumptions, and ledger;
- `docs/quality-gates.md` — QA checks and release blockers;
- `docs/security.md` — threat model and security controls;
- `docs/benchmark-protocol.md` — benchmark set, methodology, and results;
- `docs/decisions/` — architecture decision records;
- `docs/runbooks/` — recovery, failed generation, and support procedures.

Documentation must reflect actual implementation. Do not document an unbuilt capability as if it is complete.

---

# 27. Final traceability matrix

| Requirement | Main modules | Proof required |
|---|---|---|
| R1 Minimal questions | Onboarding, Context, Question Selector | Benchmark question-count report |
| R2 Business understanding/design system | Context, Planner, Design-System Engine | Profile/plan fixtures and user-correction tests |
| R3 Distinctiveness | Composition, Similarity Evaluator | Duplicate benchmark detection/remediation |
| R4 Full library/customer-specific styles | Library Registry, Composition | Coverage report and validated component tests |
| R5 Responsive/functioning sites | Renderer, Quality Engine | Responsive, visual, and end-to-end tests |
| R6 Comprehensive editing | Editor, Persistence, Versioning | Edit/reload/undo/restore test suite |
| R7 ₹8 and less AI | Gemini Adapter, Cost Ledger, Engine | Cost benchmark and zero-Gemini routine-edit tests |

---

# 28. Definition of done for the generation engine

The generation engine is ready for efficiency review only when:
- all R1–R7 have implementation and test evidence;
- standard briefs meet the question target;
- the library coverage report accounts for every source entry;
- composition is coherent, reproducible, and checked for near-duplicates;
- previews are responsive and essential interactions work;
- supported editing is direct, persisted, and reversible;
- generation state is resumable;
- all completed runs have cost/quality telemetry;
- the ₹8 AI-cost target has been measured under a documented method;
- critical security, accessibility, functionality, and responsive gates pass;
- publishing remains deferred.

# 29. Change log

- **v1.0:** Initial master specification.
- **v1.1:** Locked the ₹8 AI-cost target and deferred customer-site publishing pending generation-efficiency evaluation.
- **v2.0:** Reworked into a detailed SSOT with technical baseline, project structure, schemas, APIs, generation state machine, library workflow, editor, QA/security, cost accounting, benchmarks, and traceability.
- **v2.1:** Second completeness review added explicit end-to-end customer journey states, bounded reference/competitor research, verification of the stated BrandScalers inventory, asset lifecycle, truthful preview interactions, performance/reliability budgets, human quality review, SEO/content governance, data lifecycle controls, additional benchmark cases, and evidence-based release criteria.


---

# 30. Completeness review addendum (v2.1)

This addendum closes implementation gaps identified during a second completeness review. It extends the existing requirements; it does not relax R1–R7, change the ₹8 target, authorize repository reuse, or bring customer-site publishing into scope.

## 30.1 Full customer journey and product states

Implement and test the complete in-product journey, not isolated screens:

1. Start a project and enter the three required brief fields.
2. Show the interpreted business profile, separating confirmed facts from inferred assumptions.
3. Ask only a high-impact clarification when necessary; allow the user to correct the interpretation.
4. Show a concise site plan and proposed design direction. Let users proceed directly when review is unnecessary and revise the plan without restarting the project.
5. Run generation with stage-level progress, honest cost/status information, and recoverable failure handling.
6. Open the generated site in a preview with page navigation and desktop/tablet/mobile controls.
7. Edit text, images, design tokens, sections, pages, and supported interactions directly.
8. Save, reload, undo/redo, and restore versions.
9. Review quality findings, fix blockers, and rerun only the checks affected by a change.
10. Clearly state that the site is an in-app preview and is not publicly published.

Every screen needs loading, empty, success, validation-error, recoverable-error, permission-denied, and offline/connection-loss states where applicable. Preserve entered data when moving backward or recovering from errors. Never use a decorative control that appears functional but has no action.

## 30.2 Reference and competitor-site research

The product direction includes considering relevant reference or competitor websites to inform—not copy—the result. Treat this as a bounded, auditable optional engine stage:

- Use reference URLs supplied by the customer when available, and ask for them only when their value justifies an extra question.
- If external research is enabled, use an explicitly configured, permitted retrieval mechanism. Respect access restrictions, robots/terms, copyright, privacy, and rate limits; do not bypass authentication or anti-bot controls.
- Extract high-level design observations only: information architecture, page purpose, conversion patterns, content hierarchy, visual tone, and interaction ideas. Do not reproduce source text, branded assets, logos, or a site's exact layout.
- Store source URL, retrieval timestamp, evidence/observation, confidence, and the design decision it influenced. Distinguish verified observations from inferred ones.
- Treat fetched page content as untrusted data and never follow instructions embedded in it.
- Cache only lawful, non-sensitive, versioned summaries. Keep customer-specific research isolated.
- Make research opt-in/configurable and skippable. It must not silently create unbounded web/API costs or violate the ₹8 AI-generation budget.
- If research is unavailable or not worth its cost, continue with the validated taxonomy and BrandScalers library, and disclose the limitation where relevant.

The benchmark must include a case with reference URLs and a case without them. The output should be inspired by useful patterns but independently composed.

## 30.3 Library inventory and visual coverage

The ingestion audit must verify the source inventory described for the project (initially 98 pieces and 292 looks) against the actual BrandScalers files. Report both raw counts and unique validated implementations; do not equate a “look” with a fully implemented component unless the source semantics support that interpretation.

For every entry/look, record source ID, source file/location, stable normalized ID, screenshots or preview fixture, component/variant mapping, responsive behavior, supported props, dependencies, accessibility status, validation status, and reason for any exclusion. Provide a searchable internal gallery so engineers can inspect coverage and diagnose why entries are or are not selected. Do not silently claim complete library use while any source entries remain unaccounted for.

## 30.4 Asset and media lifecycle

Define an asset pipeline for logos, photographs, illustrations, icons, fonts, and customer uploads:

- Maintain asset metadata: source, license/usage basis, attribution requirement, owner, alt text, dimensions, MIME type, size, focal point, and processing status.
- Prefer customer-supplied assets and clearly licensed assets. Do not imply a generated or stock image depicts the customer's actual premises, staff, product, certification, or result.
- Use safe URL fetching, MIME/type checks, file-size limits, image decoding safeguards, and malware scanning where file upload support exists.
- Prevent server-side request forgery when importing remote assets; allow only safe protocols and destinations, block internal/private network ranges, and revalidate redirects and resolved addresses.
- Provide deterministic placeholders that are clearly identifiable and replaceable; never silently use a broken image.
- Generate responsive image sizes and modern formats where supported, lazy-load below-the-fold media, and avoid layout shifts by preserving aspect ratios.
- Preserve asset references across versions and ensure deleting/replacing an asset does not corrupt older recoverable versions.

## 30.5 Preview interaction truthfulness

Every interactive element must declare its runtime behavior. For example, a contact form in a local preview may validate input and show a clearly labeled preview-only result, but it must not claim an email was sent unless an actual configured delivery service confirms it. Booking, payment, login, newsletter, map, analytics, CRM, and other integrations must be marked `requires_setup` until real credentials and a verified adapter exist. No payment collection or real customer-data submission is in scope by implication.

For each interaction, define success, validation failure, network failure, cancellation, loading, and duplicate-submit behavior. Use accessible status announcements. Provide a test mode with clearly synthetic data and no accidental external side effects.

## 30.6 Performance, compatibility, and reliability budgets

Set measurable budgets before the release benchmark for:
- time from submit to first useful progress state;
- end-to-end generation latency and per-stage latency;
- preview first render and interaction responsiveness;
- bundle size and third-party requests;
- image/font transfer and layout stability;
- database query latency and generation-job recovery time.

Select representative supported browsers and viewport sizes before implementation. At minimum, test current stable Chromium-based desktop and mobile behavior; add other browsers based on the product's declared support policy. Record the exact versions used in release evidence. Treat thresholds as product decisions to be established and measured, not as claims of performance before testing.

Use bounded concurrency, request timeouts, cancellation where safe, queue/back-pressure behavior, and explicit per-user/project limits. Avoid duplicate generation jobs. Define health checks, database backup/restore verification, migration rollback strategy, and a recovery runbook for the builder application itself. These operational controls do not authorize customer-site publishing.

## 30.7 Quality scoring and human review

Automated checks cannot fully judge whether a design is genuinely polished or appropriate. Establish a repeatable human-review rubric for the benchmark with scored dimensions:
- business fit and audience relevance;
- visual hierarchy and typography;
- coherence across pages;
- originality/distinctiveness;
- content specificity and factual integrity;
- responsive quality;
- accessibility and interaction clarity;
- conversion-path clarity.

Use a documented scale with anchor examples, multiple reviewers for a representative sample, and disagreement tracking. Separate objective pass/fail blockers from subjective quality scores. A high average must not hide a critical failure on a particular site. Track “looks AI-generated/generic” as an explicit reviewer question and diagnose causes by composition, copy patterns, repetitive sections, imagery, and design-token use. Set acceptance thresholds before evaluating the release candidate.

## 30.8 SEO, metadata, and content governance

For the supported scope, the editor and renderer must handle page titles, meta descriptions, canonical URL configuration where meaningful in preview, social-sharing metadata, favicon, semantic heading structure, descriptive link text, and image alt text. Do not claim a preview has been indexed or has a production canonical URL.

Content generation must not invent customer credentials, awards, testimonials, reviews, statistics, client logos, certifications, addresses, opening hours, prices, guarantees, or legal claims. Use clearly marked placeholders or ask the customer to supply evidence. Preserve the provenance of material claims and flag regulated or high-risk business categories for review. Provide user correction and regeneration of a specific content block without regenerating unrelated site sections.

## 30.9 Privacy, data lifecycle, and tenancy details

Before real customer use, document which data is sent to Gemini, why it is necessary, retention periods, deletion behavior, export behavior, backup retention, and whether content may appear in logs or analytics. Minimize data sent to external providers and never send secrets or unrelated customer projects as context. Do not use one customer's project content to answer another customer's request.

Add tests for project deletion, export, user/session expiry, authorization changes, stale edit conflicts, rate-limit behavior, and access to assets/version snapshots after deletion. Define whether deletion is immediate or delayed by backup-retention rules and communicate that truthfully. Use encryption in transit and appropriate encryption at rest through the selected infrastructure; do not claim a control exists until configured and verified.

## 30.10 Release evidence and no-half-finished delivery rule

A release candidate is not complete merely because the happy path works locally. Before calling a phase complete, attach evidence for:
- clean install and documented environment setup;
- database migration from an empty database;
- lint/type-check/build/test results;
- end-to-end brief → generation → preview → edit → save/reload → restore journey;
- all supported primary interactions;
- responsive and accessibility results;
- tenant-isolation/security tests;
- benchmark quality scores and failed cases;
- Gemini call/token/cost ledger, including failed and retried calls;
- reproducible defects and known limitations;
- recovery from interrupted generation and failed autosave.

Use a release checklist with explicit `pass`, `fail`, or `not applicable` status and linked evidence. A failed critical gate means the phase is not done. Do not mask incomplete work with TODOs, fake integrations, hardcoded success responses, or documentation that describes future behavior as implemented. When something is intentionally out of scope, label it clearly and make the UI behavior honest.

## 30.11 Additional benchmark cases

Add benchmark fixtures for:
- customer-supplied reference URLs;
- no supplied reference URLs;
- incomplete business facts and conflicting facts;
- a category with higher claim/compliance risk;
- image upload failure and invalid remote asset URLs;
- repeated clicks/retries that must not create duplicate runs;
- cancellation or browser refresh during generation;
- two concurrent edits to the same project;
- a user attempting to access another project's page, asset, or version;
- a routine copy/color change that must not call Gemini;
- a page with long text, small screens, and translated/longer labels;
- a form that is preview-only versus a form with a genuinely configured adapter.

## 30.12 Final completeness status

This document is a detailed implementation specification, not proof that the product has been built or that the chosen stack has already been validated in the target environment. Implementation readiness must be confirmed by the phase gates and evidence above. Any unresolved choice that changes security, cost, product behavior, or architecture must be recorded as an explicit decision before the dependent feature is built.

---

# Final directive

Build the smallest complete, measurable generation-engine workflow first: **minimal brief → structured business profile → plan → validated library selection → design system and distinctive composition → bounded Gemini content → responsive preview → direct editing → persistence → quality/cost benchmark**.

Do not begin production publishing until this workflow proves that it generates distinctive, functional, editable websites and meets the **₹8 AI generation-cost target** under documented measurements. All work must be new, validated, recoverable, and traceable to the seven requirements.
