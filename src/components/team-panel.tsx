"use client";

import { FormEvent, useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import Link from "next/link";
import { BadgeCheck, Copy, Crown, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, Mail, Pencil, Phone, Search, ShieldCheck, Trash2, UserMinus, UserPlus, UsersRound } from "lucide-react";
import { PERMISSION_INFO, SCOPE_PREFIX } from "@/lib/permissions";
import { MENU_PREFIX, OWNER_MENU_AREAS, STAFF_MENU_AREAS } from "@/lib/sidebar-permissions";
import { serviceCatalog } from "@/lib/services";
import { secureApi } from "@/lib/secure-api-client";
import { AdminPager, useAdminPagination } from "@/components/admin-pager";

type Member = { id: string; name: string; email: string; phone: string | null; role: string; permissions: string[]; categories: string[]; sidebar: string[]; verified: boolean; createdAt: string; disabled: boolean; tempPassword: boolean; hasPin: boolean };
type Role = "staff" | "admin";
type Edit = { name: string; email: string; phone: string; role: Role; permissions: string[] };

/** Permissions and service categories share one list: "requests", "payments", … and "scope:<category>". */
function PermissionBoxes({ value, onChange, disabled }: { value: string[]; onChange: (next: string[]) => void; disabled?: boolean }) {
  const manual = value.some(x => x.startsWith(MENU_PREFIX));
  const chosen = STAFF_MENU_AREAS.filter(item => manual ? value.includes(MENU_PREFIX + item.id) : value.includes(item.base)).map(item => item.id);
  const scoped = chosen.includes("requests");
  function toggle(ids: string[], charge = value.includes("charge")) {
    const grants = [...new Set(ids.map(id => STAFF_MENU_AREAS.find(item => item.id === id)?.base).filter((base): base is typeof STAFF_MENU_AREAS[number]["base"] => Boolean(base)))];
    onChange([...grants,...(charge && ids.includes("payments") ? ["charge"] : []),
      ...(ids.includes("requests") ? value.filter(x => x.startsWith(SCOPE_PREFIX)) : []),
      ...ids.map(id => MENU_PREFIX + id)]);
  }
  return <>
    <div className="staff-module-controls"><b>Staff desk modules · {chosen.length} selected</b>
      <button type="button" disabled={disabled} className="btn btn--ghost btn--sm" onClick={() => toggle(STAFF_MENU_AREAS.map(item => item.id),false)}>Select all</button>
      <button type="button" disabled={disabled} className="btn btn--ghost btn--sm" onClick={() => toggle([],false)}>Clear</button></div>
    {Array.from(new Set(STAFF_MENU_AREAS.map(item => item.group))).map(group => <section key={group} className="staff-module-group">
      <h4>{group}</h4><div className="perm-grid">{STAFF_MENU_AREAS.filter(item => item.group === group).map(item => <label key={item.id} className={chosen.includes(item.id) ? "perm is-on" : "perm"}>
        <input type="checkbox" checked={chosen.includes(item.id)} disabled={disabled} onChange={e => toggle(e.target.checked ? [...chosen,item.id] : chosen.filter(id => id !== item.id))}/>
        <span><b>{item.label}</b><small>{PERMISSION_INFO[item.base].detail}</small></span>
      </label>)}</div>
    </section>)}
    <section className="staff-module-group"><h4>Owner-only modules</h4><div className="perm-grid">{OWNER_MENU_AREAS.map(id => <label className="perm" key={id}><input type="checkbox" checked={false} disabled/>
      <span><b>{id === "team" ? "Team management" : id === "customers" ? "Customers / customer preview" : "System & connections"}</b><small>Available only to admins</small></span>
    </label>)}</div></section>
    <label className="perm"><input type="checkbox" checked={value.includes("charge") && chosen.includes("payments")} disabled={disabled || !chosen.includes("payments")}
      onChange={e => toggle(chosen,e.target.checked)}/><span><b>Create charges and refunds</b><small>Sensitive financial permission, separate from Payments</small></span></label>
    {scoped && <div className="scope-box">
      <span className="field__label">Which service categories? <em>leave all unticked for every category</em></span>
      <div className="perm-grid">{serviceCatalog.map((group) => { const key = SCOPE_PREFIX + group.slug; const on = value.includes(key); return <label key={group.slug} className={on ? "perm is-on" : "perm"}>
        <input type="checkbox" checked={on} disabled={disabled} onChange={(event) => onChange(event.target.checked ? [...value, key] : value.filter((item) => item !== key))}/>
        <span><b>{group.title}</b></span>
      </label>; })}</div>
    </div>}
  </>;
}

function RolePick({ value, onChange, disabled }: { value: Role; onChange: (role: Role) => void; disabled?: boolean }) {
  return <label className="field"><span className="field__label">Role</span>
    <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as Role)}>
      <option value="staff">Staff — only the areas ticked below</option>
      <option value="admin">Owner — full access, manages the team</option>
    </select></label>;
}

