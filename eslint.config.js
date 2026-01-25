// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = defineConfig([
  // Base Expo config (includes React, React Native, TypeScript rules)
  expoConfig,

  // Prettier config - disables conflicting rules
  prettierConfig,

  // Custom configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],

    plugins: {
      prettier: prettierPlugin,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },

    rules: {
      // ============================================
      // PRETTIER - Format code automatically
      // ============================================
      'prettier/prettier': [
        'warn',
        {
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
          printWidth: 100,
          bracketSpacing: true,
          bracketSameLine: false,
          arrowParens: 'always',
          endOfLine: 'lf',
        },
      ],

      // ============================================
      // IMPORTS - Auto-sort and remove unused
      // ============================================
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // React and React Native
            ['^react$', '^react-native$'],
            // Expo packages
            ['^expo', '^@expo'],
            // External packages
            ['^@?\\w'],
            // Internal aliases (@/)
            ['^@/'],
            // Parent imports
            ['^\\.\\.'],
            // Same-folder imports
            ['^\\.'],
            // Style imports
            ['^.+\\.css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // Remove unused imports automatically
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // ============================================
      // DISABLE PROBLEMATIC IMPORT RULES
      // (TypeScript handles these better)
      // ============================================
      'import/no-unresolved': 'off',
      'import/namespace': 'off',
      'import/no-duplicates': 'warn',

      // ============================================
      // TYPESCRIPT - Handled by Expo config
      // ============================================
      '@typescript-eslint/no-unused-vars': 'off', // handled by unused-imports
      'no-unused-vars': 'off',

      // ============================================
      // REACT / REACT NATIVE
      // ============================================
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ============================================
      // GENERAL CODE QUALITY
      // ============================================
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      curly: ['error', 'all'],
      'no-debugger': 'warn',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'web-build/**',
      '.expo/**',
      'node_modules/**',
      'ios/**',
      'android/**',
      '*.config.js',
      'babel.config.js',
      'metro.config.js',
      'tailwind.config.js',
    ],
  },
]);
