import { Mathstyle, MATHSTYLES } from './mathstyle';
import { MacroDictionary } from './definitions-utils';

export type ParseMode =
    | ''
    | 'auto'
    | 'bbox'
    | 'color'
    | 'colspec'
    | 'delim'
    | 'dimen'
    | 'math'
    | 'number'
    | 'skip'
    | 'text'
    | 'string';

export type Variant =
    | 'ams'
    | 'double-struck'
    | 'calligraphic'
    | 'script'
    | 'fraktur'
    | 'sans-serif'
    | 'monospace'
    | 'normal' // 'main' (upright) or 'math' (italic) depending on letterShapeStyle
    | 'main'
    | 'math';
export type VariantStyle = 'up' | 'bold' | 'italic' | 'bolditalic' | '';
export type FontShape = 'auto' | 'n' | 'it' | 'sl' | 'sc' | '';
export type FontSeries = 'auto' | 'm' | 'b' | 'l' | '';

/**
 * Variants can map either to math characters in specific Unicode range
 * (see https://en.wikipedia.org/wiki/Mathematical_Alphanumeric_Symbols)
 * e.g. 𝒜, 𝔄, 𝖠, 𝙰, 𝔸, A, 𝐴
 * or to some built-in fonts (e.g. 'SansSerif-Regular')
 * 'normal' is a synthetic variant that maps either to 'main' (roman) or
 * 'math' (italic) depending on the symbol and the letterShapeStyle.
 */
export interface Style {
    mode?: ParseMode;
    color?: string;
    backgroundColor?: string;
    variant?: Variant;
    variantStyle?: VariantStyle;
    fontFamily?: string;
    fontShape?: FontShape;
    fontSeries?: FontSeries;
    fontSize?: string;
    cssId?: string;
    cssClass?: string;
    letterShapeStyle?: 'tex' | 'french' | 'iso' | 'up' | 'auto';
}

interface ContextInterface {
    macros?: MacroDictionary;
    atomIdsSettings?: {
        overrideID: string;
        groupNumbers: boolean;
        seed: string | number;
    };
    mathstyle?: Mathstyle;
    parentMathstyle?: Mathstyle;
    size?: string; // @revisit: set explicit possible values, e.g. 'size5', etc...
    parentSize?: string;
    letterShapeStyle?: 'tex' | 'french' | 'iso' | 'up';
    opacity?: number;
    color?: string;
    smartFence?: boolean;
}

/**
 * This structure contains the rendering context of the current parse level.
 *
 * It also holds information about the parent context to handle scaling
 * adjustments.
 *
 * When a new scope is entered, a clone of the context is created with `.clone()`
 * so that any further changes remain local to the scope.
 *
 * A scope is defined for example by:
 * - an explicit group enclosed in braces `{...}`
 * - a semi-simple group enclosed in `\bgroup...\endgroup`
 * - an environment delimited by `\begin{<envname>}...\end{<envname>}`
 *
 * @property {Mathstyle} mathstyle
 * @property {number} opacity
 * @property {number} size
 * @property {object} atomIdsSettings - If not undefined, unique IDs should be
 * generated for each span so they can be mapped back to an atom.
 * The `seed` field should be a number to generate a specific range of
 * IDs or the string "random" to generate a random number.
 * Optionally, if a `groupNumbers` property is set to true, an additional
 * span will enclose strings of digits. This is used by read aloud to properly
 * pronounce (and highlight) numbers in expressions.
 * @property {Mathstyle} parentMathstyle
 * @property {number} parentSize
 * @property {object} macros A macros dictionary
 * @property {string} color
 *
 * @class Context
 * @global
 * @private
 */
export class Context implements ContextInterface {
    macros: MacroDictionary;
    atomIdsSettings?: {
        overrideID: string;
        groupNumbers: boolean;
        seed: string | number;
    };
    mathstyle: Mathstyle;
    parentMathstyle: Mathstyle;
    size: string; // @revisit: set explicit possible values, e.g. 'size5', etc...
    parentSize: string;
    letterShapeStyle: 'tex' | 'french' | 'iso' | 'up';
    opacity: number;
    color?: string;
    smartFence: boolean;

    constructor(from: ContextInterface) {
        this.macros = from.macros || {};
        this.atomIdsSettings = from.atomIdsSettings;

        this.mathstyle = from.mathstyle || MATHSTYLES.displaystyle;

        this.letterShapeStyle = from.letterShapeStyle || 'tex';

        this.size = from.size || 'size5'; // medium size

        this.parentMathstyle = from.parentMathstyle || this.mathstyle;
        this.parentSize = from.parentSize || this.size;

        this.opacity = from.opacity;
        this.smartFence = from.smartFence;
    }

    /**
     * Returns a new context with the same properties as 'this',
     * except for the ones provided in `override`
     */
    clone(override: ContextInterface = {}): Context {
        const result = new Context(this);
        if (override) {
            // `'auto'` (or undefined) to indicate that the mathstyle should in
            // fact not be changed. This is used when specifying the mathstyle
            // for some environments.
            Object.assign(result, override);
            if (!override.mathstyle) {
                result.mathstyle = this.mathstyle;
            } else {
                result.parentMathstyle = this.mathstyle;
                result.parentSize = this.size;
                if (typeof override.mathstyle === 'string') {
                    result.mathstyle = MATHSTYLES[override.mathstyle];
                }
            }
        }
        return result;
    }

    /**
     * Change the mathstyle of this context
     * @param {string} value - `'auto'` to indicate that the mathstyle should in
     * fact not be changed. This is used when specifying the mathstyle for some
     * environments.
     * @memberof Context
     * @instance
     */
    setMathstyle(value: string) {
        if (value && value !== 'auto') {
            this.mathstyle = MATHSTYLES[value];
        }
    }
    cramp() {
        return this.clone({ mathstyle: this.mathstyle.cramp() });
    }
    sup() {
        return this.clone({ mathstyle: this.mathstyle.sup() });
    }
    sub() {
        return this.clone({ mathstyle: this.mathstyle.sub() });
    }
}
