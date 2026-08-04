export function pick(obj, keys) {
  if (!obj) return {};
  return keys.reduce((acc, key) => {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      obj[key] !== undefined
    ) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}