/** Password/PIN fields in owner tools are hidden by default and remain keyboard-accessible. */
function SecretField(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return <span className="input-wrap">
    <input {...props} type={visible ? "text" : "password"}/>
    <button type="button" className="icon-btn" aria-label={visible ? "Hide secret" : "Show secret"} aria-pressed={visible}
      onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
  </span>;
}

/** Owner only: add staff or owners, edit them, reset passwords, remove or delete. */
export default function TeamPanel({ meRole, meId }: { meRole: string; meId?: string }) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [credentialsFor, setCredentialsFor] = useState<string | null>(null);
  const [credentialPassword, setCredentialPassword] = useState("");
  const [credentialPin, setCredentialPin] = useState("");
  const [credentialKind, setCredentialKind] = useState<"password" | "pin">("password");
  const [generateCredential, setGenerateCredential] = useState(false);
  const [permissions, setPermissions] = useState<string[]>(["requests","tab:requests"]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [secret, setSecret] = useState<{ who: string; password?: string; pin?: string } | null>(null);
  const submitting = useRef(false);

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
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy("add"); setError(""); setNotice(""); setSecret(null);
    try {
      const result = await secureApi<{ created: boolean; tempPassword: string | null; tempPin: string | null }>("H5r9C2mV7pX1", { email, name, phone, role, permissions, password, pin });
      if (result.tempPassword || result.tempPin) {
        setSecret({ who: email, password: result.tempPassword ?? undefined, pin: result.tempPin ?? undefined });
      }
      setNotice(result.created
        ? `Added ${email}. Temporary credentials were sent by email; ask them to change their password after sign-in.`
        : `${email} now has team access. Existing customer records and password are preserved${result.tempPin ? ", and the requested PIN has been set" : ""}.`);
      setEmail(""); setName(""); setPhone(""); setPassword(""); setPin(""); setRole("staff"); setPermissions(["requests"]);
      await load();
    } catch (reason) { fail(reason, "Could not add this person."); }
    finally { submitting.current = false; setBusy(""); }
  }

  function startEdit(member: Member) {
    setEditing(member.id); setError(""); setNotice("");
    setEdit({ name: member.name, email: member.email, phone: member.phone ?? "", role: member.role === "admin" ? "admin" : "staff", permissions: member.permissions.length ? [...member.permissions, ...member.categories.map(slug => SCOPE_PREFIX + slug), ...(member.sidebar ?? []).map(id => MENU_PREFIX + id)] : ["requests","tab:requests"] });
  }

  async function patch(member: Member, body: Record<string, unknown>, done: string) {
    if (submitting.current) return false;
    submitting.current = true;
    setBusy(member.id); setError(""); setNotice(""); setSecret(null);
    try {
      const result = await secureApi<{ tempPassword?: string; tempPin?: string }>("B2x7T4kL9qW6", { id: member.id, ...body });
      if (result.tempPassword || result.tempPin) setSecret({ who: member.email, password: result.tempPassword, pin: result.tempPin });
      setNotice(done); await load(); return true;
    } catch (reason) { fail(reason, "That didn’t work."); return false; }
    finally { submitting.current = false; setBusy(""); }
  }

  async function saveEdit(member: Member) {
    if (!edit) return;
    const ok = await patch(member, { name: edit.name, email: edit.email, phone: edit.phone.trim() || null, role: edit.role, permissions: edit.role === "admin" ? undefined : edit.permissions }, `Saved ${edit.name}.`);
    if (ok) { setEditing(null); setEdit(null); }
  }
  const remove = (member: Member) => window.confirm(`Remove ${member.name} from the team? They become a normal customer account and are signed out everywhere.`)
    && patch(member, { remove: true }, `${member.name} no longer has team access.`);
  async function saveCredential(member: Member) {
    const kind = credentialKind;
    const value = kind === "pin" ? credentialPin : credentialPassword;
    const ready = generateCredential || (kind === "pin" ? /^\d{6}$/.test(value) : value.trim().length >= 10);
    if (!ready || submitting.current) return;
    if (kind === "pin" && !member.phone) { setError("Add a contact mobile before setting a PIN."); return; }
    if (!window.confirm(`Set a ${generateCredential ? "generated" : "custom"} ${kind} for ${member.name}? Their existing sessions will end and the new credential will be emailed to them.`)) return;
    const result = await patch(member, kind === "pin"
      ? { resetPin: true, pin: generateCredential ? "" : value }
      : { resetPassword: true, password: generateCredential ? "" : value }, `Updated ${kind} for ${member.name}. Previous sessions have ended.`);
    if (result) { setCredentialPin(""); setCredentialPassword(""); setGenerateCredential(false); setCredentialsFor(null); }
  }
  const destroy = (member: Member) => window.confirm(`Delete ${member.name}'s account for good? Their details are erased and they can’t sign in. This cannot be undone.`)
    && patch(member, { delete: true }, `${member.name}’s account was deleted.`);

  const needle = search.trim().toLocaleLowerCase();
  const filteredMembers = (members ?? []).filter((member) => !needle ||
    [member.name, member.email, member.phone ?? "", member.role, ...member.permissions]
      .some((value) => value.toLocaleLowerCase().includes(needle)));
  const paging = useAdminPagination(filteredMembers);
  if (meRole !== "admin") return <p className="alert alert--info">Only the owner can manage the team.</p>;
  return <section className="admin-queue team-panel">
    <h2><UsersRound size={17}/> Team <span>{members?.length ?? "…"}</span></h2>
    <p className="admin-lead"><b>Owners</b> can do everything and manage the team. <b>Staff</b> see only the areas you tick. <b>Customers</b> never see this workspace.</p>
    <p className="fine">Staff and owners use the same account for their own customer profile. Family members may share a contact mobile, but must use separate email logins and credentials. A shared number cannot select an account for sign-in. Changing a password does not change the six-digit PIN.</p>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {notice && <div className="alert alert--success" role="status">{notice}</div>}
    {secret && <div className="alert alert--info" role="status">
      <b>One-time login credentials for {secret.who}</b>
      {secret.password && <div><span>Temporary password:</span> <code>{secret.password}</code>{" "}
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void navigator.clipboard?.writeText(secret.password ?? "")}><Copy size={14}/> Copy password</button></div>}
      {secret.pin && <div><span>6-digit PIN:</span> <code>{secret.pin}</code>{" "}
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void navigator.clipboard?.writeText(secret.pin ?? "")}><Copy size={14}/> Copy PIN</button></div>}
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSecret(null)}>Hide credentials</button>
      <p><small>Use the exact account email shown above. Password: choose email + password. PIN: choose Email + PIN. A shared mobile cannot identify the account. Shown once here and sent to their email. Do not share publicly.</small></p>
    </div>}
    <label className="admin-team__search"><Search size={17} aria-hidden="true"/><input
      type="search" aria-label="Search staff and owners" placeholder="Find existing or new staff by name, email, mobile or permission…"
      value={search} onChange={(event) => setSearch(event.target.value)}/></label>
    <AdminPager {...paging} label="team members"/>
    <div className="team-list">{paging.items.map((member) => {
      const isMe = member.id === meId;
      const open = editing === member.id && edit;
      const locked = busy === member.id;
      return <article key={member.id} className="staff-card">
        <div className="staff-card__head">
          <span className="staff-card__avatar" aria-hidden="true">{member.name.trim().charAt(0).toUpperCase()}</span>
          <div><b>{member.name}{isMe ? " (you)" : ""}</b>
            <small><Mail size={12}/> {member.email}{member.phone ? <> · <Phone size={12}/> {member.phone}</> : " · no mobile number"}</small>
            <small>{member.disabled ? "Disabled — can’t sign in" : member.tempPassword ? "Still using the temporary password" : member.verified ? <><BadgeCheck size={12}/> Signed in before</> : "Hasn’t signed in yet"} · PIN: {member.hasPin ? "enabled" : "not set"}</small></div>
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
            {member.role === 'staff' && edit.email.trim().toLowerCase() !== member.email.toLowerCase() && <button type="button" className="btn btn--ghost btn--sm" disabled={locked} onClick={async () => {
              if (!window.confirm(`Move ${member.name}'s saved staff permissions to the existing customer login ${edit.email}? Confirm these are the SAME PERSON, not family members sharing a phone. The customer keeps their password, PIN, wallet and requests. The old staff login is disabled; its history stays separate. Unsaved edits are not copied. Afterward reset credentials on the new team entry if needed.`)) return;
              if (await patch(member, { transferEmail: edit.email.trim() }, `Staff access moved to ${edit.email}. Use that account's existing credentials or reset them on its new team entry. The old login is disabled; history was not merged.`)) { setEditing(null); setEdit(null); }
            }}>Use existing customer login for this staff member</button>}
          </div>
        </> : <>
          {member.role === "admin" ? <p className="admin-empty">Full access to every area.</p>
            : <p className="admin-empty">{member.permissions.map((permission) => PERMISSION_INFO[permission as keyof typeof PERMISSION_INFO].label).join(" · ") || "No access"}{member.permissions.includes("requests") && (member.categories.length ? ` · Categories: ${member.categories.map((slug) => serviceCatalog.find((group) => group.slug === slug)?.title ?? slug).join(", ")}` : " · All categories")}</p>}
          <div className="staff-card__actions">
            <button type="button" className="btn btn--ghost btn--sm" disabled={locked} onClick={() => startEdit(member)}><Pencil size={15}/> Edit</button>
            {isMe && <Link prefetch={false} className="btn btn--ghost btn--sm" href="/profile#security"><KeyRound size={15}/> Set my PIN / password</Link>}
            {!isMe && <>
              
              <button type="button" className="btn btn--ghost btn--sm" disabled={locked} onClick={() => {
                setCredentialsFor(credentialsFor === member.id ? null : member.id);
                setCredentialPassword(""); setCredentialPin(""); setCredentialKind("password"); setGenerateCredential(false); setError(""); setNotice("");
              }}><KeyRound size={15}/> {credentialsFor === member.id ? "Close sign-in settings" : "Manage sign-in"}</button>
              <button type="button" className="btn btn--ghost btn--sm" disabled={locked} onClick={() => void patch(member, { disabled: !member.disabled }, member.disabled ? `${member.name} can sign in again.` : `${member.name} is disabled.`)}>{member.disabled ? "Enable" : "Disable"}</button>
              <button type="button" className="btn btn--ghost btn--sm" disabled={locked} onClick={() => void remove(member)}><UserMinus size={15}/> Remove from team</button>
              <button type="button" className="btn btn--ghost btn--sm" disabled={locked} onClick={() => void destroy(member)}><Trash2 size={15}/> Delete account</button>
            </>}
          </div>
          {credentialsFor === member.id && !isMe && <section className="team-credentials" aria-label={`Manage credentials for ${member.name}`} aria-busy={locked}>
            <div className="team-credentials__heading">
              <div className="team-credentials__icon"><LockKeyhole size={20}/></div>
              <div><h3>Sign-in access</h3><p>Update credentials for <strong>{member.name}</strong>. Customer records stay unchanged.</p></div>
            </div>
            <div className="team-credentials__tabs" role="group" aria-label="Credential to update">
              <button type="button" className={credentialKind === "password" ? "is-active" : ""} aria-pressed={credentialKind === "password"} disabled={locked}
                onClick={() => { setCredentialKind("password"); setGenerateCredential(false); setError(""); }}><LockKeyhole size={16}/> Password</button>
              <button type="button" className={credentialKind === "pin" ? "is-active" : ""} aria-pressed={credentialKind === "pin"} disabled={locked || !member.phone}
                onClick={() => { setCredentialKind("pin"); setGenerateCredential(false); setError(""); }}><KeyRound size={16}/> 6-digit PIN</button>
            </div>
            <div className="team-credentials__form">
              <div className="team-credentials__input-row">
              <label className="field"><span className="field__label">{credentialKind === "password" ? "New temporary password" : "New 6-digit PIN"}</span>
                {credentialKind === "password"
                  ? <SecretField autoComplete="new-password" value={generateCredential ? "" : credentialPassword} maxLength={128} placeholder={generateCredential ? "A password will be generated securely" : "Enter a new temporary password"} disabled={locked || generateCredential} onChange={(event) => setCredentialPassword(event.target.value)}/>
                  : <SecretField autoComplete="off" inputMode="numeric" value={generateCredential ? "" : credentialPin} maxLength={6} placeholder={generateCredential ? "A PIN will be generated securely" : "Enter exactly 6 digits"} disabled={locked || generateCredential} onChange={(event) => setCredentialPin(event.target.value.replace(/\D/g, "").slice(0, 6))}/>}
                <span className="field__hint">{credentialKind === "password" ? "Use a strong temporary password; the member can change it from Profile → Security." : "Choose six digits that are not repeated or sequential. For shared contact numbers, sign in using Email + PIN."}</span>
              </label>
              <label className="team-credentials__auto">
                <input type="checkbox" checked={generateCredential} disabled={locked} onChange={(event) => setGenerateCredential(event.target.checked)}/>
                <span><b>Generate securely</b><small>Create a strong {credentialKind === "password" ? "password" : "PIN"} automatically</small></span>
              </label>
              </div>
              <div className="team-credentials__footer">
                <span><ShieldCheck size={16}/> Existing sessions will be signed out. The new credential is emailed to the member.</span>
                <button type="button" className="btn btn--primary btn--sm" aria-busy={locked} disabled={locked || (!generateCredential && (credentialKind === "password" ? credentialPassword.trim().length < 10 : !/^\d{6}$/.test(credentialPin)))}
                  onClick={() => void saveCredential(member)}>{locked ? <LoaderCircle size={16} className="api-activity__spin"/> : <KeyRound size={16}/>} {locked ? "Updating…" : `Update ${credentialKind === "password" ? "password" : "PIN"}`}</button>
              </div>
            </div>
          </section>}
        </>}
      </article>;
    })}</div>
    {filteredMembers.length === 0 && members && <p className="admin-empty">No team accounts match this search. You can add a new member below.</p>}
    {filteredMembers.length > paging.pageSize && <AdminPager {...paging} label="team members"/>}
    <details className="admin-accordion"><summary><UserPlus size={15}/> Add a person</summary>
    <form className="team-add" onSubmit={add}>
      <h3><UserPlus size={17}/> Add a person</h3>
      <div className="form-grid">
        <RolePick value={role} onChange={setRole}/>
        <label className="field"><span className="field__label">Email</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="employee@example.com"/></label>
        <label className="field"><span className="field__label">Name <em>if they don’t have an account yet</em></span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="e.g. Ravi Kumar"/></label>
        <label className="field"><span className="field__label">Mobile number <em>optional</em></span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit mobile"/></label>
        <label className="field"><span className="field__label">Temporary password <em>leave empty to generate one</em></span><SecretField value={password} onChange={(event) => setPassword(event.target.value)} maxLength={128} autoComplete="new-password" placeholder="Auto-generated"/></label>
        <label className="field"><span className="field__label">6-digit PIN <em>optional, requires mobile</em></span><SecretField value={pin} inputMode="numeric" onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0,6))} maxLength={6} autoComplete="off" placeholder="Auto-generate if mobile is entered"/></label>
      </div>
      {role === "staff" ? <><span className="field__label">What may they do?</span><PermissionBoxes value={permissions} onChange={setPermissions}/></>
        : <p className="field__hint">Owners can open every area and manage the team. Only add people you fully trust.</p>}
      <button className="btn btn--primary" disabled={busy === "add" || (role === "staff" && !permissions.length)}>{busy === "add" ? <LoaderCircle size={16} className="api-activity__spin"/> : <UserPlus size={16}/>}{busy === "add" ? "Adding…" : role === "admin" ? "Add owner" : "Add to team"}</button>
      <p className="field__hint">New team accounts with a mobile number get a temporary PIN and password by email. Existing customers keep their account history and password; an explicitly entered PIN is set for that account.</p>
    </form></details>
  </section>;
}
