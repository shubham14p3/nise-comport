"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, Download, Eye, HardDrive, Hourglass, Inbox, Link2, Lock, Mail, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Paperclip, PenSquare, Printer, RefreshCw, RotateCcw, Search, Send, X } from "lucide-react";
import Portal from "@/components/portal";
import { secureApi, secureFile, SecureApiError } from "@/lib/secure-api-client";
import {
  findReferences, formatBytes, QUICK_REPLIES, STAFF_STATUS_LABEL, STATUS_LABEL, TICKET_STATUSES, type MailAttachmentInfo, type MailMeta, type MailTicketDetail, type MailTicketSummary, type TicketStatus,
} from "@/lib/mail-core";
import { FileGlyph, FileViewer, linkedFileSource, mailFileSource, PendingList, printBlob, saveBlob, Thumb, useAttachments, type FileSource } from "@/components/mail-files";

const OP = { read: "Q3x8M5wT2kB7", write: "Z6n2K9cR4vP1", zip: "T2m7S5xK9wD4" } as const;

type Box = { id: string; label: string };
const STAFF_BOXES: Box[] = [
  { id: "open", label: "Open" }, { id: "awaiting_customer", label: "Waiting for customer" }, { id: "get_back_soon", label: "Get back soon" },
  { id: "resolved", label: "Resolved" }, { id: "closed", label: "Closed" }, { id: "all", label: "All messages" },
];
const CUSTOMER_BOXES: Box[] = [
  { id: "active", label: "Open" }, { id: "awaiting_customer", label: "Waiting for your reply" }, { id: "resolved", label: "Resolved" }, { id: "closed", label: "Closed" }, { id: "all", label: "All messages" },
];

const BOX_ICON: Record<string, typeof Inbox> = { open: Inbox, active: Inbox, awaiting_customer: Clock, get_back_soon: Hourglass, resolved: CheckCircle2, closed: Lock, all: Mail };
const IST = "Asia/Kolkata";
function listTime(iso: string) {
  const date = new Date(iso); const now = new Date();
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: IST });
  if (day(date) === day(now)) return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: IST }).toLowerCase();
  const sameYear = date.toLocaleDateString("en-IN", { year: "numeric", timeZone: IST }) === now.toLocaleDateString("en-IN", { year: "numeric", timeZone: IST });
  return date.toLocaleDateString("en-IN", sameYear ? { day: "numeric", month: "short", timeZone: IST } : { day: "numeric", month: "short", year: "numeric", timeZone: IST });
}
const fullTime = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: IST });
const initials = (value: string) => (value.match(/[\p{L}\p{N}]/gu) ?? ["?"]).slice(0, 2).join("").toUpperCase();
const prettyStatus = (value: string) => value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const errorText = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Please try again.";

function StatusTag({ status, staff }: { status: TicketStatus; staff: boolean }) {
  return <span className={`mbx-status mbx-status--${status}`}><i aria-hidden="true"/>{(staff ? STAFF_STATUS_LABEL : STATUS_LABEL)[status]}</span>;
}

/** Plain text with web links made clickable. Nothing else in a message is ever treated as markup. */
function MessageText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<>"']+)/g);
  return <p className="mbx-text">{parts.map((part, index) => {
    if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
    const trimmed = part.replace(/[.,;:!?)\]]+$/, ""); const tail = part.slice(trimmed.length);
    return <Fragment key={index}><a href={trimmed} target="_blank" rel="noopener noreferrer nofollow">{trimmed}</a>{tail}</Fragment>;
  })}</p>;
}

