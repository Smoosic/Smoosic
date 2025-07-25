// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoSelector, SmoSelection, ModifierTab } from '../../smo/xform/selections';
import { OutlineInfo, SvgHelpers } from './svgHelpers';
import { layoutDebug } from './layoutDebug';
import { SuiScroller } from './scroller';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { SmoMeasure, SmoVoice } from '../../smo/data/measure';
import { PasteBuffer } from '../../smo/xform/copypaste';
import { SmoNoteModifierBase, SmoLyric } from '../../smo/data/noteModifiers';
import { SvgBox } from '../../smo/data/common';
import { SmoNote } from '../../smo/data/note';
import { SmoScore, SmoModifier } from '../../smo/data/score';
import { SvgPageMap } from './svgPageMap';

/**
 * DI information about renderer, so we can notify renderer and it can contain
 * a tracker object
 * @param pageMap {@link SvgPageMap}: SvgPageMap - container of SVG elements and vex renderers
 * @param score {@link SmoScore}
 * @param dirty lets the caller know the display needs update
 * @param passState state machine in rendering part/all of the score
 * @param renderPromise awaits on render all
 * @param addToReplaceQueue adds a measure to the quick update queue
 * @param renderElement a little redundant with svg
 * @category SuiRender
 */
export interface SuiRendererBase {
  pageMap: SvgPageMap,
  score: SmoScore | null,
  dirty: boolean,
  passState: number,
  renderPromise(): Promise<any>,
  addToReplaceQueue(mm: SmoSelection[]): void,
  renderElement: Element
}
/**
 * used to perform highlights in the backgroundd
 * @category SuiRender
 */
export interface HighlightQueue {
  selectionCount: number, deferred: boolean
}
/**
 * Map the notes in the svg so they can respond to events and interact
 * with the mouse/keyboard
 * @category SuiRender
 */
export abstract class SuiMapper {
  renderer: SuiRendererBase;
  scroller: SuiScroller;
  // measure to selector map
  measureNoteMap: Record<string | number, SmoSelection> = {};
  // notes currently selected.  Something is always selected
  // modifiers (text etc.) that have been selected
  modifierSelections: ModifierTab[] = [];
  selections: SmoSelection[] = [];
  // The list of modifiers near the current selection
  localModifiers: ModifierTab[] = [];
  modifierIndex: number = -1;
  modifierSuggestion: ModifierTab | null = null;
  pitchIndex: number = -1;
  // By default, defer highlights for performance.
  deferHighlightMode: boolean = true;
  suggestion: SmoSelection | null = null;
  highlightQueue: HighlightQueue;
  mouseHintBox: OutlineInfo | null = null;
  selectionRects: Record<number, OutlineInfo[]> = {};
  outlines: Record<string, OutlineInfo> = {};
  mapping: boolean = false;
  constructor(renderer: SuiRendererBase, scroller: SuiScroller) {
    // renderer renders the music when it changes
    this.renderer = renderer;
    this.scroller = scroller;
    this.modifierIndex = -1;
    this.localModifiers = [];
    // index if a single pitch of a chord is selected
    this.pitchIndex = -1;
    // the current selection, which is also the copy/paste destination
    this.highlightQueue = { selectionCount: 0, deferred: false };
  }

