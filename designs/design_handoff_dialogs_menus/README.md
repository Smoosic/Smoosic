# Handoff: Smoosic dialog, menu and ribbon UI

## Overview

A visual system for Smoosic's Vue 3 dialog components, its left sidebar menus and
dropdown menu modals, the permanent top ribbon, and a redesigned staff-group control
for `staffGroups.vue`. Everything is responsive down to 768px.

The work covers three deliverables:

1. **Dialog kit** — number pickers, custom selects, labelled toggles, tri-state button
   arrays, the three submit controls, the drag handle, grouped-control frames and
   collapsible sections.
2. **Menu kit** — sidebar menu buttons, the dropdown menu modal they open, submenus,
   and the permanent ribbon (icon-only buttons, icon+text buttons, part selection).
3. **Staff groups** — a specific control for `staffGroups.vue`: a list of the score's
   staves with a per-stave action dropdown and a per-group connector dropdown, with the
   connector graphic drawn in a left gutter.

## About the design files

The files in this bundle are **design references created in HTML**. They are prototypes
showing intended look and behavior — not production code to drop in.

The **CSS is the exception and is meant to be used directly.** All three stylesheets are
written as plain component CSS against CSS custom properties, with no framework
assumptions and no build step. Copy them into `src/styles/` and they will work as-is.
Your job in the `.dc.html` files is only to read the markup structure — the class names,
the element nesting, which state class goes where — and reproduce that structure in the
existing Vue single-file components.

The HTML files are Design Component documents. They open in a browser but carry a small
runtime (`support.js`) and specimen scaffolding (`.doc`, `.spec`, `.masthead`, `.wrap`,
`.canvas`, `.frame`, `.score`, `.notes`, `.eyebrow`, `.list`, `.col`, `.sec`, `.sec-sub`,
`.rule-hair`, `.inert-chip`) that exists only to present the specimens on a page.
**None of the specimen classes ship.** They are documented as such at the top of
`dialog-kit.css`. Ignore the surrounding page; read the component markup inside it.

## Fidelity

**High fidelity.** Colors, type, spacing, control heights, border radii and all
interaction states are final. Recreate them exactly. Every value comes from a CSS
variable — take the variables, never a literal.

The one thing deliberately left open: the `.dc.html` documents are *static* mockups.
Every state (hover, focus, open, checked, disabled, dragging, changed) is shown as a
hard-coded class on a separate element so all states are visible at once. In the real
components those classes are bound to reactive state, or replaced entirely by the real
pseudo-classes — the stylesheets define both. See "State classes vs pseudo-classes".

## Target codebase

Vue 3 with `<script setup lang="ts">`, in `Smoosic/src/ui/components/`. The existing
components this work replaces or restyles:

| Existing file | What this design does to it |
| --- | --- |
| `dialogs/dialogContainer.vue` | Restyle. Structure unchanged. |
| `dialogs/draggableComp.vue` | Restyle the handle. Drag logic unchanged. |
| `dialogs/numberInput.vue` | Restyle; adds the value-changed notification. |
| `dialogs/select.vue` | Restyle the trigger and panel. |
| `dialogs/buttonGroup.vue` | Restyle; formalises the tri-state visual. |
| `dialogs/collapsableRow.vue` | Restyle; two variants (ruled section, inline box). |
| `dialogs/dialogButtons.vue` | Restyle; Remove separates to the right. |
| `dialogs/staffGroups.vue` | **Redesign.** Different control model — see that section. |
| `buttons/ribbon.vue` | Restyle to the ribbon spec. |
| `buttons/sidebar.vue` | Restyle to the sidebar menu-button spec. |
| `menus/*.ts` | No change; the sidebar groups follow these modules. |

Bootstrap grid classes in the existing templates can stay or go — the stylesheets do
their own layout with CSS grid and flex and don't depend on them. Where a row was a
12-column Bootstrap row, it is now a fixed-track CSS grid, which is what makes the
columns align down a whole list.

---

## Design tokens

### Source

All color, type, spacing, radius and shadow values come from the **Broadsheet** design
system, shipped here as `broadsheet-tokens.css`. Link it before the three component
sheets. Every rule in those sheets reads `var(--color-*)`, `var(--space-*)`,
`var(--font-*)`, `var(--radius-*)`, `var(--shadow-*)` — **do not hard-code a hex or a px
value the tokens already carry.**

### Palette as used

