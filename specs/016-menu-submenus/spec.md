# Feature Specification: Sidebar Menu Submenus

**Feature Branch**: `016-menu-submenus`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "create a submenu structure. For a menu called from the sidebar, the menu choice can enable another menu. Implement the submenu for the note menu in /src/ui/menus/note.ts when arpeggioMenuOption menu is selected. The submenu will replace the dialog in /src/ui/dialogs/arpeggio.ts, which is just a single dropdown."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose an arpeggio style from a submenu (Priority: P1)

A user has selected one or more notes and opens the Notes menu from the sidebar. They choose "Arpeggio" and, instead of a pop-up dialog with a dropdown, a submenu appears listing every arpeggio style as its own choice. Picking a style applies it immediately to the selected note(s).

**Why this priority**: This is the concrete, user-visible behavior the request asks for, and it is the only change a musician will actually notice. It also proves out the general submenu mechanism end-to-end.

**Independent Test**: Select a note, open the Notes menu, choose "Arpeggio", pick a style from the submenu that appears, and confirm the note is rendered with that arpeggio style and no dialog box was shown.

**Acceptance Scenarios**:

1. **Given** a note is selected and the Notes menu is open, **When** the user chooses "Arpeggio", **Then** a submenu opens listing the arpeggio style choices (Plain, Rasquedo Up, Rasquedo Down, Roll Up, Roll Down, Brush Up, Brush Down, None) instead of a dialog box.
2. **Given** the arpeggio submenu is open, **When** the user chooses a style, **Then** that style is applied to the selected note(s), the menu session closes, and control returns to the score editor.
3. **Given** the arpeggio submenu is open, **When** the user dismisses it (e.g. chooses Cancel or presses Escape) without picking a style, **Then** the note's arpeggio is left as it was before the Notes menu was opened.
4. **Given** a note already has an arpeggio style applied, **When** the user reopens the Notes menu and chooses "Arpeggio", **Then** the submenu is available with the same choices, and selecting a different style replaces the previous one.

---

### User Story 2 - Any sidebar menu choice can open another menu (Priority: P2)

A developer extending one of the sidebar menus (Notes, Measure, Part, etc.) wants a menu choice to lead to a further set of choices, the same way "Arpeggio" leads to a list of styles. The menu framework lets a menu choice be configured to open another menu, without that choice needing its own custom dialog or one-off popup code.

**Why this priority**: The user explicitly asked for a reusable submenu structure, not a one-off fix limited to arpeggios. Delivering this generally is what makes the arpeggio change a pattern instead of a special case.

**Independent Test**: Configure a menu choice to reference another menu's choice list, select it from its parent menu, and confirm the referenced menu is displayed using the same presentation (position, dismiss, keyboard handling) as any top-level sidebar menu.

**Acceptance Scenarios**:

1. **Given** a sidebar menu is open, **When** the user selects a choice that is configured to open another menu, **Then** that menu is displayed in place of the parent menu, using the same visual placement and dismiss behavior as menus opened directly from the sidebar.
2. **Given** a submenu is displayed, **When** the user dismisses it without making a choice, **Then** the menu session ends the same way a top-level menu's Cancel does today, with no action applied.

---

### Edge Cases

- No note is selected when "Arpeggio" is chosen: the submenu still opens, defaulting to "None" as the current behavior does, and applying a style is a no-op until a note is selected.
- Multiple notes are selected with different existing arpeggio styles: the submenu reflects the first selected note's style as the starting point, matching the current dialog's behavior, and the chosen style is applied to all selected notes.
- The user re-selects the arpeggio style the note already has: the menu closes normally with no visible change.
- The submenu has more choices than fit in the available space near where the parent menu was opened: it is positioned/scrolled so all choices remain reachable, consistent with how the app already handles long top-level menus.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sidebar menu framework MUST support a menu choice that, when selected, opens another menu ("a submenu") instead of performing a direct action or opening a dialog.
- **FR-002**: A submenu MUST be presented using the same visual and interaction pattern as any menu opened directly from the sidebar (position near the trigger, keyboard navigation, an option to cancel/dismiss).
- **FR-003**: The submenu mechanism MUST be reusable across sidebar menus, so that a menu choice other than "Arpeggio" can be configured to open its own submenu without one-off, per-choice implementation.
- **FR-004**: The Notes menu's "Arpeggio" choice MUST open a submenu listing all available arpeggio styles (Plain, Rasquedo Up, Rasquedo Down, Roll Up, Roll Down, Brush Up, Brush Down, None) as individually selectable choices.
- **FR-005**: Choosing an arpeggio style from the submenu MUST apply that style to the currently selected note(s), matching the effect the existing Arpeggio dialog has today.
- **FR-006**: The existing single-dropdown Arpeggio dialog MUST be removed from the "Arpeggio" choice's behavior; selecting "Arpeggio" from the Notes menu opens the submenu, not a dialog box.
- **FR-007**: Dismissing the arpeggio submenu without choosing a style MUST leave the note's arpeggio unchanged from before the Notes menu was opened.

### Key Entities

- **Arpeggio Style Choice**: One of the eight selectable arpeggio styles (Plain, Rasquedo Up, Rasquedo Down, Roll Up, Roll Down, Brush Up, Brush Down, None) that can be applied to a note.
- **Menu Choice**: A single selectable entry within a sidebar menu; may perform an action directly, open a dialog, or (new) open another menu.
- **Submenu**: A menu displayed as the result of selecting a menu choice from another menu, rather than being opened directly from the sidebar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can change a note's arpeggio style in two selections (open "Arpeggio", pick a style) with no intermediate dialog box appearing.
- **SC-002**: Every existing arpeggio style previously reachable through the dialog's dropdown remains reachable through the submenu, with no loss of capability.
- **SC-003**: The submenu mechanism added for "Arpeggio" can be pointed at by at least one other menu choice's configuration without additional custom UI code, demonstrating it is a reusable structure rather than an arpeggio-specific fix.

## Assumptions

- Selecting a style in the submenu closes the entire menu session (returning to the score editor), the same way choosing an item in any of today's top-level sidebar menus does; there is no "back to parent menu" navigation in this feature.
- The submenu does not visually mark which style is currently applied to the note; this matches the current behavior of other configured menu choices, none of which indicate a "current" state today.
- The set of arpeggio styles and their display labels are unchanged from the existing dialog (Plain, Rasquedo Up, Rasquedo Down, Roll Up, Roll Down, Brush Up, Brush Down, None).
- The `SuiArpeggioDialog` component and its Vue dropdown are retired as part of this change since the submenu fully replaces their function; no other menu or code path depends on them.
