const CONTROL_CHARS = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(31) + String.fromCharCode(127) + ']', 'g');

/**
 * Strip control characters, trim, collapse inner whitespace, clamp length.
 * @param {unknown} value Expected string.
 * @param {number} [max=200] Maximum output length.
 * @returns {string} Sanitized text ('' for non-string input).
 */
export function sanitizeText(value, max = 200) {
  if (typeof value !== 'string') return '';
  let s = value.replace(CONTROL_CHARS, ' ').trim().replace(/\s+/g, ' ');
  return s.slice(0, max);
}
