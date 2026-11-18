/*
 * Web-element equivalents that accept the web's Tailwind `className` strings.
 *   div -> Box, span/p/h1… -> Txt, button/a -> Btn, img -> Img, lucide icon -> I,
 *   input/textarea -> Input, scrolling div -> Scroll
 * They emulate the CSS behaviour the web relies on (text-style inheritance,
 * inline elements sizing to content, grid columns, flex shrink defaults).
 */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { parse, finalizeText, color as twColor } from '../../lib/tw';
import { resolveImageSource } from '../../lib/assets';

const ROOT_TEXT = { color: '#111827', fontSize: 16 };
const TextCtx = createContext(ROOT_TEXT);
const LayoutCtx = createContext({ flex: false, row: false, align: undefined });

export const useTextStyle = () => useContext(TextCtx);

const cx = (...parts) => parts.filter(Boolean).join(' ');

// Extract `variant:` classes (e.g. disabled:opacity-50) as plain classes
export const variantClasses = (className, variant) =>
  (className || '')
    .split(/\s+/)
    .filter((c) => c.startsWith(`${variant}:`))
    .map((c) => c.slice(variant.length + 1))
    .join(' ');

const hasWidth = (s) => s.width != null || s.flex != null || s.flexGrow != null || s.alignSelf != null || s.position === 'absolute';

const InTextCtx = React.createContext(false);

function inlineFix(style, parentLayout, isInline) {
  if (!isInline || parentLayout.flex || hasWidth(style)) return style;
  const a = parentLayout.align;
  return { ...style, alignSelf: a === 'center' ? 'center' : a === 'right' ? 'flex-end' : 'flex-start' };
}

// web `max-w-* mx-auto` = full width up to max, centred (Yoga shrinks auto-margined children otherwise)
function autoWidth(style) {
  if (style.marginLeft === 'auto' && style.marginRight === 'auto' && style.width == null && style.position !== 'absolute') {
    return { ...style, width: '100%' };
  }
  return style;
}

// CSS `h-full` on an in-flow element means "fill a parent that has a definite height" and is
// ignored when the parent's height is auto. Yoga resolves it against an undefined height instead
// (list cards grew to thousands of px), so express it as a stretch along the parent's axis.
function fullHeight(style, parentLayout) {
  if (style.height !== '100%' || style.position === 'absolute') return style;
  const { height: _h, ...rest } = style;
  return parentLayout.row ? { alignSelf: 'stretch', ...rest } : { flexGrow: 1, ...rest };
}

// CSS never shrinks a flex item below its longest word (min-width: auto); Yoga does, which broke
// short labels mid-word ("AVAILABL/E", "Che/ck"). Items whose text is only single words don't shrink.
function textOf(children, depth = 0) {
  if (depth > 3) return null;
  let out = '';
  for (const c of React.Children.toArray(children)) {
    if (typeof c === 'string' || typeof c === 'number') out += String(c);
    else if (React.isValidElement(c)) {
      if (c.type === I) continue;
      if (c.props?.children == null) continue;
      const t = textOf(c.props.children, depth + 1);
      if (t == null) return null;
      out += ` ${t}`;
    }
  }
  return out;
}
function unbreakable(children) {
  const t = textOf(children);
  return t != null && t.trim() !== '' && t.trim().length <= 24 && !/\s/.test(t.trim());
}

function rowShrink(style, parentLayout, children) {
  if (parentLayout.row && style.flexShrink == null && style.flex == null && children !== undefined && unbreakable(children)) {
    return { ...style, flexShrink: 0 };
  }
  if (!parentLayout.row || style.flexShrink != null || style.flex != null) return style;
  // CSS flex items shrink by default; keep fixed pixel widths, but let percentage widths
  // (e.g. a w-full input next to a button) shrink so siblings stay visible.
  if (style.width != null && !(typeof style.width === 'string' && style.width.endsWith('%'))) return style;
  return { ...style, flexShrink: 1, minWidth: 0 };
}

const isInlineChild = (c) =>
  typeof c === 'string' || typeof c === 'number' || (React.isValidElement(c) && c.type === Txt);

function renderChildren(children, isFlex) {
  // Fragments expanded: `<><Icon /> Buy for ₹{price}</>` must still wrap its raw text in <Text>
  const arr = flattenFragments(children);
  if (!arr.length) return null;
  const hasRaw = arr.some((c) => typeof c === 'string' || typeof c === 'number');
  if (!hasRaw) return arr;
  // block element with only inline content -> one flowing paragraph
  if (!isFlex && arr.every(isInlineChild)) return <Txt>{arr}</Txt>;
  // group consecutive raw strings/numbers into one text run
  const out = [];
  let run = [];
  const flush = (i) => { if (run.length) { out.push(<Txt key={`t${i}`}>{run.join('')}</Txt>); run = []; } };
  arr.forEach((c, i) => {
    if (typeof c === 'string' || typeof c === 'number') run.push(String(c));
    else { flush(i); out.push(c); }
  });
  flush(arr.length);
  return out;
}

