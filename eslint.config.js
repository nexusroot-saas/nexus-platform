import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  prettier,

  // ── Configuração base para todo o monorepo ─────────────────────────
  {
    plugins: { prettier: pluginPrettier },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
      },
    },
  },

  // ── Arquivos .cjs — CommonJS (babel.config.cjs, jest.config.cjs) ───
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
  },

  // ── Arquivos de teste — globals do Jest ───────────────────────────
  {
    files: ['**/__tests__/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
  },

  // ── Web portal — globals do browser ──────────────────────────────
  {
    files: ['apps/web-portal/**/*.js', 'apps/web-portal/**/*.jsx'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        matchMedia: 'readonly',
        navigator: 'readonly',
        history: 'readonly',
        location: 'readonly',
      },
    },
  },

  // ── Ignorar ───────────────────────────────────────────────────────
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '.vite/**', '**/*.jsx'],
  },
];
