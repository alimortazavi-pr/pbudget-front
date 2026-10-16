"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { io, type Socket } from "socket.io-client";

import { BASE_API_URL } from "@/common/constants";
import { useAppSelector } from "@/stores/hooks";
import { tokenSelector } from "@/stores/auth";

export type SupportChangeEvent = {
  ticketId: string;
  kind: "created" | "message" | "note" | "read" | "status" | "updated";
  by?: "user" | "admin";
};
export type SupportTypingEvent = { ticketId: string; by: "user" | "admin"; name: string };
export type SupportReadEvent = { ticketId: string; by: "user" | "admin"; at: string };

/**
 * One socket.io connection to the API's /support namespace for the signed-in
 * account, shared by every component. Pages keep a slow REST poll as a
 * fallback, and poll faster while `connected` is false.
 */
let socket: Socket | null = null;
let socketToken: string | null = null;
let connected = false;
const listeners = new Set<() => void>();
const emitState = () => listeners.forEach((listener) => listener());

function apiOrigin() {
  try {
    return new URL(BASE_API_URL).origin;
  } catch {
    return typeof window === "undefined" ? "" : window.location.origin;
  }
}

function ensureSocket(token: string) {
  if (socket && socketToken === token) return socket;
  socket?.disconnect();
  socketToken = token;
  connected = false;
  socket = io(`${apiOrigin()}/support`, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionDelay: 2_000,
    reconnectionDelayMax: 30_000,
  });
  socket.on("connect", () => {
    connected = true;
    emitState();
  });
  socket.on("disconnect", () => {
    connected = false;
    emitState();
  });
  return socket;
}

function closeSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
  connected = false;
  emitState();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Connection status of the shared support socket. */
export function useSupportSocket() {
  const token = useAppSelector(tokenSelector);
  useEffect(() => {
    if (token) ensureSocket(token);
    else closeSocket();
  }, [token]);
  return useSyncExternalStore(subscribe, () => connected, () => false);
}

/** Calls `handler` for a socket event while the component is mounted. */
export function useSupportEvent<T>(event: "support:changed" | "support:typing" | "support:read", handler: (payload: T) => void) {
  const token = useAppSelector(tokenSelector);
  const saved = useRef(handler);
  useEffect(() => {
    saved.current = handler;
  }, [handler]);
  useEffect(() => {
    if (!token) return;
    const s = ensureSocket(token);
    const listener = (payload: T) => saved.current(payload);
    s.on(event, listener);
    return () => {
      s.off(event, listener);
    };
  }, [event, token]);
}

/** Joins a conversation's room (typing, read receipts) while it is open; rejoins after reconnects. */
export function useSupportRoom(ticketId: string | null | undefined) {
  const token = useAppSelector(tokenSelector);
  const isConnected = useSupportSocket();
  useEffect(() => {
    if (!token || !ticketId || !isConnected) return;
    const s = ensureSocket(token);
    s.emit("support:join", { ticketId });
    return () => {
      s.emit("support:leave", { ticketId });
    };
  }, [token, ticketId, isConnected]);
}

/** Sends a throttled "typing" signal for the open conversation. */
export function useTypingSender(ticketId: string | null | undefined) {
  const last = useRef(0);
  return () => {
    if (!socket?.connected || !ticketId) return;
    const now = Date.now();
    if (now - last.current < 2_500) return;
    last.current = now;
    socket.emit("support:typing", { ticketId });
  };
}

/** "در حال نوشتن…" state for a conversation, cleared a few seconds after the last signal. */
export function useTypingIndicator(ticketId: string | null | undefined, from: "user" | "admin") {
  const [typing, setTyping] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useSupportEvent<SupportTypingEvent>("support:typing", (event) => {
    if (event.ticketId !== ticketId || event.by !== from) return;
    setTyping(event.name || "");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTyping(null), 4_000);
  });
  useEffect(() => {
    setTyping(null);
    return () => window.clearTimeout(timer.current);
  }, [ticketId]);
  return typing;
}
