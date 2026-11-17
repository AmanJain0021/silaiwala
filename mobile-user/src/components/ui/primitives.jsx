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

function rowShrink(style, parentLayout) {
  if (!parentLayout.row || style.flexShrink != null || style.width != null || style.flex != null) return style;
  return { ...style, flexShrink: 1 };
}

const isInlineChild = (c) =>
  typeof c === 'string' || typeof c === 'number' || (React.isValidElement(c) && c.type === Txt);

function renderChildren(children, isFlex) {
  const arr = React.Children.toArray(children).filter((c) => c !== null && c !== false && c !== true && c !== '');
  if (!arr.length) return null;
  const hasRaw = arr.some((c) => typeof c === 'string' || typeof c === 'number');
  if (!hasRaw) return children;
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

function useGrid(meta, view) {
  const [w, setW] = useState(0);
  if (!meta.grid) return { onLayout: undefined, wrap: null };
  const cols = meta.cols || 1;
  const colGap = view.columnGap ?? view.gap ?? 0;
  const padH = (view.paddingLeft || view.paddingHorizontal || view.padding || 0) + (view.paddingRight || view.paddingHorizontal || view.padding || 0);
  const inner = w - padH;
  const colW = inner > 0 ? (inner - colGap * (cols - 1)) / cols : null;
  const wrap = (child, i) => {
    if (!React.isValidElement(child)) return child;
    const span = Math.min(cols, parse(child.props?.className || '').meta.span || 1);
    const width = colW != null ? colW * span + colGap * (span - 1) : `${(100 / cols) * span - 2}%`;
    return (
      <View key={child.key ?? i} style={{ width }}>
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
  view = rowShrink(view, parentLayout);
  const isFlex = !!p.meta.flex;
  const layout = useMemo(
    () => ({ flex: isFlex, row: isFlex && !p.meta.grid && (view.flexDirection === 'row' || view.flexDirection === 'row-reverse'), align: textStyle.textAlign }),
    [isFlex, p.meta.grid, view.flexDirection, textStyle.textAlign]
  );
  const grid = useGrid(p.meta, view);
  let content = renderChildren(children, isFlex);
  if (grid.wrap) content = React.Children.toArray(content).filter(Boolean).map(grid.wrap);
  const handleLayout = grid.onLayout || onLayout ? (e) => { grid.onLayout?.(e); onLayout?.(e); } : undefined;
  return (
    <TextCtx.Provider value={textStyle}>
      <LayoutCtx.Provider value={layout}>
        <View style={[view, style]} onLayout={handleLayout} {...rest}>
          {content}
        </View>
      </LayoutCtx.Provider>
    </TextCtx.Provider>
  );
}

export function Txt({ className, style, children, numberOfLines, ...rest }) {
  const parentText = useContext(TextCtx);
  const parentLayout = useContext(LayoutCtx);
  const p = parse(className);
  const merged = mergeText(parentText, p.text);
  const textStyle = finalizeText(merged);
  let view = autoWidth(p.view);
  const hasBox = view.backgroundColor || view.paddingLeft || view.paddingTop || view.borderWidth || view.borderRadius;
  view = inlineFix(view, parentLayout, hasBox || p.meta.inline || p.meta.fit_w);
  view = rowShrink(view, parentLayout);
  const lines = numberOfLines ?? p.meta.lines ?? (p.meta.nowrap ? 1 : undefined);
  return (
    <TextCtx.Provider value={merged}>
      <Text
        style={[view, textStyle, style]}
        numberOfLines={lines}
        ellipsizeMode={p.meta.nowrap && !p.meta.ellipsis ? 'clip' : 'tail'}
        {...rest}
      >
        {children}
      </Text>
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
  view = rowShrink(view, parentLayout);
  const isFlex = !!p.meta.flex;
  const layout = useMemo(
    () => ({ flex: isFlex, row: isFlex && (view.flexDirection === 'row' || view.flexDirection === 'row-reverse'), align: textStyle.textAlign }),
    [isFlex, view.flexDirection, textStyle.textAlign]
  );
  const grid = useGrid(p.meta, view);
  let content = renderChildren(children, isFlex);
  if (!isFlex && content && !Array.isArray(content) && React.isValidElement(content) && content.type !== Txt) {
    // button content is centered on web (text-align:center + inline content)
    view = { alignItems: textStyle.textAlign === 'left' ? 'flex-start' : 'center', ...view };
  }
  if (grid.wrap) content = React.Children.toArray(content).filter(Boolean).map(grid.wrap);
  return (
    <TextCtx.Provider value={textStyle}>
      <LayoutCtx.Provider value={layout}>
        <Pressable
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
      </LayoutCtx.Provider>
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

export const Input = React.forwardRef(function Input({ className, style, placeholderTextColor, multiline, ...rest }, ref) {
  const parentText = useContext(TextCtx);
  const p = parse(className);
  const merged = mergeText(parentText, p.text);
  const textStyle = finalizeText(merged);
  delete textStyle.lineHeight;
  const ph = parse(variantClasses(className, 'placeholder')).text.color;
  return (
    <TextInput
      ref={ref}
      style={[{ paddingVertical: 0 }, p.view, textStyle, multiline ? { textAlignVertical: 'top' } : null, style]}
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
    <LayoutCtx.Provider value={layout}>
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
    </LayoutCtx.Provider>
  );
});

export { TextCtx, LayoutCtx, cx };
