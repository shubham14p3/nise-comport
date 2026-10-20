"use client";

import { FormEvent, useEffect, useState } from "react";
import { BadgeCheck, Copy, Crown, KeyRound, Mail, Pencil, Phone, ShieldCheck, Trash2, UserMinus, UserPlus, UsersRound } from "lucide-react";
import { PERMISSION_INFO, STAFF_PERMISSIONS, type Permission } from "@/lib/permissions";
import { secureApi } from "@/lib/secure-api-client";

type Member = { id: string; name: string; email: string; phone: string | null; role: string; permissions: Permission[]; verified: boolean; createdAt: string; disabled: boolean; tempPassword: boolean };
type Role = "staff" | "admin";
type Edit = { name: string; email: string; phone: string; role: Role; permissions: Permission[] };

function PermissionBoxes({ value, onChange, disabled }: { value: Permission[]; onChange: (next: Permission[]) => void; disabled?: boolean }) {
  return <div className="perm-grid">{STAFF_PERMISSIONS.map((permission) => <label key={permission} className={value.includes(permission) ? "perm is-on" : "perm"}>
    <input type="checkbox" checked={value.includes(permission)} disabled={disabled} onChange={(event) => onChange(event.target.checked ? [...value, permission] : value.filter((item) => item !== permission))}/>
    <span><b>{PERMISSION_INFO[permission].label}</b><small>{PERMISSION_INFO[permission].detail}</small></span>
  </label>)}</div>;
}

function RolePick({ value, onChange, disabled }: { value: Role; onChange: (role: Role) => void; disabled?: boolean }) {
  return <label className="field"><span className="field__label">Role</span>
    <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as Role)}>
      <option value="staff">Staff — only the areas ticked below</option>
      <option value="admin">Owner — full access, manages the team</option>
    </select></label>;
}

