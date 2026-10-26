"use client";

import {FormEvent,useEffect,useState} from "react";
import {ArrowLeft,History,Search,ShieldCheck,UserRound,UserX} from "lucide-react";
import {secureApi} from "@/lib/secure-api-client";

type Customer={id:string;name:string;email:string;phone:string|null;emailVerified:boolean;phoneVerified:boolean;createdAt:string;updatedAt:string;disabled:boolean;archived:boolean};
type RecordItem={id:string;when:string;title:string;detail:string|null;actorId:string|null;actorName:string|null};
type Detail={user:Customer;history:RecordItem[]};

/** Admin only. No staff permission flag can expose this panel or its endpoints. */
export default function CustomerManagementPanel(){
  const [q,setQ]=useState("");
  const [list,setList]=useState<Customer[]>([]);
  const [showArchived,setShowArchived]=useState(false);
  const [selected,setSelected]=useState<Detail|null>(null);
  const [edit,setEdit]=useState({name:"",email:"",phone:""});
  const [reason,setReason]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [note,setNote]=useState("");

  async function search(query=q,archived=showArchived){
    setBusy(true);setError("");
    try{
      const data=await secureApi<{users:Customer[]}>("C2m7R4vN9kP6",{q:query,archived});
      setList(data.users);
    }catch(err){setError(err instanceof Error?err.message:"Unable to search customers.");}
    finally{setBusy(false);}
  }
  async function open(id:string){
    setBusy(true);setError("");setNote("");
    try{
      const data=await secureApi<Detail>("C2m7R4vN9kP6",{id});
      setSelected(data);setEdit({name:data.user.name,email:data.user.email,phone:data.user.phone??""});setReason("");
    }catch(err){setError(err instanceof Error?err.message:"Unable to open customer history.");}
    finally{setBusy(false);}
  }
  useEffect(()=>{void search("",false);},[]);
  async function act(action:"edit"|"disable"|"enable"|"archive"){
    if(!selected)return;
    const text=action==="archive"?
      "Archive this customer account? The customer loses access; active applications must be completed first and historical service records are retained.":
      action==="disable"?"Disable this customer’s ability to sign in?":null;
    if(text&&!window.confirm(text))return;
    if(!reason.trim()||reason.trim().length<5){setError("Please enter a reason (at least five characters).");return;}
    setBusy(true);setError("");setNote("");
    try{
      const result=await secureApi<{user:Customer;message:string}>("R7k2C9vM4pN8",{
        id:selected.user.id,action,...(action==="edit"?edit:{}),reason,
        ...(action==="archive"?{confirm:"ARCHIVE"}:{}),
      });
      await open(selected.user.id);
      await search(q,showArchived);
      setNote(result.message);
    }catch(err){setError(err instanceof Error?err.message:"Could not update this customer.");}
    finally{setBusy(false);}
  }
  return <section className="admin-queue" aria-label="Admin customer accounts">
    <div className="admin-section-head"><h2><UserRound size={21}/> Customer accounts</h2><p>Owner-only account corrections and field-by-field history. Staff cannot access this page.</p></div>
    {error&&<p role="alert" className="alert alert--error">{error}</p>}
    {note&&<p role="status" className="alert alert--success">{note}</p>}
    {selected ? <div className="customer-admin-detail">
      <button type="button" className="btn btn--ghost btn--sm" onClick={()=>setSelected(null)}><ArrowLeft size={16}/> All customers</button>
      <h3>{selected.user.name}</h3>
      <p>{selected.user.archived?"Archived":selected.user.disabled?"Access disabled":"Active"} · Registered {new Date(selected.user.createdAt).toLocaleDateString("en-IN")}</p>
      <div className="form-grid">
        <label className="field"><span className="field__label">Full name</span><input value={edit.name} disabled={selected.user.archived} onChange={e=>setEdit(p=>({...p,name:e.target.value}))}/></label>
        <label className="field"><span className="field__label">Email address</span><input type="email" value={edit.email} disabled={selected.user.archived} onChange={e=>setEdit(p=>({...p,email:e.target.value}))}/><small>{selected.user.emailVerified?"Verified":"Not verified"}</small></label>
        <label className="field"><span className="field__label">Mobile number</span><input type="tel" value={edit.phone} disabled={selected.user.archived} onChange={e=>setEdit(p=>({...p,phone:e.target.value}))}/><small>{selected.user.phoneVerified?"Verified":"Not verified"}</small></label>
        <label className="field field--full"><span className="field__label">Reason for change *</span><textarea value={reason} maxLength={300} rows={2} disabled={selected.user.archived} onChange={e=>setReason(e.target.value)} placeholder="For example: Customer requested name correction after checking ID"/></label>
      </div>
      {!selected.user.archived&&<div className="customer-admin-actions">
        <button type="button" disabled={busy} className="btn btn--primary" onClick={()=>void act("edit")}><ShieldCheck size={16}/> Save corrections</button>
        <button type="button" disabled={busy} className="btn btn--ghost" onClick={()=>void act(selected.user.disabled?"enable":"disable")}>{selected.user.disabled?"Enable account":"Disable login"}</button>
        <button type="button" disabled={busy} className="btn btn--ghost" onClick={()=>void act("archive")}><UserX size={16}/> Archive account</button>
      </div>}
      <h3><History size={18}/> Change history (admin only)</h3>
      {selected.history.length===0?<p className="field__hint">No recorded changes yet. History begins with changes made after this feature was enabled; earlier edits cannot be reconstructed.</p>:
      <ol className="inbox__feed">{selected.history.map(event=><li key={event.id}>
        <span className="inbox__icon"><History size={16}/></span>
        <div><b>{event.title}</b><small>{new Date(event.when).toLocaleString("en-IN")} · {event.actorId===selected.user.id?"Customer":event.actorName||"Administrator"}</small>
          {event.detail&&<p className="field__hint">{event.detail}</p>}
        </div>
      </li>)}</ol>}
    </div> : <>
      <form className="admin-filters" onSubmit={(event:FormEvent)=>{event.preventDefault();void search();}}>
        <label className="field"><span className="field__label">Search name, email or mobile</span>
          <input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Customer details" maxLength={80}/></label>
        <button className="btn btn--primary" type="submit" disabled={busy}><Search size={17}/> Search</button>
        <label className="check"><input type="checkbox" checked={showArchived} onChange={e=>{setShowArchived(e.target.checked);void search(q,e.target.checked)}}/> Include archived</label>
      </form>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Email</th><th>Mobile</th><th>Status</th><th>Details</th></tr></thead><tbody>
        {list.map(u=><tr key={u.id}><td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.phone??"—"}</td><td>{u.archived?"Archived":u.disabled?"Disabled":"Active"}</td>
          <td><button type="button" className="btn btn--ghost btn--sm" onClick={()=>void open(u.id)}>Open / History</button></td></tr>)}
      </tbody></table></div>
      {!list.length&&<p className="field__hint">No matching customers.</p>}
    </>}
  </section>;
}
