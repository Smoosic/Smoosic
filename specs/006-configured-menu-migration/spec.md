# Feature Specification: Configured Menu Migration for Language, Part Selection, Score, and Staff Modifier Menus

**Feature Branch**: `006-configured-menu-migration`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "change src/ui/menus/ objects to extend SuiConfiguedMenu, instead of SuiMenuBase.  This would be done for language.ts, partSelection.ts, score.ts, and staffModifier.ts.  Create a SuiConfiguredMenuOption for each menu option where display method always returns true.  Follow the pattern in note.ts menu."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Language and Lines menus keep working exactly as before (Priority: P1)

As a score editor user, when I open the Language menu or the Lines (staff modifier) menu, every choice available today is still present, labeled the same, and performs the same action, with no visible change in behavior.

**Why this priority**: These two menus are static, unconditional choice lists with no per-option visibility logic, making them the lowest-risk conversions and the ones that prove out the basic "options array via `SuiConfiguredMenu`" pattern before tackling the two menus with conditional or dynamic option lists.

**Independent Test**: Open the Language menu and select each language, confirming the UI language switches correctly each time. Open the Lines menu and exercise every choice (hairpins, slur, tie, pedal marking, endings, brackets, accelerando, ritard, reset slurs), confirming each produces the same score change as it does today, including the pedal-marking overlap-resolution behavior and the deferred completion of "Reset slurs".

**Acceptance Scenarios**:

1. **Given** the Language menu is open, **When** the user selects a language choice, **Then** the application UI language changes to match and the menu closes.
2. **Given** the Lines menu is open with a selection on the score, **When** the user selects "Pedal Marking" over a region that overlaps an existing pedal marking, **Then** the existing marking is merged/replaced exactly as it is today.
3. **Given** the Lines menu is open, **When** the user selects "Reset slurs", **Then** the menu does not close until the viewport refresh completes, matching current behavior.

---

### User Story 2 - Score Settings menu keeps its context-sensitive options working (Priority: P2)

As a score editor user, when I open the Score Settings menu, I still see "Page Layout", "Global Layout", and "System Groups" only while viewing the full score (not a single exposed part), and I still see "View All" only when I am currently viewing a subset of the score's parts; every other option is always available.

**Why this priority**: `score.ts` is the only one of the four menus whose option visibility depends on runtime view state today, via a single shared `preAttach` filter. Moving that logic into each option's own `display` function is the main structural improvement of this migration, so it carries the most risk of a visibility regression and is prioritized after the simpler menus are proven out.

**Independent Test**: With a score open, expose a single part and open Score Settings — confirm "Page Layout", "Global Layout", and "System Groups" are hidden and "View All" is shown. Return to full-score view and reopen Score Settings — confirm those three options reappear and "View All" is hidden. Confirm "Smoosic Preferences", "Score Fonts", "Score Info", and "Transpose Score" are visible in both states.

**Acceptance Scenarios**:

1. **Given** a part is currently exposed (subset view), **When** the user opens Score Settings, **Then** "Page Layout", "Global Layout", and "System Groups" do not appear, and "View All" does appear.
2. **Given** the full score is currently in view (no subset), **When** the user opens Score Settings, **Then** "Page Layout", "Global Layout", and "System Groups" appear, and "View All" does not appear.
3. **Given** either view state, **When** the user opens Score Settings, **Then** "Smoosic Preferences", "Score Fonts", "Score Info", "Transpose Score", and "Cancel" always appear.

---

### User Story 3 - Parts menu keeps listing the score's current parts (Priority: P3)

As a score editor user, when I open the Parts menu, I still see one choice per part in the score (by name), plus a "View All" choice when I'm currently viewing a subset, and selecting a part or "View All" still changes the view exactly as it does today.

**Why this priority**: The Parts menu's option list is fully dynamic (rebuilt from the score's live part map on every open) rather than a fixed set, making it the most structurally different of the four conversions and the one best attempted last, after the static- and conditional-list patterns are established.

**Independent Test**: Open a multi-part score, open the Parts menu, confirm one option per part appears with the correct part name, select one, and confirm that part is exposed. Reopen the Parts menu, confirm "View All" now appears, select it, and confirm the full score view returns.

**Acceptance Scenarios**:

1. **Given** a score with multiple parts and no part currently exposed, **When** the user opens the Parts menu, **Then** one choice per part appears (by part name) and no "View All" choice appears.
2. **Given** a part is currently exposed, **When** the user opens the Parts menu, **Then** a "View All" choice appears in addition to the per-part choices.
3. **Given** the Parts menu is open, **When** the user selects "View All", **Then** the full score view is restored.
4. **Given** the Parts menu is open, **When** the user selects "Cancel" or dismisses without a valid selection, **Then** the menu closes with no change to the current view.

---

### Edge Cases

