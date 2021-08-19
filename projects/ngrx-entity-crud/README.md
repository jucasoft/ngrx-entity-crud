# ngrx-entity-crud
This library helps create the CRUD Angular application that makes use of NgRx.
Commands for code generation:
 - `store`: Generates a feature set containing an `entity`, `actions`, `reducer`, ... file.
 - `section`: Generates a new Angular CRUD page containing an `list`, `detail`, `search`, ... file.
 - `auth`: Generates a boilerplate for authentication implementation containing an `store section` and `components` file.
 - `auth0`: Generates Auth0 implementation containing an `store section` and `components` file.

# How to use it?
To create your first project, follow this [guide](https://github.com/jucasoft/ngrx-entity-crud-prime-ng-boilerplate).

# Command detail for generation

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

Store type:
  - CRUD: generate action, effect and reducer for the crud management of the entity.
  - BASE: generate an empty boilerplate
  
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
CREATE src/app/root-store/coin-store/__clazz@dasherize__.actions.ts (462 bytes)
CREATE src/app/root-store/coin-store/__clazz@dasherize__.effects.ts (1186 bytes)
CREATE src/app/root-store/coin-store/index.d.ts (265 bytes)
CREATE src/app/root-store/coin-store/index.ts (267 bytes)
CREATE src/app/root-store/coin-store/__clazz@dasherize__.names.ts (46 bytes)
CREATE src/app/root-store/coin-store/__clazz@dasherize__.reducer.ts (162 bytes)
CREATE src/app/root-store/coin-store/__clazz@dasherize__.selectors.ts (543 bytes)
CREATE src/app/root-store/coin-store/__clazz@dasherize__.state.ts (385 bytes)
CREATE src/app/main/services/coin.service.ts (347 bytes)
CREATE src/app/main/models/vo/coin.ts (221 bytes)

UPDATE src/app/root-store/index.ts (309 bytes) 
UPDATE src/app/root-store/index.d.ts (309 bytes)
UPDATE src/app/root-store/__clazz@dasherize__.state.ts (217 bytes)
UPDATE src/app/root-store/__clazz@dasherize__.selectors.ts (665 bytes)
UPDATE src/app/root-store/root-store.module.ts (1051 bytes)
```


## section

---

### Overview

Generates a new Angular CRUD page containing an `table`, `detail`, `search`, `reactive form`, ... file.

### Command

```sh
ng generate ngrx-entity-crud:section  [options]
```

### Options

Name of the class that will be managed
- `--clazz`
  - Type: `string`
  - Default: `false`

Allows you to decide whether to use the graphic components of PrimeNg, or to create an empty boilerplate
- `--lib`
  - Type: `string`
  - Enum: `"primeng" or "no-libs"`
  - Default: `true`

#### Examples

```sh
ng generate ngrx-entity-crud:section --clazz=Coin --lib=primeng
```

or

```sh
ng generate ngrx-entity-crud:section --clazz=Coin --lib=no-libs
```

#### Files generated/changed by the “:section” command

```sh
CREATE src/app/main/views/coin/coin-routing.module.ts (722 bytes)
CREATE src/app/main/views/coin/coin.module.ts (1102 bytes)
CREATE src/app/main/views/coin/coin-edit/coin-edit.component.html (1325 bytes)
CREATE src/app/main/views/coin/coin-edit/coin-edit.component.ts (1626 bytes)
CREATE src/app/main/views/coin/coin-list/coin-list.component.html (706 bytes)
CREATE src/app/main/views/coin/coin-list/coin-list.component.ts (2254 bytes)
CREATE src/app/main/views/coin/coin-main/coin-main.component.html (188 bytes)
CREATE src/app/main/views/coin/coin-main/coin-main.component.ts (536 bytes)

UPDATE src/app/app-routing.module.ts (517 bytes)
```

## auth

---

### Overview

Generates a boilerplate for authentication implementation containing an `store section` and `components` file.

### Command

```sh
ng generate ngrx-entity-crud:auth
```

#### Examples

```sh
ng generate ngrx-entity-crud:auth
```

#### Files generated/changed by the “:auth” command

```sh
CREATE src/app/main/views/login/login-routing.module.ts (546 bytes)
CREATE src/app/main/views/login/login.module.ts (819 bytes)
CREATE src/app/main/views/login/components/logout-button/logout-button.component.ts (1158 bytes)
CREATE src/app/main/views/login/login-main/login-main.component.html (1074 bytes)
CREATE src/app/main/views/login/login-main/login-main.component.ts (1590 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.actions.ts (1148 bytes)
CREATE src/app/root-store/auth-store/auth-mock.service.ts (2021 bytes)
CREATE src/app/root-store/auth-store/auth-store.module.ts (1017 bytes)
CREATE src/app/root-store/auth-store/auth.guard.ts (1359 bytes)
CREATE src/app/root-store/auth-store/auth.service.ts (731 bytes)
CREATE src/app/root-store/auth-store/conf.ts (76 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.effects.ts (1503 bytes)
CREATE src/app/root-store/auth-store/index.d.ts (271 bytes)
CREATE src/app/root-store/auth-store/index.ts (271 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.names.ts (47 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.reducer.ts (731 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.selectors.ts (1525 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.state.ts (319 bytes)
CREATE src/app/main/models/vo/auth.ts (277 bytes)

UPDATE src/app/app-routing.module.ts (558 bytes)
UPDATE src/app/root-store/index.ts (309 bytes)
UPDATE src/app/root-store/index.d.ts (309 bytes)
UPDATE src/app/root-store/__clazz@dasherize__.state.ts (184 bytes)
UPDATE src/app/root-store/root-store.module.ts (1051 bytes)
```

## auth0

---

### Overview

Generates a boilerplate for authentication implementation containing an `store section` and `components` file.

### Command

```sh
ng generate ngrx-entity-crud:auth0
```

#### Examples

```sh
ng generate ngrx-entity-crud:auth0
```

#### Files generated/changed by the “:auth0” command

```sh
CREATE src/app/root-store/auth-store/__clazz@dasherize__.actions.ts (776 bytes)
CREATE src/app/root-store/auth-store/auth-store.module.ts (1044 bytes)
CREATE src/app/root-store/auth-store/auth.guard.ts (1359 bytes)
CREATE src/app/root-store/auth-store/authentication.service.ts (675 bytes)
CREATE src/app/root-store/auth-store/conf.ts (75 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.effects.ts (1754 bytes)
CREATE src/app/root-store/auth-store/index.d.ts (271 bytes)
CREATE src/app/root-store/auth-store/index.ts (271 bytes)
CREATE src/app/root-store/auth-store/login.component.ts (2117 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.names.ts (47 bytes)
CREATE src/app/root-store/auth-store/profile.ts (224 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.reducer.ts (475 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.selectors.ts (699 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.state.ts (192 bytes)

UPDATE src/app/root-store/index.ts (309 bytes)
UPDATE src/app/root-store/index.d.ts (309 bytes)
UPDATE src/app/root-store/__clazz@dasherize__.state.ts (184 bytes)
UPDATE src/app/root-store/root-store.module.ts (1051 bytes)
```

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
