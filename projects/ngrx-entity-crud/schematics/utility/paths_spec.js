"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const paths_1 = require("./paths");
describe('paths', () => {
    describe('relativePathToWorkspaceRoot', () => {
        it(`should handle root '/'`, () => {
            const result = paths_1.relativePathToWorkspaceRoot('/');
            expect(result).toBe('.');
        });
        it(`should handle an empty path`, () => {
            const result = paths_1.relativePathToWorkspaceRoot('');
            expect(result).toBe('.');
        });
        it(`should handle an undefined path`, () => {
            const result = paths_1.relativePathToWorkspaceRoot(undefined);
            expect(result).toBe('.');
        });
        it(`should handle path with trailing '/'`, () => {
            const result = paths_1.relativePathToWorkspaceRoot('foo/bar/');
            expect(result).toBe('../..');
        });
        it(`should handle path without trailing '/'`, () => {
            const result = paths_1.relativePathToWorkspaceRoot('foo/bar');
            expect(result).toBe('../..');
        });
    });
});
//# sourceMappingURL=paths_spec.js.map