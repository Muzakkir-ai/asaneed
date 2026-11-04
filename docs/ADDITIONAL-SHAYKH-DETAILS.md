# Added-shaykh detail view — 4 November 2026

Selecting an added shaykh replaces the directory with a full detail section. Profile editing, adding qiraat ijazahs and adding mutoon start from this detail view using the existing editors and permission checks. A Back to Mashaykh control returns to the directory. Save responses refresh the displayed profile/mutoon. This is in-workspace navigation; no new external route or database schema.

TypeScript and a mocked React DOM navigation test passed for opening detail without a dialog, reading/matn add actions and returning to the list. No hosted record was written for verification. Actual authenticated role sessions remain unverified.
