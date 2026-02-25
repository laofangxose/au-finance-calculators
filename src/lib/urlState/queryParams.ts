export type QueryStateRecord = Record<string, string>;

export function readQueryParams(
  entries: Iterable<[string, string]>,
): QueryStateRecord {
  const record: QueryStateRecord = {};

  for (const [key, value] of entries) {
    record[key] = value;
  }

  return record;
}

export function mergeQueryState<T extends QueryStateRecord>(
  defaults: T,
  queryState: QueryStateRecord,
): T {
  const next = { ...defaults };

  for (const key of Object.keys(defaults) as Array<keyof T>) {
    const value = queryState[String(key)];

    if (value !== undefined) {
      next[key] = value as T[keyof T];
    }
  }

  return next;
}

export function toQueryString<T extends QueryStateRecord>(
  state: T,
  defaults?: Partial<T>,
): string {
  const params = new URLSearchParams();

  for (const key of Object.keys(state).sort() as Array<keyof T>) {
    const value = state[key];
    const defaultValue = defaults?.[key];

    if (value === "" || value === defaultValue) {
      continue;
    }

    params.set(String(key), value);
  }

  return params.toString();
}
