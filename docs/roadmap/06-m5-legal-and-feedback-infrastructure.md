# M5: Legal and Feedback Infrastructure (Internal Beta)

## Goal
Add legal trust pages and a contact surface so the app is production-structured and AdSense-ready, without changing calculator logic.

## Scope Summary
- Add pages:
  - `/about`
  - `/privacy`
  - `/terms`
  - `/contact`
- Add global footer visible on all pages with links to those pages.
- Add contact email link:
  - `mailto:au.finance.tools@gmail.com?subject=AU Finance Calculators Feedback`
- Keep all new text in i18n dictionaries (EN + ZH).
- Keep calculation engine unchanged.

## Non-Goals
- No backend email form.
- No database.
- No analytics integration.
- No ad integration.
- No calculation engine changes.
- No version bump.
- No tag/release creation.

## File Structure Proposal
- `src/app/about/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/contact/page.tsx`
- `src/components/app/AppFooter.tsx`
- `src/components/app/AppFooter.module.css`
- `src/components/app/LegalPage.module.css`
- `src/app/layout.tsx` (mount footer globally)
- `src/i18n/locales/en.json` (extend)
- `src/i18n/locales/zh.json` (extend)

## i18n Key Structure Proposal
- `footer.*`
- `footer.copyright`
- `footer.about`
- `footer.privacy`
- `footer.terms`
- `footer.contact`
- `about.*`
- `about.title`
- `about.intro`
- `about.missionTitle`
- `about.missionBody`
- `about.howItWorksTitle`
- `about.howItWorksBody`
- `about.disclaimerTitle`
- `about.disclaimerBody`
- `privacy.*`
- `privacy.title`
- `privacy.lastUpdated`
- `privacy.noPersonalCollectionTitle`
- `privacy.noPersonalCollectionBody`
- `privacy.clientSideTitle`
- `privacy.clientSideBody`
- `privacy.noSaleTitle`
- `privacy.noSaleBody`
- `privacy.adsCookiesTitle`
- `privacy.adsCookiesBody`
- `privacy.emailUseTitle`
- `privacy.emailUseBody`
- `terms.*`
- `terms.title`
- `terms.lastUpdated`
- `terms.infoOnlyTitle`
- `terms.infoOnlyBody`
- `terms.noAdviceTitle`
- `terms.noAdviceBody`
- `terms.noAccuracyGuaranteeTitle`
- `terms.noAccuracyGuaranteeBody`
- `terms.userResponsibilityTitle`
- `terms.userResponsibilityBody`
- `terms.liabilityTitle`
- `terms.liabilityBody`
- `contact.*`
- `contact.title`
- `contact.intro`
- `contact.emailLabel`
- `contact.emailValue`
- `contact.feedbackCta`
- `contact.responseNote`

## Footer Structure Design
- Semantic `<footer>` rendered from root layout on all pages.
- Content:
  - `© 2026 AU Finance Calculators`
  - `About · Privacy · Terms · Contact`
- Navigation via Next.js `<Link>`.
- All visible text from i18n keys.

## Page Content Requirements

### `/about`
- What the tool does and who it is for.
- How estimates are generated (client-side model assumptions).
- Clear estimate-only positioning.

### `/privacy`
Must include:
- No personal data collection unless voluntarily provided.
- Calculations processed client-side.
- No selling of personal data.
- Future note about third-party advertising cookies.
- Email used only for response.
- `Last updated: 2026`.

### `/terms`
Must include:
- Informational purposes only.
- Not financial/tax/legal advice.
- No guarantee of accuracy/completeness.
- User responsible for decisions.
- No liability clause.
- `Last updated: 2026`.

### `/contact`
- Show `au.finance.tools@gmail.com`.
- Mailto feedback link with exact subject.
- Plain guidance on expected response usage.

## Layout and UX Consistency
- Keep existing app shell/header.
- Use shared legal page container width (max content around 3xl).
- Use semantic headings (`h1`, `h2`).
- No inline hardcoded user text.

## Task Breakdown
1. Extend EN/ZH locale files with `footer`, `about`, `privacy`, `terms`, `contact` namespaces.
2. Create shared legal page styles.
3. Implement `/about`, `/privacy`, `/terms`, `/contact` pages using i18n.
4. Implement global footer and wire in `layout.tsx`.
5. Add contact mailto link with exact subject.
6. Validate whitelist-sensitive terms remain unbroken.
7. Run verification: `pnpm lint`, `pnpm test`, `pnpm build`.

## Risks
- SEO trust risk if legal copy is too thin.
- AdSense readiness risk if legal pages/footer links are missing or unclear.
- i18n drift risk from hardcoded fallback strings.
- Term whitelist risk if translated tokens mutate.

## Acceptance Criteria
- All four routes exist and render.
- Footer is visible across all pages.
- Footer contains required links and copyright text.
- Contact page includes exact email and mailto subject.
- Privacy page includes all required clauses + `Last updated: 2026`.
- Terms page includes all required clauses + `Last updated: 2026`.
- New text is in EN + ZH dictionaries.
- No changes to calculation engine.
- `pnpm lint`, `pnpm test`, `pnpm build` pass.

## Edge Cases
- Mailto subject encoding across email clients.
- Chinese text wrapping on mobile footer and legal pages.
- Dark mode contrast for footer and legal content.
- Missing locale key fallback should remain readable in EN.
