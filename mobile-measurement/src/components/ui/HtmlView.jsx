// dangerouslySetInnerHTML replacement for CMS / FAQ / legal HTML.
// Supports the tags the backend content actually uses: p, div, br, strong/b, em/i, u, a,
// ul/ol/li, h1–h6, blockquote, span. Unknown tags render their children.
import React, { useMemo } from 'react';
import { Linking } from 'react-native';
import { Box, Txt } from './primitives';

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', bull: '•', copy: '©', reg: '®', trade: '™', rupee: '₹' };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);

const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link']);
const SKIP = new Set(['style', 'script', 'head', 'title']);
const BLOCK = new Set(['p', 'div', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'section', 'article', 'table', 'tr', 'hr']);

function parse(html) {
  const root = { tag: 'root', attrs: {}, children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z][\w-]*)([^>]*)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    const top = stack[stack.length - 1];
    if (m[3] != null) { top.children.push(decode(m[3])); continue; }
    if (!m[1]) continue;
    const tag = m[1].toLowerCase();
    if (m[0][1] === '/') {
      const i = stack.map((n) => n.tag).lastIndexOf(tag);
      if (i > 0) stack.length = i;
      continue;
    }
    const attrs = {};
    m[2].replace(/([\w-]+)\s*=\s*("([^"]*)"|'([^']*)')/g, (_, k, __, a, b) => { attrs[k.toLowerCase()] = a ?? b; });
    const node = { tag, attrs, children: [] };
    if (SKIP.has(tag)) {
      const end = html.toLowerCase().indexOf(`</${tag}`, re.lastIndex);
      re.lastIndex = end < 0 ? html.length : end;
      continue;
    }
    top.children.push(node);
    if (!VOID.has(tag) && !m[2].trim().endsWith('/')) stack.push(node);
  }
  return root;
}

const TAG_CLS = {
  strong: 'font-bold', b: 'font-bold', em: 'italic', i: 'italic', u: 'underline',
  a: 'text-[#843D9B] underline',
  h1: 'text-xl font-bold', h2: 'text-lg font-bold', h3: 'text-base font-bold', h4: 'text-sm font-bold', h5: 'text-sm font-bold', h6: 'text-xs font-bold',
};

const isInline = (n) => typeof n === 'string' || !BLOCK.has(n.tag);

/**
 * <HtmlView html={…} className="space-y-2" textClassName="text-sm text-gray-700"
 *           tagClassNames={{ strong: 'text-slate-900', '.callout-box': 'bg-purple-50 p-3 rounded-xl' }} />
 */
export default function HtmlView({ html, className = '', textClassName = '', tagClassNames = {} }) {
  const tree = useMemo(() => parse(String(html || '')), [html]);
  const clsFor = (n) => {
    const own = [TAG_CLS[n.tag], tagClassNames[n.tag]];
    (n.attrs.class || '').split(/\s+/).filter(Boolean).forEach((c) => own.push(tagClassNames[`.${c}`]));
    return own.filter(Boolean).join(' ');
  };

  const renderInline = (n, key) => {
    if (typeof n === 'string') return n.replace(/\s+/g, ' ');
    if (n.tag === 'br') return '\n';
    const kids = n.children.map((c, i) => renderInline(c, i));
    const onPress = n.tag === 'a' && n.attrs.href && /^(https?:|mailto:|tel:)/.test(n.attrs.href) ? () => Linking.openURL(n.attrs.href) : undefined;
    return <Txt key={key} className={clsFor(n)} onPress={onPress}>{kids}</Txt>;
  };

  // Group consecutive inline nodes into one Txt; blocks become Box.
  const renderChildren = (children, ctx) => {
    const out = [];
    let run = [];
    const flush = () => {
      const trimmed = run.filter((c) => !(typeof c === 'string' && !c.trim()));
      if (trimmed.length) out.push(<Txt key={`t${out.length}`} className={textClassName}>{run.map((c, i) => renderInline(c, i))}</Txt>);
      run = [];
    };
    children.forEach((c) => {
      if (isInline(c)) { run.push(c); return; }
      flush();
      out.push(renderBlock(c, out.length, ctx));
    });
    flush();
    return out;
  };

  const renderBlock = (n, key, ctx = {}) => {
    if (n.tag === 'hr') return <Box key={key} className="h-px bg-gray-200 my-2" />;
    if (n.tag === 'ul' || n.tag === 'ol') {
      const items = n.children.filter((c) => typeof c !== 'string');
      return (
        <Box key={key} className={`space-y-1 ${clsFor(n)}`}>
          {items.map((li, i) => (
            <Box key={i} className="flex flex-row items-start">
              <Txt className={`${textClassName} w-5`}>{n.tag === 'ol' ? `${i + 1}.` : '•'}</Txt>
              <Box className="flex-1">{renderChildren(li.children || [li], ctx)}</Box>
            </Box>
          ))}
        </Box>
      );
    }
    const heading = /^h[1-6]$/.test(n.tag);
    if (heading) {
      return <Txt key={key} className={`${textClassName} ${clsFor(n)}`}>{n.children.map((c, i) => renderInline(c, i))}</Txt>;
    }
    const cls = n.tag === 'blockquote' ? `border-l-4 border-purple-200 pl-3 ${clsFor(n)}` : clsFor(n);
    return <Box key={key} className={`space-y-1 ${cls}`}>{renderChildren(n.children, ctx)}</Box>;
  };

  return <Box className={className}>{renderChildren(tree.children, {})}</Box>;
}
