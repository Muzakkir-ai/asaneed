# Studio accessibility audit

The prior local commit 378c54f was unavailable after the workspace restarted. The drawer fix was reconstructed from its handoff on GitHub main at 292dc0d5dbd27556b4004051b782cc369946c21d. The old synthetic DOM test reproduced focus loss after Escape. The reconstructed fix uses a Radix dialog trigger and localized drawer direction and names.

Run `npm ci` and `npx playwright install chromium`, then `npm run test:workspace-theme -- --studio-shell`. The fixture mounts the real Studio client with a synthetic issuer and certificate. The harness mocks requests and removes the temporary routes after testing.

| Result | Check | Evidence |
| --- | --- | --- |
| PASS | RTL keyboard and menu | Enter opens the Arabic drawer, Tab stays in it, and Escape returns focus to its trigger. Expanded state changes on open and close. English drawer direction and return focus also pass. |
| PASS | Responsive layout | Chromium 141.0.7390.37 at 1280, 390 and 320 px. No document overflow in the certificate list. Mobile narrator cards retain readable widths and parallel lanes stack. |
| PASS | Direct link and preferences | Direct certificate link works. Dark theme and English LTR persist after reload. |
| PASS | Mixed direction | Arabic-Indic registration number ٢٦٠١-١٢٣٠٥ renders its groups left-to-right inside RTL at all three widths. |
| PASS | Sampled contrast and motion | Dark-mode filled certificate action icon measured 5.20:1. Sidebar icon transform is disabled with reduced motion. |
| FAIL | Back and Forward | Source uses replaceState for Studio section changes. Section selections do not create history entries. This was documented in the prior handoff. |
| FAIL | Broader browser suite | The full suite reached a timeout at its existing narrator-creation button selector. The Studio subset passes independently. |
| BLOCKED | Profile follow-through and device checks | The English drawer could not be reopened in the Profile fixture. The certificate route verified preference reload and the English drawer. Physical devices, a full contrast audit and authenticated performance timings remain unverified. |

Studio supports Arabic and English shell controls. Urdu is available on public pages. Feature content including Profile and certificate records can remain Arabic with the English shell.
