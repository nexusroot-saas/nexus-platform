import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  // Configurações recomendadas
  js.configs.recommended,
  prettierConfig, // Desabilita regras conflitantes com Prettier

  // ── Configuração base monorepo ──────────────────────────────
  {
    plugins: {
      prettier: prettierPlugin
    },
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
        Buffer: 'readonly',
        fetch: 'readonly',
        setImmediate: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },

  // ── Arquivos .cjs (CommonJS) ───────────────────────────────
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },

  // ── Testes Jest ────────────────────────────────────────────
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

  // ── Frontend (browser globals) ────────────────────────────
  {
    files: [
      'apps/web-portal/**/*.js',
      'apps/web-portal/**/*.jsx',
      'apps/nexus-root/**/*.js',
      'apps/nexus-root/**/*.jsx',
    ],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        navigator: 'readonly',
      },
    },
  },

  // ── Ignores ────────────────────────────────────────────────
  {
    ignores: [
      'node_modules/**',
      'dist/**', 
      'build/**',
      '.vite/**',
      '**/*.min.js'
    ],
  },
];
