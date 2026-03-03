# M6: Mobile Usability and Responsive Polish

## Goal
Make the entire site fully usable and readable on mobile browsers (320px+), with priority on the Novated Lease calculator.

This milestone is UI/layout-only.
No changes to calculation logic, data tables, or business rules.

## Scope Boundaries
- Keep calculation engine untouched.
- Keep JSON financial data layer untouched.
- Keep query-param structure unchanged.
- Keep version at `0.1.0`.
- No release/tag actions.

## File-Level Change Proposal
- `src/app/globals.css`
- `src/components/app/AppHeader.module.css`
- `src/components/app/AppHeader.tsx` (layout-only adjustments)
- `src/components/layout/Footer.module.css`
- `src/app/page.module.css`
- `src/components/calculator/CalculatorPage.module.css`
- `src/components/novatedLease/NovatedLeaseCalculator.module.css`
- `src/components/novatedLease/NovatedLeaseCalculator.tsx` (layout grouping/collapse behavior only)
- `src/i18n/locales/en.json` (if minor responsive copy tweaks are needed)
- `src/i18n/locales/zh.json` (parallel copy tweaks)

## Layout Refactor Plan

### 1) Global Layout Responsiveness
- Remove horizontal overflow at 320px.
- Use adaptive container padding by breakpoint.
- Use fluid typography where needed via `clamp()`.
- Ensure footer wraps cleanly on small screens.
- Preserve desktop visual language.

### 2) Header Adaptation
- Reduce visual header density on mobile.
- Keep theme/language selectors touch-accessible (`>=44px` tap area).
- Use compact control arrangement on narrow widths.
- Preserve existing state persistence behavior.

### 3) Home Selector Responsiveness
- Stack cards in one column on mobile.
- Increase tap-target size for actions.
- Keep visual distinction between:
  - Available calculator
  - Coming-soon calculators
- Eliminate overflow in both EN and ZH.

### 4) Novated Input Section
- Single-column input layout on mobile.
- Multi-column retained on desktop.
- Keep logical section grouping.
- Advanced sections collapsed by default on mobile.
- Ensure labels/help text wrap and inputs remain full-width.
- Avoid keyboard-induced layout breakage.
- Preserve query-param sync behavior.

### 5) Results Section (High Priority)
- Keep Executive Summary visually primary.
- Ensure comparison is readable on mobile via stacked cards.
- Avoid wide-table behavior and horizontal scroll.
- Keep breakdown collapsible and clear.
- Preserve currency/number formatting consistency.

## Responsive Breakpoint Strategy
- Phone: `<= 414px`
- Tablet: `<= 768px`
- Desktop: `> 768px`

Design checks at:
- `320px`
- `360px`
- `390px`
- `414px`
- `768px`

## Component-Level Restructuring
- `CalculatorPage`:
  - mobile: one-column content flow
  - desktop: current two-column flow
- `NovatedLeaseCalculator`:
  - no calculation changes
  - form/result layout and spacing adjustments only
- `AppHeader` / `Footer`:
  - compact, touch-friendly control/link layout on mobile

## Cross-Cutting Requirements
- i18n works in EN + ZH.
- Dark mode works in all updated surfaces.
- No business logic changes.
- No engine changes.
- No route changes.

## Risks and Mitigation
- Query sync break during refactor:
  - Do not modify form state/query mapping logic.
- iOS sticky/fixed quirks:
  - Verify header/footer overlap and safe spacing.
- Mobile viewport bugs:
  - Avoid strict `100vh` dependence for main layout blocks.
- Comparison overflow:
  - Enforce stacked cards and wrap behavior.
- Touch usability:
  - Minimum 44px control target and spacing.
- Collapsible + URL restore conflicts:
  - Keep collapse state local and independent from query state.

## Testing Matrix

### Viewports
- 320
- 360
- 390
- 414
- 768

### Browsers
- iOS Safari
- Android Chrome
- Desktop Chrome

### Theme/Language combinations
- English + Light
- English + Dark
- Chinese + Light
- Chinese + Dark

## Task Breakdown
1. Harden global overflow and spacing rules.
2. Refactor header mobile layout/touch targets.
3. Refine fixed footer mobile wrapping and spacing.
4. Improve homepage card stacking and action sizing.
5. Adjust calculator shell breakpoints for mobile-first readability.
6. Refine novated form grids and advanced-section behavior on mobile.
7. Refine results/comparison/breakdown mobile presentation.
8. Validate EN/ZH + Light/Dark combinations.
9. Run verification commands.

## Acceptance Criteria
- No horizontal scrolling across target widths.
- Header/footer remain usable and readable on mobile.
- Home cards stack cleanly with clear status hierarchy.
- Novated form is readable and usable at 320px.
- Results remain clear without horizontal scrolling.
- EN/ZH render correctly.
- Dark mode renders correctly for all updated sections.
- `pnpm lint`, `pnpm test`, `pnpm build` pass.

## Definition of Done
- Responsive QA matrix completed across required viewports.
- No calculation engine/data-layer changes.
- No query-sync regressions.
- No console errors tied to layout changes.
- Lint/test/build all green.
