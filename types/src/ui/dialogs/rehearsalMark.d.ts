import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SmoRehearsalMark } from '../../smo/data/measureModifiers';
/**
 * Edits a live SmoRehearsalMark. Modeled on SuiVoltaAdapter (src/ui/dialogs/volta.ts): every
 * field write is pushed to the score immediately, and cancel() restores the backup taken when
 * the dialog opened. Position is intentionally not editable (spec Assumptions).
 * See specs/025-rehearsal-mark-dialog.
 */
export declare class SuiRehearsalMarkAdapter {
    view: SuiScoreViewOperations;
    mark: SmoRehearsalMark;
    backup: SmoRehearsalMark;
    changed: boolean;
    constructor(view: SuiScoreViewOperations, mark: SmoRehearsalMark);
    get symbol(): string;
    set symbol(value: string);
    get cardinality(): string;
    set cardinality(value: string);
    get increment(): boolean;
    set increment(value: boolean);
    updateMark(): void;
    commit(): Promise<void>;
    cancel(): Promise<void>;
    remove(): Promise<void>;
}
