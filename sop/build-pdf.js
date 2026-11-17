// Renders Native-Converter-SOP-v2.md -> .pdf with headless Chrome.
// Usage (from repo root): npm i --prefix /tmp/mk marked@14.1.4 && NODE_PATH=/tmp/mk/node_modules node sop/build-pdf.js  (needs google-chrome)
const fs = require('fs'); const path = require('path'); const os = require('os'); const { execFileSync } = require('child_process');
let marked;
try { ({ marked } = require('marked')); } catch { ({ marked } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'marked'))); }
const src = path.join(__dirname, 'Native-Converter-SOP-v2.md');
const out = path.join(__dirname, 'Native-Converter-SOP-v2.pdf');
const css = `@page{size:A4;margin:16mm 15mm 18mm 15mm}
body{font-family:'DejaVu Sans',sans-serif;font-size:9.6pt;line-height:1.45;color:#1f2330}
h1{font-size:17pt;color:#5b2370;margin:18px 0 6px;border-bottom:2px solid #843D9B;padding-bottom:4px;break-after:avoid}
h1:first-of-type{font-size:21pt;margin-top:0}
h2{font-size:12.5pt;color:#843D9B;margin:16px 0 4px;break-after:avoid}
p{margin:4px 0 6px} ul,ol{margin:3px 0 7px;padding-left:20px} li{margin:2px 0}
table{border-collapse:collapse;width:100%;margin:6px 0 10px;font-size:8.6pt} tr{break-inside:avoid}
th{background:#F3EAF8;color:#3d1650;text-align:left} th,td{border:1px solid #d9cfe0;padding:4px 6px;vertical-align:top}
code{font-family:'DejaVu Sans Mono',monospace;font-size:8.3pt;background:#f4f1f6;padding:0 3px;border-radius:3px}
pre{background:#1f1a24;color:#f1eaf5;padding:9px 11px;border-radius:6px;font-size:7.6pt;line-height:1.4;white-space:pre-wrap;break-inside:avoid}
pre code{background:none;color:inherit;padding:0;font-size:inherit} hr{border:none;border-top:1px solid #ddd;margin:14px 0}`;
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Native Converter SOP v2</title><style>${css}</style></head><body>${marked.parse(fs.readFileSync(src, 'utf8'))}</body></html>`;
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sop-')), 'sop.html');
fs.writeFileSync(tmp, html);
execFileSync('google-chrome', ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${out}`, `file://${tmp}`], { stdio: 'ignore' });
console.log('written', out);