export default function MailClient({ mode, onUnread }: { mode: "customer" | "staff"; onUnread?: (count: number) => void }) {
  const staff = mode === "staff";
  const boxes = staff ? STAFF_BOXES : CUSTOMER_BOXES;
  const [meta, setMeta] = useState<MailMeta | null>(null);
  const [box, setBox] = useState(boxes[0].id);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState<MailTicketSummary[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [listError, setListError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<MailTicketDetail | null>(null);
  const [detailState, setDetailState] = useState<"idle" | "loading" | "error">("idle");
  const [compose, setCompose] = useState(false);
  const [viewer, setViewer] = useState<{ items: FileSource[]; index: number } | null>(null);
  const [toast, setToast] = useState("");
  const [syncing, setSyncing] = useState(false);
  // Wider reading: fold the folder column into a slim rail, or hide the list while reading. Remembered on this device.
  const [rail, setRail] = useState(false);
  const [wide, setWide] = useState(false);
  useEffect(() => { try { setRail(window.localStorage.getItem("nc-mail-rail") === "1"); } catch { /* storage blocked */ } }, []);
  const toggleRail = () => setRail((value) => { try { window.localStorage.setItem("nc-mail-rail", value ? "0" : "1"); } catch { /* storage blocked */ } return !value; });
  const listRequest = useRef(0);
  const selectedRef = useRef<string | null>(null);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const flash = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast((current) => current === message ? "" : current), 4500); }, []);

  const loadMeta = useCallback(async () => {
    try { const result = await secureApi<MailMeta>(OP.read, { view: "meta" }); setMeta(result); onUnread?.(result.unread); } catch { /* the list shows the error */ }
  }, [onUnread]);

  const loadList = useCallback(async (reset: boolean, before?: string | null) => {
    const request = ++listRequest.current;
    if (reset) setListState((state) => state === "ready" ? state : "loading");
    try {
      const result = await secureApi<{ tickets: MailTicketSummary[]; nextBefore: string | null }>(OP.read, { view: "list", box, q: query, ...(before ? { before } : {}) });
      if (request !== listRequest.current) return;
      setTickets((current) => reset ? result.tickets : [...current, ...result.tickets]);
      setNext(result.nextBefore); setListState("ready"); setListError("");
    } catch (error) { if (request !== listRequest.current) return; setListError(errorText(error)); setListState("error"); }
  }, [box, query]);

  useEffect(() => { const timer = window.setTimeout(() => setQuery(search.trim()), 300); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => { void loadList(true); }, [loadList]);
  useEffect(() => { void loadMeta(); }, [loadMeta]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") { void loadList(true); void loadMeta(); } }, 45_000);
    return () => window.clearInterval(timer);
  }, [loadList, loadMeta]);

  const openTicket = useCallback(async (id: string, quiet = false) => {
    setSelected(id);
    if (!quiet) { setDetailState("loading"); setDetail(null); }
    try {
      const result = await secureApi<MailTicketDetail>(OP.read, { view: "ticket", id });
      if (selectedRef.current !== id) return;
      setDetail(result); setDetailState("idle");
      setTickets((list) => list.map((ticket) => ticket.id === id ? { ...ticket, unread: false } : ticket));
      void loadMeta();
    } catch (error) { if (selectedRef.current === id) { setDetailState("error"); if (quiet) flash(errorText(error)); } }
  }, [flash, loadMeta]);

  // A link from an email ("?t=1042") opens that ticket.
  useEffect(() => {
    const number = new URLSearchParams(window.location.search).get("t");
    if (!number || !/^\d{4,9}$/.test(number)) return;
    void secureApi<{ tickets: MailTicketSummary[] }>(OP.read, { view: "list", box: "all", q: number }).then((result) => {
      const hit = result.tickets.find((ticket) => String(ticket.number) === number);
      if (hit) void openTicket(hit.id);
    }).catch(() => undefined);
  }, [openTicket]);

  const afterChange = useCallback(async (id?: string) => { await Promise.all([loadList(true), loadMeta(), id ? openTicket(id, true) : Promise.resolve()]); }, [loadList, loadMeta, openTicket]);

  async function syncMailbox() {
    setSyncing(true);
    try {
      const result = await secureApi<{ ok: boolean; imported: number; error?: string }>(OP.write, { action: "sync" });
      flash(result.ok ? (result.imported ? `${result.imported} new ${result.imported === 1 ? "message" : "messages"} received.` : "Nothing new in the support mailbox.") : result.error ?? "Could not reach the support mailbox.");
      await Promise.all([loadList(true), loadMeta()]);
    } catch (error) { flash(errorText(error)); } finally { setSyncing(false); }
  }

  const counts = meta?.counts ?? {};
  const closeThread = () => { setSelected(null); setDetail(null); setDetailState("idle"); };

  return <section className={`mbx${selected ? " mbx--reading" : ""}${staff ? " mbx--staff" : ""}${rail ? " mbx--rail" : ""}${wide && selected ? " mbx--wide" : ""}`} aria-label="Messages">
    <aside className="mbx-side" aria-label="Folders">
      <div className="mbx-side__top">
        <button type="button" className="mbx-compose" onClick={() => setCompose(true)} title={staff ? "New message" : "Write to us"}><PenSquare size={17}/><span className="mbx-compose__text">{staff ? "New message" : "Write to us"}</span></button>
        <button type="button" className="mbx-icon-btn mbx-rail-toggle" aria-label={rail ? "Expand the folder panel" : "Collapse the folder panel"} aria-pressed={rail} title={rail ? "Expand the folder panel" : "Collapse the folder panel"} onClick={toggleRail}>{rail ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}</button>
      </div>
      <nav>
        <ul>{boxes.map((item) => { const Icon = BOX_ICON[item.id] ?? Inbox; const count = counts[item.id] ?? 0; return <li key={item.id}><button type="button" className={box === item.id ? "is-active" : undefined} aria-current={box === item.id ? "true" : undefined} aria-label={`${item.label}${count ? `, ${count}` : ""}`} title={item.label} onClick={() => { setBox(item.id); closeThread(); }}>
          <Icon size={16} aria-hidden="true"/><span className="mbx-folder__name">{item.label}</span>{count > 0 && <small>{count}</small>}
        </button></li>; })}</ul>
      </nav>
      {staff && meta?.storage && <StoragePanel meta={meta} onSync={syncMailbox} syncing={syncing}/>}
      {!staff && <p className="mbx-side__note"><Lock size={13} aria-hidden="true"/> Your messages and files are private to you and our team.</p>}
    </aside>

    <div className="mbx-list" aria-label="Conversations">
      <div className="mbx-list__bar">
        <label className="mbx-search"><Search size={16} aria-hidden="true"/><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={staff ? "Search name, email, subject, reference…" : "Search your messages"} aria-label="Search messages" maxLength={80}/></label>
        {staff && <button type="button" className="mbx-icon-btn" aria-label="Check the support mailbox now" title="Check the support mailbox now" disabled={syncing} onClick={() => void syncMailbox()}><RefreshCw size={17} className={syncing ? "is-spinning" : undefined}/></button>}
      </div>
      {listState === "loading" && <ul className="mbx-skeleton" aria-label="Loading">{[0, 1, 2, 3, 4].map((i) => <li key={i}><i/><span/><span/></li>)}</ul>}
      {listState === "error" && <div className="mbx-empty"><p>{listError || "Messages could not be loaded."}</p><button type="button" className="mbx-btn mbx-btn--ghost" onClick={() => void loadList(true)}>Try again</button></div>}
      {listState === "ready" && !tickets.length && <div className="mbx-empty">
        <Inbox size={30} aria-hidden="true"/>
        <b>{query ? "No messages match your search" : box === "all" || box === "active" || box === "open" ? "No messages here yet" : "Nothing in this folder"}</b>
        {!query && !staff && <p>Write to us about a request, a payment, or anything you need help with.</p>}
        {!query && !staff && <button type="button" className="mbx-btn mbx-btn--primary" onClick={() => setCompose(true)}><PenSquare size={16}/> Write to us</button>}
      </div>}
      {listState === "ready" && tickets.length > 0 && <ul className="mbx-rows">{tickets.map((ticket) => <li key={ticket.id}>
        <button type="button" className={`mbx-row${selected === ticket.id ? " is-selected" : ""}${ticket.unread ? " is-unread" : ""}`} aria-current={selected === ticket.id ? "true" : undefined} onClick={() => void openTicket(ticket.id)}>
          <span className="mbx-avatar" aria-hidden="true">{initials(staff ? ticket.fromName || ticket.fromEmail : "NC")}</span>
          <span className="mbx-row__main">
            <span className="mbx-row__top"><b>{staff ? ticket.fromName || ticket.fromEmail : "NISE COMPORT"}</b><time dateTime={ticket.lastMessageAt}>{listTime(ticket.lastMessageAt)}</time></span>
            <span className="mbx-row__subject">{ticket.subject}</span>
            <span className="mbx-row__preview">{ticket.preview || "No text"}</span>
            <span className="mbx-row__meta"><StatusTag status={ticket.status} staff={staff}/><span className="mbx-code">{ticket.code}</span>{ticket.linkReference && <span className="mbx-chip"><Link2 size={11} aria-hidden="true"/>{ticket.linkReference}</span>}{ticket.attachmentCount > 0 && <span className="mbx-clip" title={`${ticket.attachmentCount} attachment${ticket.attachmentCount === 1 ? "" : "s"}`}><Paperclip size={13} aria-hidden="true"/>{ticket.attachmentCount}</span>}</span>
          </span>
          {ticket.unread && <i className="mbx-dot" aria-label="Unread"/>}
        </button>
      </li>)}</ul>}
      {next && listState === "ready" && <button type="button" className="mbx-more" onClick={() => void loadList(false, next)}>Show older messages</button>}
    </div>

    <div className="mbx-read" aria-live="polite">
      {!selected && <div className="mbx-read__empty"><Mail size={34} aria-hidden="true"/><b>Select a message to read it</b><p>{staff ? "Replies you send go to the customer by email and stay on this ticket." : "Replies from our team appear here and in your email."}</p></div>}
      {selected && detailState === "loading" && <div className="mbx-read__empty"><p>Opening…</p></div>}
      {selected && detailState === "error" && <div className="mbx-read__empty"><p>This message could not be opened.</p><button type="button" className="mbx-btn mbx-btn--ghost" onClick={() => void openTicket(selected)}>Try again</button><button type="button" className="mbx-btn mbx-btn--ghost mbx-only-narrow" onClick={closeThread}>Back</button></div>}
      {selected && detail && <Thread key={detail.ticket.id} detail={detail} staff={staff} wide={wide} onToggleWide={() => setWide((value) => !value)} onBack={closeThread} onChanged={() => afterChange(detail.ticket.id)} onView={(items, index) => setViewer({ items, index })} flash={flash}/>}
    </div>

    {compose && <ComposeDialog staff={staff} onClose={() => setCompose(false)} onSent={async (id, code) => { setCompose(false); flash(`Sent. Your ticket is ${code}.`); setBox(boxes[0].id); await Promise.all([loadList(true), loadMeta()]); void openTicket(id); }}/>}
    {viewer && <FileViewer items={viewer.items} index={viewer.index} onIndex={(index) => setViewer((v) => v && { ...v, index })} onClose={() => setViewer(null)}/>}
    {toast && <div className="mbx-toast" role="status">{toast}</div>}
  </section>;
}

