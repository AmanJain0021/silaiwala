/**
 * Formats and sanitizes CMS HTML content for safe, responsive, and aesthetic rendering.
 * Replaces non-breaking spaces (&nbsp; and \u00A0) that cause horizontal overflow on mobile screens.
 */
export const sanitizeCmsHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/<p>\s*<\/p>/gi, '') // remove empty blank paragraphs
    .trim();
};

export default sanitizeCmsHtml;
