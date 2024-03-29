import {Injectable} from '@angular/core';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {environment} from '../../../environments/environment';
import {BaseSingularCrudService} from 'ngrx-entity-crud';

@Injectable({
	providedIn: 'root'
})
export class <%= clazz %>Service extends BaseSingularCrudService<<%= clazz %>> {
	public service = environment.webServiceUri + '<%= dasherize(clazz) %>';
}
