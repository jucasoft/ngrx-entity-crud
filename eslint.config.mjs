import nx from '@nx/eslint-plugin';
import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {
      // Regole di formattazione e stile
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'eol-last': 'error',
      'curly': 'error',

      // Regole per TypeScript
      '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: true }],
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Regole per import
      'no-restricted-imports': [
        'error',
        {
          patterns: ['rxjs/Rx']
        }
      ],

      // Regole per console
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // Regole per oggetti
      'quote-props': ['error', 'as-needed'],

      // Regole per spacing
      'space-before-function-paren': [
        'error',
        {
          anonymous: 'never',
          named: 'never',
          asyncArrow: 'always'
        }
      ],

      // Regole per variabili
      'camelcase': ['error', { allow: ['^_'] }],

      // Regole per deprecation (warning)
      '@typescript-eslint/no-deprecated': 'warn'
    },
  },
  {
    files: ['**/*.ts'],
    plugins: {
      '@angular-eslint': angular,
    },
    rules: {
      // Regole specifiche per Angular (solo quelle esistenti)
      '@angular-eslint/component-class-suffix': 'error',
      '@angular-eslint/directive-class-suffix': 'error',
      '@angular-eslint/no-output-on-prefix': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@angular-eslint/use-pipe-transform-interface': 'error',
    },
  },
  {
    files: ['**/*.html'],
    plugins: {
      '@angular-eslint/template': angularTemplate,
    },
    rules: {
      // Regole per template Angular
    },
  },
  {
    files: ['libs/ngrx-entity-crud/**/*.ts'],
    plugins: {
      '@angular-eslint': angular,
    },
    rules: {
      // Override specifici per la libreria ngrx-entity-crud
      'camelcase': ['error', { allow: ['^_'] }],
      '@typescript-eslint/no-inferrable-types': 'off',
    },
  },
];
