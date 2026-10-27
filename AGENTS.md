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
- The watch uses CSS layered photography with responsive camera transforms; mobile hotspot details live below the stage while desktop retains floating labels.
