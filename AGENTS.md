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

- AccountProvider owns the single Auth lifecycle subscription and modal on public pages; browsing remains public and personal actions request inline sign-in.
- Private account state is read and mutated through authenticated TanStack server functions with owner-only RLS; persisted PRO mode remains the existing interactive demo, not a paid entitlement.
- Watch discovery uses ordinary photographs and model/category selectors, not a layered 3D stage, to keep mobile browsing direct and lightweight.
- Natural-language search is interpreted only by a server function that returns filters; results always come from the existing catalog, and keyword fallback is labeled visibly — keeps keys server-side and prevents invented parts.

- Live part search runs only on the server through /api/search, returning listing-only items and explicit per-source statuses; no generated products or browser source fetching, so missing evidence stays missing.
- Auth uses the generated Supabase browser client (/auth page, AccountProvider listens to onAuthStateChange); never create fake local sessions. Mi Caja reads/writes watchbox_favorites and shopping_lists via the browser client under owner-only RLS.
- Marketplace listings created by real users live in Supabase (listings + private listing-photos bucket with signed URLs); full serials are column-revoked and only readable via get_listing_serial, and moderation goes through the moderate_listing RPC that also notifies the seller.
