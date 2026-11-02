# Clean booking URL

The former `updateUrlParams` effect in `src/App.tsx` wrote from/to/date/passengers
and step on every mount and search change. Vietnamese names were URL encoded,
which produced the long `?from=%C4...` address even when simply opening Home.

`src/utils/searchNavigation.ts` now stores validated search values and a safe
reload step in `history.state.danavaSearch` (schema version 1). Root booking screens
stay at `/`, without those five query parameters. Existing history state keys,
unrelated query parameters (e.g. campaign tracking), and anchors are preserved.
No passenger contact, selected seats, payment or admin credentials are stored here.

Legacy query links still initialize search, then their five owned parameters are
removed using replaceState; no page reload/redirect and no new history entry.
Explicit legacy query inputs take precedence over older saved state. Dates,
canonical city names and passenger counts retain the existing App validation.
Reloading results restores results. Reloading later booking stages safely returns
to results, because those stages still need live in-memory selection. Returning
Home saves the Home step, so refresh stays there. A new independent browsing
session with no saved entry uses normal defaults; copying `/` alone does not share
the previous tab's search criteria. Unrelated query parameters are not stripped.

The helper only handles pathname `/`. It cannot rewrite `/app`, `/admin`, or any
other future path. This does not implement an admin app or change existing path
routing. No changes to animations, forms, backend or cPanel configuration.

Checks: `npm run test:navigation` (25 focused assertions), build, lint and existing
logic suite (26 assertions). Browser checked legacy-link cleanup, search results
and reload retaining Da Nang–Hue, date and two passengers. Full browser journey
suite was not rerun here; its departure assertion now observes results/history
state instead of relying on the intentionally removed `step=search` URL.

Deploy the new build on cPanel following `docs/CPANEL_UPDATE.md`; a GitHub commit
alone does not update the currently served index/assets on danavago.com.
