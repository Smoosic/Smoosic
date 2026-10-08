# Feature Specification: Anchor Menus to Triggering Button

**Feature Branch**: `008-anchor-menu-to-button`

**Created**: 2026-09-05

**Status**: Draft

**Input**: User description: "for menu buttons, and ribbon buttons that create a menu, we'd like to pass the triggering DOM element into the menu creation function, which can be used to place the menu in the correct location. ButtonCallback from src/ui/buttons/button.ts ButtonDefinition should be changed to accept an element ID as an optional argument. For buttons ribbon.ts executeButton, create an SvgPoint from the top right coordinate of the Dom element. For handlers in executeQuickButton, set the SvgPoint to be the bottom left of the triggering element. SuiMenuManager should use accept optional SvgPoint argument, and use those coordinates to set this.menuPosition if it is present."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Menu opens next to the ribbon button that triggered it (Priority: P1)

A user clicks a ribbon button (e.g. a toolbar button that opens a menu, such as a note-duration or clef selector) that opens a menu. Today the menu appears at a fixed screen position that may be far from the button the user just clicked. Instead, the menu should open anchored near the button, so the user can visually connect the menu to the action they took and immediately see the available choices without hunting for them.

**Why this priority**: This is the primary, most common way users open menus in the application (via ribbon buttons), and misplaced menus are the main source of confusion this feature addresses.

**Independent Test**: Click any ribbon button that opens a menu and verify the menu appears positioned near (anchored to the top-right of) that button, rather than at the previous fixed default location.

**Acceptance Scenarios**:

1. **Given** the ribbon is displayed with a button that opens a menu, **When** the user clicks that button, **Then** the menu opens anchored near the top-right corner of the clicked button.
2. **Given** a ribbon button that opens a menu is positioned near the edge of the visible ribbon area, **When** the user clicks it, **Then** the menu still opens fully visible and anchored as close to the button as the display allows.

---

### User Story 2 - Quick-action buttons open their menu near the clicked control (Priority: P2)

Some buttons act as "quick" shortcuts that immediately trigger a menu-driven action (for example, a hotkey-bound or collapsed/quick-access control) rather than going through the standard ribbon click path. When a user activates one of these quick buttons, any resulting menu should likewise appear near the control that was activated, anchored below and to the left of it, so the behavior is visually consistent with other menu triggers.

**Why this priority**: Quick buttons are a secondary but frequently used interaction path; without this, only some menu triggers would get correct positioning, leaving an inconsistent experience.

**Independent Test**: Trigger a quick-access button that results in a menu and verify the menu appears anchored near the bottom-left of the triggering control.

**Acceptance Scenarios**:

1. **Given** a quick-access button that opens a menu, **When** the user activates it, **Then** the menu opens anchored near the bottom-left corner of that control.

---

### User Story 3 - Menus without a known trigger element still open correctly (Priority: P3)

Not every menu is opened as a direct result of clicking a visible on-screen button (for example, a menu opened programmatically or via a keyboard shortcut with no associated DOM element). In these cases the menu should continue to open using its existing default/fallback position, exactly as it does today, so no existing behavior regresses.

**Why this priority**: This is a compatibility/regression-safety story rather than new user value, but it must hold for the feature to be safely shipped.

**Independent Test**: Trigger a menu through a path that has no associated triggering element and verify it still opens at the same default position it used before this feature.

**Acceptance Scenarios**:

1. **Given** a menu is opened without a triggering element being identified, **When** the menu opens, **Then** it appears at the existing default position used prior to this change.

## Edge Cases

- What happens when the triggering button's element cannot be found in the DOM at the time the menu opens (e.g. it was removed or the ID is stale)? The menu falls back to the existing default position.
- What happens when anchoring the menu at the computed position would place part of the menu outside the visible viewport (button near a screen edge)? The menu should still be fully shown to the user (existing on-screen containment behavior, if any, is preserved).
- What happens for a button that both collapses a group and opens a menu (e.g. `collapseChildMenu`)? The menu it opens should also be anchored to that button, consistent with other menu-opening buttons.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a ribbon button configured to open a menu is activated through the standard button-execution path, the system MUST anchor the resulting menu's position to the top-right corner of that button's on-screen element.
- **FR-002**: When a quick-access button is activated and results in a menu being opened, the system MUST anchor the resulting menu's position to the bottom-left corner of that control's on-screen element.
- **FR-003**: The system MUST allow a button's definition to optionally carry a reference (element ID) to the DOM element that should be used for anchoring, without requiring every button to supply one.
- **FR-004**: The menu-opening mechanism MUST accept an optional anchor position; when supplied, the menu MUST open at that position instead of its default position.
- **FR-005**: When no anchor position is supplied, or the referenced triggering element cannot be resolved, the system MUST fall back to the current default menu position with no change in behavior.
- **FR-006**: The anchoring behavior MUST apply consistently across all existing button actions that open a menu (`menu`, `collapseChildMenu`), not just a subset.

### Key Entities

- **Button Definition**: Represents a clickable ribbon control; gains an optional reference to its own triggering DOM element so the system can compute where a menu it opens should appear.
- **Menu Anchor Position**: A single on-screen coordinate (point) derived from a triggering element's location, used to position a newly opened menu.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every ribbon button that opens a menu, the menu visibly opens adjacent to (touching or within a few pixels of) that button's corner in 100% of manual verification passes across existing menu-producing buttons.
- **SC-002**: No existing menu-opening flow that lacks a triggering element regresses to an incorrect or missing position — it continues to open at the prior default position in 100% of cases.
- **SC-003**: Users no longer need to visually search the screen for a just-opened menu, as observed by the menu always appearing within the immediate vicinity of the control they just activated.

## Assumptions

- "Menu buttons" refers to ribbon buttons whose `action` is `menu` or `collapseChildMenu` (the button actions in the existing button model that result in a menu being shown), routed through `executeButton`.
- "Ribbon buttons that create a menu" via the quick-action path refers to buttons routed through `executeQuickButton`.
- The "triggering DOM element" is identified by an element ID already available on the button (its existing unique DOM selector ID), rather than a newly-introduced element reference.
- The anchor point for standard menu buttons is the element's top-right corner; the anchor point for quick buttons is the element's bottom-left corner, per the differing visual layouts of these two control types.
- The menu system already has a single default/fallback position used today; this feature does not change that default, it only overrides it when an anchor is available.
- Screen-edge containment/clamping of the menu (ensuring it stays fully visible) is handled by existing menu-rendering behavior and is not being newly introduced by this feature.
- This feature is UI-positioning only: it does not change what any menu contains, which buttons open menus, or any other button/menu behavior.
