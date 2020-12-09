import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Auth} from '@models/vo/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  service = environment.webServiceUri;

  constructor(public http: HttpClient) {
  }

  login(email: string, password: string): Observable<Auth> {
    console.log('AuthService.login()');
    // return this.http.post(this.service + '/login', {user, passwd});
    throw new Error('method not implemented');
  }

  logout(): Observable<boolean> {
    console.log('AuthService.logout()');
    throw new Error('method not implemented');
  }

}