// Grid items are the element's children with Fragments expanded (lists rendered inside a
// <React.Fragment>, e.g. the web's <AnimatePresence>, must still lay out one cell per item).
function flattenFragments(children, prefix = '') {
  const out = [];
  React.Children.toArray(children).forEach((c, i) => {
    if (c === null || c === undefined || c === false || c === true || c === '') return;
    if (React.isValidElement(c) && c.type === React.Fragment) {
      out.push(...flattenFragments(c.props.children, `${prefix}${c.key ?? i}.`));
    } else if (React.isValidElement(c) && prefix) {
      out.push(React.cloneElement(c, { key: `${prefix}${c.key ?? i}` }));
    } else {
      out.push(c);
    }
  });
  return out;
}

function useGrid(meta, view) {
  const [w, setW] = useState(0);
  if (!meta.grid) return { onLayout: undefined, wrap: null };
  const cols = meta.cols || 1;
  const colGap = view.columnGap ?? view.gap ?? 0;
  const padH = (view.paddingLeft || view.paddingHorizontal || view.padding || 0) + (view.paddingRight || view.paddingHorizontal || view.padding || 0);
  const inner = w - padH;
  // half a pixel of slack: fractional widths can round up past the row and wrap the last column
  const colW = inner > 0 ? (inner - colGap * (cols - 1)) / cols - 0.5 : null;
  const wrap = (child, i) => {
    if (!React.isValidElement(child)) return child;
    const span = Math.min(cols, parse(child.props?.className || '').meta.span || 1);
    const width = colW != null ? colW * span + colGap * (span - 1) : `${(100 / cols) * span - 2}%`;
    return (
      // alignSelf flex-start: a stretched cell gets a "definite" height and `h-full` inside it
      // resolves circularly (cards grew to thousands of px); CSS treats that h-full as auto.
      <View key={child.key ?? i} style={{ width, alignSelf: 'flex-start' }}>
        {child}
      </View>
    );
  };
  return { onLayout: (e) => setW(e.nativeEvent.layout.width), wrap };
}

function mergeText(parentText, ownText) {
  const merged = { ...parentText, ...ownText };
  // a new font size without its own line-height drops an inherited absolute one
  if (ownText.fontSize && ownText.lineHeight == null && ownText._leading == null && parentText.lineHeight != null) {
    delete merged.lineHeight;
  }
  return merged;
}

export function Box({ className, style, children, onLayout, ...rest }) {
  const parentText = useContext(TextCtx);
  const parentLayout = useContext(LayoutCtx);
  const p = parse(className);
  const textStyle = useMemo(() => mergeText(parentText, p.text), [parentText, p.text]);
  let view = p.meta.inline || p.meta.fit_w ? p.view : autoWidth(p.view);
  view = inlineFix(view, parentLayout, p.meta.inline || p.meta.fit_w);
  view = rowShrink(view, parentLayout, children);
  view = fullHeight(view, parentLayout);
  const isFlex = !!p.meta.flex;
  const layout = useMemo(
    () => ({ flex: isFlex, row: isFlex && !p.meta.grid && (view.flexDirection === 'row' || view.flexDirection === 'row-reverse'), align: textStyle.textAlign }),
    [isFlex, p.meta.grid, view.flexDirection, textStyle.textAlign]
  );
  const grid = useGrid(p.meta, view);
  let content = renderChildren(children, isFlex);
  if (grid.wrap) content = flattenFragments(content).map(grid.wrap);
  const handleLayout = grid.onLayout || onLayout ? (e) => { grid.onLayout?.(e); onLayout?.(e); } : undefined;
  return (
    <TextCtx.Provider value={textStyle}>
      <LayoutCtx.Provider value={layout}><InTextCtx.Provider value={false}>
        {/* Android loses the corner radius when a shadow is added to a mounted view: re-create it */}
        <View key={view.boxShadow ? 'shadow' : 'flat'} style={[view, style]} onLayout={handleLayout} {...rest}>
          {content}
        </View>
      </InTextCtx.Provider></LayoutCtx.Provider>
    </TextCtx.Provider>
  );
}

// Nested <Text> ignores margins; the web uses `mx-1` etc. on inline spans for spacing,
// so turn horizontal margins into spaces of roughly the same width.
function marginSpaces(view, fontSize) {
  const l = view.marginLeft ?? view.marginHorizontal ?? 0;
  const r = view.marginRight ?? view.marginHorizontal ?? 0;
  if (!l && !r) return null;
  const sp = (fontSize || 14) * 0.28;
  const n = (px) => (typeof px === 'number' && px > 0 ? ' '.repeat(Math.max(1, Math.round(px / sp))) : '');
  return [n(l), n(r)];
}

