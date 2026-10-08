# Research: Vue-Based Modifier Property Dialogs

## R1: Creation-function pattern to follow

**Decision**: Each of the seven dialogs gets a new exported `const Sui<Name>DialogVue = (parameters: SuiDialogParams) => { ... }` function in a new file alongside its legacy dialog (e.g. `src/ui/dialogs/voltaVue.ts` next to `volta.ts`), following the shape already used by `SuiTimeSignatureDialogVue` (`src/ui/dialogs/timeSignature.ts`) and `SuiTextBlockDialogVue` (`src/ui/dialogs/textBlockVue.ts`):
1. Call `replaceVueRoot(modalContainerId)` to get a mount point (`rootId`).
2. Construct the dialog's existing adapter class directly (`new SuiVoltaAdapter(parameters.view, parameters.modifier)`, etc.) — unchanged from the legacy dialog's constructor line.
3. Wrap whatever state the `.vue` component needs in `ref(...)`.
4. Define `commitCb`, `cancelCb`, and (for the six modifier dialogs, not Custom Tuplet) `removeCb` as `async () => {...}` closures that delegate to the adapter's `commit()`/`cancel()`/`remove()`.
5. Build `appParams` (domId, label, the ref(s), and any per-field write callbacks) and call `InstallDialog({ root, app, appParams, dialogParams: parameters, commitCb, cancelCb, removeCb? })`.

**Rationale**: This is the only creation-function pattern already proven in this codebase (two prior conversions) and is explicitly what the spec's FR-001 points to. `InstallDialog` (`src/ui/dialogs/dialog.ts`) already handles everything a legacy `displayOptions` flag used to handle except modifier-relative positioning (see R4): keyboard capture (`InputTrapper`, `Escape`-to-cancel via `eventSource.bindKeydownHandler`), and mounting/unmounting the Vue app.

**Alternatives considered**: Extending `SuiDialogAdapterBase` with a Vue-rendering mode was rejected — it would entangle the legacy component-binding machinery (`bindComponents`, `SmoDynamicComponentCtor`) with Vue reactivity for no benefit, and neither prior conversion did this.

## R2: Mapping legacy `dialogElements` control types to Vue components

**Decision**:
| Legacy control | Vue replacement | Existing usage proving the pattern |
|---|---|---|
| `SuiRockerComponent` (numeric stepper) | `numberInput.vue` | `partInfo.vue`, `timeSignature.vue` |
| `SuiDropdownComponent` (dropdown) | `select.vue` | `timeSignature.vue`, `partInfo.vue` |
| `SuiToggleComponent` (checkbox/action toggle) | `toggle.vue` | `timeSignature.vue`, `partInfo.vue` (see also `specs/003-checkbox-to-toggle`) |
| `SuiTextInputComponent` (free text) | plain `<input type="text" class="form-control">` bound with `v-model` + `@change` | `partInfo.vue` (Part Name / Part Abbreviation fields), `scoreInfo.vue` |

**Rationale**: No dedicated wrapper component exists for plain text fields anywhere in `src/ui/components/dialogs` — every existing Vue dialog with a free-text field uses a bare Bootstrap `form-control` input directly, so that is "the existing modern text-input component" the spec's FR-006 refers to, not a new component to build.

**Alternatives considered**: Building a new `textInput.vue` wrapper was considered for symmetry with `numberInput.vue`/`select.vue`/`toggle.vue`, but rejected as unnecessary scope: it would be a single-line wrapper adding no behavior beyond what `partInfo.vue`'s existing inline usage already provides, and no other Vue dialog in the codebase has needed one.

## R3: Per-dialog field → adapter property wiring

**Decision**: Each new `.vue` component takes the adapter's current field values as props (read once via the adapter's getters when the creation function builds `appParams`) plus one write callback per field (or one generic `update(field, value)` callback), and the creation function's callback writes straight through to the adapter's existing setter (e.g. `adapter.startBar = value`), exactly as the legacy `SuiDialogAdapterBase.changed()` method already does today (`(this.adapter as any)[comp.smoName] = (comp as any).getValue()`), then triggers `view.updatePromise()` the same way. No new adapter code is needed — see spec Assumption "adapter class... reused as-is."

**Rationale**: The seven adapter classes (`SuiVoltaAdapter`, `SuiTextBracketAdapter`, `SuiSlurAdapter`, `SuiPedalMarkingAdapter`, `SuiHairpinAdapter`, `SuiDynamicDialogAdapter`, `SuiCustomTupletAdapter`) already fully encapsulate score reads/writes, undo-backup capture, and (for Pedal Marking) redraw-range logic; only the presentation layer is changing.

**Alternatives considered**: Passing the adapter instance itself into the `.vue` component as a prop (letting the template call adapter getters/setters directly) was considered, since it's less boilerplate. Rejected because neither `SuiTimeSignatureDialogVue` nor `SuiTextBlockDialogVue` passes an adapter or raw class instance into a `.vue` component — both pass plain refs/callbacks — so keeping the same shape preserves consistency and keeps `.vue` files framework-idiomatic (props/callbacks, not TS class instances).

## R4: Positioning the dialog near the selected modifier