- Score Settings: "View All" visibility depends on `score.staves.length < view.storeScore.staves.length`, independent of whether a specific part is exposed; this exact condition must be preserved.
- Score Settings: "Page Layout", "Global Layout", and "System Groups" must be hidden precisely when `view.isPartExposed()` is true, not merely when a subset is being viewed.
- Lines menu: the "Pedal Marking" option's multi-step logic (finding overlapping markings, awaiting their removal, then awaiting the add/replace) must remain a single atomic async handler.
- Lines menu: the "Reset slurs" option must keep deferring `complete()` until `view.refreshViewport()` resolves, rather than completing immediately like the other options.
- Parts menu: an unparseable or "cancel" selection must close the menu without exposing or changing any part, matching the current `isNaN` guard in `selection()`.
- None of the four menus should end up with a duplicate, locally-defined "Cancel" choice, since `SuiConfiguredMenu`'s constructor already appends one automatically when the supplied options array doesn't include one.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `SuiLanguageMenu` (language.ts) MUST extend `SuiConfiguredMenu` instead of `SuiMenuBase`. Each of its three language choices (English/`en`, Deutsch/`de`, اَلْعَرَبِيَّةُ/`ar`) MUST be defined as a standalone `SuiConfiguredMenuOption` whose handler calls `SmoTranslator.setLanguage` with that choice's value, and whose `display` always returns `true`, following the pattern in note.ts.
- **FR-002**: `SuiStaffModifierMenu` (staffModifier.ts) MUST extend `SuiConfiguredMenu` instead of `SuiMenuBase`. Each of its twelve existing choices (Cresc. Hairpin, Dim. Hairpin, Slur, Tie, Pedal Marking, nth ending, Dim. Bracket, Cresc. Bracket, Accelerando, Ritard, Reset slurs, Repeat Endings) MUST be defined as a standalone `SuiConfiguredMenuOption` whose handler reproduces that choice's current `selection()`-branch logic exactly (including the Pedal Marking option's overlap-resolution logic and the Reset Slurs option's awaited `refreshViewport()`), and whose `display` always returns `true`.
- **FR-003**: `SuiScoreMenu` (score.ts) MUST extend `SuiConfiguredMenu` instead of `SuiMenuBase`. Each of its nine existing choices MUST be defined as a standalone `SuiConfiguredMenuOption` whose handler reproduces that choice's current `exec*`/`selection()` logic exactly.
- **FR-004**: For the `SuiScoreMenu` choices that are unconditionally shown today (Smoosic Preferences, Score Fonts, Score Info, Transpose Score), `display` MUST always return `true`.
- **FR-005**: For the `SuiScoreMenu` choices with conditional visibility today (Page Layout, Global Layout, System Groups: hidden whenever `view.isPartExposed()` is true; View All: shown only when `score.staves.length < view.storeScore.staves.length`), `display` MUST reproduce that exact condition using the menu instance's `view`/`score` properties, replacing the current shared `preAttach` filter.
- **FR-006**: `SuiPartSelectionMenu` (partSelection.ts) MUST extend `SuiConfiguredMenu` instead of `SuiMenuBase`. Because its option list (one per part, plus a conditional "View All") is generated dynamically from the current score's part map rather than from a fixed set, the menu MUST rebuild its `SuiConfiguredMenuOption` list from the live part map each time it is opened, preserving the current behavior of one choice per part (by name) and a conditionally-included "View All" choice.
- **FR-007**: None of the four migrated menu classes MUST define a local `'cancel'` `MenuChoiceDefinition`; each MUST rely on `SuiConfiguredMenu`'s constructor, which automatically appends a Cancel option when the supplied options array does not already contain one.
- **FR-008**: Each migrated menu class's construction MUST pass its assembled `SuiConfiguredMenuOption` array to the `SuiConfiguredMenu` constructor via `super(params, label, options)`, matching the constructor call used by `SuiNoteMenu` in note.ts, replacing the current static `defaults` object plus `getDefinition()` override.
- **FR-009**: All existing call sites that construct `SuiLanguageMenu`, `SuiPartSelectionMenu`, `SuiScoreMenu`, or `SuiStaffModifierMenu` MUST continue to work unchanged, since `SuiMenuParams` and the public menu-construction API are not altered by this migration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For each of the four migrated menus, exercising every currently-available menu choice produces identical results (score/view state changes, dialogs opened, language switched) before and after the migration, with zero functional regressions.
- **SC-002**: In Score Settings, switching between full-score view and part-exposed view causes the same subset of options (Page Layout/Global Layout/System Groups/View All) to appear or disappear as it does today, in 100% of tested view-state combinations.
- **SC-003**: The Parts menu continues to list exactly one option per part (by name) plus a conditional View All option, matching the current dynamic part map, in 100% of tested scores.
- **SC-004**: All four migrated menu source files, and the project's existing automated test suite, build and pass with no new TypeScript errors or test failures.
- **SC-005**: Zero remaining references to `SuiMenuBase` as a direct base class exist in language.ts, partSelection.ts, score.ts, or staffModifier.ts.

## Assumptions

- "Follow the pattern in note.ts" means: define each menu choice as a module-level (or otherwise locally-scoped) `SuiConfiguredMenuOption` constant, collect them into a single array, and have the menu class's constructor call `super(params, label, options)` as `SuiNoteMenu` does — removing the `static defaults` / `getDefinition()`-only style of construction used today.
- Menu choices whose behavior already depends on runtime state (Score Settings' four conditional choices, and Part Selection's fully dynamic list) are the expected exceptions to "display always returns true," mirroring how note.ts's own `togglePedalRelease` option already deviates from the "always true" default within an otherwise all-true menu.
- This is a purely internal architectural refactor: no menu adds, removes, renames, or reorders any user-facing choice, and no keyboard shortcut, icon, or dialog invocation changes as a result.
- `SuiMenuCustomizer`-based per-`ctor` customization hooks (via `SuiConfiguredMenu.menuCustomizations`) are not used by any of these four menus today and are not required by this migration.
- No ratified project constitution principle specifically governs UI menu architecture, so this migration follows the existing repository convention already established by note.ts's conversion to `SuiConfiguredMenu`.
