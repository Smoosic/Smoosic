import { SuiScoreView, updateStaffModifierFunc } from './scoreView';
import { engravingFontType } from '../../smo/data/score';
import { SmoSystemStaffParams } from '../../smo/data/systemStaff';
import { SmoPartInfo } from '../../smo/data/partInfo';
import { SmoMeasure } from '../../smo/data/measure';
import { KeyEvent, SvgBox, Pitch, PitchLetter } from '../../smo/data/common';
import { SmoSystemGroup, SmoPageLayout, SmoGlobalLayout, SmoAudioPlayerSettings, SmoScorePreferences, SmoScoreInfo } from '../../smo/data/scoreModifiers';
import { SmoTextGroup } from '../../smo/data/scoreText';
import { SmoDynamicText, SmoArticulation, SmoOrnament, SmoLyric, SmoArpeggioType, SmoClefChange, SmoTabNote } from '../../smo/data/noteModifiers';
import { SmoTempoText, SmoVolta, SmoMeasureFormat, TimeSignature } from '../../smo/data/measureModifiers';
import { createStaffModifierType, MakeTupletOperation } from '../../smo/xform/operations';
import { BatchSelectionOperation } from '../../smo/xform/operations';
import { FontInfo } from '../../common/vex';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { StaffModifierBase, SmoInstrument, SmoInstrumentParams, SmoStaffTextBracket, SmoTabStave } from '../../smo/data/staffModifiers';
/**
 * MVVM-like operations on the displayed score.
 *
 * All operations that can be performed on a 'live' score go through this
 * module.  It maps the score view to the actual score and makes sure the
 * model and view stay in sync.
 *
 * Because this object operates on the current selections,
 * all operations return promise so applications can wait for the
 * operation to complete and update the selection list.
 * @category SuiRender
 */
