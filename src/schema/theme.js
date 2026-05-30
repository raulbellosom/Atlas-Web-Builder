/**
 * @file JSDoc typedefs for Theme documents.
 */

/**
 * @typedef {Object} ColorTokens
 * @property {string} primary
 * @property {string} primaryFg
 * @property {string} bg
 * @property {string} fg
 * @property {string} muted
 * @property {string} accent
 * @property {string} danger
 */

/**
 * @typedef {Object} FontTokens
 * @property {string} sans
 * @property {string} serif
 * @property {string} mono
 */

/**
 * @typedef {Object} FontSizeTokens
 * @property {string} xs
 * @property {string} sm
 * @property {string} md
 * @property {string} lg
 * @property {string} xl
 * @property {string} ['2xl']
 * @property {string} ['3xl']
 */

/**
 * @typedef {Object} RadiusTokens
 * @property {string} sm
 * @property {string} md
 * @property {string} lg
 * @property {string} pill
 */

/**
 * @typedef {Object} SpacingTokens
 * Keys are stops on the spacing scale ('0','1','2','3','4','6','8','12','16').
 */

/**
 * @typedef {Object} ShadowTokens
 * @property {string} sm
 * @property {string} md
 * @property {string} lg
 */

/**
 * @typedef {Object} ButtonStyleTokens
 * @property {'solid'|'outline'|'ghost'} style
 * @property {keyof RadiusTokens}        radius
 */

/**
 * @typedef {Object} CardStyleTokens
 * @property {keyof RadiusTokens} radius
 * @property {keyof ShadowTokens} shadow
 * @property {string}             padding
 */

/**
 * @typedef {Object} ThemeTokens
 * @property {ColorTokens}        color
 * @property {FontTokens}         font
 * @property {FontSizeTokens}     fontSize
 * @property {RadiusTokens}       radius
 * @property {Object<string,string>} spacing
 * @property {ShadowTokens}       shadow
 * @property {ButtonStyleTokens}  button
 * @property {CardStyleTokens}    card
 */

/**
 * @typedef {Object} Theme
 * @property {string}      id
 * @property {string}      [name]
 * @property {ThemeTokens} tokens
 */

export {}
