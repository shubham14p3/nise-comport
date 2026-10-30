"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, RefreshCw, Search, Send, WifiOff } from "lucide-react";
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
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadList = useCallback(async () => {
    try { const r = await secureApi<{ conversations: Conversation[]; configured: boolean }>(LIST); setList(r.conversations); setConfigured(r.configured); setOpen((current) => current ?? r.conversations[0]?.phone ?? null); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load chats."); }
  }, []);
  const loadChat = useCallback(async (phone: string) => {
    try { setMessages((await secureApi<{ messages: Message[] }>(LIST, { phone })).messages); } catch (e) { setError(e instanceof Error ? e.message : "Could not load the chat."); }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(loadList);
    const poll = () => { if (document.visibilityState === "visible") void loadList(); };
    const timer = window.setInterval(poll, 30_000);
    document.addEventListener("visibilitychange", poll);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", poll); };
  }, [loadList]);
  useEffect(() => {
    if (!open) return;
    void Promise.resolve().then(() => loadChat(open));
    // The list already refreshes; keep the currently open conversation live too.
    const pollChat = () => { if (document.visibilityState === "visible") void loadChat(open); };
    const timer = window.setInterval(pollChat, 10_000);
    return () => window.clearInterval(timer);
  }, [open, loadChat]);

  const filtered = useMemo(() => (list ?? []).filter((item) =>
    `${item.name ?? ""} ${item.phone} ${item.last}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [list, query]);
  const selected = list?.find((item) => item.phone === open);
  async function refresh() {
    setRefreshing(true);
    try { await Promise.all([loadList(), ...(open ? [loadChat(open)] : [])]); }
    finally { setRefreshing(false); }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!open || !text.trim()) return;
    setBusy(true); setError("");
    try { await secureApi(SEND, { phone: open, text }); setText(""); await loadChat(open); await loadList(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send."); } finally { setBusy(false); }
  }

  return <section className="admin-card wa-inbox">
    <div className="wa-inbox__top">
      <div><div className="wa-inbox__eyebrow"><MessageCircle size={17}/> CUSTOMER MESSAGING</div>
        <h2>WhatsApp inbox</h2><p className="muted">Customer chats, bot replies and staff handovers in one place.</p></div>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => void refresh()} disabled={refreshing} aria-label="Refresh WhatsApp conversations"><RefreshCw size={16}/> {refreshing ? "Refreshing…" : "Refresh"}</button>
    </div>
    {!configured && <p role="status" className="wa-inbox__notice"><WifiOff size={17}/> Cloud API is not configured on this server. Check the WhatsApp credentials and webhook.</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="wa-inbox__layout">
      <aside className="wa-inbox__side" aria-label="Conversations">
        <label className="wa-inbox__search"><Search size={17}/><span className="sr-only">Search conversations</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, number or message"/></label>
        <div className="wa-inbox__count">{list?.length ?? 0} conversations</div>
        <ul className="wa-inbox__list">
          {!list ? <li className="wa-inbox__empty">Loading conversations…</li> : !filtered.length ?
            <li className="wa-inbox__empty">{list.length ? "No matching conversations." : "No chats recorded yet. Check that Meta's messages webhook is subscribed and incoming messages reach this server."}</li> :
            filtered.map((c) => <li key={c.phone}><button type="button" aria-current={open === c.phone ? "true" : undefined} className={open === c.phone ? "is-active" : ""} onClick={() => setOpen(c.phone)}>
              <span className="wa-inbox__avatar">{(c.name || c.phone).charAt(0).toUpperCase()}</span>
              <span className="wa-inbox__contact"><span className="wa-inbox__name">{c.name || c.phone}{c.needsHuman && <span className="wa-inbox__flag">Needs reply</span>}</span>
                <small>{c.name ? c.phone : new Date(c.at).toLocaleString("en-IN", {dateStyle:"short",timeStyle:"short"})}</small>
                <span className="wa-inbox__preview">{c.direction === "out" ? "You: " : ""}{c.last}</span></span>
            </button></li>)}
        </ul>
      </aside>
      <div className="wa-inbox__thread">
        {open ? <>
          <header className="wa-inbox__thread-head"><span className="wa-inbox__avatar">{(selected?.name || open).charAt(0).toUpperCase()}</span>
            <div><strong>{selected?.name || open}</strong><small>{open}</small></div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => void loadChat(open)} aria-label="Refresh open conversation"><RefreshCw size={16}/></button>
          </header>
          <div className="wa-inbox__messages" aria-label="WhatsApp messages" aria-live="polite">
            {messages.length ? messages.map((m) => <article key={m.id} className={m.direction === "in" ? "wa-inbox__bubble wa-inbox__bubble--in" : "wa-inbox__bubble wa-inbox__bubble--out"}>
              <p>{m.body}</p><small>{m.sender} · {new Date(m.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</small>
            </article>) : <p className="wa-inbox__empty">No messages found for this conversation.</p>}
          </div>
          <form onSubmit={send} className="wa-inbox__compose">
            <label className="sr-only" htmlFor="wa-message">Message</label>
            <input id="wa-message" value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply to this customer…" maxLength={1000}/>
            <button className="btn btn--primary btn--sm" disabled={busy || !text.trim()}><Send size={16}/>{busy ? "Sending…" : "Send"}</button>
          </form>
          <p className="wa-inbox__disclaimer">Free-form replies require a customer message within the past 24 hours. Older conversations need an approved template.</p>
        </> : <div className="wa-inbox__empty wa-inbox__empty--center"><MessageCircle size={30}/><p>Select a conversation to view messages.</p></div>}
      </div>
    </div>
  </section>;
}
