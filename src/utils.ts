export function tableToArray<T extends { id: string }>(
  table: Table<T>,
  skipDefault: boolean = false
): T[] {
  const arr: T[] = [];
  table.each(function (row) {
    if (!skipDefault || row.id !== 'default') {
      arr.push(row);
    }
  });
  return arr;
}
export function toMap<
  T extends Record<string | number, any>,
  K extends keyof T
>(array: T[], key: K): Record<T[K], T> {
  return Object.fromEntries(
    array.map(function (value) {
      return [value[key], value];
    })
  );
}

export function length(
  collection: any[] | object | string | null | undefined
): number {
  if (collection == null) return 0;
  if (Array.isArray(collection)) return collection.length;
  if (typeof collection === 'object') return Object.keys(collection).length;
  /**
   * Let's role bug: {@link https://tracker.lets-role.dev/youtrack/issue/REPORTS-119}: strings always have 0 length... BAD AS HELL
   */
  return Array.from(collection).length;
}

export function ensureArray<T>(val: T | T[]): T[] {
  if (val == null) {
    return [];
  }
  return Array.isArray(val) ? val : [val];
}

export function isObject(value: any): value is object {
  return value && typeof value === 'object' && !Array.isArray(value);
}
