#!/usr/bin/env python3
"""Conversion fixup: web `<label>…<input type="file" hidden onChange={h} />…</label>` patterns.

For every converted `<Input … onChangeText__TODO={HANDLER} />` that is a file input (accept=/capture=/hidden),
the enclosing element (Txt/Box/Btn) becomes a Btn whose onPress opens the native picker and calls the
original handler with a web-like event `{ target: { files: [file] } }`; the Input is removed.
`capture=` -> camera, otherwise gallery. `URL.createObjectURL(file)` -> `file.uri`.
usage: fileinputs.py <file>...
"""
import re
import sys

TAG = re.compile(r'<(/?)(Box|Btn|Txt)\b((?:[^<>]|=>|\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*?)(/?)>')


def find_input_end(s, start):
    depth, i = 0, start
    while i < len(s):
        c = s[i]
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
        elif c == '>' and depth == 0:
            return i + 1
        i += 1
    raise ValueError('unterminated <Input')


def handler_of(tag):
    m = re.search(r'onChangeText__TODO=\{', tag)
    i, depth = m.end(), 1
    while depth:
        depth += {'{': 1, '}': -1}.get(tag[i], 0)
        i += 1
    return tag[m.end():i - 1].strip()


for path in sys.argv[1:]:
    s = open(path).read()
    count = 0
    while True:
        m = re.search(r'<Input\b', s)
        found = None
        pos = 0
        while True:
            m = re.compile(r'<Input\b').search(s, pos)
            if not m:
                break
            end = find_input_end(s, m.start())
            tag = s[m.start():end]
            if 'onChangeText__TODO' in tag and re.search(r'accept=|capture=|className="hidden"', tag):
                found = (m.start(), end, tag)
                break
            pos = end
        if not found:
            break
        istart, iend, tag = found
        handler = handler_of(tag)
        camera = 'capture=' in tag
        # parent = innermost unclosed Box/Btn/Txt before the input
        stack = []
        for t in TAG.finditer(s, 0, istart):
            closing, name, _attrs, selfclose = t.group(1), t.group(2), t.group(3), t.group(4)
            if selfclose:
                continue
            if closing:
                if stack and stack[-1][0] == name:
                    stack.pop()
            else:
                stack.append((name, t.start(), t.end()))
        pname, pstart, popen_end = stack[-1]
        # matching close of the parent
        depth, pos = 1, iend
        while depth:
            t = TAG.search(s, pos)
            if t.group(2) == pname and not t.group(4):
                depth += -1 if t.group(1) else 1
            pos = t.end()
        close_start, close_end = pos - len(f'</{pname}>'), pos
        opening = s[pstart:popen_end]
        attrs = opening[len(pname) + 1:-1]
        attrs = re.sub(r'\s*onPress=\{(?:[^{}]|\{[^{}]*\})*\}', '', attrs)
        pick = f"onPress={{() => pickImage({{ camera: {'true' if camera else 'false'} }}).then(file => file && ({handler})({{ target: {{ files: [file], value: file.name }} }}))}}"
        new_open = f'<Btn {pick}{attrs}>'
        inner = s[popen_end:istart] + s[iend:close_start]
        s = s[:pstart] + new_open + inner + '</Btn>' + s[close_end:]
        count += 1
    if count:
        s = s.replace('URL.createObjectURL(file)', 'file.uri')
        if 'pickImage' not in s.split('\nconst ')[0]:
            depth = path.split('src/')[1].count('/')
            s = s.replace('import React', f"import {{ pickImage }} from '{'../' * depth}lib/files';\nimport React", 1)
        open(path, 'w').write(s)
    print(f'{path}: {count} file input(s)')
