import {of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {BaseSingularCrudService} from '../lib/base-singular-crud.service';

interface Profile {
  id: string;
}

describe('BaseSingularCrudService', () => {
  function makeService(): {service: BaseSingularCrudService<Profile>; http: {get: jest.Mock}} {
    const http = {get: jest.fn().mockReturnValue(of({hasError: false, message: '', data: {id: '1'}}))};
    const service = new BaseSingularCrudService<Profile>(http as unknown as HttpClient);
    service.service = 'api/profile';
    return {service, http};
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('select() senza debugMode non scrive nulla in console', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const {service} = makeService();

    service.select({queryParams: {}}).subscribe();

    expect(log).not.toHaveBeenCalled();
  });

  it('select() con debugMode scrive i log di debug', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const {service} = makeService();
    service.debugMode();

    service.select({queryParams: {}}).subscribe();

    expect(log).toHaveBeenCalled();
  });

  it('select() chiama GET su url del servizio + path', () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const {service, http} = makeService();

    service.select({path: ['me'], queryParams: {}}).subscribe();

    expect(http.get).toHaveBeenCalledWith('api/profileme', expect.anything());
  });
});
