# Research: Vue-Based Key Signature and Tempo Dialogs

## R1: Creation-function pattern to follow

**Decision**: Each dialog gets a new exported `const Sui<Name>DialogVue = (parameters: SuiDialogParams) => { ... }` function in a new file alongside its legacy dialog (`src/ui/dialogs/keySignatureVue.ts` next to `keySignature.ts`, `src/ui/dialogs/tempoVue.ts` next to `tempo.ts`), following the shape already used by `SuiTimeSignatureDialogVue`, `SuiTextBlockDialogVue`, and all seven dialogs from `004-vue-modifier-dialogs` (e.g. `SuiTextBracketDialogVue`, `SuiPedalMarkingDialogVue`):
1. Call `replaceVueRoot(modalContainerId)` to get a mount point (`rootId`).
2. Construct the dialog's existing adapter class directly, deriving the current measure exactly as the legacy constructor does (see R2) — not from `parameters.modifier`.
3. Define `commitCb`/`cancelCb` (and, only where the legacy dialog actually exposes one — see R4 — `removeCb`) as `async () => {...}` closures that delegate to the adapter's `commit()`/`cancel()`/`remove()`.
4. Build `appParams` (domId, label, each field's current value read once off the adapter's getters, and one write callback per field or per field-type) and call `InstallDialog({ root, app, appParams, dialogParams: parameters, commitCb, cancelCb, removeCb? })`.

**Rationale**: This is the same, now twice-proven creation-function pattern in this codebase, and is exactly what the spec's FR-001 points to.

**Alternatives considered**: None — this is a direct continuation of the established pattern; no new approach is warranted for two additional dialogs.

## R2: Measure resolution — ignore `parameters.modifier`

**Decision**: Both `SuiKeySignatureDialogVue` and `SuiTempoDialogVue` must derive the current measure the same way the two legacy dialog constructors already do:
```ts
const measures = SmoSelection.getMeasureList(parameters.view.tracker.selections).map((sel) => sel.measure);
const measure = measures[0];
```
and construct the adapter with `new SuiKeySignatureAdapter(parameters.view, measure)` / `new SuiTempoAdapter(parameters.view, measure)`. Neither adapter's constructor, nor either dialog class's constructor, reads `parameters.modifier` at all.

**Rationale**: `parameters.modifier` is optional on `SuiDialogParams` and is genuinely absent at one existing call site — `ribbon.ts`'s generic `executeButtonModal` path builds a `params` object with no `modifier` key at all before calling `createAndDisplayDialog(SuiTempoDialog, params)` for any modal-button `ctor` other than `'SuiLibraryDialog'` (which today only means `'SuiTempoDialog'`, since `SuiModalButtonStrings = ['SuiLibraryDialog', 'SuiTempoDialog']`). The three call sites that do pass a `modifier` for Tempo (`ribbon.ts`'s `'ribbonTempo'` button, `display.ts`'s `ribbonTempo()`, `keyCommands.ts`'s `tempoDialog()`, each via `const tempo = ...measure.getTempo()`) pass it purely because `SuiDialogBase` stores whatever is given as `this.modifier` generically — it is never read for these two dialogs (no `MODIFIERPOS` display option, and `SuiDialogAdapterBase` overrides both `initialValue()` and `bindElements()` to go through the adapter instead of `this.modifier`). Relying on it would silently break the modifier-less call site.

**Alternatives considered**: Accepting an optional `modifier` and falling back to the selection-derived measure only when absent was considered, for symmetry with the three call sites that do pass one. Rejected as needless complexity: since the value is never actually used by either legacy dialog today, always deriving from `view.tracker.selections` is simpler and provably equivalent to current behavior in 100% of call sites, including the one that supplies no modifier at all.

## R3: Mapping legacy `dialogElements` control types to Vue components

**Decision**: Same mapping already established in `004-vue-modifier-dialogs` research (R2 there), applied to this feature's fields:

