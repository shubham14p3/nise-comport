"use client";

import { FormEvent, Fragment, useEffect, useState } from "react";
import { BadgeCheck, Crown, ShieldCheck, User, UserMinus, UserPlus, UsersRound } from "lucide-react";
import { PERMISSION_INFO, STAFF_PERMISSIONS, type Permission } from "@/lib/permissions";
import { RECORD_SERVICES } from "@/lib/record-import";
import { secureApi } from "@/lib/secure-api-client";

type Member = { id: string; name: string; email: string; phone: string | null; role: string; permissions: Permission[]; recordServices: string[] | null; verified: boolean; createdAt: string };
/** null = every service (the default). */
type Services = string[] | null;

function PermissionBoxes({ value, onChange, disabled }: { value: Permission[]; onChange: (next: Permission[]) => void; disabled?: boolean }) {
  return <div className="perm-grid">{STAFF_PERMISSIONS.map((permission) => <label key={permission} className={value.includes(permission) ? "perm is-on" : "perm"}>
    <input type="checkbox" checked={value.includes(permission)} disabled={disabled} onChange={(event) => onChange(event.target.checked ? [...value, permission] : value.filter((item) => item !== permission))}/>
    <span><b>{PERMISSION_INFO[permission].label}</b><small>{PERMISSION_INFO[permission].detail}</small></span>
  </label>)}</div>;
}

/** Which record services (PAN card, Voter ID, Passport…) this person may open. All of them unless the owner narrows it. */
function ServiceBoxes({ value, onChange, disabled }: { value: Services; onChange: (next: Services) => void; disabled?: boolean }) {
  const all = value === null;
  return <div className="service-access">
    <label className={all ? "perm is-on" : "perm"}>
      <input type="checkbox" checked={all} disabled={disabled} onChange={(event) => onChange(event.target.checked ? null : Object.keys(RECORD_SERVICES))}/>
      <span><b>All services</b><small>The default. Untick it to choose which services this person can open.</small></span>
    </label>
    {!all && <div className="perm-grid perm-grid--compact">{Object.entries(RECORD_SERVICES).map(([key, label]) => <label key={key} className={value.includes(key) ? "perm is-on" : "perm"}>
      <input type="checkbox" checked={value.includes(key)} disabled={disabled} onChange={(event) => onChange(event.target.checked ? [...value, key] : value.filter((item) => item !== key))}/>
      <span><b>{label}</b></span>
    </label>)}</div>}
  </div>;
}

