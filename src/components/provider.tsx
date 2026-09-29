"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Command, State } from "../simulation/types";
type WorkplaceContext = {
  state: State | null;
  busy: boolean;
  error: string;
  send: (command: Command) => Promise<State | undefined>;
  reload: () => Promise<void>;
};
const Context = createContext<WorkplaceContext | null>(null);
export function WorkplaceProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: State;
}) {
  const [state, setState] = useState<State | null>(initial || null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const revision = useRef(0),
    queue = useRef<Promise<unknown>>(Promise.resolve());
  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/workplace", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "Cannot load the workplace");
      revision.current = data.revision;
      setState(data.state);
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  const send = useCallback((command: Command): Promise<State | undefined> => {
    const task = queue.current.then(async () => {
      setBusy(true);
      try {
        const res = await fetch("/api/workplace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command, revision: revision.current }),
        });
        const data = await res.json();
        if (!res.ok) throw Error(data.error);
        revision.current = data.revision;
        setState(data.state);
        setError("");
        return data.state as State;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return undefined;
      } finally {
        setBusy(false);
      }
    });
    queue.current = task;
    return task;
  }, []);
  useEffect(() => {
    if (!state?.running || state.minute >= 1020) return;
    const timer = setInterval(
      () => void send({ type: "tick", minutes: 1 }),
      5000,
    );
    return () => clearInterval(timer);
  }, [state?.running, state?.minute, send]);
  return (
    <Context.Provider value={{ state, busy, error, send, reload }}>
      {children}
    </Context.Provider>
  );
}
export function useWorkplace() {
  const ctx = useContext(Context);
  if (!ctx) throw Error("Workplace provider missing");
  return ctx;
}
