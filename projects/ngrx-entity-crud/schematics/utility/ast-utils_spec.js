"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const ts = require("../third_party/github.com/Microsoft/TypeScript/lib/typescript");
const change_1 = require("../utility/change");
const test_1 = require("../utility/test");
const ast_utils_1 = require("./ast-utils");
function getTsSource(path, content) {
    return ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
}
function applyChanges(path, content, changes) {
    const tree = new schematics_1.HostTree();
    tree.create(path, content);
    const exportRecorder = tree.beginUpdate(path);
    for (const change of changes) {
        if (change instanceof change_1.InsertChange) {
            exportRecorder.insertLeft(change.pos, change.toAdd);
        }
    }
    tree.commitUpdate(exportRecorder);
    return test_1.getFileContent(tree, path);
}
// tslint:disable-next-line:no-big-function
describe('ast utils', () => {
    let modulePath;
    let moduleContent;
    beforeEach(() => {
        modulePath = '/src/app/app.module.ts';
        moduleContent = `
      import { BrowserModule } from '@angular/platform-browser';
      import { NgModule } from '@angular/core';
      import { AppComponent } from './app.component';

      @NgModule({
        declarations: [
          AppComponent
        ],
        imports: [
          BrowserModule
        ],
        providers: [],
        bootstrap: [AppComponent]
      })
      export class AppModule { }
    `;
    });
    it('should add export to module', () => {
        const source = getTsSource(modulePath, moduleContent);
        const changes = ast_utils_1.addExportToModule(source, modulePath, 'FooComponent', './foo.component');
        const output = applyChanges(modulePath, moduleContent, changes);
        expect(output).toMatch(/import { FooComponent } from '.\/foo.component';/);
        expect(output).toMatch(/exports: \[FooComponent\]/);
    });
    it('should add export to module if not indented', () => {
        moduleContent = core_1.tags.stripIndents `${moduleContent}`;
        const source = getTsSource(modulePath, moduleContent);
        const changes = ast_utils_1.addExportToModule(source, modulePath, 'FooComponent', './foo.component');
        const output = applyChanges(modulePath, moduleContent, changes);
        expect(output).toMatch(/import { FooComponent } from '.\/foo.component';/);
        expect(output).toMatch(/exports: \[FooComponent\]/);
    });
    it('should add declarations to module if not indented', () => {
        moduleContent = core_1.tags.stripIndents `${moduleContent}`;
        const source = getTsSource(modulePath, moduleContent);
        const changes = ast_utils_1.addDeclarationToModule(source, modulePath, 'FooComponent', './foo.component');
        const output = applyChanges(modulePath, moduleContent, changes);
        expect(output).toMatch(/import { FooComponent } from '.\/foo.component';/);
        expect(output).toMatch(/declarations: \[\nAppComponent,\nFooComponent\n\]/);
    });
    it('should add metadata', () => {
        const source = getTsSource(modulePath, moduleContent);
        const changes = ast_utils_1.addSymbolToNgModuleMetadata(source, modulePath, 'imports', 'HelloWorld');
        expect(changes).not.toBeNull();
        const output = applyChanges(modulePath, moduleContent, changes || []);
        expect(output).toMatch(/imports: [\s\S]+,\n\s+HelloWorld\n\s+\]/m);
    });
    it('should add metadata (comma)', () => {
        const moduleContent = `
      import { BrowserModule } from '@angular/platform-browser';
      import { NgModule } from '@angular/core';

      @NgModule({
        declarations: [
          AppComponent
        ],
        imports: [
          BrowserModule,
        ],
        providers: [],
        bootstrap: [AppComponent]
      })
      export class AppModule { }
    `;
        const source = getTsSource(modulePath, moduleContent);
        const changes = ast_utils_1.addSymbolToNgModuleMetadata(source, modulePath, 'imports', 'HelloWorld');
        expect(changes).not.toBeNull();
        const output = applyChanges(modulePath, moduleContent, changes || []);
        expect(output).toMatch(/imports: [\s\S]+,\n\s+HelloWorld,\n\s+\]/m);
    });
    it('should add metadata (missing)', () => {
        const moduleContent = `
      import { BrowserModule } from '@angular/platform-browser';
      import { NgModule } from '@angular/core';

      @NgModule({
        declarations: [
          AppComponent
        ],
        providers: [],
        bootstrap: [AppComponent]
      })
      export class AppModule { }
    `;
        const source = getTsSource(modulePath, moduleContent);
        const changes = ast_utils_1.addSymbolToNgModuleMetadata(source, modulePath, 'imports', 'HelloWorld');
        expect(changes).not.toBeNull();
        const output = applyChanges(modulePath, moduleContent, changes || []);
        expect(output).toMatch(/imports: \[HelloWorld]\r?\n/m);
    });
    it('should add metadata (empty)', () => {
        const moduleContent = `
      import { BrowserModule } from '@angular/platform-browser';
      import { NgModule } from '@angular/core';

      @NgModule({
        declarations: [
          AppComponent
        ],
        providers: [],
        imports: [],
        bootstrap: [AppComponent]
      })
      export class AppModule { }
    `;
        const source = getTsSource(modulePath, moduleContent);
        const changes = ast_utils_1.addSymbolToNgModuleMetadata(source, modulePath, 'imports', 'HelloWorld');
        expect(changes).not.toBeNull();
        const output = applyChanges(modulePath, moduleContent, changes || []);
        expect(output).toMatch(/imports: \[HelloWorld],\r?\n/m);
    });
    it(`should handle NgModule with newline after '@'`, () => {
        const moduleContent = `
      import { BrowserModule } from '@angular/platform-browser';
      import { NgModule } from '@angular/core';

      @
      NgModule({imports: [BrowserModule], declarations: []})
      export class AppModule { }
    `;
        const source = getTsSource(modulePath, moduleContent);
        const changes = ast_utils_1.addExportToModule(source, modulePath, 'FooComponent', './foo.component');
        const output = applyChanges(modulePath, moduleContent, changes);
        expect(output).toMatch(/import { FooComponent } from '.\/foo.component';/);
        expect(output).toMatch(/exports: \[FooComponent\]/);
    });
    it('should handle NgModule with no newlines', () => {
        const moduleContent = `
      import { BrowserModule } from '@angular/platform-browser';
      import { NgModule } from '@angular/core';

      @NgModule({imports: [BrowserModule], declarations: []})
      export class AppModule { }
    `;
        const source = getTsSource(modulePath, moduleContent);
        const changes = ast_utils_1.addExportToModule(source, modulePath, 'FooComponent', './foo.component');
        const output = applyChanges(modulePath, moduleContent, changes);
        expect(output).toMatch(/import { FooComponent } from '.\/foo.component';/);
        expect(output).toMatch(/exports: \[FooComponent\]/);
    });
    it('should add into providers metadata in new line ', () => {
        const moduleContent = `
      import { BrowserModule } from '@angular/platform-browser';
      import { NgModule } from '@angular/core';

      @NgModule({
        imports: [BrowserModule],
        declarations: [],
        providers: [
          {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
          }
        ]
      })
      export class AppModule { }
    `;
        const source = getTsSource(modulePath, moduleContent);
        const changes = ast_utils_1.addProviderToModule(source, modulePath, 'LogService', './log.service');
        const output = applyChanges(modulePath, moduleContent, changes);
        expect(output).toMatch(/import { LogService } from '.\/log.service';/);
        expect(output).toMatch(/\},\r?\n\s*LogService\r?\n\s*\]/);
    });
    describe('insertAfterLastOccurrence', () => {
        const filePath = './src/foo.ts';
        it('should work for the default scenario', () => {
            const fileContent = `const arr = ['foo'];`;
            const source = getTsSource(filePath, fileContent);
            const arrayNode = ast_utils_1.findNodes(source.getChildren().shift(), ts.SyntaxKind.ArrayLiteralExpression);
            const elements = arrayNode.pop().elements;
            const change = ast_utils_1.insertAfterLastOccurrence(elements, `, 'bar'`, filePath, elements.pos, ts.SyntaxKind.StringLiteral);
            const output = applyChanges(filePath, fileContent, [change]);
            expect(output).toMatch(/const arr = \['foo', 'bar'\];/);
        });
        it('should work without occurrences', () => {
            const fileContent = `const arr = [];`;
            const source = getTsSource(filePath, fileContent);
            const arrayNode = ast_utils_1.findNodes(source.getChildren().shift(), ts.SyntaxKind.ArrayLiteralExpression);
            const elements = arrayNode.pop().elements;
            const change = ast_utils_1.insertAfterLastOccurrence(elements, `'bar'`, filePath, elements.pos, ts.SyntaxKind.StringLiteral);
            const output = applyChanges(filePath, fileContent, [change]);
            expect(output).toMatch(/const arr = \['bar'\];/);
        });
    });
    // tslint:disable-next-line:no-big-function
    describe('addRouteDeclarationToModule', () => {
        it('should throw an error when there is no router module', () => {
            const moduleContent = `
        import { BrowserModule } from '@angular/platform-browser';
        import { NgModule } from '@angular/core';
        import { AppComponent } from './app.component';

        @NgModule({
          declarations: [
            AppComponent
          ],
          imports: [BrowserModule],
          bootstrap: [AppComponent]
        })
        export class AppModule { }
      `;
            const source = getTsSource(modulePath, moduleContent);
            const change = () => ast_utils_1.addRouteDeclarationToModule(source, './src/app', '');
            expect(change).toThrowError(`Couldn't find a route declaration in ./src/app.`);
        });
        it(`should throw an error when router module doesn't have arguments`, () => {
            const moduleContent = `
        import { BrowserModule } from '@angular/platform-browser';
        import { NgModule } from '@angular/core';
        import { AppComponent } from './app.component';

        @NgModule({
          declarations: [
            AppComponent
          ],
          imports: [
            BrowserModule,
            RouterModule.forRoot()
          ],
          bootstrap: [AppComponent]
        })
        export class AppModule { }
      `;
            const source = getTsSource(modulePath, moduleContent);
            const change = () => ast_utils_1.addRouteDeclarationToModule(source, './src/app', '');
            expect(change).toThrowError(`The router module method doesn't have arguments at line 11 in ./src/app`);
        });
        it(`should throw an error when the provided var (array) to router module doesn't exist`, () => {
            const moduleContent = `
        import { BrowserModule } from '@angular/platform-browser';
        import { NgModule } from '@angular/core';
        import { AppComponent } from './app.component';

        @NgModule({
          declarations: [
            AppComponent
          ],
          imports: [
            BrowserModule,
            RouterModule.forRoot(routes)
          ],
          bootstrap: [AppComponent]
        })
        export class AppModule { }
      `;
            const source = getTsSource(modulePath, moduleContent);
            const change = () => ast_utils_1.addRouteDeclarationToModule(source, './src/app', '');
            expect(change).toThrowError(
            // tslint:disable-next-line:max-line-length
            `No route declaration array was found that corresponds to router module at line 11 in ./src/app`);
        });
        // tslint:disable-next-line:max-line-length
        it(`should throw an error, if the provided first argument of router module is not an identifier`, () => {
            const moduleContent = `
        import { BrowserModule } from '@angular/platform-browser';
        import { NgModule } from '@angular/core';
        import { AppComponent } from './app.component';

        @NgModule({
          declarations: [
            AppComponent
          ],
          imports: [
            BrowserModule,
            RouterModule.forRoot(42)
          ],
          bootstrap: [AppComponent]
        })
        export class AppModule { }
      `;
            const source = getTsSource(modulePath, moduleContent);
            const change = () => ast_utils_1.addRouteDeclarationToModule(source, './src/app', '');
            expect(change).toThrowError(
            // tslint:disable-next-line:max-line-length
            `No route declaration array was found that corresponds to router module at line 11 in ./src/app`);
        });
        it('should add a route to the routes array', () => {
            const moduleContent = `
        import { BrowserModule } from '@angular/platform-browser';
        import { NgModule } from '@angular/core';
        import { AppComponent } from './app.component';

        const routes = [];

        @NgModule({
          declarations: [
            AppComponent
          ],
          imports: [
            BrowserModule,
            RouterModule.forRoot(routes)
          ],
          bootstrap: [AppComponent]
        })
        export class AppModule { }
      `;
            const source = getTsSource(modulePath, moduleContent);
            const changes = ast_utils_1.addRouteDeclarationToModule(source, './src/app', `{ path: 'foo', component: FooComponent }`);
            const output = applyChanges(modulePath, moduleContent, [changes]);
            expect(output).toMatch(/const routes = \[{ path: 'foo', component: FooComponent }\]/);
        });
        it('should add a route to the routes array when there are multiple declarations', () => {
            const moduleContent = `
        import { BrowserModule } from '@angular/platform-browser';
        import { NgModule } from '@angular/core';
        import { AppComponent } from './app.component';

        const routes = [
          { path: 'foo', component: FooComponent }
        ];

        @NgModule({
          declarations: [
            AppComponent
          ],
          imports: [
            BrowserModule,
            RouterModule.forRoot(routes)
          ],
          bootstrap: [AppComponent]
        })
        export class AppModule { }
      `;
            const source = getTsSource(modulePath, moduleContent);
            const changes = ast_utils_1.addRouteDeclarationToModule(source, './src/app', `{ path: 'bar', component: BarComponent }`);
            const output = applyChanges(modulePath, moduleContent, [changes]);
            expect(output).toMatch(
            // tslint:disable-next-line:max-line-length
            /const routes = \[\r?\n?\s*{ path: 'foo', component: FooComponent },\r?\n?\s*{ path: 'bar', component: BarComponent }\r?\n?\s*\]/);
        });
        it('should add a route to the routes argument of RouteModule', () => {
            const moduleContent = `
        import { BrowserModule } from '@angular/platform-browser';
        import { NgModule } from '@angular/core';
        import { AppComponent } from './app.component';

        @NgModule({
          declarations: [
            AppComponent
          ],
          imports: [
            BrowserModule,
            RouterModule.forRoot([])
          ],
          bootstrap: [AppComponent]
        })
        export class AppModule { }
      `;
            const source = getTsSource(modulePath, moduleContent);
            const changes = ast_utils_1.addRouteDeclarationToModule(source, './src/app', `{ path: 'foo', component: FooComponent }`);
            const output = applyChanges(modulePath, moduleContent, [changes]);
            expect(output).toMatch(/RouterModule\.forRoot\(\[{ path: 'foo', component: FooComponent }\]\)/);
        });
        // tslint:disable-next-line:max-line-length
        it('should add a route to the routes argument of RouterModule when there are multiple declarations', () => {
            const moduleContent = `
        import { BrowserModule } from '@angular/platform-browser';
        import { NgModule } from '@angular/core';
        import { AppComponent } from './app.component';

        @NgModule({
          declarations: [
            AppComponent
          ],
          imports: [
            BrowserModule,
            RouterModule.forRoot([{ path: 'foo', component: FooComponent }])
          ],
          bootstrap: [AppComponent]
        })
        export class AppModule { }
      `;
            const source = getTsSource(modulePath, moduleContent);
            const changes = ast_utils_1.addRouteDeclarationToModule(source, './src/app', `{ path: 'bar', component: BarComponent }`);
            const output = applyChanges(modulePath, moduleContent, [changes]);
            expect(output).toMatch(
            // tslint:disable-next-line:max-line-length
            /RouterModule\.forRoot\(\[\r?\n?\s*{ path: 'foo', component: FooComponent },\r?\n?\s*{ path: 'bar', component: BarComponent }\r?\n?\s*\]\)/);
        });
    });
});
//# sourceMappingURL=ast-utils_spec.js.map