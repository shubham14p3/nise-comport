"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";

type Conversation = { phone: string; name: string | null; last: string; at: string; direction: string; needsHuman: boolean };
type Message = { id: string; direction: string; body: string; sender: string; createdAt: string };
const LIST = "U3j7P1xH5nQ9";
const SEND = "C5t9W2yM6kD8";

/** Admin → WhatsApp chats: every customer conversation with the assistant, plus replies from staff. */
export default function ChatsPanel() {
  const [list, setList] = useState<Conversation[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    try { const r = await secureApi<{ conversations: Conversation[]; configured: boolean }>(LIST); setList(r.conversations); setConfigured(r.configured); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load chats."); }
  }, []);
  const loadChat = useCallback(async (phone: string) => {
    try { setMessages((await secureApi<{ messages: Message[] }>(LIST, { phone })).messages); } catch (e) { setError(e instanceof Error ? e.message : "Could not load the chat."); }
  }, []);
  useEffect(() => {
    void loadList();
    const poll = () => { if (document.visibilityState === "visible") void loadList(); };
    const timer = window.setInterval(poll, 30_000);
    document.addEventListener("visibilitychange", poll);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", poll); };
  }, [loadList]);
  useEffect(() => { if (open) void loadChat(open); }, [open, loadChat]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!open || !text.trim()) return;
    setBusy(true); setError("");
    try { await secureApi(SEND, { phone: open, text }); setText(""); await loadChat(open); await loadList(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send."); } finally { setBusy(false); }
  }

  return <section className="admin-card">
    <h2>WhatsApp chats</h2>
    {!configured && <p className="muted">WhatsApp Cloud API is not connected yet (see docs/whatsapp-setup.md), so the assistant is off.</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="chat-layout">
      <ul className="chat-list">
        {!list ? <li>Loading…</li> : !list.length ? <li>No chats yet.</li> : list.map((c) => <li key={c.phone}>
          <button type="button" className={open === c.phone ? "is-active" : undefined} onClick={() => setOpen(c.phone)}>
            <b>{c.name || c.phone}</b>{c.needsHuman && <span className="chat-flag">needs reply</span>}<br/><small>{c.direction === "in" ? "" : "You: "}{c.last}</small>
          </button></li>)}
      </ul>
      {open && <div className="chat-thread">
        <h3>{open}</h3>
        <div className="chat-messages">{messages.map((m) => <p key={m.id} className={m.direction === "in" ? "chat-in" : "chat-out"}><small>{m.sender} · {new Date(m.createdAt).toLocaleString("en-IN")}</small><br/>{m.body}</p>)}</div>
        <form onSubmit={send} className="admin-form-row"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a reply" maxLength={1000}/><button className="btn btn--primary btn--sm" disabled={busy || !text.trim()}>Send</button></form>
        <small>WhatsApp allows free replies only within 24 hours of the customer’s last message.</small>
      </div>}
    </div>
  </section>;
}
