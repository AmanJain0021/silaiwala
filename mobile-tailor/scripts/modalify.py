#!/usr/bin/env python3
"""Dev helper: web overlay modal -> Dialog/Sheet.
modalify.py <file> [--visible EXPR] [--close EXPR]
Finds `<Box className="fixed inset-0 ...">` (or Btn) overlays; drops backdrop children
(`absolute inset-0` / `fixed inset-0` elements); the remaining first element becomes the
Dialog (centered) or Sheet (items-end) card. `if (!X) return null;` becomes visible={!!X}.
"""
import re, sys
args = sys.argv[1:]
path = args[0]
vis_arg = args[args.index('--visible') + 1] if '--visible' in args else None
close_arg = args[args.index('--close') + 1] if '--close' in args else 'onClose'
s = open(path).read()
TAG = re.compile(r'<(Box|Btn|Scroll)\b(?:[^<>]|=>|\{[^{}]*\})*?/>|<(Box|Btn|Scroll)\b|</(Box|Btn|Scroll)>')

def close_of(s, start):
    m = re.match(r'<(Box|Btn|Scroll)\b', s[start:])
    name = m.group(1)
    # find end of opening tag (handles => in attributes)
    depth_b = 0; i = start
    while True:
        c = s[i]
        if c == '{': depth_b += 1
        elif c == '}': depth_b -= 1
        elif c == '>' and depth_b == 0 and s[i-1] != '=':
            break
        i += 1
    open_end = i + 1
    if s[i-1] == '/': return open_end, open_end, open_end
    pos = open_end; depth = 1
    while depth:
        t = TAG.search(s, pos)
        g = t.group(0)
        if g.startswith('</'):
            if t.group(3) == name: depth -= 1
        elif g.endswith('/>'): pass
        elif t.group(2) == name: depth += 1
        pos = t.end()
    return open_end, pos - len(f'</{name}>'), pos

count = 0
while True:
    m = re.search(r'<(Box|Btn) className=(?:"|\{`|\{cn\(")[^>]*?\bfixed inset-0\b', s)
    if not m: break
    oe, cs, ce = close_of(s, m.start())
    opening = s[m.start():oe]
    sheet = 'items-end' in opening
    inner = s[oe:cs]
    # remove backdrop elements
    # only empty elements are backdrops; `absolute inset-0` elements with content (image overlays etc.) stay
    bpos = 0
    while True:
        b = re.compile(r'<(Box|Btn) className=(?:"|\{`|\{cn\(")[^"`]*?(?:absolute|fixed) inset-0[^>]*').search(inner, bpos)
        if not b: break
        boe, bcs, bce = close_of(inner, b.start())
        empty = boe == bce or not inner[boe:bcs].strip()
        if not empty:
            bpos = boe
            continue
        inner = inner[:b.start()] + inner[bce:]
    # card = first child that is not absolutely positioned (overlay close buttons sit at top-right);
    # those absolute children are kept and moved inside the card
    keep = ''
    pos0 = 0
    while True:
        card = re.search(r'<(Box|Btn|Scroll)\b', inner[pos0:])
        if not card: break
        cstart = pos0 + card.start()
        ccoe, cccs, ccce = close_of(inner, cstart)
        if re.search(r'className=(?:"|\{`)[^"`]*\babsolute\b', inner[cstart:ccoe]):
            keep += inner[cstart:ccce] + '\n'
            pos0 = ccce
            continue
        break
    card = re.search(r'<(Box|Btn|Scroll)\b', inner[pos0:])
    if card is None:
        # no card (e.g. fullscreen image overlay: <img> + close button): the overlay content is the dialog
        card_cls = 'w-full items-center'
        body = inner
    else:
        is_scroll = card.group(1) == 'Scroll'
        cstart = pos0 + card.start()
        coe, ccs, cce = close_of(inner, cstart)
        cop = inner[cstart:coe]
        cls = re.search(r'className=(?:"([^"]*)"|\{`([^`]*)`\})', cop)
        card_cls = (cls.group(1) or cls.group(2)) if cls else 'bg-white rounded-3xl w-full'
        card_cls = re.sub(r'\bblock\b|animate-[\w-]+|zoom-in-\d+|duration-\d+|slide-in-from-\w+|fade-in', '', card_cls).strip()
        if is_scroll:
            # keep the scrolling card body: Dialog takes the card look, the Scroll keeps its padding
            cc = re.search(r'contentClassName="([^"]*)"', cop)
            body = keep + f'<Scroll className="flex-shrink" contentClassName="{cc.group(1) if cc else ""}" nestedScrollEnabled>' + inner[coe:ccs] + '</Scroll>'
        else:
            body = keep + inner[coe:ccs]
    pre = s[:m.start()]
    # `{flag && other && <Box fixed inset-0>}`: open state = first flag, close = its setter (takes priority)
    cm = re.search(r'\{\(?(\w+)((?:\s*&&\s*[\w.?]+)*)\s*&&\s*$', pre)
    # component-level `if (!x) return null;` only when the overlay is not conditionally rendered inline
    vm = [] if cm else list(re.finditer(r'if \(!([\w.?]+)\) return null;\n', pre))
    visible = vis_arg or (vm[-1].group(1) if vm else 'true')
    close = close_arg
    if cm and not vis_arg:
        var = cm.group(1)
        visible = var + cm.group(2)
        reset = 'false' if re.search(r'(Open|Modal|^show|^is)', var) else 'null'
        close = f"() => set{var[0].upper()}{var[1:]}({reset})"

    comp = 'Sheet' if sheet else 'Dialog'
    new = f'<{comp} visible={{!!({visible})}} onClose={{{close}}} className={{`{card_cls}`}}>\n<Box className="flex-shrink flex flex-col overflow-hidden">{body}</Box>\n</{comp}>'
    if vm and not vis_arg:
        pre = pre[:vm[-1].start()] + pre[vm[-1].end():]
    s = pre + new + s[ce:]
    count += 1
if count and 'ui/Sheet' not in s:
    depth = path.split('src/')[1].count('/')
    s = s.replace("import React", f"import {{ Dialog, Sheet }} from '{'../' * depth}components/ui/Sheet';\nimport React", 1)
open(path, 'w').write(s)
print(f'{path}: {count} modal(s)')
