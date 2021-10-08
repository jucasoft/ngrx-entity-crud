import {Injectable} from '@angular/core';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {environment} from '../../../environments/environment';
import {BaseCrudGqlService} from 'ngrx-entity-crud';
import {Apollo} from 'apollo-angular';

@Injectable({
	providedIn: 'root'
})
export class <%= clazz %>Service extends BaseCrudGqlService<<%= clazz %>> {
	public service = environment.webServiceUri + '<%= dasherize(clazz) %>';

  constructor(private apolloA: Apollo) {
    super.apollo = apollo;
  }
}
