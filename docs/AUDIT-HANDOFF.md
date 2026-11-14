# Asaneed audit handoff

Updated 14 November 2026 (Asia/Riyadh). Read [AGENTS.md](../AGENTS.md) and [CURRENT-STATE.md](CURRENT-STATE.md). Check GitHub for newer heads, checks and handoffs before editing.

## First task for a short session

Check the CI result for [draft PR #118](https://github.com/Muzakkir-ai/asaneed/pull/118). Compare the live PR head with `b4deadead26c40283ea8dfd969e059fdd02e8047`, then inspect the [reported run](https://github.com/Muzakkir-ai/asaneed/actions/runs/43617285543) or the matching run for any newer head. Record the exact head, check result and first failing assertion if applicable. If the run is pending or unavailable, record that status. This task needs no code changes or staging access.

## Recent results and open work

| Draft | Verified in the prior handoff | Still open |
| --- | --- | --- |
| [#116 onboarding](https://github.com/Muzakkir-ai/asaneed/pull/116#issuecomment-6880789523) | Isolated staging database verified assignment, revocation, setup code controls and activation with synthetic accounts. | Hosted browser inspection and role matrix need an isolated preview with #116. Activation and recovery email flows need a matching staging setup key and confirmed capture route. |
| [#118 certificate lifecycle](https://github.com/Muzakkir-ai/asaneed/pull/121#issuecomment-6880901974) | Same-name students are separately selectable by stable ID. Synthetic save and reload, mobile Chromium, and local recipient sanad import passed. | Confirm CI and verify picker and recipient import on isolated staging. |
| [#115 verification](https://github.com/Muzakkir-ai/asaneed/pull/115) | Synthetic HTTP and RPC tests covered number lookup limits and historical token compatibility. | Staging credential, trusted client IP, cleanup and rollback verification. |
| [#121 release QA](https://github.com/Muzakkir-ai/asaneed/pull/121) | Prior integrated staging checks covered synthetic certificate lifecycle and snapshot-preserving rollback. | Hosted recipient A4 print, verification abuse control integration and an isolated recovery rehearsal or owner decision. Keep the PR at the approval checkpoint. |

At handoff, six original chats had been resumed for [multi-sanad editor #114](https://github.com/Muzakkir-ai/asaneed/pull/114), [routing #117](https://github.com/Muzakkir-ai/asaneed/pull/117), [Qurra labels #112](https://github.com/Muzakkir-ai/asaneed/pull/112), [books and routes #120](https://github.com/Muzakkir-ai/asaneed/pull/120), [Mutūn #119](https://github.com/Muzakkir-ai/asaneed/pull/119), and Studio accessibility (last reported commit `378c54f`). Check for their latest results before taking ownership of overlapping work. The known baseline Qurra fan-in failure belongs with #117.

Use isolated synthetic fixtures. Preserve stable IDs, privacy, issued snapshots and historical verification links. No production writes, deployments, main merges, real issuance or invitations under this handoff.
