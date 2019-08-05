"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
function createHost(tree) {
    return {
        readFile(path) {
            return __awaiter(this, void 0, void 0, function* () {
                const data = tree.read(path);
                if (!data) {
                    throw new Error('File not found.');
                }
                return core_1.virtualFs.fileBufferToString(data);
            });
        },
        writeFile(path, data) {
            return __awaiter(this, void 0, void 0, function* () {
                return tree.overwrite(path, data);
            });
        },
        isDirectory(path) {
            return __awaiter(this, void 0, void 0, function* () {
                // approximate a directory check
                return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
            });
        },
        isFile(path) {
            return __awaiter(this, void 0, void 0, function* () {
                return tree.exists(path);
            });
        },
    };
}
function updateWorkspace(updaterOrWorkspace) {
    return (tree) => __awaiter(this, void 0, void 0, function* () {
        const host = createHost(tree);
        if (typeof updaterOrWorkspace === 'function') {
            const { workspace } = yield core_1.workspaces.readWorkspace('/', host);
            const result = updaterOrWorkspace(workspace);
            if (result !== undefined) {
                yield result;
            }
            yield core_1.workspaces.writeWorkspace(workspace, host);
        }
        else {
            yield core_1.workspaces.writeWorkspace(updaterOrWorkspace, host);
        }
    });
}
exports.updateWorkspace = updateWorkspace;
function getWorkspace(tree, path = '/') {
    return __awaiter(this, void 0, void 0, function* () {
        const host = createHost(tree);
        const { workspace } = yield core_1.workspaces.readWorkspace(path, host);
        return workspace;
    });
}
exports.getWorkspace = getWorkspace;
/**
 * Build a default project path for generating.
 * @param project The project which will have its default path generated.
 */
function buildDefaultPath(project) {
    const root = project.sourceRoot ? `/${project.sourceRoot}/` : `/${project.root}/src/`;
    const projectDirName = project.extensions['projectType'] === 'application' ? 'app' : 'lib';
    return `${root}${projectDirName}`;
}
exports.buildDefaultPath = buildDefaultPath;
function createDefaultPath(tree, projectName) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspace = yield getWorkspace(tree);
        const project = workspace.projects.get(projectName);
        if (!project) {
            throw new Error('Specified project does not exist.');
        }
        return buildDefaultPath(project);
    });
}
exports.createDefaultPath = createDefaultPath;
//# sourceMappingURL=workspace.js.map