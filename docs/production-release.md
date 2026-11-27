# Asaneed production releases

Production source: `audit/chat12-integration-c1ae83cba1a2` (not `main`, which has diverged). Merge reviewed changes into this branch, run the sanad editor regression workflow and relevant browser tests, deploy the exact merge SHA to the existing Asaneed Vercel project, and promote only a READY build with passing checks. Verify that `asaneed.vercel.app` resolves to the same deployment ID and commit. Keep the prior production deployment available for rollback. Never migrate or rewrite sanad records or certificate artwork as part of a UI release.
