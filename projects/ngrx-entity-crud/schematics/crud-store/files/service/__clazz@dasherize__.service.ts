import {Injectable} from '@angular/core';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {environment} from '../../../environments/environment';
import {BaseCrudService} from 'ngrx-entity-crud';

@Injectable({
	providedIn: 'root'
})
export class <%= clazz %>Service extends BaseCrudService<<%= clazz %>> {
	protected service = environment.webServiceUri + '<%= dasherize(clazz) %>';
}
