# M4: Internal Beta Polish (Not Public Release)

## Scope Guardrails
- Milestone is polish/infrastructure only; no new calculator business logic.
- Keep Novated Lease as the only functional calculator.
- Add placeholders only for:
  - Interest Rate Calculator (Coming soon)
  - Income Tax Calculator (Coming soon)
- Hard requirements for this milestone:
  - `package.json` version must be `0.1.0` (no suffix)
  - Global app/page metadata must include `(beta)` after app name
  - English default + Chinese UI toggle
  - Dark mode: System / Light / Dark with persistence
  - Homepage (`/`) is the calculator selector
  - Term whitelist must remain untranslated:
    - `ATO`, `FBT`, `ECM`, `GST`, `PAYG`, `Medicare levy`, `Residual`, `Gross-up factor`, `RFBA`, `EV`, `BEV`, `ICE`

## A) UI / Branding Plan

### A1. Top-level Information Architecture
- `/` becomes the calculator selector landing page (no intermediate chooser).
- `/novated-lease` remains the primary working calculator page.
- Remove the `/calculators` path entirely.
- Placeholder cards on selector:
  - Interest Rate Calculator — badge `Coming soon`, disabled CTA.
  - Income Tax Calculator — badge `Coming soon`, disabled CTA.
- Placeholder behavior:
  - Non-clickable primary CTA, or clickable to `#` with disabled semantics and tooltip text.
  - Must not expose unfinished routes or broken links.

### A2. Layout / Components Polish Direction
- Header/navigation:
  - Compact top bar with app name `(beta)`, language toggle, theme toggle.
  - Optional subtle beta badge next to app name.
- Typography hierarchy:
  - Clear type scale for page title, section titles, card titles, helper text.
  - Muted helper/disclaimer text consistently styled.
- Cards/results:
  - Selector page uses consistent card layout with title, short description, status badge, CTA state.
  - Novated result cards keep headline-first summary and aligned rows.
- Numeric formatting standardization:
  - Centralized currency formatter (AUD).
  - Centralized percent formatter for displayed rates.
  - No ad-hoc inline formatting styles across components.

### A3. Exact User-facing Pages/Components to Touch
- Pages:
  - `src/app/page.tsx` (homepage selector)
  - `src/app/layout.tsx` (global metadata + shell providers)
  - `src/app/novated-lease/page.tsx` (provider usage check)
- Shared components:
  - `src/components/calculator/CalculatorPage.tsx`
  - `src/components/calculator/CalculatorPage.module.css`
  - New shared header component (planned): `src/components/app/AppHeader.tsx`
  - New theme/language controls component (planned): `src/components/app/AppControls.tsx`
- Novated UI:
  - `src/components/novatedLease/NovatedLeaseCalculator.tsx`
  - `src/components/novatedLease/NovatedLeaseCalculator.module.css`

## B) Theme Plan (Dark Mode)

### B1. Chosen Approach
- Use CSS variables + data attribute (`data-theme`) with no major dependency.
- Rationale:
  - Current app already uses CSS variables heavily.
  - Minimal dependency and full control across server/client render.

### B2. Theme State + Persistence
- Theme state stored in `localStorage` key: `theme` (`system|light|dark`).
- On load:
  - If saved value exists, apply it.
  - Else use system preference (`prefers-color-scheme`).
- Apply theme via `document.documentElement.dataset.theme`.
- Toggle exposes three-state switch: System / Light / Dark.
- Hydration-safe strategy:
  - Apply initial theme in a small client provider.
  - Avoid visible flash by setting a conservative default in CSS.

### B3. Files to Change/Add
- Add:
  - `src/lib/theme/theme.ts` (theme helpers/constants)
  - `src/components/providers/ThemeProvider.tsx`
  - `src/components/app/ThemeToggle.tsx`
- Change:
  - `src/app/layout.tsx` (wrap app with provider)
  - `src/app/globals.css` (light/dark variable sets, `[data-theme]` rules)

## C) i18n Plan (EN default + 中文 toggle)

### C1. Dictionary Structure
- Add JSON locale files:
  - `src/i18n/locales/en.json`
  - `src/i18n/locales/zh.json`
- Keep flat-namespaced keys (e.g., `home.selector.title`) for maintainability.

### C2. Runtime Layer
- Add lightweight provider + hook:
  - `src/i18n/I18nProvider.tsx`
  - `src/i18n/useI18n.ts`
  - `t(key: string, params?)` with fallback to English.
