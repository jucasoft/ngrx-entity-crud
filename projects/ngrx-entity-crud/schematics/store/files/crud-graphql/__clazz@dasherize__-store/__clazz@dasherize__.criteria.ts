import {ICriteria} from 'ngrx-entity-crud';
import {QueryOptions} from '@apollo/client/core';
import {<%= clazz %>CreateDocument, <%= clazz %>CreateMutation, <%= clazz %>CreateMutationVariables, <%= clazz %>RemoveDocument, <%= clazz %>RemoveMutation, <%= clazz %>RemoveMutationVariables, <%= clazz %>SearchDocument, <%= clazz %>SearchQuery, <%= clazz %>SearchQueryVariables, <%= clazz %>SelectDocument, <%= clazz %>SelectQuery, <%= clazz %>SelectQueryVariables, <%= clazz %>UpdateDocument, <%= clazz %>UpdateMutation, <%= clazz %>UpdateMutationVariables} from '../graphql';

export const search = (variables: <%= clazz %>SearchQueryVariables): ICriteria<QueryOptions<<%= clazz %>SearchQueryVariables, <%= clazz %>SearchQuery>> => ({
  queryParams: {
    query: <%= clazz %>SearchDocument,
    variables,
  }
})

export const select = (variables: <%= clazz %>SelectQueryVariables): ICriteria<QueryOptions<<%= clazz %>SelectQueryVariables, <%= clazz %>SelectQuery>> => ({
  queryParams: {
    query: <%= clazz %>SelectDocument,
    variables,
  }
})

export const create = (variables: <%= clazz %>CreateMutationVariables): ICriteria<QueryOptions<<%= clazz %>CreateMutationVariables, <%= clazz %>CreateMutation>> => ({
  queryParams: {
    query: <%= clazz %>CreateDocument,
    variables,
  }
})

export const update = (variables: <%= clazz %>UpdateMutationVariables): ICriteria<QueryOptions<<%= clazz %>UpdateMutationVariables, <%= clazz %>UpdateMutation>> => ({
  queryParams: {
    query: <%= clazz %>UpdateDocument,
    variables,
  }
})

export const remove = (variables: <%= clazz %>RemoveMutationVariables): ICriteria<QueryOptions<<%= clazz %>RemoveMutationVariables, <%= clazz %>RemoveMutation>> => ({
  queryParams: {
    query: <%= clazz %>RemoveDocument,
    variables,
  }
})