| Role | Variable | Value | Where |
| --- | --- | --- | --- |
| Page ground | `--color-bg` | `#f3f2f2` | dialog title bar, number-picker spinner |
| Surface | `--color-neutral-100` | `#eae9e9`* | dialog body, sidebar, ribbon, menu panel |
| Field | `--dlg-field` | `#fff` | inputs, selects, dropdown panels, canvas |
| Ink | `--color-text` | `#201e1d` | all body text |
| Secondary ink | `--color-neutral-700` | — | labels, hints, metadata |
| Control border | `--color-neutral-400` (`--dlg-line`) | — | field and button borders |
| Hairline | `--color-neutral-300` (`--dlg-rule`) | — | rules, group frames, separators |
| Dialog border | `--color-neutral-500` | — | dialog and dropdown outer border |
| Interactive | `--color-accent` | `#0088b0` | the only interactive ink |
| Interactive dark | `--color-accent-700` | `#006786` | accent text, pressed, accent borders |
| Interactive tint | `--color-accent-100` | — | hover fills, group-bar fill, open menus |
| Notification | `--color-accent-2` | `#d6006c` | **reserved** for value-changed and Remove |
| Notification dark | `--color-accent-2-700` | — | changed-value text, destructive items |

\* read the real value from `broadsheet-tokens.css`; the ramps are generated in OKLCH.

Two rules carried throughout: **cyan is the only interactive color**, and **magenta
appears only twice** — as the number-picker value-changed mark and on destructive
actions (Remove, Delete selection, Remove from group). Do not introduce a third accent,
and do not use both accents inside the same small component.

### Type

Source Serif 4 throughout, via `--font-heading` and `--font-body` (both the same
family — the serif is the chrome; there is no sans-serif anywhere in this design).

| Use | Size / weight | Notes |
| --- | --- | --- |
| Control value, menu item, ribbon | 13–13.5px / 400 | |
| Field label | 12.5px / 400 | `--dlg-label` |
| Hotkey, hint, metadata | 11–11.5px / 400 | tabular-nums on hotkeys |
| Group legend, section head | 10.5–11px / 600 | uppercase, `.1em` tracking |
| Dialog title | 11.5px / 600 | uppercase, `.1em` tracking |
| Numeric fields | — | always `font-variant-numeric: tabular-nums` |

### Component tokens

Declared at the top of each sheet; these are the knobs to turn, not the rules.

```css
/* dialog-kit.css */
--dlg-h: 26px;            /* control height, compact density */
--dlg-h-lg: 30px;         /* control height below the breakpoint */
--dlg-gap: 4px;           /* gutter between adjacent controls */
--dlg-radius: 2px;        /* = --radius-md; frames, boxes, dialog shell */
--dlg-radius-btn: 6px;    /* buttons and fields — soft corners */
--dlg-label: 12.5px;
--dlg-value: 13px;

/* menu-kit.css */
--menu-rail: 232px;       /* expanded sidebar width */
--menu-rail-sm: 52px;     /* icon-only rail */
--menu-btn-h: 34px;
--menu-item-h: 30px;
--menu-key-w: 42px;       /* hotkey track, fits "Alt-X" at 11px */
--ribbon-h: 48px;
--rbtn: 34px;             /* icon-only hit box */

/* staff-groups.css */
--sg-gutter: 30px;        /* connector-graphic column */
--sg-row: 32px;           /* stave row height */
--sg-action: 148px;       /* action dropdown column */
```

Note the two radii. Anything clickable — buttons, fields, select triggers, spinners —
takes 6px. Frames that contain things — the dialog shell, grouped-control boxes, the
stave list — stay at Broadsheet's 2px, so soft controls read against crisp frames.

---

## State classes vs pseudo-classes

Every stylesheet defines interaction states **twice**: once as a real pseudo-class for
the shipping component, once as an `.is-*` class so a static mockup can show it.

```css
.mbtn:hover, .mbtn.is-hover { … }
.mbtn:active, .mbtn.is-pressed { … }
.mbtn:focus-visible, .mbtn.is-focus { … }
```

In the Vue components, **rely on the pseudo-classes** for hover, active and focus — do
not bind `.is-hover`. Bind only the states the browser can't know:

| Class | Bind to | Applies to |
| --- | --- | --- |
| `.is-on` | boolean prop / model | toggle, stateful button, ribbon latch |
| `.is-partial` | tri-state === mixed | stateful button (`aria-pressed="mixed"`) |
| `.is-open` | dropdown open | menu button, select, action trigger, part selector |
| `.is-checked` | menu item is current | menu item |
| `.is-changed` | value !== committed value | number picker |
| `.is-disabled` | disabled prop | all controls |
| `.is-dragging` | drag in progress | dialog title bar, drag handle |
| `.is-selected` | row is selected | stave row |
| `.is-danger` | destructive action | menu item |
| `.is-stop` | the transport stop button | ribbon button |
| `.is-loose` | stave belongs to no group | stave row |
| `.is-compact` | see "Responsive" | ribbon |
| `.is-rail` | see "Responsive" | sidebar |
| `.dlg-stack` | see "Responsive" | dialog |

