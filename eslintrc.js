// .eslintrc.js  (root)
module.exports = {
  env:     { node: true, es2022: true, browser: true },
  extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
  plugins: ['import'],
  rules: {
    'no-unused-vars':    ['warn', { argsIgnorePattern: '^_' }],
    'no-console':        'off',
    'import/order':      ['error', { 'newlines-between': 'always' }],
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/'],
};