| Legacy control | Vue replacement | Fields using it |
|---|---|---|
| `SuiRockerComponent` (numeric stepper) | `numberInput.vue` | Tempo: `bpm`, `yOffset` |
| `SuiDropdownComponent` (dropdown) | `select.vue` | Key Signature: `key`, `applyTo`; Tempo: `tempoMode`, `beatDuration`, `tempoText` |
| `SuiToggleComponent` (checkbox) | `toggle.vue` | Tempo: `applyToAll`, `applyToSelection`, `display` |
| `SuiTextInputComponent` (free text) | plain `<input type="text" class="form-control">` bound with `v-model`/`@change`, per the `textBracket.vue`/`pedalMarking.vue` precedent — no dedicated wrapper component exists in this codebase | Tempo: `customText` |

`select.vue` requires string `value`s (`SelectOption.value: string`) and a string `initialValue`. Key Signature's `key` and `applyTo` adapter properties are already strings, so no casting is needed. Tempo's `tempoMode` and `tempoText` are likewise already strings. Tempo's `beatDuration` is numeric (`dataType: 'int'` in the legacy `dialogElements`, values `4096`/`2048`/`6144`/`8192`) so it needs the same value/label-with-cast-at-the-boundary treatment already used for Text Bracket's `position` field in `004-vue-modifier-dialogs` (`String(value)` in, `parseInt(value, 10)` out).

**Rationale**: Directly what the user asked for (`numberInput.vue` for the rocker, `toggle.vue` for the checkbox, `select.vue` for the dropdown), and consistent with the only precedent this codebase has for each control type.

**Alternatives considered**: None beyond what `004-vue-modifier-dialogs` R2 already considered and rejected (e.g., building a dedicated `textInput.vue` wrapper) — not revisited here since the same conclusion applies unchanged.

## R4: Remove control — neither dialog has one today

**Decision**: Neither `SuiKeySignatureDialogVue` nor `SuiTempoDialogVue` passes a `removeCb` to `InstallDialog`, and neither `.vue` component receives a `removeCb` prop (matching the `SuiCustomTupletDialogVue`/`customTuplet.vue` precedent, the one dialog in `004-vue-modifier-dialogs` with no Remove button).

**Rationale**: `SuiDialogBase.displayOptions` defaults to `['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS', 'HIDEREMOVE']`, and `hideRemoveButton()` literally removes `.remove-button` from the DOM. Neither `keySignature.ts` nor `tempo.ts` overrides `displayOptions` (unlike, e.g., `volta.ts`, which explicitly lists `['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS']` — omitting `HIDEREMOVE` to keep Remove visible). So both dialogs inherit the default today, and neither currently shows a Remove button — even though `SuiTempoAdapter.remove()` exists and calls `view.removeTempo(...)`, it is unreachable from the UI today. Adding a visible Remove control for Tempo would be a user-facing behavior change beyond what was requested (see spec FR-009, corrected during planning after this was discovered).

**Alternatives considered**: Exposing Tempo's existing `remove()` via a visible Remove button was considered, since the adapter method already works. Rejected as out of scope: the spec's Assumptions call for no added or removed fields/behavior, and this would be a net-new capability the legacy dialog does not currently offer, not a straight migration.

## R5: Positioning — default fixed position for both dialogs

**Decision**: Neither dialog passes `initialPosition` to `dialogContainer.vue` (via `getModifierDialogPosition`) — both simply omit it, falling back to `dialogContainer.vue`'s existing default, matching the `SuiCustomTupletDialogVue` precedent.