Also bind ARIA alongside the classes. `.is-on` / `.is-partial` / off on a stateful button
must be `aria-pressed="true" | "mixed" | "false"`. `.is-open` must be
`aria-expanded`. `.is-checked` on a menu item must be `aria-checked` with
`role="menuitemradio"` or `menuitemcheckbox`.

Focus is never a browser default: `:focus-visible { outline: 2px solid var(--color-accent);
outline-offset: 2px; }` is already in the sheets. Don't override it.

---

## Part 1 — Dialog kit (`dialog-kit.css`)

Reference file: `Dialog Kit.dc.html`.

### Dialog shell

```html
<div class="dlg">
  <div class="dlg-bar">            <!-- + .is-dragging while dragging -->
    <span class="grip"></span>     <!-- + .is-grabbing -->
    <span class="dlg-title">Text block</span>
    <span class="dlg-meta">measure 14</span>
  </div>
  <div class="dlg-body">           <!-- + .tight for section-list dialogs -->
    …
    <div class="actions">…</div>
  </div>
</div>
```

- `.dlg` — `--color-neutral-100` fill, 1px `--color-neutral-500` border, 2px radius,
  `--shadow-lg`.
- `.dlg-bar` — 7px/10px padding, `--color-bg` fill, hairline bottom border. Turns
  `--color-accent-100` with accent text via `.is-dragging`.
- `.grip` — 10×14px, `radial-gradient` dot matrix on a 5px grid, `cursor: grab`;
  `.is-grabbing` switches the dots to accent and the cursor to `grabbing`. **This is the
  only drag affordance** and it is the upper-left element of the bar. Wire
  `draggableComp.vue`'s existing handlers to it.
- `.dlg-title` — 11.5px/600 uppercase, `.1em` tracking.
- `.dlg-meta` — pushed right with `margin-left: auto`, 11.5px, `--color-neutral-700`.
- `.dlg-body` — 20px top / 14px side padding, `flex-column` with 18px gap. Use
  `.dlg-body.tight` (16px top, 6px gap) when the body is a list of collapsible sections.

### Grouped controls

Combined controls get a ruled box with its legend cut into the top edge — the "organized
and cohesive, with a border" requirement.

```html
<div class="group">
  <span class="group-label">Typeface</span>
  <div class="grow-row">
    <span class="field-label">Family</span>
    <!-- controls -->
  </div>
  <div class="grow-row">…</div>
</div>
```

- `.group` — 1px `--dlg-rule` border, 2px radius, 15px/12px/13px padding.
- `.group-label` — absolutely positioned at `top: -7px; left: 10px`, padding `0 6px`,
  background `--color-neutral-100` to knock a hole in the border it sits on. 10.5px/600
  uppercase. **The background must match the dialog body fill** or the notch shows.
- `.grow-row` — a flex row, 8px gap, 9px top margin between rows.
- `.field-label` — fixed 52px (`.wide` 64px, `.auto` for natural width), so labels align
  down the group.
- `.toggles` — `flex-column`, 8px gap, for a run of toggle rows outside any group.

### Number picker

```html
<div class="num">                       <!-- + .is-focus .is-changed .is-disabled -->
  <div class="num-field">               <!-- .w-sm 52px | .w-md 56px | default 70px -->
    <span class="num-unit">pt</span>
    <span>12.0</span>
  </div>
  <div class="num-spin">
    <div class="num-btn"><span class="caret caret-up"></span></div>
    <div class="num-btn"><span class="caret caret-down"></span></div>
  </div>
</div>
```

- 26px tall. Field is white with a 6px left radius and no right border; the spinner is a
  19px column with a 6px right radius, split by a hairline.
- Value right-aligned, tabular figures. `.num-unit` is the unit prefix at 11px, pushed
  left with `margin-right: auto`.
- `.num-btn.is-hover` (or `:hover`) tints that arrow's half only, accent — so it's clear
  which direction you're about to hit.
- **`.is-changed` is the change notification.** Field and spinner go
  `--color-accent-2-100` fill with a `--color-accent-2` border and accent-2 carets. Pair
  it with a `.hint-changed` span reading the previous value ("was 12.0"). This is the
  only place magenta appears on a non-destructive control, which is what makes it read
  as a notification. Apply when the model value differs from the committed value.
- `.num-btn.is-disabled` dims one arrow when the value is at `min` or `max`. `.is-disabled`
  on the whole `.num` dims to 45% and greys the field.
