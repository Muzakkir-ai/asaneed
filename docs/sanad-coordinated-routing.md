# Asaneed coordinated sanad routing

## Applicability
The shared SVG engine is `planCoordinatedSanad` in
`legacy/lib/sanadCoordinatedRouting.ts`, consumed by
`legacy/components/CombinedSanadView.tsx`.

Every Qurra, historical reader-to-Companion, Ibn al-Jazari-to-al-Dani,
combined mashaykh, and comparative graph **rendered with
CombinedSanadView** uses this planner. The separate CSS
`SanadPathView` / `ConnectedChainEditor` authoring controls remain
unchanged: they are not SVG edge-routers and must not lose their
narrator insertion/editing controls during this rollout.

## Graph invariants
1. Inputs are the existing immutable person-ID paths. `combinedSanad`
   remains the source of directed edges and route membership.
2. A complete multiple-source/multiple-destination bus is permitted only
   when every source-target edge is present. Otherwise each independent
   fan-in or fan-out group is drawn separately.
3. Every real edge belongs to exactly one visual group and retains its
   original `from`, `to`, `routes`, optional `id` and original index.
4. SVG bus/feed/drop segments carry owning edge indices. An invisible
   metadata path preserves each actual source-target pair and associated
   route numbers for inspection and tracing; intersections never become
   graph edges. Sanad text never reads geometry.
5. Selecting a grouped display route or **one exact sanad** computes
   geometry only for real edges belonging to that selection. Selection
   does not rewrite, persist, or infer relationships.
6. Each fan-in uses a source-side horizontal lane and a single final
   arrow. Each fan-out uses a centered source trunk, one bus level and
   one arrow per target. All segments are orthogonal.
7. Measured narrator heights, solid rectangles with clearance, separate
   horizontal lanes and bypass corridors are included in collision checks.
   If the planner cannot produce a safe layout, its view falls back to the
   previous renderer without changing the saved graph.

## Reversible feature flag
- Default: coordinated shared-bus routing enabled.
- Emergency global kill switch: set
  `NEXT_PUBLIC_SHARED_BUS_ROUTING=false` in the Vercel project
  environment and redeploy. This restores the previous SVG router.
- Per-view rollback: click
  **العودة إلى توجيه الخطوط السابق** inside the diagram; click the
  inverse control to re-enable shared-bus routing. This changes only
  the current viewer's React state and performs no database write.

## Release checks
- `npm run typecheck` and `npm run test:sanad` cover exact edge
  equality, fan-in, fan-out, dense and incomplete bipartite graphs,
  obstacles, variable card heights, crossing non-junctions, and preserved
  edge identifiers / route memberships.
- `npm run test:sanad:graph` opens the real React components at
  desktop and mobile widths, verifies 1-to-4, 4-to-1 and 5-to-3 buses,
  individual path selection, arrow endpoints, live rollback, and card
  clearance.
- The **Asaneed Visual Preview** workflow renders the source-backed
  imam-to-Companions example and exports screenshots using synthetic
  records. It does not validate authenticated production data.
- The release adds no migrations or Supabase updates and changes no
  narrator identity, saved sanad relation, or route metadata.

## Layout safety
The engine handles its own visual parts and metadata separately.
The SVG includes `data-edge-indices` and `data-route-indices` for
each visible segment; `data-from`, `data-to`, and `data-routes`
for every original edge; and `data-focused-edge` for precisely
selected person relationships. The existing sanad creation logic
continues to read narrator paths, never SVG intersections.