  abstract highlightSelection(): void;
  abstract _growSelectionRight(hold?: boolean): number;  
  abstract _setModifierAsSuggestion(sel: ModifierTab): void;
  abstract _setArtifactAsSuggestion(sel: SmoSelection): void;
  abstract getIdleTime(): number;
  updateHighlight() {
    const self = this;
    if (this.selections.length === 0) {
      this.highlightQueue.deferred = false;
      this.highlightQueue.selectionCount = 0;
      return;
    }
    if (this.highlightQueue.selectionCount === this.selections.length) {
      this.highlightSelection();
      this.highlightQueue.deferred = false;
    } else {
      this.highlightQueue.selectionCount = this.selections.length;
      setTimeout(() => {
        self.updateHighlight();
      }, 50);
    }
  }
  deferHighlight() {
    if (!this.deferHighlightMode) {
      this.highlightSelection();
    }
    const self = this;
    if (!this.highlightQueue.deferred) {
      this.highlightQueue.deferred = true;
      setTimeout(() => {
        self.updateHighlight();
      }, 50);
    }
  }
  _createLocalModifiersList() {
    this.localModifiers = [];
    let index = 0;
    this.selections.forEach((sel) => {
      sel.note?.getGraceNotes().forEach((gg) => {
        this.localModifiers.push({ index, selection: sel, modifier: gg, box: gg.logicalBox ?? SvgBox.default });
        index += 1;
      });
      sel.note?.getModifiers('SmoDynamicText').forEach((dyn) => {
        this.localModifiers.push({ index, selection: sel, modifier: dyn, box: dyn.logicalBox ?? SvgBox.default });
        index += 1;
      });
      sel.measure.getModifiersByType('SmoVolta').forEach((volta) => {
        this.localModifiers.push({ index, selection: sel, modifier: volta, box: volta.logicalBox ?? SvgBox.default });
        index += 1;
      });
      sel.measure.getModifiersByType('SmoTempoText').forEach((tempo) => {
        this.localModifiers.push({ index, selection: sel, modifier: tempo, box: tempo.logicalBox ?? SvgBox.default });
        index += 1;
      });
      sel.staff.renderableModifiers.forEach((mod) => {
        if (SmoSelector.gteq(sel.selector, mod.startSelector) &&
          SmoSelector.lteq(sel.selector, mod.endSelector) && mod.logicalBox)  {
          const exists = this.localModifiers.find((mm) => mm.modifier.ctor === mod.ctor);
          if (!exists) {
            this.localModifiers.push({ index, selection: sel, modifier: mod, box: mod.logicalBox });
            index += 1;
          }
        }
      });
    });
  }
  /**
   * When a modifier is selected graphically, update the selection list
   * and create a local modifier list
   * @param modifierTabs 
   */
  createLocalModifiersFromModifierTabs(modifierTabs: ModifierTab[]) {
    const selections: SmoSelection[] = [];
    const modMap: Record<string, boolean> = {};
    modifierTabs.forEach((mt) => {
      if (mt.selection) {
        const key = SmoSelector.getNoteKey(mt.selection.selector);
        if (!modMap[key]) {
          selections.push(mt.selection);
          modMap[key] = true;
        }
      }
    });
    if (selections.length) {
      this.selections = selections;
      this._createLocalModifiersList();
      this.deferHighlight();
    }
  }
  removeModifierSelectionBox() {
    if (this.outlines['staffModifier'] && this.outlines['staffModifier'].element) {
      this.outlines['staffModifier'].element.remove();
      this.outlines['staffModifier'].element = undefined;
    }
  }
  // used by remove dialogs to clear removed thing
  clearModifierSelections() {
    this.modifierSelections = [];
    this._createLocalModifiersList();
    this.modifierIndex = -1;
    this.removeModifierSelectionBox();
  }
  // ### loadScore
  // We are loading a new score.  clear the maps so we can rebuild them after
  // rendering
  loadScore() {
    this.measureNoteMap = {};
    this.clearModifierSelections();
    this.selections = [];
    this.highlightQueue = { selectionCount: 0, deferred: false };
  }

  // ### _clearMeasureArtifacts
  // clear the measure from the measure and note maps so we can rebuild it.
  clearMeasureMap(measure: SmoMeasure) {
    const selector = { staff: measure.measureNumber.staffId, measure: measure.measureNumber.measureIndex, voice: 0, tick: 0, pitches: [] };

    // Unselect selections in this measure so we can reselect them when re-tracked
    const ar: SmoSelection[] = [];
    this.selections.forEach((selection) => {
      if (selection.selector.staff !== selector.staff || selection.selector.measure !== selector.measure) {
        ar.push(selection);
      }
    });
    this.selections = ar;
  }