/* ---------------------------------------------------------------- storage and mailbox status (staff) */

function StoragePanel({ meta, onSync, syncing }: { meta: MailMeta; onSync: () => void; syncing: boolean }) {
  const storage = meta.storage!;
  const used = Math.min(100, Math.round((storage.mailBytes / storage.limitBytes) * 100));
  const tone = used >= 90 ? "high" : used >= 70 ? "mid" : "low";
  return <div className="mbx-storage">
    <h3><HardDrive size={14} aria-hidden="true"/> Storage</h3>
    <div className="mbx-meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={used} aria-label="Attachment storage used"><i className={`is-${tone}`} style={{ width: `${Math.max(used, storage.mailBytes ? 2 : 0)}%` }}/></div>
    <p><b>{formatBytes(storage.mailBytes)}</b> of {formatBytes(storage.limitBytes)} used by message attachments ({storage.mailFiles} {storage.mailFiles === 1 ? "file" : "files"})</p>
    <dl>
      <div><dt>Customer documents</dt><dd>{formatBytes(storage.documentsBytes)}</dd></div>
      {storage.diskFreeBytes !== null && storage.diskTotalBytes !== null && <div><dt>Server disk free</dt><dd>{formatBytes(storage.diskFreeBytes)} of {formatBytes(storage.diskTotalBytes)}</dd></div>}
    </dl>
    {used >= 90 && <p className="mbx-storage__warn">Space is almost full. New attachments will be refused when it is.</p>}
    <h3><Mail size={14} aria-hidden="true"/> Support mailbox</h3>
    {meta.mailboxConnected
      ? <p>{meta.supportAddress}<br/><small>{meta.sync?.lastError ? `Last check failed: ${meta.sync.lastError}` : meta.sync?.lastRunAt ? `Checked ${listTime(meta.sync.lastRunAt)}` : "Not checked yet"}</small></p>
      : <p><small>Not connected. Customers can still write on the website. Add the mailbox login in the server settings to receive their emails.</small></p>}
    {meta.mailboxConnected && <button type="button" className="mbx-btn mbx-btn--ghost mbx-btn--sm" disabled={syncing} onClick={onSync}><RefreshCw size={14} className={syncing ? "is-spinning" : undefined}/> Check now</button>}
  </div>;
}

