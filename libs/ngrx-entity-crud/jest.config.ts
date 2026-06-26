import type { Config } from 'jest';

const config: Config = {
  displayName: 'ngrx-entity-crud',
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/libs/ngrx-entity-crud',
  collectCoverageFrom: [
    'src/**/*.ts',
    'devtools/**/*.ts',
    '!src/**/*.spec.ts',
    '!devtools/**/*.spec.ts',
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
  transformIgnorePatterns: ['node_modules/(?!(@angular|@ngrx|rxjs|tslib|primeng|@primeuix)/)'],
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  resolver: 'jest-preset-angular/build/resolvers/ng-jest-resolver.js',
  testMatch: ['**/*.spec.ts'],
};

export default config;
