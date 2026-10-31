# Public navigation request reduction

User goal: reduce repeated background requests while browsing Home and service pages, retaining current flows and fresh server checks for customer actions.

Investigation: FooterBody has no API requests and already disables Next Link prefetch. Header/footer navigation shares a 45-second session cache. Other page/service/offer links still use automatic prefetch, which can load destination RSC routes. BirthdayGreeting depends on the full pathname, re-running optional session checks on every public-route change. OffersProvider loads protected codes eagerly for signed-in sessions even without a code consumer. Insurance, print and request bootstrap session checks bypass the shared cache.

Implementation: disable automatic Next Link prefetch throughout app/component navigation; retain normal click navigation. Use public-vs-private eligibility for birthday effect dependencies. Make protected offer codes demand-driven (only masked-code consumers) and retain root-provider state across navigation. Route form bootstrap session checks through the existing cache, keeping direct authoritative checks before upload/write actions. No new persistent private-data cache or runtime dependencies.

Proof: component regressions for repeated public-route navigation, absent/unmasked vs mounted masked-code consumers, repeat consumers, login/logout and stale-auth responses; full existing verification and staging limitations recorded after execution. Footer request attribution is based on source inspection, not a captured production browser network trace.

## Results

- 160 additional Next Link tags across 54 files now disable automatic prefetch. A TypeScript AST audit checked all 230 Next Link usages under src/app and src/components: none has implicit/enabled prefetch. The installed Next Link implementation gates viewport, hover and touch prefetch on this property; normal click navigation is retained.
- Full `npm run verify` passed: security checks, all 271 Node tests, ESLint and production webpack build (including TypeScript). Build used the same intentionally unreachable local dummy DB as the dashboard checks; public content fallbacks are not live-data validation.
- `tests/browser/public-navigation.mjs` passed with synthetic API boundaries in a simulated DOM. The previous implementation failed the route-only birthday check regression (four session consumers vs two after two navigations). Checks also cover on-demand offer reveal, reuse across navigation/consumer remounts and logout before a delayed reveal resolves.
- Existing dashboard component checks also passed after these changes. Independent follow-up source review reported no actionable findings.
- No production browser network capture or live end-to-end latency benchmark was available. The environment's previously established Chromium-download and PostgreSQL-access limitations still apply. No deployment or database changes were performed.
- Repeated navigation may still need one authoritative session refresh after the existing 45-second UI cache expires. Form uploads, writes and account authorization remain server-validated. The shared root provider is reused during Next router navigation; full browser reloads intentionally recheck state.
