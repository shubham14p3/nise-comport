"use client";
import dynamic from 'next/dynamic';
import { useState } from 'react';
const Conversation=dynamic(()=>import('./counter-visit-conversation-body'),{loading:()=> <p>Loading updates…</p>});
/** Closed history rows make no message requests and do not load the composer bundle. */
export default function CounterVisitConversation({visitId}:{visitId:string}){
 const [open,setOpen]=useState(false);
 return <div style={{marginTop:10,width:'100%'}}>
  <button type="button" className="btn btn--ghost btn--sm" aria-expanded={open} aria-controls={`counter-conversation-${visitId}`} onClick={()=>setOpen(value=>!value)}>{open?'Close updates':'Updates / ask a question'}</button>
  {open&&<div id={`counter-conversation-${visitId}`}><Conversation visitId={visitId}/></div>}
 </div>;
}
