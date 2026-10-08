<sub>[Github site](https://github.com/smoosic) | [change notes](https://smoosic.github.io//Smoosic/changes.html) | [application](https://smoosic.github.io//Smoosic/release/html/smoosic.html)<sub> 


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

