import nx from '@nx/eslint-plugin';

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
      'no-consecutive-blank-lines': 'off',

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
    rules: {
      // Regole specifiche per Angular
      '@angular-eslint/component-class-suffix': 'error',
      '@angular-eslint/directive-class-suffix': 'error',
      '@angular-eslint/no-output-on-prefix': 'error',
      '@angular-eslint/no-inputs-metadata-property': 'error',
      '@angular-eslint/no-outputs-metadata-property': 'error',
      '@angular-eslint/no-host-metadata-property': 'error',
      '@angular-eslint/no-input-rename': 'error',
      '@angular-eslint/no-output-rename': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@angular-eslint/use-pipe-transform-interface': 'error',
    },
  },
  {
    files: ['libs/ngrx-entity-crud/**/*.ts'],
    rules: {
      // Override specifici per la libreria ngrx-entity-crud
      'camelcase': ['error', { allow: ['^_', 'allow-leading-underscore'] }],
      '@typescript-eslint/no-inferrable-types': 'off',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'lib',
          style: 'camelCase'
        }
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'lib',
          style: 'kebab-case'
        }
      ]
    },
  },
];