/* ---------------------------------------------------------------- one conversation */

function AttachmentGrid({ files, ticketId, onView }: { files: MailAttachmentInfo[]; ticketId?: string; onView: (items: FileSource[], index: number) => void }) {
  const sources = useMemo(() => files.map((file) => ticketId ? linkedFileSource(file, ticketId) : mailFileSource(file)), [files, ticketId]);
  return <ul className="mbx-files">{sources.map((source, index) => <li key={source.key} className="mbx-file">
    <button type="button" className="mbx-file__open" onClick={() => onView(sources, index)} aria-label={`Preview ${source.name}`}><Thumb source={source}/></button>
    <span className="mbx-file__info"><b title={source.name}>{source.name}</b><small>{formatBytes(source.sizeBytes)}</small></span>
    <span className="mbx-file__actions">
      <button type="button" className="mbx-icon-btn mbx-icon-btn--sm" aria-label={`Preview ${source.name}`} title="Preview" onClick={() => onView(sources, index)}><Eye size={15}/></button>
      <button type="button" className="mbx-icon-btn mbx-icon-btn--sm" aria-label={`Download ${source.name}`} title="Download" onClick={() => void source.load().then((blob) => saveBlob(blob, source.name))}><Download size={15}/></button>
      {/^(image\/|application\/pdf)/.test(source.mimeType) && <button type="button" className="mbx-icon-btn mbx-icon-btn--sm" aria-label={`Print ${source.name}`} title="Print" onClick={() => void source.load().then((blob) => printBlob(blob, source.mimeType))}><Printer size={15}/></button>}
    </span>
  </li>)}</ul>;
}

