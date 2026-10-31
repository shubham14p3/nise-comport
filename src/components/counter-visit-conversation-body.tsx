"use client";
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { secureApi } from '@/lib/secure-api-client';
import './counter-visit-conversation.css';
type Message={id:string;body:string;author:string;mine:boolean;createdAt:string};
type Page={messages:Message[];nextBefore:string|null};
export default function Conversation({visitId}:{visitId:string}){
 const [page,setPage]=useState<Page>({messages:[],nextBefore:null});
 const [text,setText]=useState('');const [busy,setBusy]=useState(true);const [error,setError]=useState('');
 const viewport=useRef<HTMLDivElement>(null);
 const sending=useRef(false);const retryKey=useRef<string|null>(null);
 useEffect(()=>{let active=true;secureApi<Page>('N4v7C2mP8qL5',{visitId}).then(result=>{if(active){setPage(result);requestAnimationFrame(()=>{if(viewport.current)viewport.current.scrollTop=viewport.current.scrollHeight;});}}).catch(reason=>{if(active)setError(reason instanceof Error?reason.message:'Could not load updates.');}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[visitId]);
 async function load(older=false){
  setBusy(true);setError('');try{const result=await secureApi<Page>('N4v7C2mP8qL5',{visitId,...(older&&page.nextBefore?{before:page.nextBefore}:{})});
   setPage(previous=>({messages:older?[...result.messages,...previous.messages]:result.messages,nextBefore:result.nextBefore}));
   if(!older)requestAnimationFrame(()=>{if(viewport.current)viewport.current.scrollTop=viewport.current.scrollHeight;});
  }catch(reason){setError(reason instanceof Error?reason.message:'Could not load updates.');}finally{setBusy(false);}
 }
 async function send(event:FormEvent){event.preventDefault();if(sending.current||!text.trim())return;sending.current=true;setBusy(true);setError('');
  const clientKey=retryKey.current??crypto.randomUUID();retryKey.current=clientKey;
  try{await secureApi('S8r3W6kL2pN9',{visitId,body:text.trim(),clientKey});retryKey.current=null;setText('');await load();}
  catch(reason){setError(reason instanceof Error?reason.message:'Could not send update.');}finally{sending.current=false;setBusy(false);}
 }
 return <section className="counter-conversation" aria-label="Counter visit conversation">
  <header><b>Visit updates</b><button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={()=>void load()}>Refresh</button></header>
  <small>Messages belong to this counter visit. Add an update, reference number or question. Do not send OTPs or passwords.</small>
  {error&&<p role="alert" className="form-error">{error}</p>}
  {page.nextBefore&&<button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={()=>void load(true)}>Load older updates</button>}
  <div className="counter-conversation__messages" aria-live="polite" ref={viewport}>
   {!page.messages.length&&<p>{busy?"Loading updates…":"No updates yet. Ask the team about this visit."}</p>}
   {page.messages.map(message=><article key={message.id} className={message.mine?'is-mine':undefined}><b>{message.author}</b><p>{message.body}</p><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}</time></article>)}
  </div>
  <form onSubmit={send}><label><span>Comment or status update</span><textarea rows={2} maxLength={2000} value={text} disabled={busy} onChange={event=>{setText(event.target.value);retryKey.current=null;}} placeholder="What is the update? / Reference number…" required/></label><button className="btn btn--primary btn--sm" disabled={busy||!text.trim()}>{busy?'Please wait…':'Send update'}</button></form>
 </section>;
}