- Props from the existing component — min, max, step, precision, unit, percent — all
  still apply; nothing in the CSS constrains them.

### Select

```html
<div class="sel">                       <!-- + .grow .w-md | .is-open -->
  <span>Merriweather</span>
  <span class="caret caret-down caret-lg"></span>
</div>
<div class="sel-panel">                 <!-- render only when open -->
  <div class="sel-opt">Arial</div>
  <div class="sel-opt is-active">Merriweather</div>
</div>
```

- Trigger 26px, white, 6px radius. `.is-open` squares the bottom corners and turns the
  border accent so trigger and panel read as one object; flip the caret to `caret-up`.
- **The panel must be a sibling inside a `position: relative` wrapper**, absolutely
  positioned `top: 100%; left: 0; right: 0`. Getting this wrong (panel aligned to an
  outer box rather than the trigger) was a real bug during design — the panel detaches
  and mis-widths.
- `.sel-opt` — 5px/8px padding, 3px transparent left border that becomes accent on
  hover/active. `.is-active` is the current value: 600 weight, accent tint, accent text.
- `.grow` makes it fill a `.grow-row`; `.w-md` is a fixed 112px.

### Toggle

```html
<div class="tgl-row">                   <!-- + .is-focus .is-disabled -->
  <span class="tgl is-on"><span class="tgl-knob"></span></span>
  <span>Attach to measure</span>
</div>
```

32×18px track, 9px radius, 14px knob. Off is `--color-neutral-300`; `.is-on` is
`--color-accent` with a `--color-accent-700` border and the knob to the right. Label sits
to the right of the track, and **the whole row is the hit target** — make `.tgl-row` the
`<label>` or the click handler, not just the track.

### Stateful buttons (tri-state)

```html
<div class="sbtn-group">
  <div class="sbtn is-on" aria-pressed="true">B</div>
  <div class="sbtn is-partial" aria-pressed="mixed"><span class="i">I</span></div>
  <div class="sbtn" aria-pressed="false"><span class="u">U</span></div>
</div>
```

- `.sbtn` — 26px tall, 30px min-width, 6px radius, white, 9px side padding. `.wide`
  (11px padding, 12.5px text) for word labels like Left / Center / Right.
- `.is-on` — solid accent fill, white text, 700 weight.
- `.is-partial` — **accent tint fill with a 3px accent bar across the left half of the
  bottom edge**, via `::after`. This is what distinguishes "partly on" (mixed selection)
  from "on". It must be visually distinct from hover, which shares the tint but has no
  bar.
- `.i` / `.u` carry italic and underline so the glyph shows its own meaning.

### Submit row

```html
<div class="actions">
  <div class="act act-ok">OK</div>
  <div class="act act-cancel">Cancel</div>
  <div class="act act-remove">Remove</div>
</div>
```

28px tall, 6px radius, hairline top border with 13px padding above. OK is a solid accent
fill at 600 weight; Cancel is outlined in `--dlg-line`; **Remove is pushed right with
`margin-left: auto`** and outlined in `--color-accent-2-300` with accent-2 text — set
apart from the pair because it does something different in kind.

All three are independently hideable (`v-if` on `commitCb` / `cancelCb` / `removeCb`
being supplied). The layout survives any combination — with Remove hidden, OK and Cancel
stay left; with only Remove, it still sits right. **Open question for you:** Remove is
outline-only with no confirm step. If a confirm is wanted, say so.

### Collapsible sections

Two variants:

```html
<!-- ruled section, for a dialog that is a list of sections -->
<div class="sect is-open">
  <div class="sect-head"><span class="caret caret-open"></span><span>Playback</span></div>
  <div class="sect-body">…</div>       <!-- omit when collapsed -->
</div>
<div class="sect">
  <div class="sect-head"><span class="caret caret-right"></span><span>Engraving</span>
    <span class="hint">6 settings</span></div>
</div>

<!-- inline box, for one collapsible group among normal controls -->
<div class="sect-inline">
  <div class="sect-head">…</div>
</div>
```

`.sect` has a hairline top rule that goes full-strength `--color-text` when `.is-open`,
and the head goes from `--color-neutral-700` to `--color-text`. Caret is `caret-right`
when collapsed, `caret-open` (pointing down) when open. Show the collapsed item count in
a `.hint` so a closed section isn't mute. **Don't animate height** — the design has no
height transition; collapse is immediate.

### Carets

One element, five classes, no icon font: `.caret` plus `.caret-up`, `.caret-down`,
`.caret-right` (collapsed section / submenu), `.caret-open` (expanded section), and
`.caret-lg` to step up from the 3.5px control size to the 4px select size. They're CSS
triangles. Keep them — they're the one piece of iconography that must match the
hairline weight exactly.