function Thread({ detail, staff, wide, onToggleWide, onBack, onChanged, onView, flash }: { detail: MailTicketDetail; staff: boolean; wide: boolean; onToggleWide: () => void; onBack: () => void; onChanged: () => Promise<void>; onView: (items: FileSource[], index: number) => void; flash: (message: string) => void }) {
  const { ticket, messages, link } = detail;
  const [busy, setBusy] = useState(false);
  const [linking, setLinking] = useState(false);
  const [reference, setReference] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const totalFiles = messages.reduce((sum, message) => sum + message.attachments.length, 0) + (link?.files?.length ?? 0);
  const closed = ticket.status === "closed";
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);

  async function act(body: Record<string, unknown>, done?: string) {
    setBusy(true);
    try { await secureApi(OP.write, body); await onChanged(); if (done) flash(done); } catch (error) { flash(errorText(error)); } finally { setBusy(false); }
  }
  async function zip() {
    setBusy(true);
    try { const { blob } = await secureFile(OP.zip, { id: ticket.id }); saveBlob(blob, `${ticket.code}-files.zip`); }
    catch (error) { flash(error instanceof SecureApiError ? errorText(error) : "The files could not be downloaded together."); } finally { setBusy(false); }
  }

  return <article className="mbx-thread" aria-label={ticket.subject}>
    <header className="mbx-thread__head">
      <button type="button" className="mbx-icon-btn mbx-only-narrow" aria-label="Back to the list" onClick={onBack}><ArrowLeft size={18}/></button>
      <div className="mbx-thread__title">
        <h2>{ticket.subject}</h2>
        <p><span className="mbx-code">{ticket.code}</span><StatusTag status={ticket.status} staff={staff}/>{staff && <span className="mbx-thread__from">{ticket.fromName ? `${ticket.fromName} · ` : ""}{ticket.fromEmail}{ticket.source === "email" ? " · via email" : ""}</span>}<span>Opened {fullTime(ticket.createdAt)}</span></p>
      </div>
      <div className="mbx-thread__actions">
        <button type="button" className="mbx-icon-btn mbx-only-wide" aria-pressed={wide} aria-label={wide ? "Show the message list" : "Widen the reading area"} title={wide ? "Show the message list" : "Widen the reading area"} onClick={onToggleWide}>{wide ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}</button>
        {totalFiles > 0 && <button type="button" className="mbx-btn mbx-btn--ghost mbx-btn--sm" disabled={busy} onClick={() => void zip()} title="Download every file of this ticket as one zip"><Download size={15}/> All files</button>}
        {staff && <label className="mbx-select"><span className="mbx-sr">Status</span><select value={ticket.status} disabled={busy} onChange={(event) => void act({ action: "status", id: ticket.id, status: event.target.value })}>{TICKET_STATUSES.map((status) => <option key={status} value={status}>{STAFF_STATUS_LABEL[status]}</option>)}</select></label>}
        {!staff && !closed && <button type="button" className="mbx-btn mbx-btn--ghost mbx-btn--sm" disabled={busy} onClick={() => { if (window.confirm("Close this message? You can reopen it later.")) void act({ action: "status", id: ticket.id, status: "closed" }, "Closed."); }}><CheckCircle2 size={15}/> Close</button>}
      </div>
    </header>

    <div className="mbx-thread__body">
      {closed && <div className="mbx-banner mbx-banner--closed"><Lock size={15} aria-hidden="true"/><span>{ticket.closeReason === "auto" ? "Closed automatically because we did not hear back within 48 hours." : "This ticket is closed."} Reply below, or reopen it, to continue.</span><button type="button" className="mbx-btn mbx-btn--ghost mbx-btn--sm" disabled={busy} onClick={() => void act({ action: "status", id: ticket.id, status: "open" }, "Reopened.")}><RotateCcw size={14}/> Reopen</button></div>}
      {!closed && ticket.autoCloseAt && (ticket.status === "awaiting_customer" || ticket.status === "resolved") && <div className="mbx-banner"><Clock size={15} aria-hidden="true"/><span>{staff ? "Closes automatically" : "This will close automatically"} on {fullTime(ticket.autoCloseAt)} unless {staff ? "the customer replies" : "you reply"}.</span></div>}

      {link && <section className="mbx-link" aria-label="Linked request">
        <div className="mbx-link__head"><Link2 size={15} aria-hidden="true"/><span><b>{link.reference}</b> · {link.label}</span><span className="mbx-status mbx-status--plain">{prettyStatus(link.status)}</span></div>
        {staff && link.files && (link.files.length ? <AttachmentGrid files={link.files} ticketId={ticket.id} onView={onView}/> : <p className="mbx-link__none">No files were uploaded with this request.</p>)}
      </section>}
      {staff && (linking
        ? <form className="mbx-linkform" onSubmit={(event) => { event.preventDefault(); void act({ action: "link", id: ticket.id, reference }, reference.trim() ? "Linked." : "Link removed.").then(() => setLinking(false)); }}>
            <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Request or print reference, e.g. NC-261019-AB12CD" aria-label="Request or print reference" maxLength={80} autoFocus/>
            <button type="submit" className="mbx-btn mbx-btn--primary mbx-btn--sm" disabled={busy}>Save</button><button type="button" className="mbx-btn mbx-btn--ghost mbx-btn--sm" onClick={() => setLinking(false)}>Cancel</button>
          </form>
        : <button type="button" className="mbx-textbtn" onClick={() => { setReference(link?.reference ?? ""); setLinking(true); }}><Link2 size={13}/> {link ? "Change linked request" : "Link to a request or print order"}</button>)}

      <ol className="mbx-messages">{messages.map((message) => {
        const mine = staff ? message.direction === "out" : message.direction === "in";
        const name = message.direction === "out" ? `${message.authorName ?? "Support"}${staff ? "" : " · NISE COMPORT"}` : staff ? message.authorName || ticket.fromEmail : "You";
        return <li key={message.id} className={`mbx-msg mbx-msg--${message.direction}${mine ? " is-mine" : ""}`}>
          <div className="mbx-msg__head">
            <span className="mbx-avatar mbx-avatar--sm" aria-hidden="true">{initials(message.direction === "out" ? "NC" : message.authorName || ticket.fromEmail)}</span>
            <b>{name}</b>{message.direction === "out" && <span className="mbx-tag">Support</span>}{message.source === "email" && <span className="mbx-tag mbx-tag--plain">Email</span>}
            <time dateTime={message.createdAt}>{fullTime(message.createdAt)}</time>
          </div>
          <MessageText text={message.body}/>
          {message.attachments.length > 0 && <AttachmentGrid files={message.attachments} onView={onView}/>}
          {staff && message.emailStatus === "failed" && <p className="mbx-msg__warn">This reply was saved but the email could not be sent. We will retry; check the email settings if it keeps failing.</p>}
        </li>;
      })}</ol>
      <div ref={endRef}/>
    </div>

    <Composer key={ticket.id + messages.length} ticketId={ticket.id} staff={staff} closed={closed} onSent={onChanged} flash={flash}/>
  </article>;
}

