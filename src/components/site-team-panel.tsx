"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, KeyRound, Pencil, Plus, Search, Trash2, UsersRound } from "lucide-react";
import { AdminPager, useAdminPagination } from "@/components/admin-pager";
import { secureApi, secureUpload } from "@/lib/secure-api-client";

type Person = { id: string; name: string; role: string; bio: string | null; image: string | null; active: boolean; sortOrder: number; phone?: string | null; email?: string | null };
type StaffAccount = { id: string; name: string; email: string; role: string };
type Draft = { id?: string; name: string; role: string; bio: string; image: string; active: boolean; phone: string; email: string };

/** Photos already in the project (public/images/team). Uploaded photos are added to the same choice. */
const BUILT_IN_PHOTOS = ["1", "2", "4", "7", "8", "9", "10"].map((n) => `/images/team/${n}.png`);
const blank: Draft = { name: "", role: "Service team", bio: "", image: "", active: true, phone: "", email: "" };

function Photo({ src, name, size = 56 }: { src: string | null; name: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
  if (src) return <img src={src} alt="" width={size} height={size} className="team-thumb" style={{ width: size, height: size }}/>;
  return <span className="team-thumb team-thumb--empty" style={{ width: size, height: size }} aria-hidden="true">{name.slice(0, 1).toUpperCase() || "?"}</span>;
}

/** Owner only: who the public Team page and About page show. Staff logins live in the panel above. */
export default function SiteTeamPanel() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [search, setSearch] = useState("");
  const [staff, setStaff] = useState<StaffAccount[] | null>(null);
  const [issuedLogin, setIssuedLogin] = useState<{ email: string; password: string } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    const result = await secureApi<{ members: Person[] }>("T9q4M2xV7bL3");
    setPeople(result.members);
    const accounts = await secureApi<{ staff: StaffAccount[] }>("K8d3N6wQ1zT4").catch(() => null);
    setStaff(accounts?.staff ?? null);
  }
  useEffect(() => {
    let active = true;
    secureApi<{ members: Person[] }>("T9q4M2xV7bL3").then((result) => { if (active) setPeople(result.members); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Could not load the team."); });
    secureApi<{ staff: StaffAccount[] }>("K8d3N6wQ1zT4").then((result) => { if (active) setStaff(result.staff); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function act(body: Record<string, unknown>, message: string) {
    setBusy(String(body.action)); setError(""); setNotice("");
    try { await secureApi("W5n8H1cK6zR4", body); setNotice(message); await load(); return true; }
    catch (e) { setError(e instanceof Error ? e.message : "That did not work. Please try again."); return false; }
    finally { setBusy(""); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const ok = await act({ action: "save", member: { id: draft.id, name: draft.name, role: draft.role, bio: draft.bio || null, image: draft.image || null, active: draft.active, phone: draft.phone || null, email: draft.email || null } }, draft.id ? "Saved." : "Added to the team page.");
    if (ok) setDraft(null);
  }

  async function upload(file: File | undefined) {
    if (!file || !draft) return;
    setBusy("upload"); setError("");
    try {
      const result = await secureUpload<{ media: { url: string } }>("P6m1T8vC3xK9", file, { title: draft.name || "Team photo", category: "team" });
      setDraft({ ...draft, image: result.media.url });
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed. Use a JPG or PNG under 5 MB."); }
    finally { setBusy(""); if (fileInput.current) fileInput.current.value = ""; }
  }

  const needle = search.trim().toLocaleLowerCase();
  const filteredPeople = (people ?? []).filter((person) => !needle ||
    [person.name, person.role, person.email ?? "", person.phone ?? "", person.bio ?? ""]
      .some((value) => value.toLocaleLowerCase().includes(needle)));
  const paging = useAdminPagination(filteredPeople);
  const staffNotListed = (staff ?? []).filter((account) => !(people ?? []).some((person) => person.email?.trim().toLowerCase() === account.email.toLowerCase()));


  async function provisionLogin(person: Person) {
    const email = person.email?.trim().toLowerCase();
    if (!email) { setError("Add and save a verified email address for this person first."); return; }
    if (!window.confirm(`Create a staff login for ${person.name} (${email}) with only Requests permission? An existing customer login using this email will be promoted to staff. Confirm the email belongs to this employee first.`)) return;
    setBusy(`login:${person.id}`); setNotice(""); setError(""); setIssuedLogin(null);
    try {
      const response = await secureApi<{ created: boolean; tempPassword: string | null }>("H5r9C2mV7pX1", {
        name: person.name, email, phone: person.phone || undefined, role: "staff", permissions: ["requests"],
      });
      const result = await secureApi<{ staff: StaffAccount[] }>("K8d3N6wQ1zT4");
      setStaff(result.staff);
      if (response.tempPassword) setIssuedLogin({ email, password: response.tempPassword });
      setNotice(response.created ? `Staff login created for ${email}. Share the temporary password securely and require a change on first login.` : `${email} now has staff access using their existing login.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create a staff account."); }
    finally { setBusy(""); }
  }

  return <section className="admin-queue site-team">
    <h2><UsersRound size={17}/> Team shown on the website</h2>
    <p className="admin-lead">Public team profiles and login accounts are separate. Match people by their private email address; only the owner may deliberately create a missing staff login. No automatic permission grants happen during page sync.</p>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {notice && <div className="alert alert--success" role="status">{notice}</div>}
    {issuedLogin && <div className="alert alert--warn" role="status"><strong>One-time password for {issuedLogin.email}:</strong> <code>{issuedLogin.password}</code> <button type="button" className="btn btn--ghost btn--sm" onClick={() => setIssuedLogin(null)}>Hide password</button><p>Only shown for this action. Staff must change it on first sign-in. Do not share it publicly.</p></div>}

    <div className="personal-codes__head"><h3>Members</h3><button type="button" className="btn btn--primary btn--sm" onClick={() => setDraft({ ...blank })}><Plus size={15}/> Add person</button></div>

    {draft && <form className="content-form team-form" onSubmit={submit}>
      <div className="form-row">
        <label>Name<input value={draft.name} maxLength={80} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required/></label>
        <label>Role<input value={draft.role} maxLength={80} onChange={(e) => setDraft({ ...draft, role: e.target.value })} required list="team-roles"/></label>
        <datalist id="team-roles"><option value="Head of Firm"/><option value="Head of Finance"/><option value="Service team"/><option value="Business partner"/></datalist>
      </div>
      <div className="form-row">
        <label>Mobile number <small>(private, only you see it)</small><input type="tel" value={draft.phone} maxLength={20} placeholder="10-digit mobile" onChange={(e) => setDraft({ ...draft, phone: e.target.value })}/></label>
        <label>Email <small>(private, only you see it)</small><input type="email" value={draft.email} maxLength={254} onChange={(e) => setDraft({ ...draft, email: e.target.value })}/></label>
      </div>
      {!draft.id && staffNotListed.length > 0 && <label>Fill from a staff account
        <select value="" onChange={(e) => { const account = staff?.find((item) => item.id === e.target.value); if (account) setDraft({ ...draft, name: account.name, email: account.email }); }}>
          <option value="">Choose a staff member…</option>
          {staffNotListed.map((account) => <option key={account.id} value={account.id}>{account.name} ({account.email})</option>)}
        </select>
      </label>}
      <label>Short line about them <small>(optional, shown under the role)</small><input value={draft.bio} maxLength={300} onChange={(e) => setDraft({ ...draft, bio: e.target.value })}/></label>
      <fieldset className="team-photos"><legend>Photo</legend>
        <div className="team-photos__row">
          <button type="button" className={!draft.image ? "team-photo is-picked" : "team-photo"} onClick={() => setDraft({ ...draft, image: "" })}><Photo src={null} name={draft.name} size={64}/><small>No photo</small></button>
          {[...(draft.image && !BUILT_IN_PHOTOS.includes(draft.image) ? [draft.image] : []), ...BUILT_IN_PHOTOS].map((src) => <button type="button" key={src} className={draft.image === src ? "team-photo is-picked" : "team-photo"} onClick={() => setDraft({ ...draft, image: src })}><Photo src={src} name="" size={64}/></button>)}
        </div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png" hidden onChange={(e) => void upload(e.target.files?.[0])}/>
        <button type="button" className="btn btn--ghost btn--sm" disabled={busy === "upload"} onClick={() => fileInput.current?.click()}><Plus size={15}/> {busy === "upload" ? "Uploading…" : "Upload a new photo (JPG or PNG, up to 5 MB)"}</button>
      </fieldset>
      <label className="switch-row"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })}/> Show on the website</label>
      <div className="form-actions"><button type="submit" className="btn btn--primary btn--sm" disabled={busy === "save"}>{busy === "save" ? "Saving…" : draft.id ? "Save changes" : "Add person"}</button><button type="button" className="btn btn--ghost btn--sm" onClick={() => setDraft(null)}>Cancel</button></div>
    </form>}

    {!people && !error && <p className="admin-empty">Loading…</p>}
    <label className="admin-team__search"><Search size={17} aria-hidden="true"/><input
      type="search" aria-label="Search website team profiles" placeholder="Find existing or new profiles by name, role, mobile or email…"
      value={search} onChange={(event) => setSearch(event.target.value)}/></label>
    <AdminPager {...paging} label="public team members"/>
    <div className="batch-list">{paging.items.map((person, index) => <article key={person.id} className={person.active ? "batch-row" : "batch-row is-off"}>
      <Photo src={person.image} name={person.name}/>
      <div><b>{person.name}</b><small>{person.role}{person.active ? "" : " · hidden"}</small>{(person.phone || person.email) && <small>{[person.phone, person.email].filter(Boolean).join(" · ")}</small>}
        {staff !== null && <small>{person.email && staff.some((account) => account.email.toLowerCase() === person.email?.trim().toLowerCase()) ? "Staff login linked by email" : person.email ? "No staff login for this email" : "Add a private email to create a login"}</small>}
        {staff !== null && person.email && !staff.some((account) => account.email.toLowerCase() === person.email?.trim().toLowerCase()) &&
          <button type="button" className="btn btn--ghost btn--sm" disabled={Boolean(busy)} onClick={() => void provisionLogin(person)}><KeyRound size={14}/> {busy === `login:${person.id}` ? "Creating…" : "Create staff login"}</button>}
      </div>
      <div className="batch-row__actions">
        <button type="button" className="icon-btn" disabled={paging.page * paging.pageSize + index === 0 || Boolean(busy)} onClick={() => void act({ action: "move", id: person.id, direction: "up" }, "Moved up.")} aria-label={`Move ${person.name} up`}><ArrowUp size={16}/></button>
        <button type="button" className="icon-btn" disabled={paging.page * paging.pageSize + index === (people?.length ?? 0) - 1 || Boolean(busy)} onClick={() => void act({ action: "move", id: person.id, direction: "down" }, "Moved down.")} aria-label={`Move ${person.name} down`}><ArrowDown size={16}/></button>
        <button type="button" className="icon-btn" onClick={() => setDraft({ id: person.id, name: person.name, role: person.role, bio: person.bio ?? "", image: person.image ?? "", active: person.active, phone: person.phone ?? "", email: person.email ?? "" })} aria-label={`Edit ${person.name}`}><Pencil size={16}/></button>
        <button type="button" className="icon-btn" onClick={() => void act({ action: "save", member: { id: person.id, name: person.name, role: person.role, bio: person.bio, image: person.image, active: !person.active, phone: person.phone ?? null, email: person.email ?? null } }, person.active ? "Hidden from the website." : "Shown on the website.")} aria-label={person.active ? `Hide ${person.name}` : `Show ${person.name}`}>{person.active ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
        <button type="button" className="icon-btn" onClick={() => { if (window.confirm(`Remove ${person.name} from the team page?`)) void act({ action: "delete", id: person.id }, "Removed."); }} aria-label={`Remove ${person.name}`}><Trash2 size={16}/></button>
      </div>
    </article>)}</div>
    {filteredPeople.length === 0 && people && <p className="admin-empty">No website team profiles match. Use Add person to create one.</p>}
    {filteredPeople.length > paging.pageSize && <AdminPager {...paging} label="public team members"/>}
  </section>;
}
