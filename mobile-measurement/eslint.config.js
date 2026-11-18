// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'android/*', 'ios/*', 'scripts/*', 'src/lib/assetMap.js'] },
  {
    rules: {
      'no-undef': 'error',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      // logic is ported verbatim from the web app; compiler-style hook rules are advisory here
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/error-boundaries': 'warn',
    },
  },
]);
