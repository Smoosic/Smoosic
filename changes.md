<sub>[Github site](https://github.com/smoosic) | [change notes](https://smoosic.github.io//Smoosic/changes.html) | [application](https://smoosic.github.io//Smoosic/release/html/smoosic.html)<sub> 


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