### The inert backdrop

The requirement: *"the area behind the dialogs should be transparent but not clickable,
and keyboard or click events should be prevented outside the dialog."* The CSS side is
just a full-viewport transparent layer. The behavior is yours to implement:

- A transparent fixed layer at `inset: 0` under the dialog, above the score.
- Capture and swallow `pointerdown`, `click`, `wheel`, `contextmenu` and `keydown` on it
  (`{ capture: true }`, `preventDefault` + `stopPropagation`). The score must stay
  **visible** — do not tint or blur.
- Trap focus in the dialog: on open, focus the first control; cycle Tab and Shift-Tab
  within it; on close, return focus to whatever opened it.
- Escape closes (equivalent to Cancel).
- The score itself must not scroll or zoom while a dialog is open.

The mockups mark this layer with an `.inert-chip` caption. **That caption is specimen
scaffolding and does not ship.**

---

## Part 2 — Menu kit (`menu-kit.css`)

Reference file: `Menu Kit.dc.html`.

### Icons

Two sources, and the rule for choosing is semantic:

- **Material Symbols Outlined** (`.mi`) for application chrome — file, undo, layers,
  title, play_arrow, stop, refresh, zoom_in, zoom_out, visibility, groups, help,
  view_column, list_alt, tune, straighten, add_box, link_off, backspace,
  vertical_align_top, vertical_align_bottom, graphic_eq, check, more_horiz, info.
  Addressed by ligature name. Loaded at `wght 300, opsz 20`, 20px (`.sm` = 17px).
  Fixed 20px width so icons align in a column.
- **Bravura** (`.bv`) for anything naming a musical object. Shipped in
  `fonts/Bravura_1.392.woff`, copied from `src/styles/fonts/`. 22px (`.sm` = 18px) — set
  larger than Material because SMuFL glyphs read optically smaller at the same px.

**Bravura glyphs are addressed by named class, never by a literal character in the
markup.** The codepoint lives in CSS:

```css
.bv-gclef::before     { content: "\E050"; }
.bv-fclef::before     { content: "\E062"; }
.bv-cclef::before     { content: "\E05C"; }
.bv-common::before    { content: "\E08A"; }
.bv-cutcommon::before { content: "\E08B"; }
.bv-num3::before      { content: "\E083"; }
.bv-quarter::before   { content: "\E1D5"; }
.bv-eighth::before    { content: "\E1D7"; }
.bv-rest::before      { content: "\E4E5"; }
.bv-flat::before      { content: "\E260"; }
.bv-natural::before   { content: "\E261"; }
.bv-sharp::before     { content: "\E262"; }
.bv-accent::before    { content: "\E4A0"; }
.bv-forte::before     { content: "\E522"; }
.bv-metronome::before { content: "\ECA5"; }
```

Markup is `<span class="bv bv-quarter"></span>` — empty element, no text content.
Add new glyphs by adding a class here, not by pasting a character into a template. The
`@font-face` block at the top of `menu-kit.css` points at
`fonts/Bravura_1.392.woff`; adjust the path for `src/styles/fonts/` and note the app
already loads Bravura via `FontFace` in `application.ts` — either is fine, but the
`@font-face` must exist for CSS `content` to resolve.

### Sidebar menu button

```html
<button class="mbtn">              <!-- + .is-open .is-pressed .is-disabled -->
  <span class="bv bv-quarter"></span>
  <span class="mbtn-label">Note</span>
  <span class="mbtn-key">Alt-N</span>
  <span class="caret caret-right"></span>
</button>
```

**`.mbtn` is a four-track CSS grid: `20px | minmax(0,1fr) | 42px | 6px`** — icon, label,
hotkey, caret. Each child is pinned to its column by `grid-column`, so all four align
down the entire rail regardless of label length. This is the requirement that hotkeys
are always on the right and icons, labels and hotkeys are vertically aligned; don't
convert it back to a flex row with `margin-left: auto`, which only aligns the ends.

- 34px tall, 6px radius, transparent until interacted with.
- Hotkey track is 42px, right-aligned, sized for the `Alt-X` format. Widen
  `--menu-key-w` if you add a longer binding.
- `.is-open` — the button whose menu is currently up stays a solid accent fill with
  white text, so the menu is visibly tethered to its trigger.
- Rail is 232px (`--menu-rail`), sized so "Time signature" doesn't ellipsize.
- `.side-group` prints a small uppercase group heading between runs of buttons. Groups as
  shown: Score (File, Edit, Score, Measure, Time signature, Key signature), Selection
  (Note, Articulation, Dynamics, Beams, Tuplets, Voices, Text), Output (Playback, Parts,
  Help) — following the modules in `src/ui/menus/`.
