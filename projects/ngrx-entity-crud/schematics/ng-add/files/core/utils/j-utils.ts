export function evalData<T>(fn: Function, def: any = null): T {
  try {
    return fn();
  } catch (e) {
    return def;
  }
}

export function stringifyCompare(a: any, b: any): boolean {
  return evalData(() => JSON.stringify(a) === JSON.stringify(b), false);
}

export const getUrlParam = (key) => {
  const matches = window.location.href.match(new RegExp(`[?&]${key}=([^&#]+)\\b`));
  return (matches && matches.length > 0) ? matches[1] : null;
};

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getFlattenInObject<T, R>(propertyName, inputArray: T[], distinct: boolean): R[] {
  let result = [];
  inputArray.forEach(item => {
    if (!distinct || (distinct && result.indexOf(item[propertyName]) === -1)) {
      result.push(item[propertyName]);
    }
  });
  return result;
}

export function getDuplicateInObject<T>(propertyName, inputArray: T[]): T[] {

  var sorted_arr = [...inputArray].sort(function(a, b) {
    return ('' + a[propertyName]).localeCompare(b[propertyName]);
  });

  var results: T[] = [];
  for (var i = 0; i < sorted_arr.length - 1; i++) {
    if (sorted_arr[i + 1][propertyName] == sorted_arr[i][propertyName] && !results.find(item => item[propertyName] === sorted_arr[i][propertyName])) {
      results.push(sorted_arr[i]);
    }
  }

  return results;

}


export function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    let context = this, args = arguments;
    let later = function() {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };
    let callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };
};

export const parseQueryString = (qs) => {
  const items = qs.split('&');
  return items.reduce((data, item) => {
    const [key, value] = item.split('=');
    if (data[key] !== undefined) {
      if (!Array.isArray(data[key])) {
        data[key] = [data[key]];
      }
      data[key].push(value);
    } else {
      data[key] = value;
    }
    return data;
  }, {});
};
