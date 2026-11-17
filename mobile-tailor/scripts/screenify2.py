#!/usr/bin/env python3
"""Dev helper used during conversion.
screenify2.py <file> --after "<marker>" [--before "<marker>"] [--nav]
 - every `<Box className="...min-h-screen...">` element -> <Screen className="BG"><Box className="flex-1 ...">…</Box></Screen>
 - the main root (last such element) gets <Scroll className="flex-1" contentClassName="pb-*"> inserted
   right after the element that starts at --after marker, closed before --before marker (or before root end)
 - --nav: Screen bottom={false} (BottomNav page)
"""
import re, sys
args = sys.argv[1:]
path = args[0]
after = args[args.index('--after') + 1] if '--after' in args else None
before = args[args.index('--before') + 1] if '--before' in args else None
nav = '--nav' in args
s = open(path).read()
TAG = re.compile(r'<(Box|Btn|Txt|Scroll)\b[^>]*?/>|<(Box|Btn|Txt|Scroll)\b|</(Box|Btn|Txt|Scroll)>')

def match_close(s, start_end, name='Box'):
    pos = start_end; depth = 1
    while depth:
        t = TAG.search(s, pos)
        if not t: raise SystemExit('unbalanced')
        g = t.group(0)
        if g.startswith('</'):
            if t.group(3) == name: depth -= 1
        elif not g.endswith('/>') and (t.group(2) == name): depth += 1
        pos = t.end()
    return pos - len(f'</{name}>'), pos

roots = list(re.finditer(r'<Box className="([^"]*min-h-(?:screen|\[100dvh\])[^"]*)"', s))
if not roots: raise SystemExit('no roots')
main = roots[-1]
# process from last to first so offsets stay valid
for m in reversed(roots):
    cls = m.group(1).split()
    bg = next((c for c in cls if c.startswith('bg-') and '/' not in c), 'bg-white')
    rest = ' '.join(c for c in cls if not c.startswith('min-h-') and not re.match(r'^pb-\d', c) and c not in ('max-w-lg', 'max-w-md', 'max-w-2xl', 'mx-auto'))
    pb = ' '.join(c for c in cls if re.match(r'^pb-\d', c))
    ALIGN = re.compile(r'^(items-|justify-|flex$|flex-col$|flex-row$|gap-|space-y-)')
    if m.start() == main.start() and after:
        moved = [c for c in rest.split() if ALIGN.match(c)]
        rest = ' '.join(c for c in rest.split() if not ALIGN.match(c))
        pb = (pb + ' ' + ' '.join(moved)).strip()
    open_end = s.index('>', m.end()) + 1
    cs, ce = match_close(s, open_end)
    is_main = m.start() == main.start()
    inner = s[open_end:cs]
    if is_main and after == '^':
        b = inner.find(before) if before else -1
        end = b if b >= 0 else len(inner)
        inner = f'\n            <Scroll className="flex-1" contentClassName="{pb}">' + inner[:end] + '            </Scroll>\n' + inner[end:]
    elif is_main and after:
        a = inner.find(after)
        if a < 0: raise SystemExit(f'after marker not found: {after}')
        # element starting at/after marker
        t = re.compile(r'<(Box|Btn|Txt|[A-Z]\w*)\b').search(inner, a)
        name = t.group(1)
        oe = inner.index('>', t.start()) + 1
        if inner[oe - 2] == '/':
            ins = oe
        else:
            if name in ('Box', 'Btn', 'Txt', 'Scroll'):
                _, ins = match_close(inner, oe, name)
            else:
                ins = inner.index(f'</{name}>', oe) + len(f'</{name}>')
        b = inner.find(before, ins) if before else -1
        end = b if b >= 0 else len(inner)
        inner = inner[:ins] + f'\n            <Scroll className="flex-1" contentClassName="{pb}">' + inner[ins:end] + '            </Scroll>\n' + inner[end:]
    new = f'<Screen className="{bg}"{" bottom={false}" if (nav and is_main) else ""}><Box className="flex-1 {rest}">' + inner + '</Box></Screen>'
    s = s[:m.start()] + new + s[ce:]
if 'import Screen' not in s:
    depth = path.split('src/')[1].count('/')
    s = s.replace("import React", f"import Screen from '{'../' * depth}components/common/Screen';\nimport React", 1)
open(path, 'w').write(s)
print('ok', path)
