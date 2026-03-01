import { SuiScoreView } from '../render/sui/scoreView';
import { ExceptionParameters } from './common';
import { SuiNavigation } from '../render/sui/configuration';
/**
 * @internal
 */
export declare class SuiExceptionHandler {
    view: SuiScoreView;
    navigation: SuiNavigation;
    thrown: boolean;
    static _instance: SuiExceptionHandler;
    constructor(params: ExceptionParameters);
    static get instance(): SuiExceptionHandler;
    exceptionHandler(e: any): void;
}
