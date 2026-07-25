import { Ref } from 'vue';
export interface HtmlHelpData {
    title: string;
    html: string;
}
/**
 * @internal
 */
export interface HtmlHelpBlock {
    title: string;
    html: string;
    index: number;
    show: Ref<boolean>;
}
export type HelpMode = 'cards' | 'expand';
/**
 * @category SuiDialog
 */
export declare class SuiHelp {
    static helpMode: HelpMode;
    static created: boolean;
    static currentCard: number;
    static setCards(): void;
    static get closeButton(): import("../common/htmlHelpers").DomBuilder;
    static _buildElements(helps: HtmlHelpBlock): import("../common/htmlHelpers").DomBuilder;
    static get helpHtml(): HtmlHelpBlock[];
}
