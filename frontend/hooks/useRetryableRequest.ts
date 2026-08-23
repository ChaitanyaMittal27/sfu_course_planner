"use client";

import { useCallback, useReducer } from "react";

/**
 * Provides a stable retry action and a request version for effects that load
 * page data. Including requestVersion in an effect's dependencies re-runs the
 * request without resetting the route or reloading the application.
 */
export function useRetryableRequest() {
  const [requestVersion, retry] = useReducer((version: number) => version + 1, 0);

  return {
    requestVersion,
    retry: useCallback(() => retry(), []),
  };
}
