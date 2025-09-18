export class AuthUser {
  public user: string;
  public email: string;
  public password: string;
  public firstname: string;
  public lastname: string;
  public age: number;
  public id: number;

}

export class Auth {
  token: string;
  user: AuthUser;
  roles: string[];
}