  _copySelectionsByMeasure(staffIndex: number, measureIndex: number) {
    const rv = this.selections.filter((sel) => sel.selector.staff === staffIndex && sel.selector.measure === measureIndex);
    const ticks = rv.length < 1 ? 0 : rv.map((sel) => (sel.note as SmoNote).tickCount).reduce((a, b) => a + b);
    const selectors: SmoSelector[] = [];
    rv.forEach((sel) => {
      const nsel = JSON.parse(JSON.stringify(sel.selector));
      if (!nsel.pitches) {
        nsel.pitches = [];
      }
      selectors.push(nsel);
    });
    return { ticks, selectors };
  }
  deleteMeasure(selection: SmoSelection) {
    const selCopy = this._copySelectionsByMeasure(selection.selector.staff, selection.selector.measure)
      .selectors;
    this.clearMeasureMap(selection.measure);
    if (selCopy.length) {
      selCopy.forEach((selector) => {
        const nsel = JSON.parse(JSON.stringify(selector));
        if (selector.measure === 0) {
          nsel.measure += 1;
        } else {
          nsel.measure -= 1;
        }
        this.selections.push(this._getClosestTick(nsel));
      });
    }
  }
  _updateNoteModifier(selection: SmoSelection, modMap: Record<string, boolean>, modifier: SmoNoteModifierBase, ix: number) {
    if (!modMap[modifier.attrs.id] && modifier.logicalBox) {
      this.renderer.pageMap.addModifierTab(
        {
          modifier,
          selection,
          box: modifier.logicalBox,
          index: ix
        }
      );
      ix += 1;
      const context = this.renderer.pageMap.getRendererFromModifier(modifier);
      modMap[modifier.attrs.id] = true;
    }
    return ix;
  }

  _updateModifiers() {
    let ix = 0;
    const modMap: Record<string, boolean> = {};
    if (!this.renderer.score) {
      return;
    }
    this.renderer.score.textGroups.forEach((modifier) => {
      if (!modMap[modifier.attrs.id] && modifier.logicalBox) {
        this.renderer.pageMap.addModifierTab({
          modifier,
          selection: null,
          box: modifier.logicalBox,
          index: ix
        });
        ix += 1;
      }
    });
    const keys = Object.keys(this.measureNoteMap);    
    keys.forEach((selKey) => {
      const selection = this.measureNoteMap[selKey];
      selection.staff.renderableModifiers.forEach((modifier) => {
        if (SmoSelector.contains(selection.selector, modifier.startSelector, modifier.endSelector)) {
          if (!modMap[modifier.attrs.id]) {
            if (modifier.logicalBox) {
              this.renderer.pageMap.addModifierTab({
                modifier,
                selection,
                box: modifier.logicalBox,
                index: ix
              });
              ix += 1;
              modMap[modifier.attrs.id] = true;
            }
          }
        }
      });
      selection.measure.modifiers.forEach((modifier) => {
        if (modifier.attrs.id
          && !modMap[modifier.attrs.id]
          && modifier.logicalBox) {
          this.renderer.pageMap.addModifierTab({
            modifier,
            selection,
            box: SvgHelpers.smoBox(modifier.logicalBox),
            index: ix
          });
          ix += 1;
          modMap[modifier.attrs.id] = true;
        }
      });
      selection.note?.textModifiers.forEach((modifier) => {
        if (modifier.logicalBox) {
          ix = this._updateNoteModifier(selection, modMap, modifier, ix);
        }
      });

      selection.note?.graceNotes.forEach((modifier) => {
        ix = this._updateNoteModifier(selection, modMap, modifier, ix);
      });
    });
  }
  // ### _getClosestTick
  // given a musical selector, find the note artifact that is closest to it,
  // if an exact match is not available
  _getClosestTick(selector: SmoSelector): SmoSelection {
    let tickKey: string | undefined = '';
    const measureKey = Object.keys(this.measureNoteMap).find((k) =>
      SmoSelector.sameMeasure(this.measureNoteMap[k].selector, selector)
        && this.measureNoteMap[k].selector.tick === 0);
    tickKey = Object.keys(this.measureNoteMap).find((k) =>
      SmoSelector.sameNote(this.measureNoteMap[k].selector, selector));
    const firstObj = this.measureNoteMap[Object.keys(this.measureNoteMap)[0]];

    if (tickKey) {
      return this.measureNoteMap[tickKey];
    }
    if (measureKey) {
      return this.measureNoteMap[measureKey];
    }
    return firstObj;
  }

