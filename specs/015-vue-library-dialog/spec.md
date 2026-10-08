# Feature Specification: Vue-Based Music Library Dialog

**Feature Branch**: `015-vue-library-dialog`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "create a vue component for the legacy dialog in /src/ui/dialogs/library.ts. Create a custom vue component to use as the tree control, based on the logic in /src/ui/dialogs/components/library.ts. The dialog has only a single component (the tree), and each level of the tree might be a song which can be loaded, or a link to a child in the tree."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select and load a song from the library (Priority: P1)

As a score editor user, when I open the Music Library dialog, I see a tree of the library's contents, and I can select any song entry in the tree and load it into the score view, so I can open scores that are hosted in the shared music library.

**Why this priority**: Loading a song is the entire purpose of this dialog; every other capability exists to help the user find the song they want to load.

**Independent Test**: Open the Music Library dialog, confirm the tree renders with the library's top-level entries, select a song (leaf) entry, confirm the Load control becomes enabled, activate it, and confirm the selected song is loaded into the score view and the dialog closes.

**Acceptance Scenarios**:

1. **Given** the Music Library dialog is opened, **When** the top-level library data finishes loading, **Then** the tree displays the library's top-level entries, each shown with an icon indicating whether it is a folder (library) or a song.
2. **Given** the tree is displayed, **When** the user selects a song entry, **Then** that entry is marked as the current selection and the Load control becomes enabled.
3. **Given** a song entry is selected, **When** the user activates the Load control, **Then** that song is loaded into the score view and the dialog closes.
4. **Given** no song entry is currently selected (nothing selected yet, or a folder is selected), **When** the dialog is first opened, **Then** the Load control is disabled.

---

### User Story 2 - Drill into a folder to find a song (Priority: P2)

As a score editor user, when the song I want is inside a nested folder in the library, I can select that folder entry to reveal its contents, so I can keep drilling down through the library's structure until I find the song I'm looking for.

**Why this priority**: Most of the library's songs are not at the top level; without folder navigation, a user could only reach songs already visible at the root, making the dialog useful only for the simplest libraries.

**Independent Test**: Open the Music Library dialog, select a folder entry that has not yet been opened, confirm its contents are fetched and appended under it in the tree, confirm the folder automatically expands to reveal those contents, and confirm the Load control remains disabled since a folder (not a song) is selected.

**Acceptance Scenarios**:

1. **Given** a folder entry whose contents have not yet been loaded, **When** the user selects it, **Then** its contents are fetched from the library's remote source and added to the tree as that folder's children.
2. **Given** a folder entry is selected, **When** its contents finish loading (or were already loaded), **Then** the folder automatically expands so its children are visible, and the Load control is disabled.
3. **Given** a folder entry whose contents were already loaded in a prior selection, **When** the user selects it again, **Then** no additional fetch occurs and the folder simply expands to show its already-known children.
4. **Given** a nested folder several levels deep, **When** the user selects it after having drilled down through its ancestor folders, **Then** the same load-if-needed-and-expand behavior applies, allowing navigation to any depth.

---

### User Story 3 - Expand or collapse a folder without changing the selection (Priority: P3)

As a score editor user, once I've already loaded a folder's contents, I can show or hide that folder's children using a dedicated expand/collapse control, without disturbing whatever entry I currently have selected, so I can tidy up the tree's visible structure while I look around.

**Why this priority**: This is a display convenience on top of the core browse-and-load workflow (User Stories 1-2); the dialog is fully usable without it, since every folder auto-expands the first time it's selected.

**Independent Test**: Open the Music Library dialog, select a song entry so the Load control is enabled, then use a folder's expand/collapse control (not the folder's own selection) to collapse and re-expand that folder's children, and confirm the song selection and the Load control's enabled state are unaffected throughout.

**Acceptance Scenarios**:

1. **Given** a folder entry with visible children, **When** the user activates that folder's collapse control, **Then** its children are hidden from view, the folder's own selection state is unchanged, and no data is re-fetched.
2. **Given** a collapsed folder entry, **When** the user activates its expand control, **Then** its already-known children reappear, with no data re-fetched.
3. **Given** any current selection (song or folder) elsewhere in the tree, **When** the user expands or collapses an unrelated folder, **Then** the current selection and the Load control's enabled state remain unchanged.

---

### Edge Cases

