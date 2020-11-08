import {FilterMetadata} from './models';

export const isEmpty = (obj) => {
  return obj === null || undefined
    ? true
    : (() => {
      for (const prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
          return false;
        }
      }
      return true;
    })();
};

export function jNgrxFilter<T>(items: T[], filters: { [s: string]: FilterMetadata; }): T[] {
  return new JNgrxFilter<T>().jNgrxFilter(items, filters);
}

export class JNgrxFilter<T> {

  private readonly filterConstraints = {

    startsWith(value, filter): boolean {
      if (filter === undefined || filter === null || filter.trim() === '') {
        return true;
      }

      if (value === undefined || value === null) {
        return false;
      }

      const filterValue = filter.toLowerCase();
      return value.toString().toLowerCase().slice(0, filterValue.length) === filterValue;
    },

    contains(value, filter): boolean {
      if (filter === undefined || filter === null || (typeof filter === 'string' && filter.trim() === '')) {
        return true;
      }

      if (value === undefined || value === null) {
        return false;
      }

      return value.toString().toLowerCase().indexOf(filter.toLowerCase()) !== -1;
    },

    endsWith(value, filter): boolean {
      if (filter === undefined || filter === null || filter.trim() === '') {
        return true;
      }

      if (value === undefined || value === null) {
        return false;
      }

      const filterValue = filter.toString().toLowerCase();
      return value.toString().toLowerCase().indexOf(filterValue, value.toString().length - filterValue.length) !== -1;
    },

    equals(value, filter): boolean {
      if (filter === undefined || filter === null || (typeof filter === 'string' && filter.trim() === '')) {
        return true;
      }

      if (value === undefined || value === null) {
        return false;
      }

      return value.toString().toLowerCase() === filter.toString().toLowerCase();
    },

    notEquals(value, filter): boolean {
      if (filter === undefined || filter === null || (typeof filter === 'string' && filter.trim() === '')) {
        return false;
      }

      if (value === undefined || value === null) {
        return true;
      }

      return value.toString().toLowerCase() !== filter.toString().toLowerCase();
    },

    in(value, filters: any[]): boolean {
      if (filters === undefined || filters === null || filters.length === 0) {
        return true;
      }

      if (value === undefined || value === null) {
        return false;
      }

      filters.forEach(filter => {
        if (filter === value) {
          return true;
        }
      });

      return false;
    }
  };

  public jNgrxFilter(items: T[], filters: { [s: string]: FilterMetadata; }): T[] {

    if (isEmpty(filters)) {
      return items;
    }

    const filteredValue = [];
    items.forEach((item) => {
      let localMatch = false;

      // tslint:disable-next-line:forin
      for (const filterField in filters) {

        const filterValue = filters[filterField].value;
        const filterMatchMode = filters[filterField].matchMode || 'startsWith';
        const filterConstraint = this.filterConstraints[filterMatchMode];

        const renderFunction = filters[filterField].renderFunction;
        const dataFieldValue = this.isFunction(renderFunction) ? renderFunction(this.resolveFieldData(item, filterField)) : this.resolveFieldData(item, filterField);

        if (filterConstraint(dataFieldValue, filterValue)) {
          localMatch = true;
          break;
        }
      }
      if (localMatch) {
        filteredValue.push(item);
      }
    });

    return filteredValue;
  }

  private resolveFieldData(data: any, field: any): any {
    if (data && field) {
      if (this.isFunction(field)) {
        return field(data);
      } else if (field.indexOf('.') === -1) {
        return data[field];
      } else {
        const fields: string[] = field.split('.');
        let value = data;
        for (let i = 0, len = fields.length; i < len; ++i) {
          if (value == null) {
            return null;
          }
          value = value[fields[i]];
        }
        return value;
      }
    } else {
      return null;
    }
  }

  private readonly isFunction = (obj: any) => !!(obj && obj.constructor && obj.call && obj.apply);
}