const sameList = (a: readonly string[] | null, b: readonly string[] | null) => (a === null || b === null) ? a === b : JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const joined = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** Owner only: the team as a table (email, name, role, joined, action), what each role means, and a form to add people. */
export default function TeamPanel({ meRole }: { meRole: string }) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Permission[]>>({});
  const [serviceDrafts, setServiceDrafts] = useState<Record<string, Services>>({});
  const [editing, setEditing] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>(["requests"]);
  const [newServices, setNewServices] = useState<Services>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const result = await secureApi<{ staff: Member[] }>("K8d3N6wQ1zT4");
    setMembers(result.staff);
    setDrafts({}); setServiceDrafts({});
  }
  useEffect(() => {
    let active = true;
    secureApi<{ staff: Member[] }>("K8d3N6wQ1zT4").then((result) => { if (active) setMembers(result.staff); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load the team."); });
    return () => { active = false; };
  }, []);

  async function add(event: FormEvent) {
    event.preventDefault(); setBusy("add"); setError(""); setNotice("");
    try {
      const result = await secureApi<{ created: boolean }>("H5r9C2mV7pX1", { email, name, permissions, recordServices: newServices });
      setNotice(result.created ? `Added ${email}. They’ve been emailed how to sign in with an email code.` : `${email} already had an account and is now staff. They’ve been emailed.`);
      setEmail(""); setName(""); setPermissions(["requests"]); setNewServices(null);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not add this person."); }
    finally { setBusy(""); }
  }

  async function save(member: Member) {
    setBusy(member.id); setError(""); setNotice("");
    try {
      await secureApi("B2x7T4kL9qW6", { id: member.id, permissions: drafts[member.id] ?? member.permissions, recordServices: member.id in serviceDrafts ? serviceDrafts[member.id] : member.recordServices });
      setNotice(`Saved ${member.name}’s access.`); setEditing(""); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save."); }
    finally { setBusy(""); }
  }

  async function remove(member: Member) {
    if (!window.confirm(`Remove ${member.name} from the team? They become a normal customer account and are signed out everywhere.`)) return;
    setBusy(member.id); setError(""); setNotice("");
    try { await secureApi("B2x7T4kL9qW6", { id: member.id, remove: true }); setNotice(`${member.name} no longer has staff access.`); setEditing(""); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not remove."); }
    finally { setBusy(""); }
  }

  if (meRole !== "admin") return <p className="alert alert--info">Only the owner can manage the team.</p>;
  return <section className="admin-queue team-panel">
    <h2><UsersRound size={17}/> Team <span>{members?.length ?? "…"}</span></h2>
    <p className="admin-lead">Choose what each person can do and which services they can open. New people can open every service until you narrow it.</p>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {notice && <div className="alert alert--success" role="status">{notice}</div>}

    <div className="team-table-wrap"><table className="team-table">
      <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Joined</th><th>Access</th><th>Action</th></tr></thead>
      <tbody>{(members ?? []).map((member) => {
        const draft = drafts[member.id] ?? member.permissions;
        const draftServices = member.id in serviceDrafts ? serviceDrafts[member.id] : member.recordServices;
        const changed = !sameList(draft, member.permissions) || !sameList(draftServices, member.recordServices);
        const isOwner = member.role === "admin";
        const open = editing === member.id;
        return <Fragment key={member.id}>
          <tr>
            <td data-label="Email">{member.email}{member.verified ? <BadgeCheck size={13} aria-label="has signed in before"/> : <small> · not signed in yet</small>}</td>
            <td data-label="Name">{member.name}</td>
            <td data-label="Role"><span className={isOwner ? "role-pill role-pill--owner" : "role-pill"}>{isOwner ? <><Crown size={13}/> Owner</> : <><ShieldCheck size={13}/> Staff</>}</span></td>
            <td data-label="Joined">{joined(member.createdAt)}</td>
            <td data-label="Access">{isOwner ? "Everything" : `${member.permissions.length} area${member.permissions.length === 1 ? "" : "s"} · ${member.recordServices ? `${member.recordServices.length} service${member.recordServices.length === 1 ? "" : "s"}` : "all services"}`}</td>
            <td data-label="Action">{isOwner ? <small>—</small> : <button type="button" className="btn btn--ghost btn--sm" aria-expanded={open} onClick={() => setEditing(open ? "" : member.id)}>{open ? "Close" : "Change access"}</button>}</td>
          </tr>
          {open && !isOwner && <tr className="team-table__edit"><td colSpan={6}>
            <span className="field__label">What may {member.name.split(/\s+/)[0]} do?</span>
            <PermissionBoxes value={draft} onChange={(next) => setDrafts((all) => ({ ...all, [member.id]: next }))} disabled={busy === member.id}/>
            <span className="field__label">Which services can they open?</span>
            <ServiceBoxes value={draftServices} onChange={(next) => setServiceDrafts((all) => ({ ...all, [member.id]: next }))} disabled={busy === member.id}/>
            <div className="staff-card__actions">
              <button type="button" className="btn btn--primary btn--sm" disabled={!changed || busy === member.id || (draftServices !== null && draftServices.length === 0)} onClick={() => void save(member)}>Save access</button>
              <button type="button" className="btn btn--ghost btn--sm" disabled={busy === member.id} onClick={() => void remove(member)}><UserMinus size={15}/> Remove from team</button>
            </div>
          </td></tr>}
        </Fragment>;
      })}</tbody>
    </table></div>

    <div className="role-cards" aria-label="What each role means">
      <article><span className="role-cards__icon"><Crown size={20}/></span><h3>Owner</h3><p>Full access to everything: every service, every area, the team and imports.</p></article>
      <article><span className="role-cards__icon"><ShieldCheck size={20}/></span><h3>Staff</h3><p>Only the areas you tick, and by default every service. Narrow the services to keep a person to, say, PAN card and Voter ID.</p></article>
      <article><span className="role-cards__icon"><User size={20}/></span><h3>Customer</h3><p>Sees their own requests and past records, can message the centre about a record, and never sees this workspace.</p></article>
    </div>

    <form className="team-add" onSubmit={add}>
      <h3><UserPlus size={17}/> Add an employee</h3>
      <div className="form-grid">
        <label className="field"><span className="field__label">Email</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="employee@example.com"/></label>
        <label className="field"><span className="field__label">Name <em>if they don’t have an account yet</em></span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="e.g. Ravi Kumar"/></label>
      </div>
      <span className="field__label">What may they do?</span>
      <PermissionBoxes value={permissions} onChange={setPermissions}/>
      <span className="field__label">Which services can they open?</span>
      <ServiceBoxes value={newServices} onChange={setNewServices}/>
      <button className="btn btn--primary" disabled={busy === "add" || !permissions.length || (newServices !== null && newServices.length === 0)}>{busy === "add" ? "Adding…" : "Add to team"}<UserPlus size={16}/></button>
      <p className="field__hint">They get an email. New people sign in with “Sign in with an email code”, then set a password from their profile. Removing someone signs them out everywhere.</p>
    </form>
  </section>;
}
