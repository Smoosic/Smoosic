<sub>[Github site](https://github.com/smoosic) | [change notes](https://smoosic.github.io//Smoosic/changes.html) | [application](https://smoosic.github.io//Smoosic/release/html/smoosic.html)<sub> 


## 11-24-2026
Preserve music when changing the time signature.

* The **Time Signature** dialog no longer changes the score while it is open.  Editing the time signature, the display options, **Apply To** or the new **Preserve music** box only collects your choices; they are applied together when you click **OK**, as one undo step.  Cancel leaves the score untouched.  Clicking OK when the measures already have that time signature does nothing.
* **Preserve music** is ticked by default.  The music in the measures you chose is laid out again in the new time signature, with the same notes in the same order, and measures are added after them if the new time signature holds less time.  Two measures of 4/4 changed to 3/4 become three measures of 3/4, with a rest at the end of the last one.  Measures are never removed: if fewer are needed, the spare ones are filled with rests.  This works the same in every staff, so the staves stay lined up.
* A note that crosses a new bar line is split into tied notes, and a rest is split into rests.  Anything attached to the note (dynamics, lyrics, chords, articulations and so on) stays on the first part.  A tuplet is kept whole: if it does not fit in what is left of a measure, the rest of the measure is filled with rests and the tuplet starts the next one.  Slurs, ties and hairpins stay on the same notes.  Hand-placed beaming in the changed measures is reset to automatic.  The measures after the ones you changed keep their own time signature and music.
* A time signature with several parts, such as 3/4+2/4, alternates between them from measure to measure, and the music fills each measure to its own length.
* **Untick Preserve music** for the old behavior: the new time signature is applied to the measures in place, the music that fits is kept, and the rest is dropped.  Changing only the display options, or choosing a time signature with the same length (2/2 for 4/4), never moves any music.
* For people using Smoosic as a library: `SmoOperation.rebarMeasures` (and `rebarMeasures` in `smo/xform/rebar`) re-bars a range of measures, `SmoOperation.timeSignatureChanges` and `timeSignatureKeepsLength` read what a change would do, `timeSignatureRange` finds the measures for Apply To, and `SuiScoreViewOperations.setTimeSignature` takes an optional second argument `{ applyTo, preserveMusic }`.  Called with one argument it works as before.  `SmoScore.addMeasure` takes an optional second argument, the measure the new one copies its settings from.

## 11-16-2026
Delete Special.

* The **Edit** menu has a new **Delete Special...** command, next to Paste Special.  It opens a dialog with a checkbox for each kind of marking you can remove from the selected notes: **Dynamics, Lyrics, Annotations, Chords, Articulations, Ornaments, Grace Notes, Arpeggios and Microtones**.  Nothing is ticked at first.  Tick the kinds you want and confirm, and they are removed from every selected note.  The notes' pitches and rhythms are not changed, and neither are the kinds you did not tick.
* Lyrics, annotations and chord symbols are separate choices: removing one never removes another.  **Lyrics** removes every verse.  **Microtones** removes the microtones but keeps the pitches.
* It is one undo step.  If nothing is ticked, or the selected notes have none of the ticked kinds, nothing happens and no undo step is made.
* For people using Smoosic as a library: `SmoOperation.deleteNoteAttributes`, `SmoOperation.countNoteAttributes` and `SmoOperation.deleteAttributeKinds` work on selections, `SuiScoreViewOperations.deleteNoteAttributes` does it on the current selection as one undo step, and `SuiDeleteSpecialDialog` is the dialog.

## 11-15-2026
Dynamics dialog: font size, and the old dialog is removed.

* The **Dynamics** dialog has a new **Font Size** field, from 1 to 99.  The marking is redrawn as you change it, on every selected note.  Cancel puts the size back, like the other fields.  Scores saved before this open with the same size as before (30).
* For people using Smoosic as a library: the old `SuiDynamicModifierDialog` and `SuiDynamicDialogAdapter` classes are removed.  The dialog people use is `SuiDynamicModifierDialogVue`, and `SuiModifierDialogFactory` still opens it for a `SmoDynamicText`.  `SmoDynamicText` has `minFontSize`, `maxFontSize` and `isValidFontSize()`.

## 11-9-2026
Fill Measures.

* The **Measure** menu has a new **Fill Measures** submenu that replaces the selected measures with rests.  **This removes all the notes and voices in those measures**, and the slurs, ties, hairpins and text that were attached to them.  The measure's time signature, key, clef, tempo, barlines, endings and other settings are kept.  It is one undo step.
* **Whole Rest** uses the largest rest that fits: a whole rest in 4/4, a dotted half rest in 3/4 and 6/8, a double-dotted half rest in 7/8.  When no single rest fits, it adds the next largest until the measure is full, so 5/8 is a half rest and an eighth rest.
* **Beats** uses a rest for each beat: quarter rests in 4/4, 2/4 and 3/4, and dotted quarter rests in 6/8, 9/8 and 12/8.  In meters like 5/8 and 7/8 the last rest is the largest that fits what is left.
* **Eighth Rests** uses eighth rests, and a smaller rest at the end if less than an eighth is left (5/16), so a measure is never left short.
* A pickup measure keeps its length, and each selected measure is filled for its own time signature.
* For people using Smoosic as a library: `SmoOperation.fillMeasures` and `SuiScoreViewOperations.fillMeasures` do the fill, and `fillRestDurations` in `smo/xform/measureFill` works out the rests.

## 11-8-2026
Beam groups for each measure, and dotted notes beam together.

* The **Beams** menu has a new **Beam Groups** command.  Use **Add group** (+) to add a beam group for each part of the measure, and set each one from 1 to 4: for a measure of 5/8 add two groups and set them to 3 and 2.  Each number is the longest beam group, in eighth notes (sixteenth notes in x/16 time).  The first number is used for the first beam group, the second for the second group, and so on.  If the measure has more groups than numbers the list starts over, so `3` in 12/8 gives four groups of three and `3, 2` in 10/8 gives 3 + 2 + 3 + 2.  Leave it empty to use the default for the meter.
* Choose where it applies: **Selected measures** or **Whole score**.  Applying a grouping replaces any hand-placed beams in those measures.  Beam Selections in a measure with a grouping keeps the beam you make across the group boundaries, so you can beam the last three notes of a 5/8 measure grouped 3 + 2 and get 2 + 3.
* The **Beams** menu is reorganized.  **Quick Beam** is a submenu with **Beam Selections**, **Unbeam Selections** and a new **Autobeam Selections**, which removes any hand-placed beam breaks and joins from the selected notes so they beam automatically (by the measure's beam groups, if it has them).  **Stem Direction** is a submenu with **Stems Up**, **Stems Down** and **Stems Auto**, replacing the single choice that stepped through the three.  The keys are unchanged, so Shift-B still steps through up, down and auto.
* Measures with no grouping beam exactly as before, and scores saved before this open unchanged.  The score-wide default beam length in the preferences is still used for those measures.
* In duple time, groups of notes that include a dotted note, such as dotted eighth and sixteenth, or double-dotted eighth and thirty-second, now beam together across the beat, as far as half a measure.  Runs of plain sixteenths still beam by the beat.
* For people using Smoosic as a library: the grouping is a measure modifier, `SmoBeamPreferences` (a list `groups`), set with `SmoMeasure.setBeamGroups()` and read with `getBeamGroups()`.  `SmoOperation.setBeamGroups` and `setAllBeamGroups` set it for selections or for the whole score, and `SuiScoreViewOperations.setBeamGroups` does so as one undo step.  The new modifier is in `tools/smoosic-schema.json`; the separate SmoSchema repository needs it too.

## 11-6-2026
Create Part dialog fixes.

* **Staff Location** now counts from 1 and goes up to one more than the number of staves in the score.  1 puts the new part first and the largest value puts it after the last staff, which is where it starts.  Before, the largest value could not be reached.
* A new part is never put inside a part that has two staves.  If the location is between a part's two staves, the new part goes after it.
* The dialog is titled **Create Part** and has **Name** and **Abbreviation** fields.  If you leave Name empty, the part is named for the instrument you chose, which is shown in the field as you change the instrument.
* Parts made with the dialog keep their text groups (Preserve Text Groups is on).  The default for parts made any other way is unchanged.
* A part with two staves is now created as one undo step, and its two staves are properly linked as one part.
* Putting a staff above others used to leave slurs, hairpins, brackets, groups and instrument settings of the staves below it pointing at the wrong staves.  They now follow their staves.  For people using Smoosic as a library: `SmoScore.addStaff` shifts these when it inserts above existing staves, and `SmoOperation.addPart` and `SuiScoreViewOperations.createPart` create a part at a location.

## 11-2-2026
Fix a crash in the Time Signature dialog.

* The alternate display string updated the score on every keystroke, so a half-typed value such as `3/` was drawn and crashed the renderer.  The dialog now waits until the string is a valid time signature, or empty.
* A display string must look like `3/4` or `3/8+2/4`.  `SmoTimeSignature.displayString` now reads as the empty string for anything else, so a bad value in a file can't crash the renderer either.

## 11-1-2026
Autosave and Recovery.

* While you work, Smoosic now keeps a rolling set of snapshots of the whole score in the browser's local storage.  The first change after a snapshot starts a timer, and when it runs out a new snapshot is taken.  A score that hasn't changed isn't snapshotted again, and quick edits make one snapshot, not many.  The oldest snapshots are dropped to stay within the number you choose, and if the browser runs out of room.  Quick Save is unchanged.
* The File menu has a new **Recovery** command.  It lists the snapshots, newest first, with the date, time and name of the score.  Pick one to load it.  Snapshots are not deleted by recovering, so you can try another.  If the open score has unsaved changes you are asked about them first, and the recovered score counts as unsaved until you save it to a file.
* Smoosic Preferences has a new **Autosave** section: minutes between autosaves (5 to 60, default 10) and autosaves to keep (1 to 20, default 10).  They are saved with the score as `autosaveInterval` and `autosaveCount` in the score preferences.  Scores saved before this opened with the defaults.
* The snapshots are shared by every score opened in the browser, so the count limits all of them together.
* For people using Smoosic as a library: `SmoScorePreferences` has the two new fields, and `SuiScoreView` has `listSnapshots()` and `recoverSnapshot(id)`.  The two new properties are in `tools/smoosic-schema.json`; the separate SmoSchema repository needs them too.

## 10-31-2026
Paste Special.

* The Edit menu has a new **Paste Special...** command, which replaces **Paste Chords**.  After a Copy, it opens a dialog where you choose which of the things attached to the copied notes to paste: dynamics, lyrics, annotations, chords, articulations and ornaments.  Only the kinds you choose are pasted.  Pitches, rhythms and everything else on the destination notes are left alone, so you can move these markings to another part, or another place in the same part.
* The dialog can either replace the markings the destination notes already have for the chosen kinds, or add to them.  In both cases a dynamic, or a lyric of the same verse, is never doubled.
* The copied and destination notes are lined up by elapsed time, the same way Paste Chords did.  With the same rhythm, that is note for note.  Chords are spelled for the destination if it is a transposing instrument; the other kinds are pasted as they are.
* For people using Smoosic as a library: `PasteBuffer.pasteChords` and the view's `pasteChords` are gone.  Use `pasteAttributes({ kinds: ['chords'], mode: 'replace' })`.  Unlike Paste Chords, replace mode also clears a destination note's chords when the copied note has none.
* `SmoNote.removeAllAnnotations` used to remove every lyric and chord as well as the annotations.  It now removes only annotations.

## 10-30-2026
Compressed score files.

* Scores now save as `.smz` (Smoosic zipped), a zip archive holding the complete score.  The file is much smaller than the `.json` we saved before.  The key-abbreviation dictionary is no longer used for new files, since compression does a better job.
* Open accepts `.smz` as well as `.json`.  Older `.json` scores, in the abbreviated form or the full 'validation' form, open as before.  A file is recognized by its contents, so a renamed file still opens.
* The 'Validation (large)' save option is unchanged: plain, complete, uncompressed `.json`.
* If a file can't be opened, a message says why and the current score is left alone.
* Scores saved as `.smz` can't be opened by older versions of Smoosic.  Use the validation format to share a plain text file.

## 10-27-2026
Better enharmonic spelling when transposing.

* Transposing, pasting into a different key, and choosing a default spelling for a note that is not in the key no longer use a table of spellings.  A note's *distance* from a key is how many sharps or flats you would have to add to the key signature to include it (from C, Bb is 1 flat away and A# is 5 sharps away).
* When notes are pasted or transposed to another key, they keep their distance from the key.  A C# in C becomes D# in D, an A# becomes B#, and an E natural in Eb becomes G# in G.
* A note that is not in the key is spelled with the fewest accidentals added to the key, and as a flat if the sharp and flat are equally far.  In C major, C# is now the default spelling instead of Db.
* Transpose Score now changes the key signature to match the interval, and also transposes grace notes.  Previously the key signature stayed the same.

## 10-8-2026
All new text formatting, new menu and dialog look-and-feel.

* Score-level text has never worked well in previous versios.  It was difficult to place, scale and update.  I incorporated a dedicated text editor (tiptap), and automated some landmark-type of text such as titles, automatic rescaling now works.
* Removed 'attached' score text, which becomes problematic as scores change and measures are added and removed, scales changed etc.  Replaced with 'annotations' which are note-level features implemented in vex-flow.
* Redesigned UI dialogs and menus, with help from Claude.

## Changes to Smoosic
This is a completely new Github repository dedicated to Smoosic, optmized for collaboration and feedback.  Now that the application itself is generally functional, I'd like to pull the open source community in a bit.

### April 8, 2026
Two major new features:
* mouse-note entry - create notes using the mouse, ala MuseScore.
* horizontal layout (continuous scroll) - non-paged view of your score.

#### Breaking changes:
New DOM structure.  Only domContainer parameter for application mode is required.   It can be a string ID or an element. Older versions required a more complicated DOM structure.

### October, 2024
Thanks to [Nenad Strangar](https://github.com/strangarnenad) we now have nested tuplets!