/** Owner only: add staff or owners, edit them, reset passwords, remove or delete. */
export default function TeamPanel({ meRole, meId }: { meRole: string; meId?: string }) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>(["requests"]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [secret, setSecret] = useState<{ who: string; password: string } | null>(null);

  async function load() {
    const result = await secureApi<{ staff: Member[] }>("K8d3N6wQ1zT4");
    setMembers(result.staff);
  }
  useEffect(() => {
    let active = true;
    secureApi<{ staff: Member[] }>("K8d3N6wQ1zT4").then((result) => { if (active) setMembers(result.staff); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load the team."); });
    return () => { active = false; };
  }, []);

  const fail = (reason: unknown, fallback: string) => setError(reason instanceof Error ? reason.message : fallback);

  async function add(event: FormEvent) {
    event.preventDefault(); setBusy("add"); setError(""); setNotice(""); setSecret(null);
    try {
      const result = await secureApi<{ created: boolean; tempPassword: string | null }>("H5r9C2mV7pX1", { email, name, phone, role, permissions, password });
      if (result.tempPassword) { setSecret({ who: email, password: result.tempPassword }); setNotice(`Added ${email}. The temporary password below has been emailed to them; they should change it after signing in.`); }
      else setNotice(`${email} already had an account and is now ${role === "admin" ? "an owner" : "staff"}. They keep their own password and have been emailed.`);
      setEmail(""); setName(""); setPhone(""); setPassword(""); setRole("staff"); setPermissions(["requests"]);
      await load();
    } catch (reason) { fail(reason, "Could not add this person."); }
    finally { setBusy(""); }
  }

  function startEdit(member: Member) {
    setEditing(member.id); setError(""); setNotice("");
    setEdit({ name: member.name, email: member.email, phone: member.phone ?? "", role: member.role === "admin" ? "admin" : "staff", permissions: member.permissions.length ? member.permissions : ["requests"] });
  }

  async function patch(member: Member, body: Record<string, unknown>, done: string) {
    setBusy(member.id); setError(""); setNotice(""); setSecret(null);
    try {
      const result = await secureApi<{ tempPassword?: string }>("B2x7T4kL9qW6", { id: member.id, ...body });
      if (result.tempPassword) setSecret({ who: member.email, password: result.tempPassword });
      setNotice(done); await load(); return true;
    } catch (reason) { fail(reason, "That didn’t work."); return false; }
    finally { setBusy(""); }
  }

  async function saveEdit(member: Member) {
    if (!edit) return;
    const ok = await patch(member, { name: edit.name, email: edit.email, phone: edit.phone.trim() || null, role: edit.role, permissions: edit.role === "admin" ? undefined : edit.permissions }, `Saved ${edit.name}.`);
    if (ok) { setEditing(null); setEdit(null); }
  }
  const remove = (member: Member) => window.confirm(`Remove ${member.name} from the team? They become a normal customer account and are signed out everywhere.`)
    && patch(member, { remove: true }, `${member.name} no longer has team access.`);
  const reset = (member: Member) => window.confirm(`Set a new temporary password for ${member.name}? They are signed out everywhere and get the new password by email.`)
    && patch(member, { resetPassword: true }, `New temporary password set for ${member.name}.`);
  const destroy = (member: Member) => window.confirm(`Delete ${member.name}'s account for good? Their details are erased and they can’t sign in. This cannot be undone.`)
    && patch(member, { delete: true }, `${member.name}’s account was deleted.`);

  if (meRole !== "admin") return <p className="alert alert--info">Only the owner can manage the team.</p>;
  return <section className="admin-queue team-panel">
    <h2><UsersRound size={17}/> Team <span>{members?.length ?? "…"}</span></h2>
    <p className="admin-lead"><b>Owners</b> can do everything and manage the team. <b>Staff</b> see only the areas you tick. <b>Customers</b> never see this workspace.</p>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {notice && <div className="alert alert--success" role="status">{notice}</div>}
    {secret && <div className="alert alert--info" role="status">
      <b>Temporary password for {secret.who}:</b> <code>{secret.password}</code>{" "}
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => void navigator.clipboard?.writeText(secret.password)}><Copy size={14}/> Copy</button>
      <br/><small>Shown only now. It was also emailed to them.</small>
    </div>}
    <div className="team-list">{(members ?? []).map((member) => {
      const isMe = member.id === meId;
      const open = editing === member.id && edit;
      const locked = busy === member.id;
      return <article key={member.id} className="staff-card">
        <div className="staff-card__head">
          <span className="staff-card__avatar" aria-hidden="true">{member.name.trim().charAt(0).toUpperCase()}</span>
          <div><b>{member.name}{isMe ? " (you)" : ""}</b>
            <small><Mail size={12}/> {member.email}{member.phone ? <> · <Phone size={12}/> {member.phone}</> : " · no mobile number"}</small>
            <small>{member.disabled ? "Disabled — can’t sign in" : member.tempPassword ? "Still using the temporary password" : member.verified ? <><BadgeCheck size={12}/> Signed in before</> : "Hasn’t signed in yet"}</small></div>
          <span className={member.role === "admin" ? "role-pill role-pill--owner" : "role-pill"}>{member.role === "admin" ? <><Crown size={13}/> Owner</> : <><ShieldCheck size={13}/> Staff</>}</span>
        </div>
        {open ? <>
          <div className="form-grid">
            <label className="field"><span className="field__label">Name</span><input value={edit.name} maxLength={100} onChange={(event) => setEdit({ ...edit, name: event.target.value })}/></label>
            <label className="field"><span className="field__label">Email</span><input type="email" value={edit.email} onChange={(event) => setEdit({ ...edit, email: event.target.value })}/></label>
            <label className="field"><span className="field__label">Mobile number</span><input type="tel" value={edit.phone} placeholder="10-digit mobile" onChange={(event) => setEdit({ ...edit, phone: event.target.value })}/></label>
            <RolePick value={edit.role} disabled={isMe} onChange={(next) => setEdit({ ...edit, role: next })}/>
          </div>
          {edit.role === "staff" && <PermissionBoxes value={edit.permissions} onChange={(next) => setEdit({ ...edit, permissions: next })} disabled={locked}/>}
          <div className="staff-card__actions">
            <button type="button" className="btn btn--primary btn--sm" disabled={locked} onClick={() => void saveEdit(member)}>{locked ? "Saving…" : "Save changes"}</button>
            <button type="button" className="btn btn--ghost btn--sm" disabled={locked} onClick={() => { setEditing(null); setEdit(null); }}>Cancel</button>
          </div>
        </> : <>
          {member.role === "admin" ? <p className="admin-empty">Full access to every area.</p>
            : <p className="admin-empty">{member.permissions.map((permission) => PERMISSION_INFO[permission].label).join(" · ") || "No access"}</p>}
          <div className="staff-card__actions">
            <button type="button" className="btn btn--ghost btn--sm" disabled={locked} onClick={() => startEdit(member)}><Pencil size={15}/> Edit</button>
            {!isMe && <>
              <button type="button" className="btn btn--ghost btn--sm" disabled={locked} onClick={() => void reset(member)}><KeyRound size={15}/> Reset password</button>
              <button type="button" className="btn btn--ghost btn--sm" disabled={locked} onClick={() => void patch(member, { disabled: !member.disabled }, member.disabled ? `${member.name} can sign in again.` : `${member.name} is disabled.`)}>{member.disabled ? "Enable" : "Disable"}</button>
              <button type="button" className="btn btn--ghost btn--sm" disabled={locked} onClick={() => void remove(member)}><UserMinus size={15}/> Remove from team</button>
              <button type="button" className="btn btn--ghost btn--sm" disabled={locked} onClick={() => void destroy(member)}><Trash2 size={15}/> Delete account</button>
            </>}
          </div>
        </>}
      </article>;
    })}</div>
    <form className="team-add" onSubmit={add}>
      <h3><UserPlus size={17}/> Add a person</h3>
      <div className="form-grid">
        <RolePick value={role} onChange={setRole}/>
        <label className="field"><span className="field__label">Email</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="employee@example.com"/></label>
        <label className="field"><span className="field__label">Name <em>if they don’t have an account yet</em></span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="e.g. Ravi Kumar"/></label>
        <label className="field"><span className="field__label">Mobile number <em>optional</em></span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit mobile"/></label>
        <label className="field"><span className="field__label">Temporary password <em>leave empty to generate one</em></span><input value={password} onChange={(event) => setPassword(event.target.value)} maxLength={128} autoComplete="off" placeholder="auto-generated"/></label>
      </div>
      {role === "staff" ? <><span className="field__label">What may they do?</span><PermissionBoxes value={permissions} onChange={setPermissions}/></>
        : <p className="field__hint">Owners can open every area and manage the team. Only add people you fully trust.</p>}
      <button className="btn btn--primary" disabled={busy === "add" || (role === "staff" && !permissions.length)}>{busy === "add" ? "Adding…" : role === "admin" ? "Add owner" : "Add to team"}<UserPlus size={16}/></button>
      <p className="field__hint">New people get an email with their temporary password and must change it after signing in (Profile → Security). Existing customers keep their own password.</p>
    </form>
  </section>;
}