- Hotkeys as shown: Alt-F, Alt-E, Alt-S, Alt-M, Alt-T, Alt-K, Alt-N, Alt-A, Alt-D, Alt-B,
  Alt-U, Alt-V, Alt-X, Alt-P, Alt-R, Alt-H. Confirm these against the real bindings.

### Dropdown menu modal

```html
<div class="mdrop">
  <div class="mdrop-head"><span>Note</span><span class="hint">↑↓ to walk · Esc closes</span></div>
  <div class="mitem is-checked">
    <span class="mi check">check</span>
    <span class="bv sm bv-quarter"></span>
    <span class="mitem-label">Quarter note</span>
    <span class="mitem-key">5</span>
  </div>
  <div class="mdrop-sep"></div>
  <div class="mitem is-danger">…</div>
  <div class="mdrop-note">Items ending in an ellipsis open a dialog.</div>
</div>
```

- Same shell as `.dlg` — `--color-neutral-100`, `--color-neutral-500` border,
  `--shadow-lg` — because it *is* a modal, behaving exactly like a dialog: inert layer,
  captured events, trapped focus, Escape to close, focus returned to the button.
- 276px min-width (`.mdrop`), sized for the longest item label.
- `.mitem` — 30px, 3px transparent left border that becomes accent on hover, with the
  accent tint.
- **The tick column is always present**, as `<span class="mi check">&nbsp;</span>` when
  unchecked, so labels stay aligned whether or not anything is checked.
- `.is-checked` — 600 weight, accent tick. `.is-danger` — accent-2 text, accent-2 tint on
  hover. `.is-disabled` — 45%, no pointer.
- `.mitem-key` shows the hotkey right-aligned. Items ending in `…` open a dialog; items
  with a trailing `.caret-right` open a submenu.
- Keyboard: Up/Down walk items (skipping disabled and separators), letter keys jump by
  hotkey, Enter activates, Escape closes.

### Submenu

`.msub` positions absolutely at `top: 34px; left: calc(100% - 6px)` — overlapping its
parent panel by 6px so the pointer can cross the seam without the parent closing. Add
`.flip-left` (`right: calc(100% - 6px)`) when the parent is within a submenu's width of
the viewport edge; compute this at open time from the trigger's bounding rect.

**Open question for you:** submenus currently open on click. Hover-with-delay is the
other option; the CSS supports both.

### Ribbon

Permanently across the top, 48px, `--color-neutral-100` with a hairline bottom border.
Three button kinds, as specified:

```html
<div class="ribbon-host">
  <div class="ribbon">
    <button class="rbtn is-on"><span class="mi">visibility</span></button>
    <button class="rbtn"><span class="mi">refresh</span></button>
    <span class="ribbon-sep"></span>
    <button class="rbtn"><span class="mi">zoom_in</span></button>
    <button class="rbtn"><span class="mi">zoom_out</span></button>
    <span class="ribbon-sep"></span>
    <button class="rbtn"><span class="mi">play_arrow</span></button>
    <button class="rbtn is-stop"><span class="mi">stop</span></button>
    <span class="ribbon-sep"></span>
    <button class="rbtn has-text">
      <span class="bv bv-sharp"></span>
      <span class="rbtn-label">Key</span>
      <span class="rbtn-val">D</span>
    </button>
    <button class="rbtn has-text">
      <span class="bv bv-metronome"></span><span class="rbtn-label">Tempo</span>
      <span class="rbtn-val">= 96</span>
    </button>
    <button class="rbtn has-text">
      <span class="bv bv-common"></span><span class="rbtn-label">Time</span>
      <span class="rbtn-val">4/4</span>
    </button>
    <span class="ribbon-spacer"></span>
    <button class="rpart">
      <span class="mi sm">groups</span>
      <span class="rpart-label">Full score</span>
      <span class="rpart-count">6 parts</span>
      <span class="caret caret-down caret-lg"></span>
    </button>
  </div>
</div>
```

1. **Icon only** — `.rbtn`, 34px square: visibility, refresh, zoom in, zoom out, play,
   stop. `.is-on` latches (view overlay showing, transport playing) as a solid accent
   fill. `.is-stop` hovers magenta — the one destructive-adjacent transport control.
2. **Icon + text** — `.rbtn.has-text`: a Bravura glyph, a `.rbtn-label`, and a
   `.rbtn-val` showing the current value (Key D, Tempo = 96, Time 4/4), so the bar
   answers the question without being clicked. Each opens its dialog.
