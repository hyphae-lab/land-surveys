export const humanReadableTitle = (s) => {
  let str = s.split('');
  let nextCap = false;
  for (let i = 0; i < str.length; i++) {
    if(i === 0 || nextCap) {
      str[i] = str[i].toUpperCase();
      nextCap = false;
    }
    if (str[i] === '.' || str[i] === '_' || str[i] === '-') {
      str[i] = ' ';
      nextCap = true;
    }
  }
  return str.join('');
};

export const addUniqueKey = (item) => {
  if ((item instanceof Object)) {
    if (!item.uniqueKeyReactMap) {
      Object.defineProperty(item, 'uniqueKeyReactMap', {
        enumerable: false,
        writable: false,
        value: Math.floor(Math.random() * 1000 * 1000 * 1000).toString(16)
      });
    }

    return item.uniqueKeyReactMap;
  } else {
    return item;
  }
};

export const makePromiseFactory = () => {
  let resolve = null;
  let reject = null;
  const promise = new Promise((resolve_, reject_) => {
    resolve = resolve_;
    reject = reject_;
  });
  return {promise, resolve, reject};
};
