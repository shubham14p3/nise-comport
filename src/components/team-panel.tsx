"use client";

import { FormEvent, useEffect, useState } from "react";
import { BadgeCheck, Crown, Mail, ShieldCheck, UserMinus, UserPlus, UsersRound } from "lucide-react";
import { PERMISSION_INFO, STAFF_PERMISSIONS, type Permission } from "@/lib/permissions";
import { secureApi } from "@/lib/secure-api-client";

type Member = { id: string; name: string; email: string; phone: string | null; role: string; permissions: Permission[]; verified: boolean; createdAt: string };

function PermissionBoxes({ value, onChange, disabled }: { value: Permission[]; onChange: (next: Permission[]) => void; disabled?: boolean }) {
  return <div className="perm-grid">{STAFF_PERMISSIONS.map((permission) => <label key={permission} className={value.includes(permission) ? "perm is-on" : "perm"}>
    <input type="checkbox" checked={value.includes(permission)} disabled={disabled} onChange={(event) => onChange(event.target.checked ? [...value, permission] : value.filter((item) => item !== permission))}/>
    <span><b>{PERMISSION_INFO[permission].label}</b><small>{PERMISSION_INFO[permission].detail}</small></span>
  </label>)}</div>;
}

/** Owner only: add employees, choose what each may do, remove access. */
export default function TeamPanel({ meRole }: { meRole: string }) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Permission[]>>({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>(["requests"]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const result = await secureApi<{ staff: Member[] }>("K8d3N6wQ1zT4");
    setMembers(result.staff);
    setDrafts({});
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
      const result = await secureApi<{ created: boolean }>("H5r9C2mV7pX1", { email, name, permissions });
      setNotice(result.created ? `Added ${email}. They’ve been emailed how to sign in with an email code.` : `${email} already had an account and is now staff. They’ve been emailed.`);
      setEmail(""); setName(""); setPermissions(["requests"]);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not add this person."); }
    finally { setBusy(""); }
  }

  async function save(member: Member) {
    setBusy(member.id); setError(""); setNotice("");
    try { await secureApi("B2x7T4kL9qW6", { id: member.id, permissions: drafts[member.id] ?? member.permissions }); setNotice(`Saved ${member.name}’s access.`); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save."); }
    finally { setBusy(""); }
  }

  async function remove(member: Member) {
    if (!window.confirm(`Remove ${member.name} from the team? They become a normal customer account and are signed out everywhere.`)) return;
    setBusy(member.id); setError(""); setNotice("");
    try { await secureApi("B2x7T4kL9qW6", { id: member.id, remove: true }); setNotice(`${member.name} no longer has staff access.`); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not remove."); }
    finally { setBusy(""); }
  }

  if (meRole !== "admin") return <p className="alert alert--info">Only the owner can manage the team.</p>;
  return <section className="admin-queue team-panel">
    <h2><UsersRound size={17}/> Team <span>{members?.length ?? "…"}</span></h2>
    <p className="admin-lead"><b>Owner</b> (you) can do everything and manage the team. <b>Staff</b> see only the areas you tick. <b>Customers</b> never see this workspace.</p>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {notice && <div className="alert alert--success" role="status">{notice}</div>}
    <div className="team-list">{(members ?? []).map((member) => {
      const draft = drafts[member.id] ?? member.permissions;
      const changed = drafts[member.id] && JSON.stringify([...drafts[member.id]].sort()) !== JSON.stringify([...member.permissions].sort());
      return <article key={member.id} className="staff-card">
        <div className="staff-card__head">
          <span className="staff-card__avatar" aria-hidden="true">{member.name.trim().charAt(0).toUpperCase()}</span>
          <div><b>{member.name}</b><small><Mail size={12}/> {member.email}{member.verified ? <> · <BadgeCheck size={12}/> signed in before</> : " · hasn’t signed in yet"}</small></div>
          <span className={member.role === "admin" ? "role-pill role-pill--owner" : "role-pill"}>{member.role === "admin" ? <><Crown size={13}/> Owner</> : <><ShieldCheck size={13}/> Staff</>}</span>
        </div>
        {member.role === "admin" ? <p className="admin-empty">Full access to every area.</p> : <>
          <PermissionBoxes value={draft} onChange={(next) => setDrafts((all) => ({ ...all, [member.id]: next }))} disabled={busy === member.id}/>
          <div className="staff-card__actions">
            <button type="button" className="btn btn--primary btn--sm" disabled={!changed || busy === member.id} onClick={() => void save(member)}>Save access</button>
            <button type="button" className="btn btn--ghost btn--sm" disabled={busy === member.id} onClick={() => void remove(member)}><UserMinus size={15}/> Remove from team</button>
          </div>
        </>}
      </article>;
    })}</div>
    <form className="team-add" onSubmit={add}>
      <h3><UserPlus size={17}/> Add an employee</h3>
      <div className="form-grid">
        <label className="field"><span className="field__label">Email</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="employee@example.com"/></label>
        <label className="field"><span className="field__label">Name <em>if they don’t have an account yet</em></span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="e.g. Ravi Kumar"/></label>
      </div>
      <span className="field__label">What may they do?</span>
      <PermissionBoxes value={permissions} onChange={setPermissions}/>
      <button className="btn btn--primary" disabled={busy === "add" || !permissions.length}>{busy === "add" ? "Adding…" : "Add to team"}<UserPlus size={16}/></button>
      <p className="field__hint">They get an email. New people sign in with “Sign in with an email code”, then set a password from their profile. Removing someone signs them out everywhere.</p>
    </form>
  </section>;
}