- A folder entry with no children (an empty folder, once loaded) shows no expandable content; activating its expand/collapse control has no visible effect since there is nothing to reveal.
- Canceling the dialog (Cancel control or Escape) closes it without loading anything, regardless of what is currently selected or expanded.
- Activating Load while a folder (not a song) is selected has no load effect; since Load is disabled whenever a folder is selected, this can only be reached defensively and simply closes the dialog without loading a score.
- Collapsing an ancestor folder that contains the currently-selected song does not clear that selection or disable the Load control; it only hides the song from view until its ancestor is re-expanded.
- Song (leaf) entries never display an expand/collapse control, since they cannot have children.
- Reopening the dialog always starts fresh: the top-level library is reloaded, no folder is pre-expanded, and no entry is pre-selected, matching a first-time open.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dialog MUST be implemented as a Vue component with a creation function following the established pattern used for other migrated dialogs (e.g. the Vue-based Lyric Editor, `010-vue-lyric-dialog`), replacing `SuiLibraryDialog` and `SuiLibraryAdapter` (`src/ui/dialogs/library.ts`) without modifying the legacy classes or their call sites.
- **FR-002**: The dialog MUST present a single control: the library tree, matching `SuiLibraryDialog.dialogElements`, which defines exactly one "Selection" element.
- **FR-003**: The tree control MUST be a new, general-purpose recursive Vue component capable of rendering an arbitrarily nested parent/child structure, replacing `SuiTreeComponent` (`src/ui/dialogs/components/tree.ts`).
- **FR-004**: Each tree entry MUST display an icon indicating whether it is a folder (library) entry or a song entry, matching the current book/file-music icon distinction.
- **FR-005**: Opening the dialog MUST load the top-level library data before the tree is first rendered, matching current `SuiLibraryAdapter.initialize`/`topLib.load` behavior.
- **FR-006**: Selecting a folder entry whose own contents have not yet been loaded MUST fetch those contents from that entry's remote source and add the resulting child entries to the tree under it.
- **FR-007**: Selecting a folder entry whose contents are already loaded MUST NOT trigger an additional fetch.
- **FR-008**: Selecting a folder entry MUST automatically expand that entry so its children (existing or newly loaded) become visible.
- **FR-009**: Selecting a song entry MUST record it as the current selection, with no data fetch triggered.
- **FR-010**: The Load control MUST be enabled only when the current selection is a song entry, and disabled whenever the current selection is a folder entry or nothing is selected.
- **FR-011**: Each folder entry with children MUST provide its own expand/collapse control, independent of selection, that shows or hides its already-known children without triggering a fetch or changing the current selection.
- **FR-012**: Confirming the dialog while a song is selected MUST load that song into the score view and close the dialog, matching current `_loadScore`/`loadRemoteScore` behavior.
- **FR-013**: Confirming the dialog while no song is selected MUST close the dialog without loading anything, matching current fallback behavior.
- **FR-014**: Canceling the dialog (Cancel control or Escape) MUST close it without loading anything.
- **FR-015**: The tree control MUST support library structures of arbitrary depth, with folder entries able to contain further folder and song entries as children.

### Key Entities

- **Library Entry**: A node in the remote library tree - either a Folder (contains further entries, may need its own contents fetched on first selection) or a Song (a leaf entry that can be loaded into the score view). Key attributes: display name, remote location, whether it is a folder or a song, whether its contents have been fetched yet, and its children (if any).
- **Current Selection**: The single library entry the user has most recently selected in the tree; determines whether the Load control is enabled and which song (if any) would be loaded on confirmation.
- **Expansion State**: Per-folder-entry visibility of its children in the tree display; distinct from the Current Selection and unaffected by it once a folder has already been expanded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can browse the library tree to any depth and load any reachable song into the score view, with no user-visible functional regression compared to the current dialog.
- **SC-002**: Selecting a folder whose contents are already loaded reveals its children with no network fetch and no perceptible delay.
- **SC-003**: The Load control is enabled if and only if the current selection is a song entry.
- **SC-004**: Expanding or collapsing a folder's children never changes the current selection or the Load control's enabled state.
- **SC-005**: A user can complete a full open-browse-select-load cycle without encountering any control built on the dialog's legacy custom-component base classes.

## Assumptions

- This is an internal architectural migration (legacy custom dialog/tree components to Vue), not a change to end-user-visible library capabilities. `SuiLibraryDialog`, `SuiLibraryAdapter`, and their call sites (`src/ui/buttons/ribbon.ts`, `src/ui/ribbonLayout/default/defaultRibbon.ts`, `src/ui/ribbonLayout/default/tabletRibbon.ts`) remain unchanged until the new dialog is verified; wiring callers over to it is a separate, later change and out of scope here, matching how prior dialog migrations (e.g. `010-vue-lyric-dialog`, `013-vue-chord-dialog`) were introduced standalone before being wired in.
- No existing recursive/nested-list Vue component exists in the codebase to reuse for the tree; the new tree component is a first-of-its-kind general-purpose control for this codebase, following the same props/callback conventions as other reusable dialog controls (e.g. `select.vue`).
- A folder entry (format `'library'`) is any entry that can contain children and may require its own remote fetch; every other entry format (e.g. `'smoosic'`, `'mxml'`, `'midi'`, `'abc'`) is treated as a loadable song leaf, matching the format check in the current `SuiTreeComponent`/`SmoLibrary` logic.
- No loading indicator is required beyond current behavior: the dialog's initial top-level load and any folder's lazy sub-load are not required to show a spinner or progress state, matching the current dialog's behavior.
- No project constitution has been ratified yet, so no additional project-specific principles apply beyond the existing Vue dialog conventions already established in the codebase (e.g. `src/ui/dialogs/*.ts` creation functions paired with `src/ui/components/dialogs/*.vue` components).
