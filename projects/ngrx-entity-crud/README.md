# NgrxEntityCrud
This library helps create the CRUD Angular application that makes use of NgRx.
Commands:
 - `store`: Generates a feature set containing an `entity`, `services`, `actions`, `effects`, `reducer`,`selectors`, ... file.
 - `section`: Generates a new Angular CRUD page containing an `table`, `detail`, `search`, `reactive form`, ... file.
 - `auth`: Generates a boilerplate for authentication implementation containing an `store section` and `components` file.
 - `auth0`: Generates Auth0 implementation containing an `store section` and `components` file.

# How to use it?
To create your first project, follow this [guide](https://github.com/jucasoft/ngrx-entity-crud-prime-ng-boilerplate).

# Commands

## store   

---

### Overview

Generates a feature set containing an `actions`, `effects`, `reducer`, and `selectors` file. You use this to build out a new feature area that provides a new piece of state.

### Command

```sh
ng generate ngrx-entity-crud:store  [options]
```

### Options

Name of the store section
- `--name`
  - Type: `string`
  - Default: `false`

Name of the class that will be managed 
- `--clazz`
  - Type: `string`
  - Default: `false`


- `--type`
  - Type: `string`
  - Enum: `"CRUD" or "BASE"`
  - Default: `false`

#### Examples

```sh
ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=CRUD
```

or

```sh
ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=BASE
```

#### Files generated/changed by the “:store” command

```sh
CREATE src/app/root-store/coin-store/coin-store.module.ts (787 bytes)
CREATE src/app/root-store/coin-store/actions.ts (462 bytes)
CREATE src/app/root-store/coin-store/effects.ts (1186 bytes)
CREATE src/app/root-store/coin-store/index.d.ts (265 bytes)
CREATE src/app/root-store/coin-store/index.ts (267 bytes)
CREATE src/app/root-store/coin-store/names.ts (46 bytes)
CREATE src/app/root-store/coin-store/reducer.ts (162 bytes)
CREATE src/app/root-store/coin-store/selectors.ts (543 bytes)
CREATE src/app/root-store/coin-store/state.ts (385 bytes)
CREATE src/app/main/services/coin.service.ts (347 bytes)
CREATE src/app/main/models/vo/coin.ts (221 bytes)

UPDATE src/app/root-store/index.ts (309 bytes) 
UPDATE src/app/root-store/index.d.ts (309 bytes)
UPDATE src/app/root-store/state.ts (217 bytes)
UPDATE src/app/root-store/selectors.ts (665 bytes)
UPDATE src/app/root-store/root-store.module.ts (1051 bytes)
```

launches

ng generate ngrx-entity-crud:store --name=launche --clazz=Launches --type=CRUD
## Running unit tests
Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Help
If you need help, or want to help me: [https://github.com/jucasoft/ngrx-entity-crud/issues](https://github.com/jucasoft/ngrx-entity-crud/issues)

## MIT License

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