/* ---------------------------------------------------------------- reply box */

function Composer({ ticketId, staff, closed, onSent, flash }: { ticketId: string; staff: boolean; closed: boolean; onSent: () => Promise<void>; flash: (message: string) => void }) {
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<TicketStatus>("awaiting_customer");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const files = useAttachments();
  const canSend = (body.trim().length > 0 || files.ids.length > 0) && !files.busy && !sending;

  async function send() {
    if (!canSend) return;
    setSending(true); setError("");
    try {
      await secureApi(OP.write, { action: "reply", id: ticketId, body, attachmentIds: files.ids, ...(staff ? { status } : {}) });
      setBody(""); files.reset(); await onSent(); flash(staff ? "Reply sent." : "Message sent.");
    } catch (e) { setError(errorText(e)); } finally { setSending(false); }
  }

  return <form className={`mbx-composer${drag ? " is-drag" : ""}`} onSubmit={(event) => { event.preventDefault(); void send(); }}
    onDragOver={(event) => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); setDrag(true); } }} onDragLeave={() => setDrag(false)}
    onDrop={(event) => { event.preventDefault(); setDrag(false); if (event.dataTransfer.files.length) files.add(event.dataTransfer.files); }}>
    {staff && <div className="mbx-composer__tools">
      <label className="mbx-select mbx-select--inline"><span>Quick reply</span><select value="" onChange={(event) => { const hit = QUICK_REPLIES.find((reply) => reply.label === event.target.value); if (hit) setBody((current) => current ? `${current}\n\n${hit.text}` : hit.text); }}><option value="">Insert…</option>{QUICK_REPLIES.map((reply) => <option key={reply.label}>{reply.label}</option>)}</select></label>
    </div>}
    <label className="mbx-sr" htmlFor={`reply-${ticketId}`}>Your reply</label>
    <textarea id={`reply-${ticketId}`} value={body} onChange={(event) => setBody(event.target.value)} rows={4} maxLength={20000} placeholder={closed ? "Write here to reopen this ticket…" : staff ? "Write your reply to the customer…" : "Write your reply…"}
      onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); void send(); } }}/>
    <PendingList items={files.items} onRemove={files.remove}/>
    {files.notice && <p className="mbx-composer__note" role="alert">{files.notice}</p>}
    {error && <p className="mbx-composer__note mbx-composer__note--error" role="alert">{error}</p>}
    <div className="mbx-composer__bar">
      <button type="button" className="mbx-btn mbx-btn--ghost" onClick={() => picker.current?.click()}><Paperclip size={16}/> Attach</button>
      <input ref={picker} type="file" multiple hidden accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" onChange={(event) => { if (event.target.files) files.add(event.target.files); event.target.value = ""; }}/>
      <span className="mbx-composer__hint">{closed ? "Sending will reopen this ticket. " : ""}Drop files here · up to 10 files, 15 MB each</span>
      {staff && <label className="mbx-select mbx-select--inline"><span>After sending</span><select value={status} onChange={(event) => setStatus(event.target.value as TicketStatus)}>{TICKET_STATUSES.map((item) => <option key={item} value={item}>{STAFF_STATUS_LABEL[item]}</option>)}</select></label>}
      <button type="submit" className="mbx-btn mbx-btn--primary" disabled={!canSend}><Send size={16}/> {sending ? "Sending…" : "Send"}</button>
    </div>
  </form>;
}

