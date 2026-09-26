# Feature Specification: Landmark Text Menu

**Feature Branch**: `021-landmark-text-menu`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "create a submenu in the text menu for landmark text features.  These will create a SmoTextGroup for some score or part metadata.  The submenu will have an option for each of the SmoTextGroup.purposes.  The PART will only be displayed if the part is exposed.   The other options may not be displayed if that text is not defined.  TITLE, SUBTITLE, COMPOSER, COPYRIGHT comes from SmoScoreInfo.  PAGE will have the form 'Page x of y' and is based on the number of pages and using the special page markers @@@ and ###.  Part comes from the part name.  Once a landmark text is selected, create it automatically.  Title and subtitle will be horizontally centered and placed at the top of the first page (subtitle below title) at the top of the page, and have pagination type Every.  and the default font size will be: TITLE - 24px, SUBTITLE - 18px. The copyright and DATE will be at the bottom of the page, centered, and PAGE, PART and COMPOSER will be in the upper right corner.  The tip-tap editor should not be enabled for the landmarks, neither can the page behavior. But the user can change the other features like font attributes, and they can move the text by selecting the text, from the normal post-edit dialog box.  If the user picks the landmark from the menu, and it exists, you can just bring up the dialog box."

## Clarifications

### Session 2026-09-24

- Q: How far from the true edge of the page should top/bottom landmark text (Title, Subtitle, Copyright, Date, Composer, Page number, Part) sit — flush against the physical page edge, or with a small fixed buffer so it isn't touching the paper edge? → A: Small fixed buffer from the page edge, equal to one em of that landmark's own font size (same convention already used for Title).
- Q: (Follow-up refinement) For top-anchored landmarks specifically, should the buffer be a flat "one em," or proportional to the top margin? → A: Proportional — a top-anchored landmark with nothing above it starts no lower than half the top margin's height (minus its own height, never above the true page top); a top-anchored landmark that has another landmark above it in its column (Subtitle under Title; Page number/Part under whichever of Composer/Page number already exists) stacks immediately below that landmark's bottom edge instead. This supersedes the flat "one em" answer above for Title/Subtitle/Composer/Page number/Part; Copyright/Date (bottom-anchored) are unaffected and keep the flat small-buffer-from-the-page-edge behavior.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a standard score landmark (Title, Subtitle, Composer, Copyright, Date, or Page number) (Priority: P1)

As a score editor user, I open the Text menu, choose "Landmark Text", and pick one of the standard items (Title, Subtitle, Composer, Copyright, Date, Page number). The system automatically creates a properly positioned, sized, and styled text block using the relevant score information, without me having to type anything.

**Why this priority**: This is the core value of the feature — turning score metadata that already exists (or is computable, like page numbers) into on-page text with a single click, using sensible defaults, instead of requiring the user to manually create and position a generic text block.

**Independent Test**: With a score that has a title and composer set, open the Text menu, choose "Landmark Text" > "Title", and confirm a centered title appears at the top of the first page in the correct default font size, without any text-entry step.

**Acceptance Scenarios**:

