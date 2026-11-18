#!/usr/bin/env python3
"""Dev helper: post-codemod fix-ups. fixups.py <file>...
 - removes empty `import {  } from ...`
 - injects useNavigate into components that call navigate() without defining it
 - strips the TODO-RN review trailer (call after manual review)
"""
import re, sys, os
for path in sys.argv[1:]:
    s = open(path).read()
    s = re.sub(r"import \{\s*\} from '[^']+';\n", '', s)
    if re.search(r'\bnavigate\(', s) and 'useNavigate()' not in s:
        depth = path.split('src/')[1].count('/')
        nav = '../' * depth + 'lib/nav'
        if 'useNavigate' not in s.split('const ')[0]:
            if re.search(r"from '[^']*lib/nav'", s):
                s = re.sub(r"import \{([^}]*)\} from '([^']*lib/nav)'", lambda m: f"import {{{m.group(1).rstrip()}, useNavigate }} from '{m.group(2)}'", s, 1)
            else:
                s = s.replace("import React", f"import {{ useNavigate }} from '{nav}';\nimport React", 1)
        # first component arrow body
        m = re.search(r'\nconst [A-Z]\w* = \([^)]*\) => \{\n|\nconst [A-Z]\w* = \(\{[\s\S]*?\}\) => \{\n|\nfunction [A-Z]\w*\([^)]*\) \{\n', s)
        if m:
            s = s[:m.end()] + '  const navigate = useNavigate();\n' + s[m.end():]
    def ring(m):
        cls = m.group(1)
        size = re.search(r'\bh-(\d+(?:\.\d+)?)\b', cls)
        col = re.search(r'border-((?!t-|b-|l-|r-|\d|transparent)[\w#\[\]/-]+)', cls)
        sz = int(float(size.group(1)) * 4) if size else 32
        c = col.group(1) if col else 'primary'
        return f'<Spin size={{{sz}}} className="text-{c}" />'
    s2 = re.sub(r'<Box className="([^"]*animate-spin[^"]*)"\s*(?:></Box>|/>)', ring, s)
    if s2 != s:
        s = s2
        if 'import Spin' not in s:
            depth = path.split('src/')[1].count('/')
            s = s.replace("import React", f"import Spin from '{'../' * depth}components/ui/Spin';\nimport React", 1)
    s = re.sub(r"window\.open\(([^,()]+(?:\([^()]*\))?[^,()]*),\s*'_blank'(?:,\s*'[^']*')?\)", r'Linking.openURL(\1)', s)
    s = re.sub(r"window\.open\(([^,()]+)\)", r'Linking.openURL(\1)', s)
    s = re.sub(r"window\.location\.href\s*=\s*(['\"`]/[^;\n]+);?", r'navigate(\1, { replace: true });', s)
    s = re.sub(r"window\.location\.href\s*=\s*([^;\n]+);?", r'Linking.openURL(\1);', s)
    s2 = re.sub(r'navigate\((?=[`\'"](?:https?:|tel:|mailto:|whatsapp:|sms:))', 'Linking.openURL(', s)
    if 'Linking.openURL(' in s and s2 == s: s2 = s + ''
    if s2 != s or 'Linking.openURL(' in s:
        s = s2
        if "Linking" not in s.split('const ')[0]:
            if re.search(r"from 'react-native';", s):
                s = re.sub(r"import \{([^}]*)\} from 'react-native';", lambda m: f"import {{{m.group(1).rstrip()}, Linking }} from 'react-native';", s, 1)
            else:
                s = s.replace("import React", "import { Linking } from 'react-native';\nimport React", 1)
    if 'window.Razorpay' in s:
        s = s.replace('new window.Razorpay(', 'new Razorpay(')
        s = re.sub(r'if \(!window\.Razorpay\)[^\n]*\n', '', s)
        depth = path.split('src/')[1].count('/')
        s = s.replace("import React", f"import Razorpay from '{'../' * depth}lib/razorpay';\nimport React", 1)
    if 'import.meta.env' in s:
        s = re.sub(r"import\.meta\.env\.VITE_RAZORPAY_KEY_ID(\s*\|\|\s*'[^']*')?", 'RAZORPAY_KEY_ID', s)
        s = re.sub(r"import\.meta\.env\.VITE_GOOGLE_MAPS_API_KEY(\s*\|\|\s*['\"][^'\"]*['\"])?", 'GOOGLE_MAPS_API_KEY', s)
        s = re.sub(r"import\.meta\.env\.VITE_API_URL", 'API_URL', s)
        depth = path.split('src/')[1].count('/')
        names = [n for n in ('RAZORPAY_KEY_ID', 'GOOGLE_MAPS_API_KEY', 'API_URL') if re.search(r'\b' + n + r'\b', s)]
        if names and 'lib/config' not in s:
            s = s.replace("import React", f"import {{ {', '.join(names)} }} from '{'../' * depth}lib/config';\nimport React", 1)
    if re.search(r'\blocalStorage\.', s):
        s = s.replace('localStorage.', 'storage.')
        if not re.search(r"import storage\b", s):
            depth = path.split('src/')[1].count('/')
            s = s.replace("import React", f"import storage from '{'../' * depth}lib/storage';\nimport React", 1)
    if 'window.confirm(' in s:
        # make the nearest enclosing arrow async and await the native confirm
        out = []
        idx = 0
        for m in re.finditer(r'window\.confirm\(', s):
            seg = s[idx:m.start()]
            am = list(re.finditer(r'(async\s+)?(\([^()]*\)|\b\w+)\s*=>\s*\{', seg))
            if am and not am[-1].group(1):
                a = am[-1].start()
                seg = seg[:a] + 'async ' + seg[a:]
            out.append(seg + 'await confirm(')
            idx = m.end()
        out.append(s[idx:])
        s = ''.join(out)
        if 'lib/alert' not in s:
            depth = path.split('src/')[1].count('/')
            s = s.replace("import React", f"import {{ confirm }} from '{'../' * depth}lib/alert';\nimport React", 1)
        elif 'confirm' not in s.split('lib/alert')[0].split('import')[-1]:
            s = re.sub(r"import \{([^}]*)\} from '([^']*lib/alert)';", lambda m: f"import {{{m.group(1).rstrip()}, confirm }} from '{m.group(2)}';", s, 1)
    if re.search(r'\bsessionStorage\.', s):
        s = s.replace('sessionStorage.', 'sessionStore.')
        depth = path.split('src/')[1].count('/')
        s = s.replace("import React", f"import {{ sessionStore }} from '{'../' * depth}lib/storage';\nimport React", 1)
    if re.search(r'(?<![\w.])alert\(', s) and 'lib/alert' not in s:
        depth = path.split('src/')[1].count('/')
        s = s.replace("import React", f"import {{ alert }} from '{'../' * depth}lib/alert';\nimport React", 1)
    if re.search(r'window\.confirm\(|(?<![\w.])confirm\(', s):
        print('  !! confirm() needs manual await:', path)
    def sel(m):
        attrs, body = m.group(1), m.group(2)
        opts = re.findall(r'<option value=(?:"([^"]*)"|\{([^}]*)\})[^>]*>([\s\S]*?)</option>', body)
        rest = re.sub(r'<option[\s\S]*?</option>', '', body).strip()
        if not opts or rest:
            return m.group(0)
        items = []
        for v1, v2, lab in opts:
            val = repr(v1) if v2 == '' else v2
            lab = lab.strip()
            items.append(f"{{ value: {val}, label: {repr(lab) if '{' not in lab else lab.strip('{}')} }}")
        attrs = re.sub(r'onChangeText=\{e => (\w+)\(e\)\}', r'onChange={\1}', attrs)
        attrs = re.sub(r'onChangeText=', 'onChange=', attrs)
        return f'<Select{attrs} options={{[{", ".join(items)}]}} />'
    s2 = re.sub(r'<Select__TODO((?:=>|[^>])*?)>([\s\S]*?)</Select__TODO>', sel, s)
    if s2 != s:
        s = s2
        if 'ui/Select' not in s:
            depth = path.split('src/')[1].count('/')
            s = s.replace("import React", f"import Select from '{'../' * depth}components/ui/Select';\nimport React", 1)
    if re.search(r"import \{\s*Input\s*\} from \"[^\"]*components/ui/Input\"", s):
        s = re.sub(r"(import \{[^}]*?)\bInput, ([^}]*\} from '[^']*ui/primitives')", r"\1\2", s)
        s = re.sub(r"(import \{[^}]*?), Input(\s*[,}][^}]*\} from '[^']*ui/primitives'|\s*\} from '[^']*ui/primitives')", r"\1\2", s)
    lm = re.search(r'import \{([^}]*)\} from "lucide-react-native";', s)
    if lm:
        names = [n.strip() for n in lm.group(1).split(',') if n.strip()]
        clash = [n for n in names if n in ('Box', 'Txt', 'Btn', 'I', 'Img', 'Input', 'Scroll', 'Screen', 'Select', 'Spin')]
        if clash:
            new = [f'{n} as {n}Icon' if n in clash else n for n in names]
            s = s.replace(lm.group(0), 'import { ' + ', '.join(new) + ' } from "lucide-react-native";')
            for n in clash:
                s = s.replace(f'icon={{{n}}}', f'icon={{{n}Icon}}')
    if 'useJsApiLoader' in s:
        s = re.sub(r'const \{\s*isLoaded(?:\s*,\s*loadError)?\s*\} = useJsApiLoader\(\{[\s\S]*?\}\);', 'const isLoaded = true;\n  const loadError = null;', s)
        s = re.sub(r'import \{\s*useJsApiLoader\s*\} from "@react-google-maps/api";\n', '', s)
        s = re.sub(r'const GOOGLE_MAPS_LIBRARIES = [^;]+;\n', '', s)
    if 'window.prompt(' in s:
        s = s.replace('window.prompt(', 'await prompt(')
        depth = path.split('src/')[1].count('/')
        s = s.replace("import React", f"import {{ prompt }} from '{'../' * depth}lib/prompt';\nimport React", 1)
    if 'navigator.clipboard.writeText(' in s:
        s = s.replace('navigator.clipboard.writeText(', 'Clipboard.setStringAsync(')
        s = s.replace("import React", "import * as Clipboard from 'expo-clipboard';\nimport React", 1)
    if '<Spin' in s and 'import Spin' not in s:
        depth = path.split('src/')[1].count('/')
        s = s.replace("import React", f"import Spin from '{'../' * depth}components/ui/Spin';\nimport React", 1)
    s = re.sub(r'<((?:[A-Z]\w*)?Icon|[a-z]\w*\.icon|[a-z]\w*\.Icon)(\s|/>)', r'<I icon={\1}\2', s)
    s = re.sub(r'\n/\* TODO-RN review:[\s\S]*?\*/\n?$', '\n', s)
    open(path, 'w').write(s)
    print('fixed', path)
