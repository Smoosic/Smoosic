// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
/**
 * Pure geometry for the note entry caret: converting between a y position and a staff line.
 * Staff line 1 is the bottom line of the staff and each step of 1 is one staff line, so a
 * space is a half step.  The caller must pass every y in the same coordinate system: either all
 * absolute (measured from the top of the first page, as mouse positions are after conversion to
 * SVG coordinates) or all local to one page.  Mixing them is wrong on every page after the first.
 * No imports, so it can be tested without a DOM.
 * @module /render/sui/staffLineGeometry
 */

/**
 * The staff line (in half steps) at a y position.
 * @param y the y position, in the same coordinate system as `caretTop`
 * @param caretTop the y of the top of the caret box (the top of the highest ledger line position)
 * @param bottomOffset distance from `caretTop` down to the bottom line of the staff's lower ledger area
 * @param lineHeight pixels between staff lines
 * @returns the staff line, to the nearest half step
 */
export function staffLineFromY(y: number, caretTop: number, bottomOffset: number, lineHeight: number): number {
  const relativeY = y - caretTop;
  return Math.round((bottomOffset - relativeY) / (lineHeight / 2)) / 2;
}

/**
 * The y position of a staff line.
 * @param staffLine the staff line, in half steps
 * @param caretTop the y of the top of the caret box
 * @param bottomOffset distance from `caretTop` down to the bottom line of the staff's lower ledger area
 * @param lineHeight pixels between staff lines
 * @returns the y, in the same coordinate system as `caretTop`
 */
export function yFromStaffLine(staffLine: number, caretTop: number, bottomOffset: number, lineHeight: number): number {
  return (bottomOffset - (staffLine * lineHeight)) + caretTop;
}

/**
 * The vertical extent in which the mouse is tracked by the note entry caret.  All y values are in
 * one coordinate system (absolute, from the top of the first page).
 */
export interface TrackingLimitParams {
  /** top of the caret box (the highest ledger position above the staff) */
  caretTop: number,
  /** bottom of the caret box (the lowest ledger position below the staff) */
  caretBottom: number,
  /** top of the staff itself; tracking always covers the staff */
  staffTop: number,
  /** bottom of the staff itself */
  staffBottom: number,
  /** top of the page the staff is on */
  pageTop: number,
  /** bottom of the page the staff is on */
  pageBottom: number,
  /** bottom of the staff above in this system, or of the previous system, if there is one */
  aboveBottom: number | null,
  /** top of the staff below in this system, or of the next system, if there is one */
  belowTop: number | null
}
export interface TrackingLimits {
  top: number,
  bottom: number
}
/**
 * Where to stop tracking the mouse above and below a staff.  The caret allows for ledger lines above
 * and below the staff, but when staves are close together that area overlaps the next staff (or the
 * next system), which makes the notes there hard to select.  So tracking stops at the bottom of the
 * staff above or the previous system (or the top of the page), and at the top of the staff below or the
 * next system (or the bottom of the page), whichever comes first.  It never cuts into the staff itself.
 * @param p the geometry, see {@link TrackingLimitParams}
 */
export function trackingLimits(p: TrackingLimitParams): TrackingLimits {
  let top = Math.max(p.caretTop, p.pageTop);
  if (p.aboveBottom !== null) {
    top = Math.max(top, p.aboveBottom);
  }
  let bottom = Math.min(p.caretBottom, p.pageBottom);
  if (p.belowTop !== null) {
    bottom = Math.min(bottom, p.belowTop);
  }
  return { top: Math.min(top, p.staffTop), bottom: Math.max(bottom, p.staffBottom) };
}