1. **Given** a score with a title set, **When** the user opens Text menu > Landmark Text and chooses "Title", **Then** a new text block showing the score's title is created automatically, horizontally centered at the top of the first page, in the default title font size, with no manual text entry required.
2. **Given** a score with a subtitle set, **When** the user chooses "Subtitle" from the Landmark Text submenu, **Then** a new text block showing the subtitle is created automatically, horizontally centered and positioned below the title's position at the top of the page, in the default subtitle font size.
3. **Given** a score with a composer set, **When** the user chooses "Composer", **Then** a new text block showing the composer's name is created automatically in the upper right corner of the page.
4. **Given** a score with copyright information set, **When** the user chooses "Copyright", **Then** a new text block showing the copyright text is created automatically, centered at the bottom of the page.
5. **Given** any score, **When** the user chooses "Date", **Then** a new text block showing the date is created automatically, centered at the bottom of the page.
6. **Given** a score with more than one page, **When** the user chooses "Page number", **Then** a new text block reading "Page x of y" (with "x" being that page's number and "y" being the total page count) is created automatically in the upper right corner, and the numbers stay correct as pages are added or removed.
7. **Given** the user has just created any landmark item, **When** the automatic creation completes, **Then** the item's edit dialog opens immediately so the user can review or adjust it.

---

### User Story 2 - Add a part-specific landmark (Priority: P2)

As a user editing a part (a single-instrument extraction of the score), I want a "Part" option in the Landmark Text submenu that inserts the part's name automatically, so the printed part is labeled without me retyping the instrument name.

**Why this priority**: Useful and follows the same pattern as User Story 1, but only applies to the subset of users working with an exposed/extracted part, so it is secondary to the score-wide landmarks.

**Independent Test**: Open a view where a single instrument's part is exposed, open Text menu > Landmark Text, confirm "Part" is offered, choose it, and confirm the part's name appears automatically in the upper right corner of the page.

**Acceptance Scenarios**:

1. **Given** the user is viewing an exposed (single-instrument) part, **When** the user opens the Landmark Text submenu, **Then** a "Part" option is offered.
2. **Given** the user is viewing the full, multi-instrument score (no part exposed), **When** the user opens the Landmark Text submenu, **Then** the "Part" option is not offered.
3. **Given** an exposed part, **When** the user chooses "Part", **Then** a new text block showing that part's name is created automatically in the upper right corner of the page.

---

### User Story 3 - Reopen an existing landmark instead of duplicating it (Priority: P2)

As a score editor user who already added a landmark item (e.g., Title), I want choosing that same item again from the Landmark Text submenu to open its existing dialog for review/editing, rather than creating a second, duplicate text block.

**Why this priority**: Prevents accidental duplicate landmarks and gives users a predictable way to get back to an item they created earlier, but it depends on landmark creation (User Story 1) already existing.

**Independent Test**: Create a Title landmark, close its dialog, choose "Title" from the Landmark Text submenu again, and confirm the existing Title's dialog opens instead of a second title being created.

**Acceptance Scenarios**:

1. **Given** a Title landmark already exists in the score, **When** the user chooses "Title" from the Landmark Text submenu again, **Then** the existing Title's dialog opens and no new text block is created.
2. **Given** a landmark item's dialog was reopened this way, **When** the user changes its font or position and closes the dialog, **Then** the score retains exactly one text block for that landmark, with the updated settings.

---

### User Story 4 - Adjust a landmark's appearance without retyping its content (Priority: P3)

As a score editor user, once a landmark item exists, I want to change its font size, font family, or position using the same dialog used for other score text, so I can fine-tune how it looks, while being prevented from freely retyping its content or changing whether it repeats across pages (since that would break its purpose as a Title, Page number, etc.).

**Why this priority**: Refinement on top of the core creation flow (User Stories 1-3); most landmarks are usable with their defaults, so this is a secondary but expected capability.

**Independent Test**: Create a landmark item, open its dialog, confirm there is no free-text editing step and no control to change how it repeats across pages, change its font size, and confirm the change is reflected on the rendered score.

**Acceptance Scenarios**:

1. **Given** a landmark item's dialog is open, **When** the user looks for a way to freely retype the displayed text, **Then** no such free-text editing control is available.
2. **Given** a landmark item's dialog is open, **When** the user looks for a control to change how the item repeats across pages, **Then** no such control is available.
3. **Given** a landmark item's dialog is open, **When** the user changes the font size, font family, or another supported appearance attribute, **Then** the rendered landmark updates accordingly.
4. **Given** a landmark item is selected on the score, **When** the user drags/moves it using the same interaction used to move other score text, **Then** the landmark's position updates accordingly.

---

### Edge Cases

- What happens when the user opens the Landmark Text submenu on a score where the title, subtitle, composer, and copyright are all blank? Only the always-available items (Date, Page number) are offered; Title, Subtitle, Composer, and Copyright are omitted until that information is entered elsewhere.
- What happens if a Title (or other) landmark already exists, and the user later clears the score's title field entirely? The existing landmark and its menu entry remain available (so the user can still open, edit, or remove it); clearing the source field does not retroactively delete or hide an already-created landmark.
- What happens when the user chooses "Page number" on a single-page score? A text block reading "Page 1 of 1" is created.
- What happens if the exposed part's name is blank? The "Part" option is still offered (since a part is exposed), and the created text block reflects whatever name the part currently has, including empty.
- What happens if the user is on an exposed part and later returns to the full score view? The "Part" option is no longer offered in that context, and any part landmark previously created remains part of that part's own materials.
- What happens if two top-anchored landmark purposes share a column (Title/Subtitle, or Composer/Page number/Part in the upper right)? Whichever is created first uses the FR-019 base position; each subsequently created one in the same column stacks immediately below whichever one currently sits lowest in that column, so they never overlap — regardless of the order they're created in (FR-020).
- What happens if a landmark's top/bottom position were measured from the score's music margin instead of the physical page edge? It would land inside the region reserved for music systems and could visually collide with the rendered score; landmarks are therefore always positioned relative to the page edge, entirely outside the margin area used by the music (see FR-018).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Text menu MUST offer a "Landmark Text" submenu containing one entry per landmark purpose: Title, Subtitle, Composer, Copyright, Date, Page number, and Part.
- **FR-002**: The Title, Subtitle, Composer, and Copyright entries MUST be omitted from the submenu whenever their corresponding score information (title, subtitle, composer, copyright) is not defined (empty/blank).
- **FR-003**: The Part entry MUST be offered only when the user is viewing an exposed (single-instrument) part, and MUST be omitted otherwise.
- **FR-004**: The Date and Page number entries MUST always be offered, regardless of other score information.
- **FR-005**: Choosing a submenu entry for a landmark purpose that does not yet exist in the score MUST automatically create the corresponding text block, populated from the relevant source (score title/subtitle/composer/copyright, current date, computed page position, or exposed part name), with no manual text-entry step required from the user.
- **FR-006**: Choosing a submenu entry for a landmark purpose that already exists in the score MUST open that existing item's dialog instead of creating a duplicate.
- **FR-007**: A newly created Title landmark MUST be horizontally centered at the top of the first page, using the default title font size, and MUST repeat across every page.
- **FR-008**: A newly created Subtitle landmark MUST be horizontally centered at the top of the page, positioned below the Title's position, using the default subtitle font size, and MUST repeat across every page.
- **FR-009**: A newly created Copyright landmark and a newly created Date landmark MUST each be horizontally centered at the bottom of the page.
- **FR-010**: A newly created Page number landmark MUST be positioned in the upper right corner of the page and MUST display in the form "Page x of y", where "x" is that page's number and "y" is the total number of pages, and MUST stay correct as pages are added or removed.
- **FR-011**: A newly created Composer landmark and a newly created Part landmark MUST each be positioned in the upper right corner of the page (right-justified against the right margin — see FR-021).
- **FR-012**: The default font size for a newly created Title landmark MUST be 24px, and for a newly created Subtitle landmark MUST be 18px.
- **FR-013**: The dialog for a landmark text block MUST NOT offer free-text (rich-text) editing of its displayed content.
- **FR-014**: The dialog for a landmark text block MUST NOT offer a control to change how the item repeats across pages (its pagination behavior).
- **FR-015**: The dialog for a landmark text block MUST offer the same appearance controls available to other score text (such as font family, font size, and other supported text attributes), and changes made there MUST be reflected on the rendered score.
- **FR-016**: A landmark text block MUST be repositionable using the same select-and-move interaction already available for other score text.
- **FR-017**: Immediately after a landmark text block is automatically created, its dialog MUST open so the user can review or adjust it.
- **FR-018**: A landmark's top-of-page position (Title, Subtitle, Composer, Page number, Part) or bottom-of-page position (Copyright, Date) MUST be measured from the physical edge of the page, not from the score's music margins, ensuring it never renders inside the margin area used by the music and therefore cannot visually collide with it.
- **FR-019**: A top-anchored landmark with no other landmark positioned above it (Title; or the first landmark created in the upper-right group of Composer/Page number/Part) MUST start no lower than half the top margin's height, and MUST NOT start above the true top edge of the page (i.e., its own height may push its start position down from the page edge, down to but not below half the top margin).
- **FR-020**: A top-anchored landmark that has another landmark already positioned in the same column (Subtitle and Title; Composer, Page number, and Part) MUST be positioned immediately below whichever of them currently sits lowest, rather than at the FR-019 base position — regardless of which order the column's landmarks were created in.
- **FR-021**: A newly created Composer, Page number, or Part landmark (the "upper right corner" group) MUST be right-justified against the right margin — its right edge aligned with the right margin, not centered around a point partway across the page.

### Key Entities

- **Landmark Text Group**: A score (or part) text block created via the Landmark Text submenu, tied to one specific purpose (Title, Subtitle, Composer, Copyright, Date, Page number, or Part). At most one exists per purpose per score (or, for Part, per part). Its displayed content is derived automatically from score/part information rather than freely typed, and it does not support changing its own repeat-across-pages behavior.
- **Score Information**: The score-level metadata (title, subtitle, composer, copyright) that feeds the Title, Subtitle, Composer, and Copyright landmarks. Presence or absence of each field determines whether its corresponding submenu entry is offered.
- **Exposed Part**: A single-instrument view/extraction of the score, whose name feeds the Part landmark. Determines whether the Part submenu entry is offered.
- **Page Collection**: The current set of rendered pages in the score, whose count and each page's position feed the Page number landmark's "Page x of y" content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add any available landmark item to the score in a single menu selection, with no typing required.
- **SC-002**: 100% of newly created landmark items appear at their documented default position (top-center, bottom-center, or upper-right) and, for Title/Subtitle, at their documented default font size, without manual adjustment.
- **SC-003**: The "Part" submenu entry is offered only while viewing an exposed part, and never while viewing the full multi-instrument score.
- **SC-004**: Re-choosing a submenu entry for a landmark that already exists opens the existing item 100% of the time, with 0 duplicate text blocks created.
- **SC-005**: Submenu entries whose source score information is blank are hidden 100% of the time, so no user ever creates an accidentally empty Title/Subtitle/Composer/Copyright landmark.
- **SC-006**: 100% of Page number landmarks display the correct current-page/total-page values after pages are added to or removed from the score.
- **SC-007**: 100% of landmark text positioned at the top or bottom of the page renders entirely outside the region occupied by the score's music margins, with no visual collision with the rendered music.

## Assumptions

- The seven landmark purposes offered are exactly those in the underlying purpose list, excluding the generic/unset purpose (which is not a landmark a user would pick from this menu).
- "Not defined" for Title, Subtitle, Composer, and Copyright means the corresponding score information field is empty or blank; any non-empty value is treated as defined.
- Pagination behavior for Copyright, Date, Page number, Composer, and Part landmarks defaults to repeating on every page, consistent with their role as running header/footer information; only Title and Subtitle are explicitly specified in this feature's source request, but the same "every page" behavior is the reasonable default for the others since they are also page-level landmarks rather than one-time text.
- The Date landmark shows the current date in a standard, system-appropriate date format; the exact format is an implementation detail left to existing date-display conventions elsewhere in the product.
- Default font size/family for Composer, Copyright, Date, Page number, and Part landmarks use the product's existing default text styling, since only Title and Subtitle default sizes were explicitly specified.
- A landmark's displayed content is fixed at creation time; it does not automatically update afterward if the underlying score information changes (e.g., editing the score's title after a Title landmark exists does not silently retype that landmark). Editing the landmark's own content, if ever needed, happens outside the free-text-disabled dialog described here (e.g., by deleting and recreating it), which is out of scope for this feature.
- "Part is exposed" refers to the existing single-instrument part view/extraction concept already present in the product; this feature does not change what makes a part exposed, only whether the Part submenu entry is shown.