3. **Part selection** — `.rpart`: a dropdown *trigger*, not a native `<select>`, because
   its menu is the same `.mdrop` modal the sidebar uses. 140px min-width, right-aligned
   via `.ribbon-spacer` since it belongs to the score rather than the selection. Its
   panel attaches under it with the top corners squared, same as `.sel.is-open`.

`.ribbon-sep` hairlines group them: view/refresh · zoom · transport · signatures.

**`.ribbon-host` must wrap the ribbon.** It sets `container-type: inline-size`, and two
container queries degrade the bar on *its own* width rather than the viewport's: below
800px the text buttons shed label and value; below 660px the part selector goes
icon-only. This matters because the ribbon sits in a column beside the sidebar, so its
width is much less than the viewport's — a viewport media query gets this wrong.

---

## Part 3 — Staff groups (`staff-groups.css`, `staffGroups.vue`)

Reference file: `Staff Groups.dc.html`.

### What changes and why

The current component gives each stave three columns of toggles — Add, Create, Remove —
so the same question is asked three times per stave and each answer is a checkbox that
means "perform an action". The redesign gives each stave **one dropdown whose options are
the four operations**, and gives each group **its own connector dropdown**.

The second move: **groups are drawn, not described.** The connector graphic spans its
staves in a 30px left gutter at the weight it will print, so the shape of the bracketing
is legible without reading a label.

### Markup

```html
<div class="sg-list has-menu">            <!-- .has-menu only while a menu is open -->
  <div class="sg-head"><span>Group</span><span>Stave</span><span>Action</span></div>

  <div class="sg-group">
    <div class="sg-conn sg-bracket" style="top:33px;bottom:0"></div>
    <div class="sg-group-bar">
      <span></span>
      <span class="sg-group-name">Woodwinds<span class="sg-group-count">4 staves</span></span>
      <div class="sel"><span>Bracket</span><span class="caret caret-down caret-lg"></span></div>
    </div>
    <div class="sg-row">
      <span></span>
      <span class="sg-name">
        <span class="sg-num">1</span>
        <span class="bv sm bv-gclef"></span>
        <span class="sg-name-label">Flute</span>
      </span>
      <div class="sg-act"><span class="sg-act-label">Grouped</span><span class="caret caret-down"></span></div>
    </div>
    …
  </div>

  <div class="sg-row is-loose">…</div>    <!-- stave in no group -->
</div>
```

`.sg-head`, `.sg-group-bar` and `.sg-row` share one grid:
`minmax(--sg-gutter, auto) | minmax(0,1fr) | --sg-action` with a 10px gap — so gutter,
name and action align down the whole list including the header.

### Connector graphics

Four values from `SmoSystemGroup.connectorTypes`: brace 0, bracket 1, single 2, double 3.

`.sg-conn` is absolutely positioned in the gutter; the group sets `top` and `bottom` so
it spans exactly its rows (`top: 33px` clears the group bar). Variants:

- `.sg-bracket` — 3px vertical stem with 3px serifs top and bottom, via `::before` and
  `::after`.
- `.sg-brace` — **an SVG mask, not the Bravura glyph.** Bravura's brace sits entirely
  above the baseline and is drawn narrow for the engraver to stretch, so as text it needs
  per-group scale correction and still overflows its box. As a `mask` with
  `preserveAspectRatio='none'`, filled with `currentColor`, it simply fills its group's
  height at any number of staves. Don't revert this to a font glyph.
- `.sg-single` / `.sg-double` — 2px rules, one or two.

All four stretch to their group's height, so the graphic is the same shape at two staves
or twelve. `.sg-swatch` renders any of them at specimen size.

### The per-stave action dropdown

```html
<div class="sg-act">                       <!-- + .is-open .is-disabled -->
  <span class="sg-act-label">Grouped</span>
  <span class="caret caret-down"></span>
</div>
```

26px, 148px column. **The trigger reads the stave's current condition** — "Grouped" /
"Ungrouped" — not a verb, so every row reports its state; the verbs are inside the menu.
Its menu is a `.mdrop`:

| Option | Icon | Maps to |
| --- | --- | --- |
| Add above | `vertical_align_top` | `addToGroupCb` — extend the group above over this stave |
| Add below | `vertical_align_bottom` | `addToGroupCb` — extend the group below |
| Create new group | `add_box` | `createStaffGroupCb` |
| Remove from group | `link_off`, `.is-danger` | `removeFromGroupCb` |

**All four always appear; unavailable ones are `.is-disabled`, never hidden** — so the
row never changes height and each option's position is learnable. Stave 1 ungrouped, for
instance, disables Add above (nothing above to join) and Remove (not in a group).

