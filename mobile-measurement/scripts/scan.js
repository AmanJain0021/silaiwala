// SOP 9.4 AST scans: lowercase (DOM) JSX elements, web-only props, and Btn without onPress.
// usage: node scripts/scan.js [srcDir]
const fs = require('fs');
const path = require('path');
const parser = require(require.resolve('@babel/parser', { paths: [path.join(__dirname, '..')] }));

const root = process.argv[2] || path.join(__dirname, '..', 'src');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.jsx?$/.test(e.name) ? [path.join(d, e.name)] : []));
const WEB_PROPS = new Set(['dangerouslySetInnerHTML', 'htmlFor', 'onClick', 'onSubmit', 'onMouseEnter', 'onChangeText__TODO']);
const report = { dom: [], props: [], noPress: [] };

for (const f of walk(root)) {
  if (f.endsWith('assetMap.js')) continue;
  const src = fs.readFileSync(f, 'utf8');
  let ast;
  try { ast = parser.parse(src, { sourceType: 'module', plugins: ['jsx'] }); } catch (e) { console.log('PARSE', f, e.message); continue; }
  const rel = path.relative(root, f);
  const visit = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(visit); return; }
    if (n.type === 'JSXOpeningElement') {
      if (n.name.type === 'JSXIdentifier' && /^[a-z]/.test(n.name.name)) report.dom.push(`${rel}:${n.loc.start.line} <${n.name.name}>`);
      if (n.name.name === 'Btn') {
        const names = n.attributes.map((a) => a.name?.name || '...');
        if (!names.includes('onPress') && !names.includes('...')) {
          report.noPress.push(`${rel}:${n.loc.start.line} ${src.slice(n.end, n.end + 70).replace(/\s+/g, ' ')}`);
        }
      }
    }
    if (n.type === 'JSXAttribute' && WEB_PROPS.has(n.name.name)) report.props.push(`${rel}:${n.loc.start.line} ${n.name.name}`);
    for (const k in n) if (k !== 'loc') visit(n[k]);
  };
  visit(ast.program);
}
for (const [k, list] of Object.entries(report)) {
  console.log(`== ${k}: ${list.length}`);
  list.slice(0, 60).forEach((l) => console.log('  ' + l));
}
