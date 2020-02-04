# NgrxEntityCrud
Provides actions, reducers and selectors for the CRUD management of the entities.

How did I get to this result?

1) Having adopted this best practice:   
[NgRx — Best Practices for Enterprise Angular Applications](https://itnext.io/ngrx-best-practices-for-enterprise-angular-applications-6f00bcdf36d7)

2) I wanted a mechanism to eliminate repeated code in my projects, after reading this article:   
[How to Reduce Action Boilerplate](https://blog.angularindepth.com/how-to-reduce-action-boilerplate-90dc3d389e2b)

3) In the first version of this library, i used the "ts-action" and "ts-action-operators" libraries, 
from version 8 of ngrx these features are integrated.

4) [Schematics for Libraries](https://angular.io/guide/schematics-for-libraries).

## Installation
```
npm i ngrx-entity-crud -S
```

## How to use it?
We create an application with the classic CRUD features.

### Download Angular + NgRx Boilerplate

There are two versions, one for web projects with "PrimeNg" and one for mobile projects with Ionic.
Clone a repository into directory.   
## PrimeNg :
```
git clone https://gitlab.com/jucasoft/ngrx-entity-crud-prime-ng-boilerplate.git {projectName}
cd {projectName}
npm i
```

## Ionic :
```
git clone https://gitlab.com/jucasoft/ngrx-entity-crud-ionic-boilerplate.git {projectName}
cd {projectName}
npm i
```

Search in the all project: "ngrx-entity-crud-prime-ng-boilerplate" or ngrx-entity-crud-ionic-boilerplate and replace it with {projectName}

Test application:
```
npm run start:dev
```
if there are no errors, we can continue

## Project structure

```
dist/                           compiled version
e2e/                            end-to-end tests
src/                            project source code
|- app/                         app components
|  |- core/                     core module (singleton services and single-use components)
|  |  |- components/
|  |  |- directive/
|  |  |- interceptors/
|  |  |- models/
|  |  |- pipe/
|  |  +- utils/
|  |- shared/                   shared module  (common components, directives and pipes)
|  |- main/
|  |  |- components/
|  |  |- models/
|  |  |- services/
|  |  +- views/
|  |- root-store/               as indicated in the article  https://itnext.io/ngrx-best-practices-for-enterprise-angular-applications-6f00bcdf36d7
|  |  |- router-store/
|  |  |- index.ts
|  |  |- root-reducer.ts
|  |  |- root-store.module.ts
|  |  |- selectors.ts
|  |  +- state.ts
|  |- app.component.*           app root component (shell)
|  |- app.module.ts             app root module definition
|  |- app.routing.ts            app routes
|  +- ...                       additional modules and components
+ ...
```

### Back-End
In this project we will use [jsonserver](https://github.com/typicode/json-server):

Edit the /db.json file add some data:
```
{
  "coin": [
    { "id": 1, "value": "10", "name": "xxxx", "description": "xxxx" },
    { "id": 2, "value": "20", "name": "xxxx", "description": "xxxx" },
    { "id": 3, "value": "30", "name": "xxxx", "description": "xxxx" }
  ]
}
```

Start JSON Server
```
npm run start
```

Now if you go to http://localhost:3000/api/v1/coin/1, you'll get:
```
{
  "data": {
    "id": 1,
    "value": "10",
    "name": "xxxx",
    "description": "xxxx"
  }
}
```

### Code scaffolding   
Create the store to manage the coins, the command to use: "crud-store" and the parameters to pass: "--clazz=Coin" and "--name=coin"
```
ng generate ngrx-entity-crud:crud-store --name=coin --clazz=Coin
```
the list of created and modified files will appear in the console
```
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

Create the new pages (search, list, detail...) of the Coin section.   
The command to use: "crud-section" and the parameters to pass: "--clazz=Coin"
```
ng generate ngrx-entity-crud:crud-section --clazz=Coin
```

the list of created and modified files will appear in the console
```
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

we compile the application
```
ng build --aot --prod
```

start server
```
npm run start
```

Go to http://localhost:3000/coin

You have finished creating the new crud section, now you can filter, create, edit and delete coins.

## Running unit tests

Run `ng test NgrxEntityCrud` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Help

If you need help, or want to help me: [https://gitlab.com/jucasoft/ngrx-entity-crud](https://gitlab.com/jucasoft/ngrx-entity-crud)

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
