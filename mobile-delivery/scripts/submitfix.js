// Conversion fixup: a web <button type="submit"> runs its <form onSubmit={...}>. RN has no forms, so the
// matching <Btn> (same className, same-named file) gets onPress={<the form's handler>}.
// usage: node scripts/submitfix.js <appSrcDir> <webDir> [webDir...] [--write]
const fs = require('fs');
const path = require('path');
const parser = require(require.resolve('@babel/parser', { paths: [path.join(__dirname, '..')] }));

const args = process.argv.slice(2);
const write = args.includes('--write');
const [appDir, ...webDirs] = args.filter((a) => a !== '--write');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.jsx$/.test(e.name) ? [path.join(d, e.name)] : []));
const parse = (src) => parser.parse(src, { sourceType: 'module', plugins: ['jsx'], errorRecovery: true });
const norm = (s) => s.replace(/\s+/g, '').replace(/,\)/g, ')').replace(/'/g, '"');
const attr = (el, name) => el.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === name);
const text = (src, v) => (!v ? '' : v.type === 'StringLiteral' ? JSON.stringify(v.value) : src.slice(v.expression.start, v.expression.end));
const tag = (el) => (el.name.type === 'JSXIdentifier' ? el.name.name : el.name.type === 'JSXMemberExpression' ? `${el.name.object.name}.${el.name.property.name}` : '');

const byBase = {};
for (const f of walk(appDir)) (byBase[path.basename(f)] ||= []).push(f);
let total = 0;
const unmatched = [];
for (const wf of webDirs.flatMap(walk)) {
  const targets = byBase[path.basename(wf)];
  if (!targets) continue;
  const wsrc = fs.readFileSync(wf, 'utf8');
  let ast;
  try { ast = parse(wsrc); } catch { continue; }
  const wanted = [];
  const visit = (n, handler) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach((c) => visit(c, handler)); return; }
    let h = handler;
    if (n.type === 'JSXElement') {
      const op = n.openingElement;
      const name = tag(op);
      if (/^(motion\.)?form$/.test(name) && attr(op, 'onSubmit')) h = text(wsrc, attr(op, 'onSubmit').value);
      const type = attr(op, 'type');
      if (h && /^(motion\.)?button$/.test(name) && type?.value?.value === 'submit' && !attr(op, 'onClick')) {
        wanted.push({ key: norm(text(wsrc, attr(op, 'className')?.value)), handler: h });
      }
    }
    for (const k in n) if (k !== 'loc') visit(n[k], h);
  };
  visit(ast.program, null);
  if (!wanted.length) continue;
  for (const af of targets) {
    let src = fs.readFileSync(af, 'utf8');
    const edits = [];
    const a = parse(src);
    const seen = [];
    const walkApp = (n) => {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) { n.forEach(walkApp); return; }
      if (n.type === 'JSXOpeningElement' && n.name.name === 'Btn' && !attr(n, 'onPress')) seen.push(n);
      for (const k in n) if (k !== 'loc') walkApp(n[k]);
    };
    walkApp(a.program);
    seen.sort((x, y) => x.start - y.start);
    for (const w of wanted) {
      const i = seen.findIndex((n) => { const t = norm(text(src, attr(n, 'className')?.value)); return t === w.key || t === norm(`\`block ${w.key}\``); });
      if (i < 0) { unmatched.push(`${path.basename(af)}: ${w.handler}`); continue; }
      edits.push([seen[i].name.end, ` onPress={${w.handler}}`]);
      seen.splice(i, 1);
    }
    total += edits.length;
    console.log(`${path.relative(appDir, af)}: ${edits.length}/${wanted.length}`);
    if (write && edits.length) {
      for (const [p, ins] of edits.sort((x, y) => y[0] - x[0])) src = src.slice(0, p) + ins + src.slice(p);
      fs.writeFileSync(af, src);
    }
  }
}
console.log('wired', total, write ? '(written)' : '(dry run)');
if (unmatched.length) console.log('UNMATCHED:\n  ' + unmatched.join('\n  '));
