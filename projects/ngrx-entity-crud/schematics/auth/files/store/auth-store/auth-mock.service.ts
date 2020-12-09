import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Auth} from '@models/vo/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthMockService {

  service = environment.webServiceUri;

  constructor(public http: HttpClient) {
  }

  login(user: string, passwd: string): Observable<Auth> {
    console.log('AuthService.login()');
    console.log('user', user);
    console.log('passwd', passwd);
    if (authMocks.hasOwnProperty(user)) {
      const result = authMocks[user];
      if (result.user.password === passwd) {
        return of(result);
      }
      return throwError({message: `error passwd:${passwd} for user: "${user}"`});
    }
    return throwError({message: `user:"${user}" does not exist`});
  }

  logout(): Observable<boolean> {
    console.log('AuthMockService.logout()');
    return of(true);
  }
}

const cipo: Auth = {
  token: 'xxx.xxx.xxx',
  roles: ['roleA'],
  user: {
    user: 'cipo',
    email: 'cipollino@mail.com',
    password: 'cipo',
    firstname: 'Cipo',
    lastname: 'Lino',
    age: 32,
    id: 1
  }
};

const cino: Auth = {
  token: 'xxx.xxx.xxx',
  roles: ['roleA', 'roleB', 'roleC'],
  user: {
    user: 'cino',
    email: 'leoncino@mail.com',
    password: 'cino',
    firstname: 'Cino',
    lastname: 'Leon',
    age: 32,
    id: 2
  }
};

const pino: Auth = {
  token: 'xxx.xxx.xxx',
  roles: ['roleA', 'roleB', 'roleC'],
  user: {
    user: 'pino',
    email: 'pinosilvestre@mail.com',
    password: 'pino',
    firstname: 'Pino',
    lastname: 'Silvestre',
    age: 32,
    id: 3
  }
};
const poli: Auth = {
  token: 'xxx.xxx.xxx',
  roles: ['roleA', 'roleB', 'roleC'],
  user: {
    user: 'poli',
    email: 'poliester@mail.com',
    password: 'poli',
    firstname: 'Poli',
    lastname: 'Ester',
    age: 32,
    id: 4
  }
};

const authMocks: { [key: string]: Auth } = {
  cipo, cino, pino, poli
};