  // ### _setModifierBoxes
  // Create the DOM modifiers for the lyrics and other modifiers
  _setModifierBoxes(measure: SmoMeasure) {
    const context = this.renderer.pageMap.getRenderer(measure.svg.logicalBox);
    measure.voices.forEach((voice: SmoVoice) => {
      voice.notes.forEach((smoNote: SmoNote) =>  {
        if (context) {
          const el = context.svg.getElementById(smoNote.renderId as string);
           if (el) {
            SvgHelpers.updateArtifactBox(context, (el as any), smoNote);
            // TODO: fix this, only works on the first line.
            smoNote.getModifiers('SmoLyric').forEach((lyrict: SmoNoteModifierBase) => {
              const lyric: SmoLyric = lyrict as SmoLyric;
              if (lyric.getText().length || lyric.isHyphenated()) {
                const lyricElement = context.svg.getElementById('vf-' + lyric.attrs.id) as SVGSVGElement;
                if (lyricElement) {
                  SvgHelpers.updateArtifactBox(context, lyricElement, lyric as any);
                }
              }
            });
          }
          smoNote.graceNotes.forEach((g) => {
            if (g.element) {
            }
            var gel = context.svg.getElementById('vf-' + g.renderId) as SVGSVGElement;
            SvgHelpers.updateArtifactBox(context, gel, g);
          });
          smoNote.textModifiers.forEach((modifier) => {
            if (modifier.logicalBox && modifier.element) {
              SvgHelpers.updateArtifactBox(context, modifier.element, modifier as any);
            }
          });
        }
      });
    });
  }

  /**
   * returns true of the selections are adjacent
   * @param s1 a selections
   * @param s2 another election
   * @returns 
   */
  isAdjacentSelection(s1: SmoSelection, s2: SmoSelection) {
    if (!this.renderer.score) {
      return false;
    }
    const nextSel = SmoSelection.advanceTicks(this.renderer.score, s1, 1);
    if (!nextSel) {
      return false;
    }
    return SmoSelector.eq(nextSel.selector, s2.selector);
  }
  areSelectionsAdjacent() {
    let selectionIx = 0;
    for (selectionIx = 0; this.selections.length > 1 && selectionIx < this.selections.length - 1; ++selectionIx) {
      if (!this.isAdjacentSelection(this.selections[selectionIx], this.selections[selectionIx + 1])) {
        return false;
      }
    }
    return true;    
  }

  /**
   * This is the logic that stores the screen location of music after it's rendered
   */
  mapMeasure(staff: SmoSystemStaff, measure: SmoMeasure, printing: boolean) {
    let voiceIx = 0;
    let selectedTicks = 0;

    // We try to restore block selections. If all the selections in this block are not adjacent, only restore individual selections
    // if possible
    let adjacentSels = this.areSelectionsAdjacent();
    const lastResortSelection: SmoSelection[] = [];
    let selectionChanged = false;
    let vix = 0;
    let replacedSelectors = 0;
    if (!measure.svg.logicalBox) {
      return;
    }
    this._setModifierBoxes(measure);
    const timestamp = new Date().valueOf();
    // Keep track of any current selections in this measure, we will try to restore them.
    const sels = this._copySelectionsByMeasure(staff.staffId, measure.measureNumber.measureIndex);
    this.clearMeasureMap(measure);
    if (sels.selectors.length) {
      vix = sels.selectors[0].voice;
    }
    sels.selectors.forEach((sel) => {
      sel.voice = vix;
    });

    measure.voices.forEach((voice) => {
      let tick = 0;
      voice.notes.forEach((note) => {
        const selector = {
          staff: staff.staffId,
          measure: measure.measureNumber.measureIndex,
          voice: voiceIx,
          tick,
          pitches: []
        };
        if (measure.repeatSymbol) {
          // Some measures have a symbol that replaces the notes.  This allows us to select
          // the measure
          const x = measure.svg.logicalBox.x + (measure.svg.logicalBox.width / voice.notes.length) * tick;
          const width = measure.svg.logicalBox.width / voice.notes.length;
          note.logicalBox = { x, y: measure.svg.logicalBox.y, width, height: measure.svg.logicalBox.height };
        }
        // create a selection for the newly rendered note
        const selection = new SmoSelection({
          selector,
          _staff: staff,
          _measure: measure,
          _note: note,
          _pitches: [],
          box: SvgHelpers.smoBox(SvgHelpers.smoBox(note.logicalBox)),
          type: 'rendered'
        });
        // and add it to the map
        this._updateMeasureNoteMap(selection, printing);

        // If this note is the same location as something that was selected, reselect it
        if (replacedSelectors < sels.selectors.length && selection.selector.tick === sels.selectors[replacedSelectors].tick &&
          selection.selector.voice === vix) {
          this.selections.push(selection);
          // Reselect any pitches.
          if (sels.selectors[replacedSelectors].pitches.length > 0) {
            sels.selectors[replacedSelectors].pitches.forEach((pitchIx) => {
              if (selection.note && selection.note.pitches.length > pitchIx) {
                selection.selector.pitches.push(pitchIx);
              }
            });
          }
          const note = selection.note as SmoNote;
          selectedTicks += note.tickCount;
          replacedSelectors += 1;
          selectionChanged = true;
        } else if (adjacentSels && selectedTicks > 0 && selectedTicks < sels.ticks && selection.selector.voice === vix) {
          // try to select the same length of music as was previously selected.  So a 1/4 to 2 1/8, both
          // are selected
          replacedSelectors += 1;
          this.selections.push(selection);
          selectedTicks += note.tickCount;
        } else if (this.selections.length === 0 && sels.selectors.length === 0 && lastResortSelection.length === 0) {
          lastResortSelection.push(selection);
        }
        tick += 1;
      });
      voiceIx += 1;
    });
    // We deleted all the notes that were selected, select something else
    if (this.selections.length === 0) {
      selectionChanged = true;
      this.selections = lastResortSelection;
    }
    // If there were selections on this measure, highlight them.
    if (selectionChanged) {
      this.deferHighlight();
    }
    layoutDebug.setTimestamp(layoutDebug.codeRegions.MAP, new Date().valueOf() - timestamp);
  }

