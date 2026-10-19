"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const noop = () => () => undefined;

/** Renders dialogs on <body> so no page section can stack above them (the sticky site header used to). */
export default function Portal({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  return ready ? createPortal(children, document.body) : null;
}
