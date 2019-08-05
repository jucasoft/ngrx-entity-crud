"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const workspace_models_1 = require("../utility/workspace-models");
const project_1 = require("./project");
describe('project', () => {
    describe('buildDefaultPath', () => {
        let project;
        beforeEach(() => {
            project = {
                projectType: workspace_models_1.ProjectType.Application,
                root: 'foo',
                prefix: 'app',
            };
        });
        it('should handle projectType of application', () => {
            const result = project_1.buildDefaultPath(project);
            expect(result).toEqual('/foo/src/app');
        });
        it('should handle projectType of library', () => {
            project = Object.assign({}, project, { projectType: workspace_models_1.ProjectType.Library });
            const result = project_1.buildDefaultPath(project);
            expect(result).toEqual('/foo/src/lib');
        });
        it('should handle sourceRoot', () => {
            project = Object.assign({}, project, { sourceRoot: 'foo/bar/custom' });
            const result = project_1.buildDefaultPath(project);
            expect(result).toEqual('/foo/bar/custom/app');
        });
    });
});
//# sourceMappingURL=project_spec.js.map