`.sg-menu` anchors the menu absolutely under its trigger, right-aligned, overlaying the
rows below. Add `.has-menu` to `.sg-list` while it's open — that switches the list to
`overflow: visible` so the menu can escape the list's clip. Its `top` is computed from
the row index; the mockup hard-codes `calc(33px + var(--sg-row) * 2 + 4px)` for row 9, so
compute it live.

### The per-group connector dropdown

One `.sel` per group, on the group's first row in `.sg-group-bar` (accent-tinted,
carrying the group name and stave count). Options: Brace, Bracket, Single line, Double
line → `leftConnector` via `setConnectorCb`.

**Wrap trigger and panel in a `position: relative` div** and position the panel
`top: 100%; left: 0; right: 0`, as with every select in this design.

### Open questions for you

1. **Group names.** The mockup shows Woodwinds / Harp / Strings. `SmoSystemGroup` carries
   `text` and `shortText` — should this dialog edit them, or derive a name from the
   staves it spans? This affects the data model, so decide before building.
2. Should overlapping groups be prevented in the UI, or left to `overlaps()` to reject on
   commit?
3. Nothing here reorders staves. Drag-to-reorder here, or is that the instruments dialog?
4. The trigger reads state ("Grouped"). A bare icon button is tidier but gives no read on
   the row.

---

## Responsive — down to 768px

Each stylesheet ships the breakpoint **twice**: as a real `@media (max-width: 768px)`
block for the app, and as a class (`.dlg-stack`, `.side.is-rail`, `.ribbon.is-compact`)
so the mockups can show the narrow state at desktop width. **Only the media queries
matter for the app** — the classes are a documentation device. (The one exception is the
ribbon, where the container queries do the real work at any viewport width.)

What changes at 768px:

**Dialogs** — width becomes `calc(100vw - 24px)`, max-height `calc(100vh - 24px)` with
internal scroll. `.grow-row` stacks: label above control, 12px and `--color-neutral-700`.
Controls grow 26 → 30px; `.num-field` flexes and the spinner widens to 26px; `.sbtn`
flexes to fill. The submit row becomes full-width buttons in reading order at **44px**,
Remove losing its `margin-left: auto`. **`.grip` is `display: none` — drag is disabled**
and the bar becomes a static title bar. Grouped boxes keep border and legend; only their
internal flow changes.

**Sidebar** — collapses to the 52px icon rail: labels, hotkeys, carets and group headings
hide, and `.mbtn` becomes a single centered track. This is why every button has an icon —
at this width the icon is the whole button.

**Menus** — `.mdrop` goes `calc(100vw - 76px)`, items to 40px, `.msub` becomes static
(inline, not floating).

**Ribbon** — all buttons to 40px icon-only, horizontally scrollable (scrollbar hidden) if
it still overflows.

**Staff groups** — `--sg-action` drops to 40px and `.sg-act` becomes caret-only; rows to
40px; the connector `.sel` moves onto its own line under the group name; `.sg-menu` goes
full width.

Touch targets are 40px in lists and menus and 44px in the submit row. Nothing anywhere
goes below 40px at this breakpoint.

---

## Files in this bundle

| File | What it is |
| --- | --- |
| `broadsheet-tokens.css` | The Broadsheet token sheet. Link first. **Ships.** |
| `dialog-kit.css` | Dialog shell, all four control types, submit row, sections. **Ships.** |
| `menu-kit.css` | Bravura `@font-face` + glyph classes, sidebar, dropdown, ribbon. **Ships.** |
| `staff-groups.css` | The staff-group list, connectors, action trigger. **Ships.** |
| `Dialog Kit.dc.html` | Design reference — controls, three composite dialogs, 768px. |
| `Menu Kit.dc.html` | Design reference — ribbon, sidebar, menus, icon inventory, 768px. |
| `Staff Groups.dc.html` | Design reference — the dialog, connectors, 768px. |
| `fonts/Bravura_1.392.woff` | Copied from `src/styles/fonts/`. Already in the repo. |

The three stylesheets are load-order dependent: `broadsheet-tokens.css`, then
`dialog-kit.css`, then `menu-kit.css` (uses `--dlg-*`), then `staff-groups.css` (uses
both).

Open any `.dc.html` in a browser to see the intended result. Remember the page furniture
around the specimens is scaffolding.

## Assets

Only two, both already available: **Bravura** (in the repo at
`src/styles/fonts/Bravura_1.392.woff`, and loaded at runtime by `application.ts`) and
**Material Symbols Outlined** (Google Fonts; the mockups load it from the CDN — vendor it
if the app must work offline). No images, no raster assets, no SVG files — the brace mask
is a data URI inside `staff-groups.css`, and every caret and connector is CSS.
