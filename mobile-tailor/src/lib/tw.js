/*
 * Tailwind (web) class strings -> React Native styles.
 *
 * twrnc does the bulk of the utility -> style mapping using tailwind.config.js
 * (the app's single theme file). This module adds what the web relies on but
 * twrnc / React Native lack:
 *   - drops responsive / state variants (sm:, md:, hover:, …) — the spec is the
 *     phone-width render, where none of those apply
 *   - web `flex` means row; `grid` is emulated with row-wrap + column meta
 *   - space-x/space-y -> gap, shadows/rings -> boxShadow, gradients ->
 *     backgroundImage, blur -> filter, percentage translates
 *   - splits text styles (inherited, like CSS) from view styles
 */
import { Dimensions } from 'react-native';
import { create } from 'twrnc';
import config from '../../tailwind.config';

const base = create(config);

const TEXT_KEYS = new Set([
  'color', 'fontSize', 'fontWeight', 'fontFamily', 'fontStyle', 'textAlign', 'lineHeight',
  'letterSpacing', 'textTransform', 'textDecorationLine', 'textDecorationColor',
  'textDecorationStyle', 'fontVariant',
]);

const SKIP = /^(transition|duration-|ease-|delay-|cursor-|select-|outline|backdrop-|no-scrollbar|scrollbar|scroll-|snap-|will-change|touch-|appearance-|resize|antialiased|subpixel|break-|list-|group|peer|isolate|container$|prose|animate-|origin-|filter$|transform$|transform-gpu|bg-clip|bg-cover|bg-contain|bg-center|bg-no-repeat|bg-fixed|bg-\[url|bg-top|bg-bottom|text-transparent|fill-|stroke-|accent-|caret-|placeholder|decoration-|underline-offset|align-|table|content-|overscroll|hyphens|text-wrap|text-balance|text-pretty|text-ellipsis|text-clip|overflow-x-|overflow-y-|overflow-auto|overflow-scroll|overflow-visible|ring-offset|ring-inset|shadow-inner|mix-blend|invert|grayscale|sepia|brightness|contrast|saturate|hue-rotate|drop-shadow|columns-|float-|clear-|box-|object-center|object-top|object-bottom|bg-blend|backface|perspective|contain-|field-sizing|forced-|inset-shadow|text-shadow|mask-|tabular-nums|lining-nums|ordinal|slashed-zero|order-|justify-items|justify-self|place-self|visible$|collapse$|static$|relative$|wrap-|text-start|indent-|-space-)/;

const SHADOWS = {
  'shadow-2xs': ['0 1px 0 0 C05'],
  'shadow-xs': ['0 1px 2px 0 C05'],
  shadow: ['0 1px 3px 0 C10', '0 1px 2px -1px C10'],
  'shadow-sm': ['0 1px 3px 0 C10', '0 1px 2px -1px C10'],
  'shadow-md': ['0 4px 6px -1px C10', '0 2px 4px -2px C10'],
  'shadow-lg': ['0 10px 15px -3px C10', '0 4px 6px -4px C10'],
  'shadow-xl': ['0 20px 25px -5px C10', '0 8px 10px -6px C10'],
  'shadow-2xl': ['0 25px 50px -12px C25'],
};
const BLUR = { blur: 8, 'blur-xs': 4, 'blur-sm': 8, 'blur-md': 12, 'blur-lg': 16, 'blur-xl': 24, 'blur-2xl': 40, 'blur-3xl': 64 };
const TRACK = { 'tracking-tighter': -0.05, 'tracking-tight': -0.025, 'tracking-normal': 0, 'tracking-wide': 0.025, 'tracking-wider': 0.05, 'tracking-widest': 0.1 };
const LEADING = { 'leading-none': 1, 'leading-tight': 1.25, 'leading-snug': 1.375, 'leading-normal': 1.5, 'leading-relaxed': 1.625, 'leading-loose': 2 };
const GRAD_DIR = { t: 'to top', tr: 'to top right', r: 'to right', br: 'to bottom right', b: 'to bottom', bl: 'to bottom left', l: 'to left', tl: 'to top left' };

const hasVariant = (c) => {
  let depth = 0;
  for (let i = 0; i < c.length; i++) {
    const ch = c[i];
    if (ch === '[' || ch === '(') depth++;
    else if (ch === ']' || ch === ')') depth--;
    else if (ch === ':' && depth === 0) return true;
  }
  return false;
};

const withAlpha = (color, alpha) => {
  if (!color) return color;
  if (alpha == null) return color;
  const m = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  const rgba = color.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const parts = rgba[1].split(',').map((s) => s.trim());
    return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha})`;
  }
  return color;
};

// Resolve a tailwind color token ("primary", "gray-200", "[#843D9B]", "white/80") to a CSS color string.
export const color = (token) => {
  if (!token) return undefined;
  if (token === 'transparent') return 'transparent';
  if (token === 'current' || token === 'inherit') return undefined;
  let alpha;
  let name = token;
  const slash = token.lastIndexOf('/');
  if (slash > 0 && !token.endsWith(']')) {
    const op = token.slice(slash + 1).replace(/[[\]%]/g, '');
    alpha = Number(op) > 1 ? Number(op) / 100 : Number(op);
    name = token.slice(0, slash);
  }
  let c;
  if (name.startsWith('[') && name.endsWith(']')) c = name.slice(1, -1).replace(/_/g, ' ');
  else c = base.color(name);
  if (!c) return undefined;
  return alpha != null && !Number.isNaN(alpha) ? withAlpha(c, alpha) : c;
};

const spacingPx = (v) => {
  if (v === 'px') return 1;
  if (v === 'full') return '100%';
  if (/^\d+\/\d+$/.test(v)) { const [a, b] = v.split('/').map(Number); return `${(a / b) * 100}%`; }
  if (/^\[.+\]$/.test(v)) {
    const raw = v.slice(1, -1);
    if (raw.endsWith('px')) return parseFloat(raw);
    if (raw.endsWith('rem')) return parseFloat(raw) * 16;
    if (raw.endsWith('%')) return raw;
    return parseFloat(raw);
  }
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n * 4;
};

const cache = new Map();

export function parse(className) {
  if (!className) return EMPTY;
  const key = className;
  const hit = cache.get(key);
  if (hit) return hit;

  const meta = {};
  const rest = [];
  const shadowLayers = [];
  let shadowColor = null;
  let ringWidth = null;
  let ringColor = null;
  const grad = {};
  const transforms = [];
  const extra = {};
  let trackEm = null;
  let leading = null;

  const classes = className.split(/\s+/).filter(Boolean);
  const hasBackdropBlur = classes.some((c) => /^backdrop-blur/.test(c));
  for (let raw of classes) {
    let c = raw.startsWith('!') ? raw.slice(1) : raw;
    if (hasVariant(c)) continue;
    if (SKIP.test(c)) continue;

    // display / layout semantics
    if (c === 'flex') { meta.flex = true; continue; }
    if (c === 'inline-flex') { meta.flex = true; meta.inline = true; continue; }
    if (c === 'grid' || c === 'inline-grid') { meta.flex = true; meta.grid = true; continue; }
    if (c === 'block' || c === 'contents' || c === 'flow-root') { meta.block = true; continue; }
    if (c === 'inline' || c === 'inline-block') { meta.inline = true; continue; }
    if (c === 'hidden' || c === 'sr-only' || c === 'invisible') { extra.display = 'none'; continue; }
    if (c === 'flex-col' || c === 'flex-col-reverse' || c === 'flex-row' || c === 'flex-row-reverse') { meta.dir = c; continue; }
    let m;
    if ((m = c.match(/^grid-cols-(\d+)$/))) { meta.cols = Number(m[1]); continue; }
    if ((m = c.match(/^col-span-(\d+|full)$/))) { meta.span = m[1] === 'full' ? 99 : Number(m[1]); continue; }
    if (/^(grid-|col-|row-span|auto-)/.test(c)) continue;
    if ((m = c.match(/^space-y-(.+)$/))) { rest.push(`gap-y-${m[1]}`); continue; }
    if ((m = c.match(/^space-x-(.+)$/))) { rest.push(`gap-x-${m[1]}`); continue; }
    if (c === 'truncate') { meta.lines = 1; meta.ellipsis = true; continue; }
    if (c === 'whitespace-nowrap' || c === 'text-nowrap') { meta.nowrap = true; continue; }
    if (/^whitespace-/.test(c)) continue;
    if ((m = c.match(/^line-clamp-(\d+)$/))) { meta.lines = Number(m[1]); meta.ellipsis = true; continue; }
    if (c === 'line-clamp-none') continue;
    if ((m = c.match(/^object-(cover|contain|fill|none|scale-down)$/))) { meta.fit = m[1]; continue; }
    if (c === 'fixed') { extra.position = 'absolute'; meta.fixed = true; continue; }
    if (c === 'sticky') { meta.sticky = true; continue; }
    if (c === 'absolute') { extra.position = 'absolute'; continue; }
    // twrnc ignores arbitrary z-index (`Number('[100]')` is NaN), so overlays fell behind later siblings and lost taps
    // twrnc ignores arbitrary opacity (`opacity-[0.03]`), which left faint decorations fully visible
    if ((m = c.match(/^opacity-\[(\d*\.?\d+)\]$/))) { extra.opacity = Number(m[1]); continue; }
    if ((m = c.match(/^(-)?z-\[(-?\d+)\]$/))) { extra.zIndex = (m[1] ? -1 : 1) * Number(m[2]); continue; }
    if (c === 'pointer-events-none') { extra.pointerEvents = 'none'; continue; }
    if (c === 'pointer-events-auto') continue;
    if (c === 'w-screen') { rest.push('w-full'); continue; }
    if (c === 'w-fit' || c === 'w-max' || c === 'w-min' || c === 'w-auto') { if (c !== 'w-auto') meta.fit_w = true; continue; }
    if (c === 'h-fit' || c === 'h-max' || c === 'h-min' || c === 'h-auto') continue;
    if (/^(min-)?h-(screen|dvh|svh|lvh|\[100dvh\]|\[100vh\]|\[100svh\])$/.test(c)) {
      if (c.startsWith('min-')) extra.flexGrow = 1; else extra.flex = 1;
      continue;
    }
    if (/^max-h-(screen|dvh|\[\d+(d|s)?vh\])$/.test(c)) continue;
    if ((m = c.match(/^(min-|max-)?h-\[(\d+)(d|s)?vh\]$/))) {
      const v = Math.round(Dimensions.get('window').height * Number(m[2]) / 100);
      extra[m[1] === 'min-' ? 'minHeight' : m[1] === 'max-' ? 'maxHeight' : 'height'] = v;
      continue;
    }
    if ((m = c.match(/^(min-|max-)?w-\[(\d+)vw\]$/))) {
      const v = Math.round(Dimensions.get('window').width * Number(m[2]) / 100);
      extra[m[1] === 'min-' ? 'minWidth' : m[1] === 'max-' ? 'maxWidth' : 'width'] = v;
      continue;
    }
    if (c === 'place-items-center' || c === 'place-content-center') { rest.push('items-center', 'justify-center'); continue; }
    if ((m = c.match(/^size-(.+)$/))) { rest.push(`w-${m[1]}`, `h-${m[1]}`); continue; }
    // twrnc ignores arbitrary flex (`flex-[1.15]`): CSS `flex: n` = grow n, shrink 1, basis 0
    if ((m = c.match(/^flex-\[(\d+(?:\.\d+)?)\]$/))) { extra.flexGrow = Number(m[1]); extra.flexShrink = 1; extra.flexBasis = 0; continue; }
    if (c === 'aspect-square') { extra.aspectRatio = 1; continue; }
    if (c === 'aspect-video') { extra.aspectRatio = 16 / 9; continue; }
    if ((m = c.match(/^aspect-\[(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\]$/))) { extra.aspectRatio = Number(m[1]) / Number(m[2]); continue; }
    if ((m = c.match(/^aspect-(\d+)\/(\d+)$/))) { extra.aspectRatio = Number(m[1]) / Number(m[2]); continue; }
    if (/^aspect-/.test(c)) continue;
    if (c === 'mx-auto') { extra.marginLeft = 'auto'; extra.marginRight = 'auto'; continue; }
    if (c === 'my-auto') { extra.marginTop = 'auto'; extra.marginBottom = 'auto'; continue; }
    if (c === 'ml-auto') { extra.marginLeft = 'auto'; continue; }
    if (c === 'mr-auto') { extra.marginRight = 'auto'; continue; }
    if (c === 'mt-auto') { extra.marginTop = 'auto'; continue; }
    if (c === 'mb-auto') { extra.marginBottom = 'auto'; continue; }

    // typography
    if (c in TRACK) { trackEm = TRACK[c]; continue; }
    if ((m = c.match(/^tracking-\[(-?[\d.]+)(em|px|rem)?\]$/))) {
      const v = Number(m[1]);
      if (m[2] === 'px') extra.letterSpacing = v; else if (m[2] === 'rem') extra.letterSpacing = v * 16; else trackEm = v;
      continue;
    }
    if (/^tracking-/.test(c)) continue;
    if (c in LEADING) { leading = LEADING[c]; continue; }
    if ((m = c.match(/^leading-\[([\d.]+)(px|rem)?\]$/))) {
      if (m[2] === 'px') extra.lineHeight = Number(m[1]);
      else if (m[2] === 'rem') extra.lineHeight = Number(m[1]) * 16;
      else leading = Number(m[1]);
      continue;
    }
    if ((m = c.match(/^leading-(\d+(?:\.\d+)?)$/))) { extra.lineHeight = Number(m[1]) * 4; continue; }
    if (/^leading-/.test(c)) continue;
    if ((m = c.match(/^font-(sans|serif|body|jakarta|mono)$/))) { meta.family = m[1]; continue; }
    if (/^font-\[/.test(c)) { meta.family = /Jakarta/i.test(c) ? 'jakarta' : /Manrope/i.test(c) ? 'body' : /Caslon|serif/i.test(c) ? 'serif' : 'sans'; continue; }
    if (c === 'not-italic') continue;
    if (c === 'normal-case') { extra.textTransform = 'none'; continue; }

    // shadows / rings
    if (c in SHADOWS) { shadowLayers.push(...SHADOWS[c]); continue; }
    if (c === 'shadow-none') { shadowLayers.length = 0; extra.boxShadow = 'none'; continue; }
    if ((m = c.match(/^shadow-\[(.+)\]$/))) {
      const v = m[1].replace(/_/g, ' ');
      if (/^(#|rgb|hsl)/.test(v) && !/\d+px/.test(v)) shadowColor = v; else shadowLayers.push(v);
      continue;
    }
    if ((m = c.match(/^shadow-(.+)$/))) { const sc = color(m[1]); if (sc) shadowColor = sc; continue; }
    if (c === 'ring') { ringWidth = 3; continue; }
    if ((m = c.match(/^ring-(\d+)$/))) { ringWidth = Number(m[1]); continue; }
    if ((m = c.match(/^ring-\[(\d+)px\]$/))) { ringWidth = Number(m[1]); continue; }
    if ((m = c.match(/^ring-(.+)$/))) { ringColor = color(m[1]); continue; }

    // gradients
    if ((m = c.match(/^bg-(?:gradient|linear)-to-(t|tr|r|br|b|bl|l|tl)$/))) { grad.dir = GRAD_DIR[m[1]]; continue; }
    if ((m = c.match(/^bg-linear-(\d+)$/))) { grad.dir = `${m[1]}deg`; continue; }
    if ((m = c.match(/^bg-radial/))) { grad.radial = true; continue; }
    if ((m = c.match(/^(from|via|to)-(\d+%)$/))) continue;
    if ((m = c.match(/^(from|via|to)-(.+)$/))) { grad[m[1]] = color(m[2]); continue; }

    // blur
    if (c in BLUR) { extra.filter = `blur(${BLUR[c]}px)`; continue; }
    if ((m = c.match(/^blur-\[(\d+)px\]$/))) { extra.filter = `blur(${m[1]}px)`; continue; }
    if (/^blur/.test(c)) continue;

    // transforms
    if ((m = c.match(/^(-)?translate-([xy])-(.+)$/))) {
      const v = spacingPx(m[3]);
      if (v == null) continue;
      const signed = typeof v === 'string' ? (m[1] ? `-${v}` : v) : (m[1] ? -v : v);
      transforms.push({ [m[2] === 'x' ? 'translateX' : 'translateY']: signed });
      continue;
    }
    if ((m = c.match(/^(-)?scale-(x-|y-)?(\d+)$/))) {
      const v = Number(m[3]) / 100 * (m[1] ? -1 : 1);
      transforms.push({ [m[2] === 'x-' ? 'scaleX' : m[2] === 'y-' ? 'scaleY' : 'scale']: v });
      continue;
    }
    if ((m = c.match(/^(-)?rotate-(\[)?(\d+)(deg)?(\])?$/))) { transforms.push({ rotate: `${m[1] ? '-' : ''}${m[3]}deg` }); continue; }
    if (/^(skew|translate|scale|rotate)-/.test(c)) continue;

    // position helpers with fractions (top-1/2)
    if ((m = c.match(/^(-)?(top|bottom|left|right)-(\d+\/\d+|full)$/))) {
      const v = spacingPx(m[3]);
      extra[m[2]] = m[1] ? `-${v}` : v;
      continue;
    }

    rest.push(c);
  }

  let style = {};
  if (rest.length) {
    try {
      style = { ...base.style(rest.join(' ')) };
    } catch (e) {
      // Fall back class-by-class so one unknown utility doesn't drop the rest
      style = {};
      for (const c of rest) {
        try { Object.assign(style, base.style(c)); } catch (_) { /* unknown utility */ }
      }
    }
  }
  Object.assign(style, extra);

  // No backdrop blur in RN: a translucent bar (bg-white/80 + backdrop-blur) would show the page through it.
  // Only for full-width bars/headers; translucent pills (even absolutely positioned ones) stay translucent.
  const fullWidthBar = (style.position === 'absolute' && style.left === 0 && style.right === 0) || meta.sticky;
  if (hasBackdropBlur && fullWidthBar && typeof style.backgroundColor === 'string') {
    style.backgroundColor = style.backgroundColor.replace(/rgba\(([^)]+),\s*([\d.]+)\)/, (all, rgb, a) => (Number(a) < 0.95 ? `rgba(${rgb}, 0.97)` : all));
  }

  // CSS: `w-full aspect-[5/4] max-h-[260px]` keeps the full width and caps the height.
  // Yoga instead shrinks the width to keep the ratio, so resolve the height here
  // (percentage width measured against the window width).
  if (style.aspectRatio && style.maxHeight != null && typeof style.width === 'string' && style.width.endsWith('%')) {
    const w = Dimensions.get('window').width * parseFloat(style.width) / 100;
    style.height = Math.min(w / style.aspectRatio, style.maxHeight);
    delete style.aspectRatio;
  }

  // web `flex` defaults to row
  if (meta.flex) {
    const dir = meta.dir || 'flex-row';
    style.flexDirection = dir === 'flex-row' ? 'row' : dir === 'flex-row-reverse' ? 'row-reverse' : dir === 'flex-col-reverse' ? 'column-reverse' : 'column';
    if (meta.grid) {
      style.flexDirection = 'row';
      style.flexWrap = 'wrap';
      // grid rows must not stretch into spare height (Yoga's web-default align-content: stretch
      // made the first card of a list fill the whole screen)
    }
  } else if (meta.dir === 'flex-col-reverse') {
    style.flexDirection = 'column-reverse';
  }
  if (style.display === 'flex') delete style.display;
  // wrapped rows must not stretch into spare height (Yoga's web-default align-content: stretch
  // made the first card of a grid list fill the whole screen)
  if (style.flexWrap === 'wrap' && style.alignContent == null) style.alignContent = 'flex-start';

  if (shadowLayers.length || ringWidth != null) {
    const layers = shadowLayers.map((l) => {
      if (shadowColor) return l.replace(/C(05|10|25)$/, shadowColor).replace(/rgba?\([^)]*\)$/, shadowColor);
      return l.replace(/C05$/, 'rgba(0,0,0,0.05)').replace(/C10$/, 'rgba(0,0,0,0.1)').replace(/C25$/, 'rgba(0,0,0,0.25)');
    });
    if (ringWidth != null) layers.unshift(`0 0 0 ${ringWidth}px ${ringColor || 'rgba(59,130,246,0.5)'}`);
    style.boxShadow = layers.join(', ');
  } else if (ringColor && !ringWidth) {
    // ring color without width has no effect on web
  }

  if (grad.dir || grad.from || grad.to) {
    const from = grad.from || 'transparent';
    const to = grad.to || (grad.from ? withAlpha(grad.from, 0) : 'transparent');
    const stops = grad.via ? [from, grad.via, to] : [from, to];
    if (grad.radial) style.experimental_backgroundImage = `radial-gradient(circle, ${stops.join(', ')})`;
    else style.experimental_backgroundImage = `linear-gradient(${grad.dir || 'to bottom'}, ${stops.join(', ')})`;
  }

  if (transforms.length) style.transform = transforms;

  // split text vs view
  const view = {};
  const text = {};
  for (const k of Object.keys(style)) {
    if (TEXT_KEYS.has(k)) text[k] = style[k];
    else view[k] = style[k];
  }
  // twrnc emits relative lineHeight only when a size is present; we resolve at render
  // size utilities carry a line-height ratio (inherits like CSS unitless line-height)
  if (text.fontSize && text.lineHeight && leading == null && extra.lineHeight == null) {
    text._leading = text.lineHeight / text.fontSize;
    delete text.lineHeight;
  }
  if (text.letterSpacing != null && trackEm == null && extra.letterSpacing == null) delete text.letterSpacing;
  if (extra.letterSpacing != null) text.letterSpacing = extra.letterSpacing;
  if (trackEm != null) meta.trackEm = trackEm;
  if (leading != null) meta.leading = leading;
  if (meta.family) text._family = meta.family;
  if (trackEm != null) text._trackEm = trackEm;
  if (leading != null) text._leading = leading;

  const out = { view, text, meta };
  cache.set(key, out);
  return out;
}

const EMPTY = { view: {}, text: {}, meta: {} };

/**
 * Plain style object (view + text merged) for direct use on RN components:
 *   style={tw`p-4 bg-white`}   or   style={tw('p-4', cond && 'bg-white')}
 */
export default function tw(strings, ...values) {
  let cls;
  if (Array.isArray(strings) && strings.raw) {
    cls = strings.reduce((acc, s, i) => acc + s + (i < values.length ? (values[i] || '') : ''), '');
  } else {
    cls = [strings, ...values].filter(Boolean).join(' ');
  }
  const p = parse(cls);
  return finalizeText({ ...p.view, ...p.text });
}

const WEIGHT_NAMES = { 100: '100Thin', 200: '200ExtraLight', 300: '300Light', 400: '400Regular', 500: '500Medium', 600: '600SemiBold', 700: '700Bold', 800: '800ExtraBold', 900: '900Black' };
const FAMILY_WEIGHTS = {
  sans: { name: 'Poppins', weights: [400, 500, 600, 700, 800, 900] },
  jakarta: { name: 'PlusJakartaSans', weights: [400, 500, 600, 700, 800] },
  body: { name: 'Poppins', weights: [400, 500, 600, 700, 800, 900] },
  mono: { name: 'Poppins', weights: [400, 500, 600, 700, 800, 900] },
  serif: { name: 'LibreCaslonText', weights: [400, 700] },
};

/** Resolve inherited web text props to concrete RN text style (font file per weight, em -> px). */
export function finalizeText(s) {
  const out = { ...s };
  const fam = FAMILY_WEIGHTS[out._family || 'sans'];
  let w = Number(out.fontWeight || 400);
  if (Number.isNaN(w)) w = out.fontWeight === 'bold' ? 700 : 400;
  const pick = fam.weights.reduce((best, cur) => (Math.abs(cur - w) < Math.abs(best - w) ? cur : best), fam.weights[0]);
  if (!out.fontFamily || out._family) {
    out.fontFamily = out.fontStyle === 'italic' && fam.name === 'Poppins'
      ? `Poppins_${WEIGHT_NAMES[pick]}_Italic`
      : `${fam.name}_${WEIGHT_NAMES[pick]}`;
  }
  delete out.fontWeight;
  if (out.fontFamily && out.fontFamily.endsWith('Italic')) delete out.fontStyle;
  const size = out.fontSize || 16;
  if (out._trackEm != null) out.letterSpacing = out._trackEm * size;
  if (out._leading != null) out.lineHeight = out._leading * size;
  // Android clips Poppins glyphs when line-height < ~1.2em
  if (out.lineHeight != null && out.lineHeight < size * 1.2) out.lineHeight = Math.round(size * 1.2);
  delete out._trackEm;
  delete out._leading;
  delete out._family;
  return out;
}

export { base as twrnc };
