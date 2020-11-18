# NgrxEntityCrud
This library helps create the CRUD Angular application that makes use of NgRx, provides actions, reducers and selectors for the CRUD management of the entities.

How did I get to this result?

1) I adopted this best practice:   
[NgRx — Best Practices for Enterprise Angular Applications](https://itnext.io/ngrx-best-practices-for-enterprise-angular-applications-6f00bcdf36d7)

2) I found a mechanism to reduced repeated code in my projects, after reading this article:   
[How to Reduce Action Boilerplate](https://redux.js.org/recipes/reducing-boilerplate)

3) [Schematics for Libraries](https://angular.io/guide/schematics-for-libraries).

## Installation
```
npm i ngrx-entity-crud -S
```

# How to use it?
We create an [Angular](https://angular.io/) + [NgRx](https://ngrx.io/) application with the classical [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) features.
    
## 1) Creating a GitHub repository from a template (Angular + NgRx Boilerplate)
The project was made through [PrimeNg](https://www.primefaces.org/primeng), if you want other versions just ask me.
Creating a repository GitHub from a template:
1) Navigate to [https://github.com/jucasoft/ngrx-entity-crud-prime-ng-boilerplate](https://github.com/jucasoft/ngrx-entity-crud-prime-ng-boilerplate)
2) Above the file list, click: "Use this template".
3) Use the Owner drop-down menu, and select the account you want to own the repository.
4) Type a name for your repository/projectName, and an optional description.
5) Choose a repository visbility.
6) Click Create repository from template.
For more information ([help.github.com creating-a-repository-from-a-template](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template))


## 2) Cloning a repository from GitHub:
```
git clone https://github.com/{account}/{repository}.git {projectName}
cd {projectName}
npm i
```
For more information ([help.github.com cloning-a-repository](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository))

## 3) Rename project
Search in the all project: "ngrx-entity-crud-prime-ng-boilerplate" replace it with {projectName}

## 4) Run application:
```
npm run start:dev
```
if there are no errors, we can continue

## 5) Project structure:

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

## 6) Back-End
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

## 7) Create the NgRx store to manage the coins
the command to use: "crud-store" and the parameters to pass: "--clazz=Coin" and "--name=coin"
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

#### Add the attributes in Coin class
Open the class Coin "src/app/main/models/vo/coin.ts"
Add the attributes (present in the DB JSON file):

    public value:string = undefined;
    public name:string = undefined;
    public description:string = undefined;
    
why set the default value for class members: "undefined"?   
if we were to have a class:
````
class Dog{
    public id:string = undefined;
    public name:string = undefined;
    public description:string; // in this attribute we do not set the default value
}
````

when we create a new instance (new Dog()):
````
{
    id:undefined
    name:undefined
}
````
the description attribute will not be present


## 8)Create the new pages (search, list, detail...) of the Coin section.   
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

## 9) compile the application
```
ng build --aot --prod
```

## 10) start server
```
npm run start
```

Go to http://localhost:3000/coin

You have finished creating the new crud section, now you can filter, create, edit and delete coins.

## 11) deploy app to Heroku
The application (FE and BE) is ready to be started on heroku, register on heroku and run this guide [github-integration](https://devcenter.heroku.com/articles/github-integration)

## Running unit tests
Run `ng test NgrxEntityCrud` to execute the unit tests via [Karma](https://karma-runner.github.io).

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