  _getTicksFromSelections(): number {
    let rv = 0;
    this.selections.forEach((sel) => {
      if (sel.note) {
        rv += sel.note.tickCount;
      }
    });
    return rv;
  }
  _copySelections(): SmoSelector[] {
    const rv: SmoSelector[] = [];
    this.selections.forEach((sel) => {
      rv.push(sel.selector);
    });
    return rv;
  }
  // ### getExtremeSelection
  // Get the rightmost (1) or leftmost (-1) selection
  getExtremeSelection(sign: number): SmoSelection {
    let i = 0;
    let rv = this.selections[0];
    for (i = 1; i < this.selections.length; ++i) {
      const sa = this.selections[i].selector;
      if (sa.measure * sign > rv.selector.measure * sign) {
        rv = this.selections[i];
      } else if (sa.measure === rv.selector.measure && sa.tick * sign > rv.selector.tick * sign) {
        rv = this.selections[i];
      }
    }
    return rv;
  }
  _selectClosest(selector: SmoSelector) {
    var artifact = this._getClosestTick(selector);
    if (!artifact) {
      return;
    }
    if (this.selections.find((sel) => JSON.stringify(sel.selector)
      === JSON.stringify(artifact.selector))) {
      return;
    }
    const note = artifact.note as SmoNote;
    if (selector.pitches && selector.pitches.length && selector.pitches.length <= note.pitches.length) {
      // If the old selection had only a single pitch, try to recreate that.
      artifact.selector.pitches = JSON.parse(JSON.stringify(selector.pitches));
    }
    this.selections.push(artifact);
  }
  // ### updateMap
  // This should be called after rendering the score.  It updates the score to
  // graphics map and selects the first object.
  updateMap() {
    const ts = new Date().valueOf();
    this.mapping = true;
    let tickSelected = 0;
    const selCopy = this._copySelections();
    const ticksSelectedCopy = this._getTicksFromSelections();
    const firstSelection = this.getExtremeSelection(-1);
    this._updateModifiers();

    // Try to restore selection.  If there were none, just select the fist
    // thing in the score
    const firstKey = SmoSelector.getNoteKey(SmoSelector.default);
    if (!selCopy.length && this.renderer.score) {
    // If there is nothing rendered, don't update tracker
    if (typeof(this.measureNoteMap[firstKey]) !== 'undefined' && !firstSelection)
      this.selections = [this.measureNoteMap[firstKey]];
    }  else if (this.areSelectionsAdjacent() && this.selections.length > 1) {
      // If there are adjacent selections, restore selections to the ticks that are in the score now
      if (!firstSelection) {
        layoutDebug.setTimestamp(layoutDebug.codeRegions.UPDATE_MAP, new Date().valueOf() - ts);
        return;
      }
      this.selections = [];
      this._selectClosest(firstSelection.selector);
      const first = this.selections[0];
      tickSelected = (first.note as SmoNote).tickCount ??  0;
      while (tickSelected < ticksSelectedCopy && first) {
        let delta: number = this._growSelectionRight(true);
        if (!delta)  {
          break;
        }
        tickSelected += delta;
      }
    }
    this.deferHighlight();
    this._createLocalModifiersList();
    this.mapping = false;
    layoutDebug.setTimestamp(layoutDebug.codeRegions.UPDATE_MAP, new Date().valueOf() - ts);
  }
  createMousePositionBox(logicalBox: SvgBox) {
    const pageMap = this.renderer.pageMap;
    const page = pageMap.getRendererFromPoint(logicalBox);
    if (page) {
      const cof = (pageMap.zoomScale * pageMap.renderScale);  
      const debugBox = SvgHelpers.smoBox(logicalBox);
      debugBox.y -= (page.box.y + 5 / cof);
      debugBox.x -= (page.box.x + 5 / cof)
      debugBox.width = 10 / cof;
      debugBox.height = 10 / cof;
      if (!this.mouseHintBox) {
        this.mouseHintBox =  {
          stroke: SvgPageMap.strokes['debug-mouse-box'],
          classes: 'hide-print',
          box: debugBox,
          scroll: { x: 0, y: 0 },
          context: page,
          timeOff: 1000
        };
      }
      this.mouseHintBox.context = page;
      this.mouseHintBox.box = debugBox;
      SvgHelpers.outlineRect(this.mouseHintBox);
    }            
  }
  eraseMousePositionBox() {
    if (this.mouseHintBox && this.mouseHintBox.element) {
      this.mouseHintBox.element.remove();
      this.mouseHintBox.element = undefined;
    }
  }
  /**
   * Find any musical elements at the supplied screen coordinates and set them as the selection
   * @param bb 
   * @returns 
   */
  intersectingArtifact(bb: SvgBox) {
    const scrollState = this.scroller.scrollState;
    bb = SvgHelpers.boxPoints(bb.x + scrollState.x, bb.y + scrollState.y, bb.width ? bb.width : 1, bb.height ? bb.height : 1);
    const logicalBox = this.renderer.pageMap.clientToSvg(bb);
    const { selections, page } = this.renderer.pageMap.findArtifact(logicalBox);
    if (page) {
      const artifacts = selections;
      // const artifacts = SvgHelpers.findIntersectingArtifactFromMap(bb, this.measureNoteMap, SvgHelpers.smoBox(this.scroller.scrollState.scroll));
      // TODO: handle overlapping suggestions
      if (!artifacts.length) {
        const sel = this.renderer.pageMap.findModifierTabs(logicalBox);
        if (sel.length) {
          this._setModifierAsSuggestion(sel[0]);
          this.eraseMousePositionBox();
        } else {
          // no intersection, show mouse hint          
          this.createMousePositionBox(logicalBox);
        }
        return;
      }
      const artifact = artifacts[0];
      this.eraseMousePositionBox();
      this._setArtifactAsSuggestion(artifact);
    }
  }
  _getRectangleChain(selection: SmoSelection) {
    const rv: number[] = [];
    if (!selection.note) {
      return rv;
    }
    rv.push(selection.measure.svg.pageIndex);
    rv.push(selection.measure.svg.lineIndex);
    rv.push(selection.measure.measureNumber.measureIndex);
    return rv;
  }
  _updateMeasureNoteMap(artifact: SmoSelection, printing: boolean) {
    const note = artifact.note as SmoNote;
    const noteKey = SmoSelector.getNoteKey(artifact.selector);
    const activeVoice = artifact.measure.getActiveVoice();
    // not has not been drawn yet.
    if ((!artifact.box) || (!artifact.measure.svg.logicalBox)) {
      return;
    }
    this.measureNoteMap[noteKey] = artifact;
    this.renderer.pageMap.addArtifact(artifact);
    artifact.scrollBox = { x: artifact.box.x,
      y: artifact.measure.svg.logicalBox.y };
  }
}
