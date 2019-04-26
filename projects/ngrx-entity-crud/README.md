# NgrxEntityCrud
Actions, reducers selectors... for the CRUD management of the entities.

## Why make this library?

Basic steps before creating the library (maybe it will help you understand):

1) Having adopted this best practice:   
[NgRx — Best Practices for Enterprise Angular Applications](https://itnext.io/ngrx-best-practices-for-enterprise-angular-applications-6f00bcdf36d7)

2) I wanted a mechanism to eliminate repeated code in my projects, after reading this article:   
[How to Reduce Action Boilerplate](https://blog.angularindepth.com/how-to-reduce-action-boilerplate-90dc3d389e2b)

3) I replaced all my actions, using the ts-action and ts-action-operators libraries.

4) At that point the code was reduced a lot, but I still had repeated code for the reducers and selectors.

5) I decided to create an extension of [@ngrx/entity](https://github.com/ngrx/platform/tree/master/modules/entity) for the automatic generation of actions, reducers, selectors and everything that can be used for the CRUD management of the entities.


## Running unit tests

Run `ng test NgrxEntityCrud` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Help

For help or information write to: incoming+jucasoft-ngrx-entity-crud-12043524-issue-@incoming.gitlab.com

## MIT License

Copyright (c) 2016 Gleb Bahmutov

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
