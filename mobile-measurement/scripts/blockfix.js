// Conversion fixup: a clickable <div>/<motion.div> on the web is a block element, not a <button>.
// Finds those in the web source and prefixes `block` on the matching <Btn> className in the app
// (matched by the same className text in the same-named file).
// usage: node scripts/blockfix.js <webSrcDir> <appSrcDir> [--write]
const fs = require('fs');
const path = require('path');
const parser = require(require.resolve('@babel/parser', { paths: [path.join(__dirname, '..')] }));

const [webDir, appDir, flag] = process.argv.slice(2);
const write = flag === '--write';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.jsx?$/.test(e.name) ? [path.join(d, e.name)] : []));
const parse = (src) => parser.parse(src, { sourceType: 'module', plugins: ['jsx'], errorRecovery: true });
const norm = (s) => s.replace(/\s+/g, '').replace(/,\)/g, ')').replace(/'/g, '"');
const visit = (n, fn) => {
  if (!n || typeof n !== 'object') return;
  if (Array.isArray(n)) { n.forEach((c) => visit(c, fn)); return; }
  fn(n);
  for (const k in n) if (k !== 'loc' && k !== 'start' && k !== 'end') visit(n[k], fn);
};
const attrText = (src, v) => (v.type === 'StringLiteral' ? JSON.stringify(v.value) : src.slice(v.expression.start, v.expression.end));

const byBase = {};
for (const f of walk(appDir)) (byBase[path.basename(f)] ||= []).push(f);

let total = 0;
for (const wf of walk(webDir)) {
  const targets = byBase[path.basename(wf)];
  if (!targets) continue;
  const wsrc = fs.readFileSync(wf, 'utf8');
  let wast;
  try { wast = parse(wsrc); } catch { continue; }
  const keys = new Set();
  visit(wast.program, (n) => {
    if (n.type !== 'JSXOpeningElement') return;
    const nm = n.name.type === 'JSXIdentifier' ? n.name.name : n.name.type === 'JSXMemberExpression' ? `${n.name.object.name}.${n.name.property.name}` : '';
    if (!/^(div|li|section|article|motion\.(div|li|section|article))$/.test(nm)) return;
    const attrs = Object.fromEntries(n.attributes.filter((a) => a.name).map((a) => [a.name.name, a]));
    if (!attrs.onClick || !attrs.className || !attrs.className.value) return;
    const text = attrText(wsrc, attrs.className.value);
    if (/\bblock\b/.test(text)) return;
    keys.add(norm(text));
  });
  if (!keys.size) continue;
  for (const af of targets) {
    let src = fs.readFileSync(af, 'utf8');
    let ast;
    try { ast = parse(src); } catch { continue; }
    const edits = [];
    visit(ast.program, (n) => {
      if (n.type !== 'JSXOpeningElement' || n.name.name !== 'Btn') return;
      const a = n.attributes.find((x) => x.name && x.name.name === 'className');
      if (!a || !a.value) return;
      const v = a.value;
      const text = attrText(src, v);
      if (/^["`]block\b/.test(text) || /\bblock\b/.test(text.split(/\s/)[0])) return;
      if (!keys.has(norm(text))) return;
      edits.push(v.type === 'StringLiteral' ? [v.start + 1, v.start + 1, 'block '] : [v.expression.start, v.expression.end, null]);
    });
    if (!edits.length) continue;
    total += edits.length;
    console.log(`${path.relative(appDir, af)}: ${edits.length}`);
    if (write) {
      for (const [s, e, ins] of edits.sort((x, y) => y[0] - x[0])) {
        src = ins ? src.slice(0, s) + ins + src.slice(e) : `${src.slice(0, s)}\`block \${${src.slice(s, e)}}\`${src.slice(e)}`;
      }
      fs.writeFileSync(af, src);
    }
  }
}
console.log('total', total, write ? '(written)' : '(dry run)');
