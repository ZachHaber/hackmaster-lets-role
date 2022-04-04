export function tableToArray<T extends { id: string }>(
  table: Table<T>,
  skipDefault: boolean=false
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
