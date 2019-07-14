Generated new project with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.0.
```
 ng new ngrx-entity-crud-app
```

# Back-end
In this project we will use [jsonserver](https://github.com/typicode/json-server) to create the Beck-end services:
```
npm install json-server --save-dev
```

Create a fake-server/db.json file with some data
```
{
  "coin": [
    { "id": 1, "value": "10", "name": "xxxx", "description": "xxxx" },
    { "id": 2, "value": "20", "name": "xxxx", "description": "xxxx" },
    { "id": 3, "value": "30", "name": "xxxx", "description": "xxxx" }
  ]
}
```

Create a fake-server/server.js file:
```
const jsonServer = require('json-server');
const server = jsonServer.create();
const path = require('path');
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(router);

router.render = (req, res) => {
  res.jsonp({
    data: res.locals.data
  })
};

server.listen(3000, (res) => {
  console.log('JSON Server is running')
});
```


Start JSON Server
```
node fake-server/server.js
```

Now if you go to http://localhost:3000/coin/1, you'll get:
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

# Front-end
## [PrimeNG](https://www.primefaces.org/primeng/#/setup)
Install PrimeNG components; PrimeNG is a rich set of open source native Angular UI components.

```
npm install -S primeng primeicons
```
Styles Configuration angular.json file
Configure required styles at the styles section, example below uses the Nova Light theme.

```
"styles": [
  "node_modules/primeicons/primeicons.css",
  "node_modules/primeng/resources/themes/nova-light/theme.css",
  "node_modules/primeng/resources/primeng.min.css",
  //...
],
```

## NgRx
Installing NgRx Dependencies
```
npm install -S @ngrx/{store,store-devtools,entity,effects}
```
## ngrx-entity-crud
Install ngrx-entity-crud:
```

```
## [ts-action](https://github.com/cartant/ts-action) [ts-action-operators](https://github.com/cartant/ts-action-operators) 
Install ts-action ts-action-operators 
```
npm install -S ts-action ts-action-operators
```

# Start Crud APP
Create directory structure
```
- src
  - app
    - core
      - components
      - models
        - vo
        - api
      - services 
    - main
      - components
      - models
        - vo
        - api
      - pages
      - services 
```

Add baseUrl and paths in tsconfig.json
```
{
  ...
  "compilerOptions": {
    ...
    "baseUrl": "./",
    ...
    "paths": {
      ...
      "@models": [
        "src/app/main/models"
      ],
      "@models/*": [
        "src/app/main/models/*"
      ],
      "@services": [
        "src/app/main/services"
      ],
      "@services/*": [
        "src/app/main/services/*"
      ]
      ...
    }
  }
}

```

Create primeng.module.ts file in src/app/ directory:
```
import {NgModule} from '@angular/core';
import {TableModule} from 'primeng/table';

@NgModule({
  declarations: [],
  imports: [
    TableModule, ButtonModule
  ],
  exports: [TableModule, ButtonModule]
})
export class PrimeNgCommonsModule {
}

```

Create Coin class in src/app/main/models/vo directory:
```
export class Coin {
  id: string;
  value: string;
  name: string;
  description: string;
}

```

Create CoinService class and extends BaseCrudService in src/app/main/services directory:
```
ng generate service Coin
```

```
import {Injectable} from '@angular/core';
import {BaseCrudService} from 'ngrx-entity-crud';
import {Coin} from '@models/vo/coin';

@Injectable({
  providedIn: 'root'
})
export class CoinService extends BaseCrudService<Coin> {

}

```

To be able to use http calls, you must import the HttpClientModule module into AppModule; 
If the module is not imported, it causes the error: "To be able to use http calls, you must import the HttpClientModule module into AppModule"


Create CoinModule, go in to directory src/app/main/pages and create new module:
```
ng generate module Coin --routing=true --routingScope=Child --skipImport
```

Edit CoinModule, add CoinService provider
```
@NgModule({
  ...
  providers: [CoinService]
  ...
})
```

Create CoinListComponent, go in to directory src/app/main/pages/coin :
```
ng generate component CoinList --skipTests=true --inlineStyle=true --changeDetection=OnPush
```

coin-list.component.html :
```
<p-table [value]="collection$">
  <ng-template pTemplate="header">
    <tr>
      <th>id</th>
      <th>value</th>
      <th>name</th>
      <th>description</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-item>
    <tr>
      <td>{{item.id}}</td>
      <td>{{item.value}}</td>
      <td>{{item.name}}</td>
      <td>{{item.description}}</td>
    </tr>
  </ng-template>
</p-table>
```

coin-list.component.ts :
```
import {Component, OnInit} from '@angular/core';
import {Coin} from '@models/vo/coin';
import {CoinService} from '@services/coin.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-coin-list',
  templateUrl: './coin-list.component.html',
  styles: []
})
export class CoinListComponent implements OnInit {

  collection$: Observable<Coin[]>;

  constructor(private service: CoinService) {
    console.log('CoinListComponent.constructor()');
  }

  ngOnInit() {
    console.log('CoinListComponent.ngOnInit()');
    this.collection$ = this.service.search().pipe(
      map(value => value.data)
    );
  }

}

```

# Now configure LazyLoading route

app-routing.module.ts:
```
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: ''},
  {path: 'coin', loadChildren: './main/pages/coin/coin.module#CoinModule'},
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
```

app.component.html:
```
<!--The content below is only a placeholder and can be replaced.-->
<div style="text-align:center">
  <h1>
    Welcome to {{ title }}!
  </h1>
</div>
<button pButton type="button" routerLink="/coin" label="Coinaaa"></button>
<router-outlet></router-outlet>
```

Edit app.module.ts, add ButtonModule import:
```
@NgModule({
  ...
  imports: [
    ...
    ButtonModule
    ...
  ],
  ...
})

```
