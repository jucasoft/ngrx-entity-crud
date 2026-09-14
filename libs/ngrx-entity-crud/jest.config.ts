import type { Config } from 'jest';

const config: Config = {
  displayName: 'ngrx-entity-crud',
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/libs/ngrx-entity-crud',
  collectCoverageFrom: [
    'src/**/*.ts',
    'devtools/**/*.ts',
    'ui/**/*.ts',
    'persistence/**/*.ts',
    '!src/**/*.spec.ts',
    '!devtools/**/*.spec.ts',
    '!ui/**/*.spec.ts',
    '!persistence/**/*.spec.ts',
    '!src/test-setup.ts',
  ],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|@ngrx|rxjs|tslib|primeng|@primeuix)/)',
  ],
  moduleNameMapper: {
    // `persistence/` importa il core tramite il nome del pacchetto (unico modo per un secondary
    // entry-point ng-packagr di referenziare `src/lib`, il cui rootDir e' ristretto alla propria
    // cartella): sotto Jest, che non passa da `dist/`, va risolto contro la sorgente.
    '^ngrx-entity-crud$': '<rootDir>/src/public-api.ts',
  },
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  resolver: 'jest-preset-angular/build/resolvers/ng-jest-resolver.js',
  testMatch: ['**/*.spec.ts'],
};

export default config;
