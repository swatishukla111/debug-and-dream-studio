<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Rebuilt from an uploaded Flask + React app: all data lives in Lovable Cloud tables (profiles, providers, datasets, consents) accessed from the browser client under RLS — no separate API server is needed.
- Account type in `profiles` is a display label only, never a permission; there is no self-assignable admin role (the original allowed it, which was a security hole).
- Privacy helpers (FHIR conversion, k-anonymity) are pure functions in `src/lib/privacy.ts` so they can be unit-tested.