**Rationale**: `getModifierDialogPosition` (added in `004-vue-modifier-dialogs` for the six dialogs that use `MODIFIERPOS`) only produces a position when a display option `MODIFIERPOS` was set in the legacy dialog. Neither `keySignature.ts` nor `tempo.ts` sets `MODIFIERPOS` (or `SELECTIONPOS`) — both rely on the base class default `GLOBALPOS` (`positionGlobally`, centered on the scroll container). Using `getModifierDialogPosition` here regardless of that would either always return `undefined` (Key Signature, whose `modifier` is always explicitly `null`) or introduce a positioning behavior Tempo has never had (Tempo's `modifier` — the tempo object itself — does inherit `logicalBox` from `SmoMeasureModifierBase`, so calling the helper on it could sometimes produce a position, changing today's always-fixed-position behavior).

**Alternatives considered**: Adding `MODIFIERPOS`-equivalent positioning to Tempo, since its `modifier` parameter happens to carry a usable `logicalBox` when the tempo marking is displayed on the score. Rejected as an unrequested behavior change — the legacy dialog has never positioned itself near the tempo marking, and the spec's Assumptions call for no added behavior.

## R6: Call-site migration and legacy class retention

**Decision**: Update every call site:
- Key Signature: `src/ui/buttons/ribbon.ts` (`'keySignature'` button handler), `src/ui/buttons/display.ts` (`keySignature()` method), `src/ui/menus/manager.ts` (`evKey`'s `'k'` slash-command branch).
- Tempo: `src/ui/buttons/ribbon.ts` (`'ribbonTempo'` button handler, and the `executeButtonModal` fallback branch that handles the generic `SuiTempoDialog` modal-button `ctor`), `src/ui/buttons/display.ts` (`ribbonTempo()` method), `src/application/keyCommands.ts` (`tempoDialog()` method).

Each call site's `createAndDisplayDialog(SuiKeySignatureDialog, {...})` / `createAndDisplayDialog(SuiTempoDialog, {...})` (or, for the modal fallback, `createAndDisplayDialog(SuiTempoDialog, params)`) is replaced with a direct call to `SuiKeySignatureDialogVue({...})` / `SuiTempoDialogVue({...})`, passing the same parameters object (unused fields like `ctor`/`id` are harmless to keep, matching the `SmoTextGroup` substitution precedent in `factory.ts`). `SuiKeySignatureDialog`/`SuiTempoDialog` (and their static `dialogElements`) are left in place as dead code — `SuiTempoDialog` is still listed in `SmoTranslator.allDialogs` (`src/ui/i18n/language.ts`) for i18n, and both classes remain part of the public API re-exported from `src/application/exports.ts`.

`tabletRibbon.ts` needs no change: it only sets `ctor: 'SuiTempoDialog'` as data on a `ButtonDefinition`, consumed by `ribbon.ts`'s `executeButtonModal`, which is already covered above.

**Rationale**: Matches spec FR-011 exactly, mirrors the call-site substitution approach already used in `004-vue-modifier-dialogs` (R5 there), and preserves the i18n/public-API surface the spec's Assumptions say not to disturb.

**Alternatives considered**: Deleting the two legacy dialog classes outright was considered (spec allows either). Rejected for this feature, same reasoning as `004-vue-modifier-dialogs` R5: `SuiTempoDialog` still feeds `SmoTranslator.allDialogs`/i18n, and disentangling that is a separate concern from converting the dialogs' rendering to Vue.

## R7: Pre-existing label bug in Key Signature's dialog definition

**Finding (not a decision to act on without confirmation)**: `SuiKeySignatureDialog.dialogElements`'s first field (`smoName: 'key'`) is labeled `'Tempo Mode'` — an apparent copy-paste artifact from the Tempo dialog, unrelated to its actual purpose (choosing a key signature). This is preserved verbatim in the new `.vue` component's default per spec Assumptions ("every field... remains available... with no fields added or removed" — read narrowly as "no unrequested behavior changes"), since fixing mislabeled text is outside what this migration was asked to do. Flagged here so it is not mistaken for a transcription error during implementation review; a follow-up fix (relabeling to `'Key'`) can be done as a separate, trivial change if desired.