export function Txt({ className, style, children, numberOfLines, ...rest }) {
  const parentText = useContext(TextCtx);
  const parentLayout = useContext(LayoutCtx);
  const inText = useContext(InTextCtx);
  const p = parse(className);
  // A span with `flex items-center gap-2` (icon/badge + label) is a flex box on the web; RN text
  // can't lay out children with width/height/gap, so render it as a Box that passes text styles down.
  if (p.meta.flex && !rest.onPress) {
    return <Box className={className} style={style} {...rest}>{children}</Box>;
  }
  const merged = mergeText(parentText, p.text);
  const textStyle = finalizeText(merged);
  let view = autoWidth(p.view);
  if (inText) {
    const spaces = marginSpaces(view, merged.fontSize);
    if (spaces) {
      const { marginLeft: _l, marginRight: _r, marginHorizontal: _h, ...restView } = view;
      view = restView;
      children = <>{spaces[0]}{children}{spaces[1]}</>;
    }
  }
  const hasBox = view.backgroundColor || view.paddingLeft || view.paddingTop || view.borderWidth || view.borderRadius;
  view = inlineFix(view, parentLayout, hasBox || p.meta.inline || p.meta.fit_w);
  view = rowShrink(view, parentLayout, children);
  const lines = numberOfLines ?? p.meta.lines ?? (p.meta.nowrap ? 1 : undefined);
  // Content-sized text (e.g. a centred heading) is measured at its exact width and then laid out at a
  // pixel-rounded-down width, so Android wraps the last word onto a hidden line ("Your Cart is" + lost
  // "Empty"). One pixel of slack keeps it on one line.
  if (!inText && view.width == null) view = { ...view, paddingRight: (view.paddingRight ?? view.paddingHorizontal ?? view.padding ?? 0) + 1 };
  return (
    <TextCtx.Provider value={merged}>
      <InTextCtx.Provider value>
        <Text
          style={[view, textStyle, style]}
          // measure and draw with the same line breaking, or Android clips the last word of bold headings
          textBreakStrategy="simple"
          numberOfLines={lines}
          ellipsizeMode={p.meta.nowrap && !p.meta.ellipsis ? 'clip' : 'tail'}
          {...rest}
        >
          {children}
        </Text>
      </InTextCtx.Provider>
    </TextCtx.Provider>
  );
}

export function Btn({ className, style, children, onPress, disabled, onLongPress, hitSlop, accessibilityLabel, ...rest }) {
  const parentText = useContext(TextCtx);
  const parentLayout = useContext(LayoutCtx);
  const cls = disabled ? cx(className, variantClasses(className, 'disabled')) : className;
  const p = parse(cls);
  const textStyle = useMemo(() => mergeText(p.meta.block ? parentText : { textAlign: 'center', ...parentText }, p.text), [parentText, p.text, p.meta.block]);
  let view = p.view;
  view = inlineFix(view, parentLayout, !p.meta.block);
  view = rowShrink(view, parentLayout, children);
  view = fullHeight(view, parentLayout);
  const isFlex = !!p.meta.flex;
  const layout = useMemo(
    () => ({ flex: isFlex, row: isFlex && (view.flexDirection === 'row' || view.flexDirection === 'row-reverse'), align: textStyle.textAlign }),
    [isFlex, view.flexDirection, textStyle.textAlign]
  );
  const grid = useGrid(p.meta, view);
  let content = renderChildren(children, isFlex);
  if (!isFlex && content && !Array.isArray(content) && React.isValidElement(content) && content.type !== Txt && content.type !== Box) {
    // button content is centered on web (text-align:center + inline content)
    view = { alignItems: textStyle.textAlign === 'left' ? 'flex-start' : 'center', ...view };
  }
  // A web <button> centres its content vertically (e.g. `h-10` size chips); clickable divs (block) don't.
  if (!isFlex && !p.meta.block) view = { justifyContent: 'center', ...view };
  if (grid.wrap) content = flattenFragments(content).map(grid.wrap);
  return (
    <TextCtx.Provider value={textStyle}>
      <LayoutCtx.Provider value={layout}><InTextCtx.Provider value={false}>
        {onPress || onLongPress || rest.accessibilityRole ? (
          <Pressable
            key={view.boxShadow ? 'shadow' : 'flat'}
            onPress={onPress}
            onLongPress={onLongPress}
            disabled={disabled}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onLayout={grid.onLayout}
            style={({ pressed }) => [view, style, pressed && !disabled ? { opacity: 0.7 } : null]}
            {...rest}
          >
            {content}
          </Pressable>
        ) : (
          // A button without a handler (decorative "View >" inside a tappable card) must not
          // capture the touch, so the card underneath receives it like on the web.
          <View key={view.boxShadow ? 'shadow' : 'flat'} style={[view, style]} onLayout={grid.onLayout} accessibilityLabel={accessibilityLabel} {...rest}>
            {content}
          </View>
        )}
      </InTextCtx.Provider></LayoutCtx.Provider>
    </TextCtx.Provider>
  );
}

