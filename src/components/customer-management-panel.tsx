"use client";

import {FormEvent,useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft,Eye,History,LoaderCircle,Search,ShieldCheck,UserRound,UserX} from "lucide-react";
import {secureApi} from "@/lib/secure-api-client";
import "./customer-management-panel.css";

type Customer={id:string;name:string;email:string;phone:string|null;role:string;emailVerified:boolean;phoneVerified:boolean;createdAt:string;updatedAt:string;disabled:boolean;archived:boolean};
type RecordItem={id:string;when:string;title:string;detail:string|null;actorId:string|null;actorName:string|null};
type Detail={user:Customer;history:RecordItem[]};

/** Admin only. No staff permission flag can expose this panel or its endpoints. */
export default function CustomerManagementPanel(){
  const router=useRouter();
  const [q,setQ]=useState("");
  const [newCustomer,setNewCustomer]=useState({name:"",phone:"",email:""});
  const [creating,setCreating]=useState(false);
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
  useEffect(()=>{
    let mounted=true;
    void secureApi<{users:Customer[]}>("C2m7R4vN9kP6",{q:"",archived:false})
      .then(data=>{if(mounted)setList(data.users)})
      .catch(err=>{if(mounted)setError(err instanceof Error?err.message:"Unable to load customers.")});
    return()=>{mounted=false};
  },[]);
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
  async function previewCustomer(id:string){
    if(busy)return;
    setBusy(true);setError("");setNote("");
    try{
      await secureApi("V2a9N6sK4rD8",{action:"start",userId:id});
      router.push("/customer-preview");
    }catch(err){setError(err instanceof Error?err.message:"Unable to start the customer preview.");}
    finally{setBusy(false);}
  }
  async function createForPreview(event:FormEvent){
    event.preventDefault();
    if(busy)return;
    setBusy(true);setError("");setNote("");
    try{
      const result=await secureApi<{userId:string}>("V2a9N6sK4rD8",{action:"create",
        name:newCustomer.name,phone:newCustomer.phone,email:newCustomer.email||undefined});
      setCreating(false);setNewCustomer({name:"",phone:"",email:""});
      await search(newCustomer.phone,false);
      await previewCustomer(result.userId);
    }catch(err){setError(err instanceof Error?err.message:"Could not create customer account.");}
    finally{setBusy(false);}
  }
  return <section className="admin-queue" aria-label="Admin customer accounts">
    <div className="admin-section-head"><h2><UserRound size={21}/> Customer accounts</h2><p>Owner-only account corrections and field-by-field history. Staff cannot access this page.</p></div>
    {error&&<p role="alert" className="alert alert--error">{error}</p>}
    {note&&<p role="status" className="alert alert--success">{note}</p>}
    {selected ? <div className="customer-admin-detail">
      <button type="button" className="btn btn--ghost btn--sm" onClick={()=>setSelected(null)}><ArrowLeft size={16}/> All customers</button>
      <h3>{selected.user.name}</h3>
      <button type="button" className="btn btn--primary" disabled={busy||selected.user.archived||selected.user.disabled} onClick={()=>void previewCustomer(selected.user.id)}><Eye size={17}/> {busy?"Opening preview…":"Impersonate — read only"}</button>
      <p>{selected.user.archived?"Archived":selected.user.disabled?"Access disabled":"Active"} · Registered {new Date(selected.user.createdAt).toLocaleDateString("en-IN")}</p>
      <div className="form-grid">
        <label className="field"><span className="field__label">Full name</span><input value={edit.name} disabled={selected.user.archived} onChange={e=>setEdit(p=>({...p,name:e.target.value}))}/></label>
        <label className="field"><span className="field__label">Email address</span><input type="email" value={edit.email} disabled={selected.user.archived} onChange={e=>setEdit(p=>({...p,email:e.target.value}))}/><small>{selected.user.emailVerified?"Verified":"Not verified"}</small></label>
        <label className="field"><span className="field__label">Mobile number</span><input type="tel" value={edit.phone} disabled={selected.user.archived} onChange={e=>setEdit(p=>({...p,phone:e.target.value}))}/><small>{selected.user.phoneVerified?"Verified":"Not verified"}</small></label>
        <label className="field field--full"><span className="field__label">Reason for change *</span><textarea value={reason} maxLength={300} rows={2} disabled={selected.user.archived} onChange={e=>setReason(e.target.value)} placeholder="For example: Customer requested name correction after checking ID"/></label>
      </div>
      {selected.user.role==="customer"&&!selected.user.archived&&<div className="customer-admin-actions">
        <button type="button" disabled={busy} className="btn btn--primary" onClick={()=>void act("edit")}><ShieldCheck size={16}/> Save corrections</button>
        <button type="button" disabled={busy} className="btn btn--ghost" onClick={()=>void act(selected.user.disabled?"enable":"disable")}>{selected.user.disabled?"Enable account":"Disable login"}</button>
        <button type="button" disabled={busy} className="btn btn--ghost" onClick={()=>void act("archive")}><UserX size={16}/> Archive account</button>
      </div>}
      {selected.user.role!=="customer"&&<p className="field__hint">This is also a team account. Customer preview is available; changes to team identity and permissions are managed in Team.</p>}
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
      <div className="customer-admin-actions">
        <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={()=>setCreating(!creating)}>
          {creating?"Close new account":"Create customer from mobile"}
        </button>
      </div>
      {creating&&<form className="customer-admin-detail" onSubmit={(event)=>void createForPreview(event)}>
        <h3>Create a customer account</h3>
        <p>Use this for a person in an imported register who has no website account yet. Existing counter and team accounts must be reused, not duplicated. No password is required for admin preview.</p>
        <div className="form-grid">
          <label className="field"><span className="field__label">Name</span><input required minLength={2} maxLength={100} value={newCustomer.name} onChange={e=>setNewCustomer(p=>({...p,name:e.target.value}))}/></label>
          <label className="field"><span className="field__label">Mobile</span><input required inputMode="tel" maxLength={24} value={newCustomer.phone} onChange={e=>setNewCustomer(p=>({...p,phone:e.target.value}))}/></label>
          <label className="field"><span className="field__label">Email (optional)</span><input type="email" value={newCustomer.email} maxLength={254} onChange={e=>setNewCustomer(p=>({...p,email:e.target.value}))}/></label>
        </div>
        <button className="btn btn--primary" disabled={busy||newCustomer.name.trim().length<2||newCustomer.phone.trim().length<10}>
          {busy?<LoaderCircle className="api-activity__spin" size={17}/>:<UserRound size={17}/>} Create account
        </button>
        <small>Imported documents are not automatically claimed. The customer must verify ownership before those records become available to them.</small>
      </form>}
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Email</th><th>Mobile</th><th>Status</th><th>Details</th></tr></thead><tbody>
        {list.map(u=><tr key={u.id}><td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.phone??"—"}</td><td>{u.archived?"Archived":u.disabled?"Disabled":"Active"}</td>
          <td className="customer-admin-actions"><button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={()=>void open(u.id)}>Open / History</button><button type="button" className="btn btn--primary btn--sm" disabled={busy||u.archived||u.disabled} onClick={()=>void previewCustomer(u.id)}><Eye size={15}/> Impersonate</button></td></tr>)}
      </tbody></table></div>
      {!list.length&&<p className="field__hint">No matching customers.</p>}
    </>}
  </section>;
}
