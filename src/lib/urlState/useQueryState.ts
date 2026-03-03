"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  mergeQueryState,
  readQueryParams,
  toQueryString,
  type QueryStateRecord,
} from "./queryParams";

type StateUpdater<T> = T | ((prev: T) => T);
const STORAGE_PREFIX = "query-state:";

function readPersistedState<T extends QueryStateRecord>(key: string): Partial<T> | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Partial<T>;
  } catch {
    return null;
  }
}

export function useQueryState<T extends QueryStateRecord>(defaults: T) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const storageKey = `${STORAGE_PREFIX}${pathname}`;
  const stateFromUrl = useMemo(() => {
    const queryState = readQueryParams(searchParams.entries());
    const hasQuery = searchParams.toString().length > 0;
    const persisted = hasQuery ? null : readPersistedState<T>(storageKey);
    const merged = mergeQueryState(defaults, (persisted ?? {}) as QueryStateRecord);
    return mergeQueryState(merged, queryState);
  }, [defaults, searchParams, storageKey]);

  const [state, setState] = useState<T>(stateFromUrl);

  useEffect(() => {
    setState(stateFromUrl);
  }, [stateFromUrl]);

  useEffect(() => {
    const currentQuery = searchParams.toString();
    const nextQuery = toQueryString(state, defaults);

    if (currentQuery === nextQuery) {
      return;
    }

    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [defaults, pathname, router, searchParams, state]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  const setQueryState = useCallback(
    (updater: StateUpdater<T>) => {
      setState((prev) =>
        typeof updater === "function"
          ? (updater as (current: T) => T)(prev)
          : updater,
      );
    },
    [],
  );

  return [state, setQueryState] as const;
}
