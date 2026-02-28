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

export function useQueryState<T extends QueryStateRecord>(defaults: T) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const stateFromUrl = useMemo(
    () => mergeQueryState(defaults, readQueryParams(searchParams.entries())),
    [defaults, searchParams],
  );

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
