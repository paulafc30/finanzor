module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  globals: { __APP_VERSION__: 'readonly' },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'public', '.eslintrc.cjs', 'node_modules'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: '18.3' } },
  overrides: [
    {
      // Providers/contextos que exportan a la vez el componente y su hook.
      files: [
        'src/context/ThemeContext.jsx',
        'src/hooks/useMonth.jsx',
        'src/hooks/useOnboarding.jsx',
        'src/components/transactions/MovementsFilters.jsx',
      ],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
  ],
  plugins: ['react-refresh'],
  rules: {
    'react/prop-types': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
