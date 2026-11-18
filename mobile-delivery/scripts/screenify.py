#!/usr/bin/env python3
"""Dev helper used during conversion.
screenify.py <file> <content-marker> [--bottom-nav]
 - root `return <Box className="min-h-screen BG ...">` -> <Screen className="BG">
 - first <Box ...> whose className contains <content-marker> -> <Scroll className="flex-1" contentClassName="...">
   (matching </Box> -> </Scroll>); root pb-* padding moved into the scroll content
"""
import re, sys
path, marker = sys.argv[1], sys.argv[2]
bottom_nav = '--bottom-nav' in sys.argv
s = open(path).read()

m = re.search(r'return <Box className="([^"]*min-h-(?:screen|\[100dvh\])[^"]*)">', s)
if not m: sys.exit('root not found')
root_cls = m.group(1)
bg = next((c for c in root_cls.split() if c.startswith('bg-')), 'bg-white')
pb = ' '.join(c for c in root_cls.split() if re.match(r'^pb-\d', c))
s = s[:m.start()] + f'return <Screen className="{bg}"{" bottom={false}" if bottom_nav else ""}>' + s[m.end():]

# close root: last "</Box>;" before "export default" or end of component
idx = s.rfind('</Box>;')
s = s[:idx] + '</Screen>;' + s[idx + len('</Box>;'):]

# content container
cm = re.search(r'<Box className="([^"]*' + re.escape(marker) + r'[^"]*)"\s*>', s)
if not cm: sys.exit('content not found')
cls = ' '.join(c for c in cm.group(1).split() if not c.startswith('max-w') and c != 'mx-auto')
cls = (cls + ' ' + pb).strip()
start = cm.start()
# find matching close
pos = cm.end(); depth = 1
tag = re.compile(r'<Box\b[^>]*?/>|<Box\b|</Box>')
while depth:
    t = tag.search(s, pos)
    if not t: sys.exit('unbalanced')
    g = t.group(0)
    if g.startswith('</Box'): depth -= 1
    elif g.endswith('/>'): pass
    else: depth += 1
    pos = t.end()
close_start = pos - len('</Box>')
s = s[:close_start] + '</Scroll>' + s[pos:]
s = s[:start] + f'<Scroll className="flex-1" contentClassName="{cls}">' + s[cm.end():]
if "import Screen" not in s:
    rel = '../' * (path.count('/') - path.index('src/') // 1 - 1) if False else None
    depth_n = path.split('src/')[1].count('/')
    s = s.replace("import { Box", f"import Screen from '{'../' * depth_n}components/common/Screen';\nimport {{ Box", 1)
open(path, 'w').write(s)
print('ok', path)