**Decision**: Extend `draggableSession` (`src/ui/composable/draggable.ts`) with an optional initial-position argument, and add a small helper (e.g. `positionFromModifierBox(view, modifier)` in `src/ui/dialogs/adapter.ts` or a new shared module) that mirrors the legacy `SuiDialogBase.positionFromModifier()` logic: if `modifier.logicalBox` is set, compute `view.renderer.pageMap.svgToClient(modifier.logicalBox)` and use it as the initial `{top, left}`; otherwise fall back to the existing default (currently a fixed `top: 100, left: 100`, matching the legacy `positionGlobally` fallback closely enough for a small property dialog). Each of the six modifier dialogs' creation functions passes its modifier through this helper when building the `draggableSession`/`dialogContainer` props; Custom Tuplet (no modifier) uses the existing unconditional default, matching its legacy dialog which sets no `MODIFIERPOS` display option at all.

**Rationale**: This is the one piece of legacy `displayOptions` behavior (`MODIFIERPOS`) that `InstallDialog`/`dialogContainer.vue` does not already replicate — today every Vue dialog opens at a fixed `(100, 100)` position regardless of what's selected. For a small property popup that a user opens immediately after clicking a slur/hairpin/volta/etc. on the canvas, opening far from the selection is a real, user-visible regression against spec FR-013, so it needs a deliberate (if small) fix rather than being silently dropped.

**Alternatives considered**: Leaving all seven dialogs at the fixed default position (i.e., treating FR-013's positioning clause as already-acceptable-since-`SuiTextBlockDialogVue`-does-this) was considered, since it's the path of least resistance and matches the one existing precedent. Rejected because Text Block is opened from a menu action where the user doesn't have an existing on-canvas selection box in the same way, while all six of these dialogs are opened by directly clicking an existing modifier on the score — losing modifier-relative positioning would be a noticeably worse experience for exactly the interaction this batch of dialogs exists for.

## R5: Call-site migration and legacy class retention

**Decision**: Update every call site found in `src/ui/dialogs/factory.ts` (all six modifier dialogs, reached via `SuiModifierDialogFactory.createModifierDialog`), `src/ui/menus/text.ts` (Dynamics, plus the direct `SuiDynamicModifierDialog` menu handler), and `src/ui/menus/tuplets.ts` (Custom Tuplet) to call the new `Sui<Name>DialogVue` functions instead of `createAndDisplayDialog(Sui<Name>...Dialog, ...)`, following the exact substitution already made for `SmoTextGroup` in `factory.ts` (calls `SuiTextBlockDialogVue(...)` directly and returns `null` instead of `createAndDisplayDialog(...)`). The seven legacy dialog classes (and their static `dialogElements`, still consumed by `initDialogTranslationElements`/`DialogTranslations` for i18n) are left in place, per the spec's Assumptions — only their construction from live UI code paths is removed.

**Rationale**: Matches spec FR-012 exactly, and reuses an already-shipped precedent in the same factory function rather than inventing a new call-site convention.

**Alternatives considered**: Deleting the six legacy dialog classes outright was considered (spec allows either). Rejected for this feature: `DialogTranslations`/i18n (`src/ui/i18n/language.ts`, `initDialogTranslationElements` in `factory.ts`) still reads `dialogElements` off several of these classes, and disentangling the i18n label-translation system from the legacy `DialogDefinition` structures is a separate concern from converting the dialogs' rendering to Vue — out of scope here.

## R6: Slur's "Reset All Slurs" modal-block behavior

**Decision**: Keep `SuiSlurAdapter.resetAll`/`resetDefaults` and its `updating` flag exactly as-is; the new Slur `.vue` component watches an `updating` ref (surfaced from the adapter via the creation function, mirroring how `SuiSlurAttributesDialog.changed()` currently polls `adapter.updating` via `modalPromise()`). `dialogButtons.vue`'s existing `enable` prop only gates the OK button (confirmed during implementation — `arpeggio.vue`/`clefChange.vue` already rely on that OK-only semantic for input validation, so it can't be repurposed to also gate Cancel/Remove without changing their behavior). Instead, a new optional `enableCancelRemove?: Boolean` prop was added to `dialogButtons.vue` (defaulting to `true` via the same `toRef`-or-`ref(true)` pattern already used for `enable`) and threaded through `dialogContainer.vue`; Slur passes the same `updating`-derived ref to both `enable` and `enableCancelRemove`, replicating the legacy `disableClose()`/`enableClose()` pair (which disabled all three buttons) without changing any other dialog's behavior.

**Rationale**: Additive, backward-compatible props on shared components (default `true` when omitted) keep every existing caller of `dialogButtons.vue`/`dialogContainer.vue` unaffected while giving Slur the all-three-buttons-disabled behavior FR-010 requires.

**Alternatives considered**: Reimplementing `resetAll`'s slur-by-slur async loop inside the new `.vue` component was considered (to avoid the `setTimeout`-based polling in `SuiSlurAdapter.resetAll`/legacy `modalPromise`). Rejected as out of scope — the spec's Assumptions call for reusing each adapter unchanged, and the loop's timing behavior is not something the spec asks to change.