export declare class SuiScoreViewOperations extends SuiScoreView {
    /**
     * Add a new text group to the score
     * @param textGroup a new text group
     * @returns
     */
    addTextGroup(textGroup: SmoTextGroup): Promise<void>;
    /**
     * Remove the text group from the score
     * @param textGroup
     * @returns
     */
    removeTextGroup(textGroup: SmoTextGroup): Promise<void>;
    /**
     * UPdate an existing text group.  The original is passed in, because since TG not tied to a musical
     * element, we need to find the one we're updating.
     * @param oldVersion
     * @param newVersion
     * @returns
     */
    updateTextGroup(newVersion: SmoTextGroup): Promise<void>;
    /**
     * load an mxml score remotely, return a promise that
     * completes when the file is loaded
     * @param url where to find the xml file
     * @returns
     */
    loadRemoteXml(url: string): Promise<any>;
    /**
     * load a remote score in SMO format
     * @param url url to find the score
     * @returns
     */
    loadRemoteJson(url: string): Promise<any>;
    /**
     * Load a remote score, return promise when it's been loaded
     * from afar.
     * @param pref
     * @returns
     */
    loadRemoteScore(url: string): Promise<any>;
    updateAudioSettings(pref: SmoAudioPlayerSettings): Promise<void>;
    /**
     * Global settings that control how the score editor behaves
     * @param pref
     * @returns
     */
    updateScorePreferences(pref: SmoScorePreferences): Promise<void>;
    /**
     * Update information about the score, composer etc.
     * @param scoreInfo
     * @returns
     */
    updateScoreInfo(scoreInfo: SmoScoreInfo): Promise<void>;
    addRemoveArpeggio(code: SmoArpeggioType): Promise<void>;
    /**
     * A clef change mid-measure (clefNote)
     * @param clef
     */
    addRemoveClefChange(clef: SmoClefChange): Promise<void>;
    /**
     * Modify the dynamics assoicated with the specific selection
     * @param selection
     * @param dynamic
     * @returns
     */
    addDynamic(selection: SmoSelection, dynamic: SmoDynamicText): Promise<void>;
    /**
     * Remove dynamics from the current selection
     * @param dynamic
     * @returns
     */
    removeDynamic(dynamic: SmoDynamicText): Promise<void>;
    /**
     * we never really delete a note, but we will convert it into a rest and if it's
     * already a rest we will try to hide it.
     * Operates on current selections
     * */
    deleteNote(): Promise<void>;
    /**
    * The lyric editor moves around, so we can't depend on the tracker for the
    * correct selection.  We get it directly from the editor.
    *
    * @param selector - the selector of the note with the lyric to remove
    * @param lyric - a copy of the lyric to remove.  We use the verse, parser to identify it
    * @returns render promise
    */
    removeLyric(selector: SmoSelector, lyric: SmoLyric): Promise<void>;
    /**
     * @param selector where to add or update the lyric
     * @param lyric a copy of the lyric to remove
     * @returns
     */
    addOrUpdateLyric(selector: SmoSelector, lyric: SmoLyric): Promise<void>;
    /**
     * Delete all the notes for the currently selected voice
     * @returns
     */
    depopulateVoice(): Promise<void>;
    /**
     * Change the active voice in a multi-voice measure.
     * @param index
     * @returns
     */
    _changeActiveVoice(index: number): SmoSelection[];
    /**
     * Populate a new voice with default notes
     * @param index the voice to populate
     * @returns
     */
    populateVoice(index: number): Promise<void>;
    swapVoices(voice1: number, voice2: number): Promise<void>;
    /**
     * Assign an instrument to a set of measures
     * @param instrument the instrument to assign to the selections
     * @param selections
     * @returns
     */
    changeInstrument(instrument: SmoInstrument, selections: SmoSelection[]): Promise<void>;
    /**
     * Set the time signature for a selection
     * @param timeSignature actual time signature
     */
    setTimeSignature(timeSignature: TimeSignature): Promise<void>;
    /**
     * Move selected staff up or down in the score.
     * @param index direction to move
     * @returns
     */
    moveStaffUpDown(index: number): Promise<void>;
    /**
     * Update the staff group for a score, which determines how the staves
     * are justified and bracketed
     * @param staffGroup
     */
    addOrUpdateStaffGroup(staffGroup: SmoSystemGroup): Promise<void>;
    removeStaffGroup(staffGroup: SmoSystemGroup): Promise<void>;
    clearSystemGroups(): Promise<void>;
    updateTabStave(tabStave: SmoTabStave): Promise<void>;
    removeTabStave(): Promise<void>;
    /**
     * Update tempo for all or part of the score
     * @param measure the measure with the tempo.  Tempo is measure-wide parameter
     * @param scoreMode if true, update whole score.  Else selections
     * @returns
     */
    updateTempoScore(measure: SmoMeasure, tempo: SmoTempoText, scoreMode: boolean, selectionMode: boolean): Promise<void>;
    updateTabNote(tabNote: SmoTabNote): Promise<void>;
    removeTabNote(): Promise<void>;
    /**
     * 'remove' tempo, which means either setting the bars to the
     * default tempo, or the previously-set tempo.
     * @param scoreMode whether to reset entire score
     */
    removeTempo(measure: SmoMeasure, tempo: SmoTempoText, scoreMode: boolean, selectionMode: boolean): Promise<void>;
    /**
     * Add a grace note to the selected real notes.
     */
    addGraceNote(): Promise<void>;
    /**
     * remove selected grace note
     * @returns
     */
    removeGraceNote(): Promise<void>;
    /**
     * Toggle slash in stem of grace note
     */
    slashGraceNotes(): Promise<void>;
    transposeScore(offset: number): Promise<void>;
    /**
     * transpose selected notes
     * @param offset 1/2 steps
     * @returns
     */
    transposeSelections(offset: number): Promise<void>;
    /**
     * toggle the accidental spelling of the selected notes
     * @returns
     */
    toggleEnharmonic(): Promise<void>;
    /**
     * Toggle cautionary/courtesy accidentals
     */
    toggleCourtesyAccidentals(): Promise<void>;
    /**
     * change the duration of notes for selected, creating more
     * or fewer notes.
     * After the change, reset the selection so it's as close as possible
     * to the original length
     * @param operation
     * @returns
     */
    batchDurationOperation(operation: BatchSelectionOperation): Promise<void>;
    /**
     * Toggle selected modifier on selected notes
     * @param modifier
     * @param ctor parent class constructor (e.g. SmoOrnament)
     * @returns
     */
    toggleArticulation(modifier: string, ctor: string): Promise<void>;
    setArticulation(modifier: SmoArticulation, set: boolean): Promise<void>;
    setOrnament(modifier: SmoOrnament, set: boolean): Promise<void>;
    /**
     * convert non-tuplet not to a tuplet
     * @param params
     */
    makeTuplet(params: MakeTupletOperation): Promise<void>;
    /**
     * Convert selected tuplet to a single (if possible) non-tuplet
     */
    unmakeTuplet(): Promise<void>;
    /**
     * Create a chord by adding an interval to selected note
     * @param interval 1/2 steps
     * @returns
     */
    setInterval(interval: number): Promise<void>;
    /**
     * change the selected chord into a single note
     * @returns
     */
    collapseChord(): Promise<void>;
    /**
     * Toggle chicken-scratches, for jazz improv, comping etc.
     */
    toggleSlash(): Promise<void>;
    /**
     * make selected notes into a rest, or visa-versa
     * @returns
     */
    makeRest(): Promise<void>;
    clearAllBeams(): Promise<void>;
    clearSelectedBeams(): Promise<void>;
    /**
     * toggle the 'end beam' flag for selected notes
     * @returns
     */
    unbeamSelections(): Promise<void>;
    toggleCue(): Promise<void>;
    /**
    * up or down
    * @returns
    */
    toggleBeamDirection(): Promise<void>;
    /**
     * Add the selected notes to a beam group
     */
    beamSelections(): Promise<void>;
    /**
     * change key signature for selected measures
     * @param keySignature vex key signature
     */
    addKeySignature(keySignature: string): Promise<void>;
    /**
     * Sets a pitch from the piano widget.
     * @param pitch {Pitch}
     * @param chordPedal {boolean} - indicates we are adding to a chord
     */
    setPitchPiano(pitch: Pitch, chordPedal: boolean): Promise<void>;
    /**
     * show or hide the piano widget
     * @param value to show it
     */
    showPiano(value: boolean): Promise<void>;
    /**
     * Render a pitch for each letter name-pitch in the string,
     * @param pitches letter names for pitches
     * @returns promise, resolved when all pitches rendered
     * @see setPitch
     */
    setPitchesPromise(pitches: PitchLetter[]): Promise<any>;
    /**
     * Add a pitch to the score at the cursor.  This tries to find the best pitch
     * to match the letter key (F vs F# for instance) based on key and surrounding notes
     * @param letter string
     */
    setPitch(letter: PitchLetter): Promise<void>;
    /**
     * Generic clipboard copy action
     */
    copy(): Promise<void>;
    /**
     * clipboard paste action
     * @returns
     */
    paste(): Promise<void>;
    /**
     * Paste only the chords.
     */
    pasteChords(): Promise<void>;
    /**
     * specify a note head other than the default for the duration
     * @param head
     */
    setNoteHead(head: string): Promise<void>;
    /**
     * Add a volta for selected measures
     */
    addEnding(): Promise<void>;
    /**
     * @param ending volta settings
     * @returns
     */
    updateEnding(ending: SmoVolta): Promise<void>;
    /**
     *
     * @param ending volta to remove
     * @returns
     */
    removeEnding(ending: SmoVolta): Promise<void>;
    /**
     *
     * @param position begin or end
     * @param barline barline type
     * @returns
     */
    setBarline(position: number, barline: number): Promise<void>;
    /**
     *
     * @param position start or end
     * @param symbol coda, etc.
     */
    setRepeatSymbol(position: number, symbol: number): Promise<void>;
    /**
     *  toggle rehearsal mark on first selected measure
     * @returns
     */
    toggleRehearsalMark(): Promise<void>;
    _removeStaffModifier(modifier: StaffModifierBase): void;
    /**
     * Remove selected modifier
     * @param modifier slur, hairpin, etc.
     * @returns
     */
    removeStaffModifier(modifier: StaffModifierBase): Promise<void>;
    /**
     * Change a staff modifier
     * @param original original version
     * @param modifier modified version
     * @returns
     */
    addOrUpdateStaffModifier(original: StaffModifierBase, modifier: StaffModifierBase): Promise<void>;
    lineOperation(op: createStaffModifierType<StaffModifierBase>): void;
    /**
     * Add crescendo to selection
     */
    crescendo(): Promise<void>;
    /**
     * Add crescendo to selection
     */
    crescendoBracket(): Promise<void>;
    /**
     * Add crescendo to selection
     */
    dimenuendo(): Promise<void>;
    /**
     * Add crescendo to selection
     */
    accelerando(): Promise<void>;
    /**
     * Add crescendo to selection
     */
    ritard(): Promise<void>;
    /**
     * diminuendo hairpin
     * @returns
     */
    decrescendo(): Promise<void>;
    removeTextBracket(bracket: SmoStaffTextBracket): Promise<void>;
    addOrReplaceStaffModifier(callback: updateStaffModifierFunc, modifier: StaffModifierBase): Promise<void>;
    addOrReplaceTextBracket(modifier: SmoStaffTextBracket): Promise<void>;
    /**
     * Slur selected notes
     * @returns
     */
    addSlur(): Promise<void>;
    /**
     * tie selected notes
     * @returns
     */
    tie(): Promise<void>;
    updateZoom(zoomFactor: number): Promise<void>;
    /**
     * set global page for score, zoom etc.
     * @param layout global SVG settings
     * @returns
     */
    setGlobalLayout(layout: SmoGlobalLayout): Promise<void>;
    /**
     * Set the layout of a single page
     * @param layout page layout
     * @param pageIndex which page to change
     * @returns
     */
    setPageLayout(layout: SmoPageLayout, pageIndex: number): Promise<void>;
    setPageLayouts(layout: SmoPageLayout, startIndex: number, endIndex: number): Promise<void>;
    /**
     * Update the music font
     * @param family
     * @returns
     */
    setEngravingFontFamily(family: engravingFontType): Promise<void>;
    /**
     * Upate global font used for chord changes
     * @param fontInfo
     * @returns
     */
    setChordFont(fontInfo: FontInfo): Promise<void>;
    /**
     * Update font used for lyrics
     * @param fontInfo
     * @returns
     */
    setLyricFont(fontInfo: FontInfo): Promise<void>;
    /**
     * @param value if false, lyric widths don't affect measure width
     * @returns
     */
    setLyricAdjustWidth(value: boolean): Promise<void>;
    /**
     * delete selected measures
     * @returns
     */
    deleteMeasure(): Promise<void>;
    /**
     * add number of measures, with default notes selections
     * @param append
     * @param numberToAdd
     * @returns
     */
    addMeasures(append: boolean, numberToAdd: number): Promise<void>;
    /**
     * add a single measure before or after selection
     * @param append
     * @returns
     */
    addMeasure(append: boolean): Promise<void>;
    /**
     * remove an entire line of music
     * @returns
     */
    removeStaff(): Promise<void>;
    addStaff(instrument: SmoSystemStaffParams): Promise<void>;
    /**
     * Update part info assumes that the part is currently exposed - that
     * staff 0 is the first staff in the part prior to editing.
     * @param info
     */
    updatePartInfo(info: SmoPartInfo): Promise<void>;
    /**
     * A simpler API for applications to add a new staff to the score.
     * @param params - the instrument, which determines clef, etc.
     * @returns
     */
    addStaffSimple(params: Partial<SmoInstrumentParams>): Promise<void>;
    /**
     * Save the score to local storage.
     */
    quickSave(): void;
    updateRepeatCount(count: number): Promise<any>;
    /**
     * Update the measure formatting parameters for the current selection
     * @param format generic measure formatting parameters
     * @returns
     */
    setMeasureFormat(format: SmoMeasureFormat): Promise<any>;
    /**
     * Remove system breaks from the measure formatting for selected measures
     * @returns
     */
    removeSystemBreaks(): Promise<any>;
    renumberMeasures(measureIndex: number, displayIndex: number): Promise<void>;
    /**
     * Play the music from the starting selection
     * @returns
     */
    playFromSelection(): Promise<void>;
    stopPlayer(): void;
    pausePlayer(): void;
    /**
     * Proxy calls to move the tracker parameters according to the
     * rules of the 'Home' key (depending on shift/ctrl/alt)
     * @param ev
     * @returns
     */
    moveHome(ev: KeyEvent): Promise<any>;
    /**
     * Proxy calls to move the tracker parameters according to the
     * rules of the 'End' key (depending on shift/ctrl/alt)
     * @param ev
     * @returns
     */
    moveEnd(ev: KeyEvent): Promise<any>;
    /**
     * Grow the current selection by one to the left, if possible
     * @param ev
     * @returns
     */
    growSelectionLeft(): Promise<any>;
    /**
     * Grow the current selection by one to the right, if possible
     * @param ev
     * @returns
     */
    growSelectionRight(): Promise<any>;
    /**
     * Select the next tabbable modifier near one of the selected notes
     * @param keyEv
     * @returns
     */
    advanceModifierSelection(keyEv: KeyEvent): Promise<any>;
    /**
     * Select the next entire measure, if possible
     * @returns
     */
    growSelectionRightMeasure(): Promise<any>;
    /**
     * Advance cursor forwards, if possible
     * @param ev
     * @returns
     */
    moveSelectionRight(): Promise<any>;
    /**
     * Advance cursor backwards, if possible
     * @param ev
     * @returns
     */
    moveSelectionLeft(): Promise<any>;
    /**
     * Advance cursor back entire measure, if possible
     * @returns
     */
    moveSelectionLeftMeasure(): Promise<any>;
    /**
     * Advance cursor forward one measure, if possible
     * @returns
     */
    moveSelectionRightMeasure(): Promise<any>;
    /**
     * Move cursor to a higher pitch in the current chord, with wrap
     * @returns
     */
    moveSelectionPitchUp(): Promise<any>;
    /**
     * Move cursor to a lower pitch in the current chord, with wrap
     */
    moveSelectionPitchDown(): Promise<any>;
    /**
     * Move cursor up a staff in the system, if possible
     * @returns
     */
    moveSelectionUp(): Promise<any>;
    /**
     * Move cursor down a staff in the system, if possible
     * @returns
     */
    moveSelectionDown(): Promise<any>;
    /**
     * Set the current suggestions (hover element) as the selection
     * @returns
     */
    selectSuggestion(evData: KeyEvent): Promise<any>;
    /**
     * Find an element at the given box, and make it the current selection
     *  */
    intersectingArtifact(evData: SvgBox): Promise<any>;
}
