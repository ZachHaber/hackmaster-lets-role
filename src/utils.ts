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

// export function deepClone<T>(value: T[]):T[]
export function deepClone<T>(value: T): T {
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    return Array.from<any>(value as unknown as any).map(
      (val) => deepClone(val as any) as any
    ) as any;
  } else if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map((entry) => [entry[0], deepClone(entry[1])])
    ) as any;
  }
  return value;
}

const IS_DEBUG = false;

export function debug(data: any) {
  // Only log if IS_DEBUG is set.
  if (!IS_DEBUG) {
    return;
  }
  if (typeof data === 'object' && data !== null) {
    log(data);
  } else {
    log(`[debug]: ${data}`);
  }
}
export function debugFunc(data: () => any) {
  // Only log if IS_DEBUG is set.
  if (!IS_DEBUG) {
    return;
  }
  if (typeof data !== 'function') {
    return;
  }
  debugDeep(data());
}
export function debugDeep(data: any) {
  // Only log if IS_DEBUG is set.
  if (!IS_DEBUG) {
    return;
  }
  if (typeof data === 'object' && data !== null) {
    log(deepClone(data));
  } else {
    log(`[debug]: ${data}`);
  }
}