const FIT = { cover: 'cover', contain: 'contain', fill: 'fill', none: 'none', 'scale-down': 'scale-down' };

export function Img({ src, fallback, className, style, alt, contentFit, onError, onLoad, autoHeight, ...rest }) {
  const parentLayout = useContext(LayoutCtx);
  const [failed, setFailed] = useState(false);
  const [ratio, setRatio] = useState(null);
  const p = parse(className);
  let view = rowShrink(p.view, parentLayout);
  view = fullHeight(view, parentLayout);
  const source = resolveImageSource(failed && fallback ? fallback : src);
  return (
    <ExpoImage
      source={source}
      style={[view, autoHeight ? { aspectRatio: ratio || 2.6, height: undefined } : null, style]}
      contentFit={contentFit || FIT[p.meta.fit] || 'cover'}
      onLoad={(e) => {
        if (autoHeight && e?.source?.width && e?.source?.height) setRatio(e.source.width / e.source.height);
        onLoad?.(e);
      }}
      accessibilityLabel={alt}
      transition={150}
      cachePolicy="memory-disk"
      onError={(e) => {
        if (fallback && !failed) setFailed(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}

/** Icon: <I icon={ArrowRight} className="w-5 h-5 text-primary" /> — color inherits like currentColor */
export function I({ icon: Icon, size, color, className, strokeWidth, fill, style }) {
  const parentText = useContext(TextCtx);
  if (!Icon) return null;
  const p = parse(className);
  const s = size ?? p.view.width ?? p.view.height ?? 24;
  const c = color || p.text.color || parentText.color || '#111827';
  let f = fill === 'currentColor' ? c : fill;
  let sw = strokeWidth;
  (className || '').split(/\s+/).forEach((tok) => {
    if (tok === 'fill-current') f = c;
    else if (tok.startsWith('fill-') && !f) f = twColor(tok.slice(5));
    const m = tok.match(/^stroke-\[([\d.]+)\]$/) || tok.match(/^stroke-(\d)$/);
    if (m && sw == null) sw = Number(m[1]);
  });
  const view = p.view.width ? { ...p.view, width: undefined, height: undefined } : p.view;
  return <Icon size={s} color={c} strokeWidth={sw ?? 2} fill={f || 'none'} style={[{ pointerEvents: 'none' }, view, style]} />;
}

export const Input = React.forwardRef(function Input({ className, style, placeholderTextColor, multiline, rows, numberOfLines, ...rest }, ref) {
  // web <textarea rows="2">: Android crashes on a non-numeric numberOfLines, and rows implies multiline
  // web maxLength only limits typing; Android also cuts a longer existing value (e.g. +91 phone shown as 10 digits)
  if (rest.maxLength != null && rest.value != null && String(rest.value).length > Number(rest.maxLength)) {
    rest.maxLength = String(rest.value).length;
  }
  const lines = rows ?? numberOfLines;
  if (lines != null) {
    rest.numberOfLines = Number(lines) || undefined;
    multiline = true;
  }
  const parentText = useContext(TextCtx);
  const parentLayout = useContext(LayoutCtx);
  const p = parse(className);
  const view = fullHeight(rowShrink(p.view, parentLayout), parentLayout);
  const merged = mergeText(parentText, p.text);
  const textStyle = finalizeText(merged);
  delete textStyle.lineHeight;
  const ph = parse(variantClasses(className, 'placeholder')).text.color;
  return (
    <TextInput
      ref={ref}
      style={[{ paddingVertical: 0 }, view, textStyle, multiline ? { textAlignVertical: 'top' } : null, style]}
      placeholderTextColor={placeholderTextColor || ph || '#9ca3af'}
      multiline={multiline}
      {...rest}
    />
  );
});

export const Scroll = React.forwardRef(function Scroll({ className, contentClassName, style, contentContainerStyle, children, ...rest }, ref) {
  const p = parse(className);
  const c = parse(contentClassName);
  const isFlex = !!c.meta.flex;
  const layout = { flex: isFlex, row: !!rest.horizontal, align: undefined };
  return (
    <LayoutCtx.Provider value={layout}><InTextCtx.Provider value={false}>
      <ScrollView
        ref={ref}
        style={[p.view, style]}
        contentContainerStyle={[c.view, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...rest}
      >
        {children}
      </ScrollView>
    </InTextCtx.Provider></LayoutCtx.Provider>
  );
});

export { TextCtx, LayoutCtx, cx };
