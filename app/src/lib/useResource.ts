import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ApiError } from "./api";
import { useAuth } from "./auth";

type State<T> =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: T; refreshing: boolean };

/**
 * Loads data for a signed-in screen and reloads it every time the screen gains focus.
 * A 401 signs the rider out so the layout guard returns them to sign-in.
 */
export function useResource<T>(load: (token: string, signal: AbortSignal) => Promise<T>) {
  const { session, signOut } = useAuth();
  const token = session?.token ?? null;
  const [state, setState] = useState<State<T>>({ kind: "loading" });
  const controller = useRef<AbortController | null>(null);
  const loadRef = useRef(load);
  loadRef.current = load;

  const run = useCallback(
    async (mode: "initial" | "refresh" | "silent"): Promise<boolean> => {
      if (!token) return false;
      controller.current?.abort();
      const ctrl = new AbortController();
      controller.current = ctrl;
      setState((prev) => {
        if (mode === "initial" || prev.kind !== "ready") return { kind: "loading" };
        return mode === "refresh" ? { ...prev, refreshing: true } : prev;
      });
      try {
        const data = await loadRef.current(token, ctrl.signal);
        if (ctrl.signal.aborted) return false;
        setState({ kind: "ready", data, refreshing: false });
        return true;
      } catch (err) {
        if (ctrl.signal.aborted) return false;
        if (err instanceof ApiError && err.status === 401) {
          await signOut();
          return false;
        }
        setState({ kind: "error", message: err instanceof Error ? err.message : "Something went wrong" });
        return false;
      }
    },
    [token, signOut],
  );

  useFocusEffect(
    useCallback(() => {
      void run("silent");
      return () => controller.current?.abort();
    }, [run]),
  );

  return {
    state,
    retry: useCallback(() => run("initial"), [run]),
    refresh: useCallback(() => run("refresh"), [run]),
    setData: useCallback((data: T) => setState({ kind: "ready", data, refreshing: false }), []),
  };
}