- Persist language in `localStorage` key: `lang` (`en|zh`).
- Language toggle in header; default to English.

### C3. No Internal Names + Minimal Hard-coded Strings
- Replace user-facing strings in components with `t("...")`.
- Keep only non-user-facing constants hard-coded.
- Add lintable convention:
  - No plain UI copy inside JSX except very short structural tokens if unavoidable.

### C4. Term Whitelist Enforcement
- Implement term-preservation helper:
  - `src/i18n/terms.ts`
  - `preserveTerms(text, locale)` that keeps canonical tokens untouched.
- Authoring convention:
  - Chinese dictionaries may append explanatory Chinese in parentheses while preserving token.
  - Example: `FBT（福利税）`.
- Use helper in glossary/tooltip and other high-risk sections.

### C5. Starter Translation Key Map
- Header/nav:
  - `app.name`
  - `app.beta_badge`
  - `nav.calculators`
  - `controls.language`
  - `controls.theme`
  - `controls.theme.system`
  - `controls.theme.light`
  - `controls.theme.dark`
- Homepage selector:
  - `home.selector.title`
  - `home.selector.subtitle`
  - `home.selector.disclaimer`
  - `home.card.novated.title`
  - `home.card.novated.desc`
  - `home.card.novated.cta`
  - `home.card.interest.title`
  - `home.card.interest.desc`
  - `home.card.interest.status`
  - `home.card.tax.title`
  - `home.card.tax.desc`
  - `home.card.tax.status`
- Novated page headings/sections/buttons:
  - `novated.title`
  - `novated.subtitle`
  - `novated.calculate`
  - `novated.status.outdated`
  - `novated.status.latest`
  - `novated.summary.title`
  - `novated.compare.title`
  - `novated.section.inputs`
  - `novated.section.results`
- Tooltips/glossary/disclaimer:
  - `novated.glossary.title`
  - `novated.glossary.fbt`
  - `novated.glossary.ecm`
  - `novated.disclaimer.title`
  - `novated.disclaimer.body`
- Placeholders:
  - `placeholder.coming_soon`
  - `placeholder.no_logic_yet`

## D) Beta Indication

### D1. Global Metadata
- Set global metadata title pattern with `(beta)`:
  - Example: `AU Finance Calculators (beta)`
- Apply at root layout metadata so all pages inherit.
- If template/title config is used, ensure suffix remains consistent.

### D2. Optional Header Badge
- Add subtle badge near app name:
  - text: `beta`
  - low-contrast pill style
  - no animated/disruptive treatment

## E) Versioning & Non-release

### E1. Planned Versioning Updates
- Update `package.json`:
  - `"version": "0.1.0"`
- Add `CHANGELOG.md` (currently missing) with entry:
  - `0.1.0 - Internal beta polish`
  - summarize: i18n toggle, theme toggle, selector homepage, metadata beta marking

### E2. Explicit Non-release Confirmation
- No git tags.
- No GitHub Release creation.
- No release automation workflow changes in this milestone.

## F) Risks and Verification

### F1. Key Risks
- SSR/client mismatch:
  - Theme/lang from localStorage can mismatch server render if not guarded.
- Query param sync regressions:
  - Existing novated URL state must remain stable after text localization/theme additions.
- Route IA changes:
  - Ensure `/` selector migration and `/novated-lease` route stay stable after shell/i18n/theme updates.
- Term whitelist drift:
  - Chinese copy updates could accidentally translate protected terms without guard utility.

### F2. Verification Commands
- `pnpm lint`
- `pnpm test`
- `pnpm build`

Additional acceptance checks (manual):
- Theme toggle cycles `System/Light/Dark` and persists across reload.
- Language toggle `English/中文` persists across reload.
- Whitelisted terms remain untranslated in Chinese UI.
- Homepage shows selector with one active + two coming-soon cards.
- No broken links from homepage cards.

## Implementation Order (for execution phase)
1. Add i18n runtime + dictionaries + header language toggle.
2. Add theme runtime + toggle + CSS variable themes.
3. Refactor homepage into selector cards with placeholders.
4. Migrate user-facing strings on novated page to i18n keys.
5. Enforce whitelist helper in glossary/high-risk UI labels.
6. Update metadata `(beta)` and version/changelog.
7. Full lint/test/build and manual UX verification.
