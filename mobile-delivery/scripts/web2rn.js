/*
 * Dev-only codemod used during the conversion: web React (Tailwind JSX) -> RN primitives.
 *   node scripts/web2rn.js <web file> <target file>
 * Output always needs a manual review pass (forms, file inputs, browser APIs are flagged with TODO-RN).
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const [, , srcFile, outFile] = process.argv;
const WEB = path.resolve(__dirname, '../../frontend/src');
const APP = path.resolve(__dirname, '../src');
const code = fs.readFileSync(srcFile, 'utf8');
const ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });

const BOX = new Set(['div', 'section', 'form', 'header', 'footer', 'main', 'nav', 'ul', 'ol', 'li', 'article', 'aside', 'table', 'tbody', 'thead', 'tr', 'figure', 'fieldset', 'details', 'summary', 'dl', 'dd', 'dt']);
const TXT = new Set(['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'strong', 'b', 'em', 'small', 'i', 'td', 'th', 'sup', 'sub', 'u', 'code', 'pre', 'blockquote', 'time']);
const BTN = new Set(['button', 'a', 'Link', 'NavLink']);
const DROP_ATTRS = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap', 'whileHover', 'whileInView', 'viewport', 'layout', 'layoutId', 'variants', 'custom', 'type', 'htmlFor', 'id', 'role', 'tabIndex', 'aria-label', 'aria-hidden', 'title', 'loading', 'decoding', 'draggable', 'width', 'height', 'target', 'rel', 'onMouseEnter', 'onMouseLeave', 'onMouseDown', 'onMouseUp', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'ref', 'name', 'autoComplete', 'onKeyDown', 'onKeyPress', 'onFocus', 'onBlur', 'required', 'min', 'max', 'step', 'colSpan', 'rowSpan', 'dir', 'lang', 'spellCheck', 'onDragOver', 'onDrop']);

const lucideIcons = new Set();
const usedPrims = new Set();
const notes = [];

const mapModule = (src) => {
  if (src === 'lucide-react') return 'lucide-react-native';
  if (src === 'react-router-dom') return '__NAV__';
  if (src === 'react-hot-toast') return '__TOAST__';
  if (src === 'framer-motion' || src === 'clsx' || src === 'tailwind-merge') return null;
  if (!src.startsWith('.')) return src;
  const abs = path.resolve(path.dirname(srcFile), src);
  let rel = path.relative(WEB, abs).split(path.sep).join('/');
  const table = [
    [/^utils\/api$/, 'lib/api'], [/^utils\/auth$/, 'lib/auth'], [/^config\/constants$/, 'lib/config'],
    [/^utils\/cn$/, 'lib/cn'], [/^utils\/(.+)$/, 'utils/$1'], [/^store\/(.+)$/, 'store/$1'], [/^hooks\/(.+)$/, 'hooks/$1'],
    [/^components\/Common\/(.+)$/, 'components/common/$1'], [/^components\/ui\/(.+)$/, 'components/ui/$1'],
    [/^modules\/customer\/components\/checkout\/summary\/(.+)$/, 'components/customer/checkout/$1'],
    [/^modules\/customer\/components\/checkout\/address\/(.+)$/, 'components/customer/checkout/$1'],
    [/^modules\/customer\/components\/(.+)$/, 'components/customer/$1'], [/^modules\/customer\/pages\/(.+)$/, 'screens/$1'],
    [/^modules\/customer\/context\/(.+)$/, 'context/$1'], [/^modules\/common\/pages\/(.+)$/, 'screens/$1'],
    [/^shared\/hooks\/(.+)$/, 'shared/hooks/$1'], [/^shared\/components\/(.+)$/, 'components/shared/$1'],
    [/^shared\/utils\/api$/, 'lib/api'], [/^shared\/utils\/(.+)$/, 'utils/$1'],
    // tailor (partner) app
    [/^modules\/tailor\/services\/api$/, 'lib/api'], [/^modules\/tailor\/pages\/(.+)$/, 'screens/$1'],
    [/^modules\/tailor\/components\/(.+)$/, 'components/tailor/$1'], [/^modules\/tailor\/context\/(.+)$/, 'context/tailor/$1'],
    [/^modules\/tailor\/layouts\/(.+)$/, 'components/tailor/$1'], [/^layouts\/(.+)$/, 'components/tailor/$1'],
    [/^modules\/admin\/components\/(.+)$/, 'components/admin/$1'], [/^modules\/admin\/constants\/(.+)$/, 'utils/admin/$1'],
    [/^config\/maps$/, 'lib/config'],
    // delivery app
    [/^modules\/delivery\/pages\/(?:[A-Za-z]+\/)?(.+)$/, 'screens/$1'], [/^modules\/delivery\/components\/(?:Layout\/)?(.+)$/, 'components/delivery/$1'],
    [/^modules\/delivery\/layouts\/(.+)$/, 'components/delivery/$1'], [/^modules\/delivery\/store\/(.+)$/, 'store/$1'],
    [/^modules\/delivery\/services\/(.+)$/, 'lib/$1'], [/^modules\/delivery\/utils\/(.+)$/, 'utils/$1'],
  ];
  for (const [re, rep] of table) if (re.test(rel)) { rel = rel.replace(re, rep); break; }
  return `__APP__/${rel}`;
};

const jsxName = (n) => (t.isJSXIdentifier(n) ? n.name : t.isJSXMemberExpression(n) ? `${n.object.name}.${n.property.name}` : null);
const setName = (el, name) => {
  el.openingElement.name = t.jsxIdentifier(name);
  if (el.closingElement) el.closingElement.name = t.jsxIdentifier(name);
};
const attr = (el, name) => el.openingElement.attributes.find((a) => t.isJSXAttribute(a) && a.name.name === name);

traverse(ast, {
  ImportDeclaration(p) {
    const m = mapModule(p.node.source.value);
    if (m === null) { p.remove(); return; }
    if (p.node.source.value === 'lucide-react') p.node.specifiers.forEach((s) => lucideIcons.add(s.local.name));
    if (/\.(png|jpe?g|webp|mp3|mpeg)(\?url)?$/.test(p.node.source.value)) notes.push(`asset import: ${p.node.source.value}`);
    p.node.source = t.stringLiteral(m);
  },
  JSXElement(p) {
    const el = p.node;
    const name = jsxName(el.openingElement.name);
    if (!name) return;
    const typeA = attr(el, 'type');
    const typeVal = typeA && t.isStringLiteral(typeA.value) ? typeA.value.value : null;
    // strip unsupported attrs
    const isDom = /^[a-z]/.test(name) || name.startsWith('motion.');
    if (isDom) el.openingElement.attributes = el.openingElement.attributes.filter((a) => !(t.isJSXAttribute(a) && DROP_ATTRS.has(a.name.name)));
    const onClick = attr(el, 'onClick');
    if (onClick) onClick.name = t.jsxIdentifier('onPress');
    if (!onClick && name === 'button' && typeVal === 'submit') {
      const formP = p.findParent((pp) => pp.isJSXElement() && attr(pp.node, 'onSubmit'));
      const sub = formP && attr(formP.node, 'onSubmit');
      if (sub && t.isJSXExpressionContainer(sub.value)) {
        el.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier('onPress'), t.jsxExpressionContainer(t.cloneNode(sub.value.expression))));
      }
    }
    if (name === 'form') {
      el.openingElement.attributes = el.openingElement.attributes.filter((a) => !(t.isJSXAttribute(a) && a.name.name === 'onSubmit'));
    }
    if (name === 'AnimatePresence') { setName(el, 'React.Fragment'); el.openingElement.attributes = []; return; }
    if (name === 'React.Fragment' || name === 'Fragment') return;
    const base = name.startsWith('motion.') ? name.slice(7) : name;
    if (lucideIcons.has(base) && (base === 'Loader2' || base === 'Loader') && /animate-spin/.test(code.slice(el.start, el.end))) {
      setName(el, 'Spin'); usedPrims.add('__SPIN__'); return;
    }
    if (lucideIcons.has(base)) {
      el.openingElement.attributes.unshift(t.jsxAttribute(t.jsxIdentifier('icon'), t.jsxExpressionContainer(t.identifier(base))));
      setName(el, 'I'); usedPrims.add('I'); return;
    }
    if (base === 'img') {
      const oe = attr(el, 'onError');
      if (oe) {
        const src = code.slice(oe.start, oe.end);
        const m = src.match(/\.src\s*=\s*(['"`])([^'"`]+)\1/);
        el.openingElement.attributes = el.openingElement.attributes.filter((a) => a !== oe);
        if (m) el.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier('fallback'), t.stringLiteral(m[2])));
        else notes.push(`img onError at line ${el.loc?.start.line}`);
      }
      setName(el, 'Img'); usedPrims.add('Img'); return;
    }
    if (base === 'input' || base === 'textarea' || base === 'select') {
      if (base === 'textarea') el.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier('multiline')));
      const oc = attr(el, 'onChange');
      if (oc) {
        const fn = t.isJSXExpressionContainer(oc.value) ? oc.value.expression : null;
        const prm = fn && (t.isArrowFunctionExpression(fn) || t.isFunctionExpression(fn)) && fn.params[0] && t.isIdentifier(fn.params[0]) ? fn.params[0].name : null;
        const src = fn ? code.slice(fn.start, fn.end) : '';
        const onlyValue = prm && !new RegExp(`\\b${prm}\\.(?!target\\.value)`).test(src);
        if (onlyValue) {
          traverse(fn, {
            noScope: true,
            MemberExpression(mp) {
              const n = mp.node;
              if (t.isMemberExpression(n.object) && t.isIdentifier(n.object.object, { name: prm }) && t.isIdentifier(n.object.property, { name: 'target' }) && t.isIdentifier(n.property, { name: 'value' })) mp.replaceWith(t.identifier(prm));
            },
          }, p.scope, p);
          oc.name = t.jsxIdentifier('onChangeText');
        } else oc.name = t.jsxIdentifier('onChangeText__TODO');
      }
      const kb = { email: 'email-address', tel: 'phone-pad', number: 'numeric' }[typeVal];
      if (kb) el.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier('keyboardType'), t.stringLiteral(kb)));
      if (typeVal === 'password') el.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier('secureTextEntry')));
      if (typeVal === 'checkbox' || typeVal === 'radio' || typeVal === 'file' || typeVal === 'date' || typeVal === 'range') notes.push(`input type=${typeVal} at line ${el.loc?.start.line}`);
      setName(el, base === 'select' ? 'Select__TODO' : 'Input'); usedPrims.add('Input');
      notes.push(`form control <${base}> at line ${el.loc?.start.line}`);
      return;
    }
    if (BTN.has(base) || ((BOX.has(base) || base === 'svg') && onClick)) {
      const to = attr(el, 'to') || attr(el, 'href');
      if (to && !onClick) {
        to.name = t.jsxIdentifier('onPress');
        const v = t.isJSXExpressionContainer(to.value) ? to.value.expression : to.value;
        to.value = t.jsxExpressionContainer(t.arrowFunctionExpression([], t.callExpression(t.identifier('navigate'), [v])));
      } else if (to) {
        el.openingElement.attributes = el.openingElement.attributes.filter((a) => a !== to);
      }
      if (BOX.has(base)) {
        const ca = attr(el, 'className');
        if (ca && t.isStringLiteral(ca.value)) ca.value = t.stringLiteral(`block ${ca.value.value}`);
        else if (ca && t.isJSXExpressionContainer(ca.value)) ca.value = t.jsxExpressionContainer(t.templateLiteral([t.templateElement({ raw: 'block ', cooked: 'block ' }), t.templateElement({ raw: '', cooked: '' }, true)], [ca.value.expression]));
        else el.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier('className'), t.stringLiteral('block')));
      }
      setName(el, 'Btn'); usedPrims.add('Btn'); return;
    }
    if (BOX.has(base)) {
      const ca = attr(el, 'className');
      const cls = ca ? code.slice(ca.start, ca.end) : '';
      if (/overflow-x-auto|overflow-y-auto|overflow-auto/.test(cls)) {
        if (t.isStringLiteral(ca.value)) {
          const toks = ca.value.value.split(/\s+/).filter(Boolean);
          const isContent = (k) => /^(p[xytblr]?-|space-|gap-|flex$|flex-col|flex-row|flex-wrap|items-|justify-|divide-|snap-)/.test(k);
          const outer = toks.filter((k) => !isContent(k) && !/overflow/.test(k)).join(' ');
          const inner = toks.filter(isContent).join(' ');
          el.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier('className'), t.stringLiteral(outer)));
          ca.value = t.stringLiteral(inner);
        }
        ca.name = t.jsxIdentifier('contentClassName');
        if (/overflow-x-auto/.test(cls)) el.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier('horizontal')));
        else el.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier('nestedScrollEnabled')));
        setName(el, 'Scroll'); return;
      }
      setName(el, 'Box'); usedPrims.add('Box'); return;
    }
    if (TXT.has(base)) { setName(el, 'Txt'); usedPrims.add('Txt'); return; }
    if (base === 'br') { p.replaceWith(t.jsxText('\n')); return; }
    if (base === 'svg' || base === 'iframe' || base === 'video' || base === 'audio' || base === 'canvas') notes.push(`<${base}> at line ${el.loc?.start.line}`);
  },
  CallExpression(p) {
    const c = p.node.callee;
    if (t.isMemberExpression(c) && t.isIdentifier(c.property, { name: 'stopPropagation' })) {
      if (p.parentPath.isExpressionStatement()) p.parentPath.remove();
    }
    if (t.isMemberExpression(c) && t.isIdentifier(c.property, { name: 'preventDefault' }) && p.parentPath.isExpressionStatement()) p.parentPath.remove();
  },
  MemberExpression(p) {
    const o = p.node.object;
    if (t.isIdentifier(o) && ['window', 'document', 'localStorage', 'sessionStorage', 'navigator'].includes(o.name)) {
      notes.push(`browser API ${o.name}.${p.node.property.name || ''} at line ${p.node.loc?.start.line}`);
    }
  },
});

let out = generate(ast, { retainLines: false, jsescOption: { minimal: true } }, code).code;
const relTo = (target) => {
  let r = path.relative(path.dirname(outFile), path.join(APP, target)).split(path.sep).join('/');
  return r.startsWith('.') ? r : `./${r}`;
};
out = out.replace(/"__APP__\/([^"]+)"/g, (_, p1) => `"${relTo(p1)}"`).replace(/'__APP__\/([^']+)'/g, (_, p1) => `'${relTo(p1)}'`);
out = out.replace(/["']__NAV__["']/g, `'${relTo('lib/nav')}'`).replace(/import \{\s*toast\s*\} from ["']__TOAST__["']/g, `import toast from '${relTo('lib/toast')}'`).replace(/["']__TOAST__["']/g, `'${relTo('lib/toast')}'`);
out = out.replace(/import \{([^}]*)\} from '([^']*lib\/nav)'/, (m, names, mod) => `import {${names.replace(/\bLink\b,?|\bNavLink\b,?|\bOutlet\b,?/g, '')}} from '${mod}'`);
const spin = usedPrims.delete('__SPIN__');
const prims = [...usedPrims, 'Scroll'].join(', ');
out = `// Port of ${path.relative(WEB, srcFile)} (converted with scripts/web2rn.js, then reviewed)\n${out}`;
out = out.replace(/(\nimport [^\n]+\n)(?!import)/, `$1import { ${prims} } from '${relTo('components/ui/primitives')}';\n`);
if (spin) out = out.replace(/(import \{[^}]*\} from '[^']*components\/ui\/primitives';\n)/, `$1import Spin from '${relTo('components/ui/Spin')}';\n`);
if (notes.length) out += `\n/* TODO-RN review:\n${[...new Set(notes)].map((n) => ` * ${n}`).join('\n')}\n */\n`;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, out);
console.log(`${outFile}: ${notes.length} notes`);