/* ---------------------------------------------------------------- new message */

function ComposeDialog({ staff, onClose, onSent }: { staff: boolean; onClose: () => void; onSent: (id: string, code: string) => Promise<void> }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [drag, setDrag] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const files = useAttachments();
  const references = useMemo(() => findReferences(`${subject}\n${body}`), [subject, body]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !sending) onClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose, sending]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (files.busy || sending) return;
    setSending(true); setError(""); setFields({});
    try {
      const result = await secureApi<{ id: string; code: string }>(OP.write, { action: "create", subject, body, attachmentIds: files.ids, ...(staff && to.trim() ? { to } : {}) });
      await onSent(result.id, result.code);
    } catch (e) { setError(errorText(e)); if (e instanceof SecureApiError && e.body && typeof e.body === "object" && "fields" in e.body) setFields((e.body as { fields: Record<string, string> }).fields); setSending(false); }
  }

  return <Portal><div className="mbx-modal" role="dialog" aria-modal="true" aria-labelledby="mbx-compose-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !sending) onClose(); }}>
    <form className={`mbx-dialog${drag ? " is-drag" : ""}`} onSubmit={(event) => void send(event)}
      onDragOver={(event) => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); setDrag(true); } }} onDragLeave={() => setDrag(false)}
      onDrop={(event) => { event.preventDefault(); setDrag(false); if (event.dataTransfer.files.length) files.add(event.dataTransfer.files); }}>
      <header><h2 id="mbx-compose-title">{staff ? "New message" : "Write to us"}</h2><button type="button" className="mbx-icon-btn" aria-label="Close" disabled={sending} onClick={onClose}><X size={18}/></button></header>
      <div className="mbx-dialog__body">
        {staff
          ? <label className="mbx-field"><span>To</span><input type="email" value={to} onChange={(event) => setTo(event.target.value)} placeholder="customer@example.com (leave empty to message yourself)" autoComplete="off" maxLength={160}/>{fields.to && <em>{fields.to}</em>}</label>
          : <div className="mbx-field mbx-field--static"><span>To</span><b>NISE COMPORT Support</b></div>}
        <label className="mbx-field"><span>Subject</span><input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={150} placeholder="What is this about?" required autoFocus aria-invalid={Boolean(fields.subject)}/>{fields.subject && <em>{fields.subject}</em>}</label>
        <label className="mbx-field"><span>Message</span><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={8} maxLength={20000} placeholder={staff ? "Write your message…" : "Tell us what you need. Include your request or print reference number if you have one."} aria-invalid={Boolean(fields.body)}/>{fields.body && <em>{fields.body}</em>}</label>
        {references.length > 0 && <p className="mbx-hint"><Link2 size={14} aria-hidden="true"/> {staff ? "This ticket will be linked to" : "We will connect this message to"} <b>{references[0]}</b> if it is {staff ? "a request or print order" : "yours"}.</p>}
        <PendingList items={files.items} onRemove={files.remove}/>
        {files.notice && <p className="mbx-composer__note" role="alert">{files.notice}</p>}
        {error && <p className="mbx-composer__note mbx-composer__note--error" role="alert">{error}</p>}
      </div>
      <footer>
        <button type="button" className="mbx-btn mbx-btn--ghost" onClick={() => picker.current?.click()}><Paperclip size={16}/> Attach files</button>
        <input ref={picker} type="file" multiple hidden accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" onChange={(event) => { if (event.target.files) files.add(event.target.files); event.target.value = ""; }}/>
        <span className="mbx-composer__hint">Pictures, PDF, Word, Excel · up to 10 files, 15 MB each</span>
        <button type="submit" className="mbx-btn mbx-btn--primary" disabled={sending || files.busy || subject.trim().length < 3 || (!body.trim() && !files.ids.length)}><Send size={16}/> {sending ? "Sending…" : files.busy ? "Uploading files…" : "Send"}</button>
      </footer>
    </form>
  </div></Portal>;
}
