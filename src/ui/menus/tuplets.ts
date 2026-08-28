import { SuiMenuBase, SuiMenuParams, MenuDefinition, SuiMenuHandler, SuiMenuShowOption,
    SuiConfiguredMenuOption, SuiConfiguredMenu } from './menu';
import {SuiCustomTupletDialogVue} from "../dialogs/customTupletsVue";

declare var $: any;
/**
 * stuff you can do to beams
 * @category SuiMenu
 */
export class SuiTupletMenu extends SuiConfiguredMenu {
    constructor(params: SuiMenuParams) {
        super(params, 'Tuplets', SuiTupletMenuOptions);
    }
}


/**
 * @category SuiMenu
 */
const tripletMenuOption: SuiConfiguredMenuOption = {
    handler: async (menu: SuiMenuBase) => {
        menu.view.makeTuplet({numNotes: 3, notesOccupied: 2, bracketed: true, ratioed: false});
    }, display: shouldDisplayCreateTuplet,
    menuChoice: {
        icon: ' icon icon-smo icon-triplet',
        text: 'Make Triplet',
        hotkey: 'Ctrl-3',
        value: 'tripletMenuOption'
    }
}
/**
 * @category SuiMenu
 */
const quintupletMenuOption: SuiConfiguredMenuOption = {
    handler: async (menu: SuiMenuBase) => {
        menu.view.makeTuplet({numNotes: 5, notesOccupied: 4, bracketed: true, ratioed: false});
    },
    display: shouldDisplayCreateTuplet,
    menuChoice: {
        icon: 'icon-smo icon-quint',
        text: 'Make 5-tuplet',
        hotkey: 'Ctrl-5',
        value: 'quintupletMenuOption'
    }
}
/**
 * @category SuiMenu
 */
const sevenTupletMenuOption: SuiConfiguredMenuOption = {
    handler: async (menu: SuiMenuBase) => {
        menu.view.makeTuplet({numNotes: 7, notesOccupied: 4, bracketed: true, ratioed: false});
    },
    display: shouldDisplayCreateTuplet,
    menuChoice: {
        icon: 'icon-smo icon icon-septuplet',
        hotkey: 'Ctrl-7',
        text: 'Make 7-tuplet',
        value: 'sevenTupletMenuOption'
    }
}
/**
 * @category SuiMenu
 */
const customTupletDialogMenuOption: SuiConfiguredMenuOption = {
    handler: async (menu: SuiMenuBase) => {
        SuiCustomTupletDialogVue({
            view: menu.view,
            completeNotifier: menu.completeNotifier,
            startPromise: menu.closePromise,
            eventSource: menu.eventSource,
            tracker: menu.tracker,
            ctor: 'SuiCustomTupletDialog',
            id: 'custom-tuplet-dialog',
            modifier: null
        });
    },
    display: shouldDisplayCreateTuplet,
    menuChoice: {
        icon: '',
        text: 'Custom Tuplet',
        value: 'customTupletDialog'
    }
}
/**
 * @category SuiMenu
 */
const removeTupletMenuOption: SuiConfiguredMenuOption = {
    handler: async (menu: SuiMenuBase) => {
        menu.view.unmakeTuplet();
    },
    display: shouldDisplayRemoveTuplet,
    menuChoice: {
        icon: 'icon icon-smo icon-no_tuplet',
        text: 'Unmake tuplet',
        hotkey: 'Ctrl-0',
        value: 'unmakeTuplet'
    }
}

function shouldDisplayRemoveTuplet(menu: SuiMenuBase): boolean {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
        const mm = menu.view.tracker.selections[i].measure;
        for (let j = 0; j < mm.voices.length; ++j) {
            const vv = mm.voices[j];
            for (let k = 0; k < vv.notes.length; ++k) {
                const nn = vv.notes[k];
                if (nn) {
                    if (nn.isTuplet) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function shouldDisplayCreateTuplet(menu: SuiMenuBase): boolean {
    for (let i = 0; i < menu.view.tracker.selections.length; ++i) {
        const mm = menu.view.tracker.selections[i].measure;
        for (let j = 0; j < mm.voices.length; ++j) {
            const vv = mm.voices[j];
            for (let k = 0; k < vv.notes.length; ++k) {
                const nn = vv.notes[k];
                if (nn) {
                    if (nn.noteType === 'n') {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}
/**
 * Stuff you can do to tuplets
 * @category SuiMenu
 */
export const SuiTupletMenuOptions: SuiConfiguredMenuOption[] = [tripletMenuOption, quintupletMenuOption,
    sevenTupletMenuOption,customTupletDialogMenuOption, removeTupletMenuOption,
];