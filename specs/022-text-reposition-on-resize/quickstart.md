# Quickstart: Validating Text Repositioning on Layout Resize

## Prerequisites

- Node/npm installed, repo dependencies installed (`npm install`), same as for `npm run test:attached-text`.
- No browser or build step is required for the automated check below.

## Automated validation (headless, matches `contracts/reposition-contract.md`)

1. Run the new regression script once it exists (Phase 2/implementation adds it):
   ```sh
   npm run test:global-layout-reposition
   ```
2. Expected output: one `PASS <name>` line per case in `contracts/reposition-contract.md` (R1–R11), and a final `all checks passed` with exit code 0. Any `FAIL <name> -- <detail>` line means that case's expected position/ratio was not produced.

## Manual validation in the running app (exploratory, not a substitute for the automated check)

1. Start the app (`npm run server` after `npm run build`, or the project's usual dev flow) and open/create a score.
2. Add a title text block (Score menu → text tools, or however titles are added in the current build) so there is at least one `SmoTextGroup` to observe.
3. Open **Score Settings → Score Layout** (`SuiGlobalLayoutDialogVue`).
4. Change **Note Size (%)** (`svgScale`) and watch the title: it should stay in the same visual spot and size after the change is applied — not jump.
5. Change **Page Width** (or pick a different **Paper Size** preset) and confirm the title's position across the page (e.g. distance from the left edge as a fraction of page width) looks the same proportionally as before, not the same absolute pixel offset.
6. Reopen the dialog, make a change, and click Cancel — confirm the title returns exactly to where it was before step 4.
7. Reopen the dialog, make a change, apply it (close the dialog normally), then trigger Undo — confirm the title returns to its pre-change position and the layout settings revert too.

## Where to look if a case fails

- Aliasing/snapshot logic: `src/ui/dialogs/globalLayout.ts` (the `previousValue` tracking and the call into `setGlobalLayout`).
- Orchestration across view/store/part copies: `src/render/sui/scoreViewOperations.ts`, `setGlobalLayout`.
- Pure math: the new helper in `src/smo/data/score.ts` (alongside `scaleTextGroups`) and `src/smo/data/scoreText.ts` (alongside `SmoTextGroup.scaleText`).
