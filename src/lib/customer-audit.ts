/** Audit data is owner-only. Never include credentials, OTPs, passwords or file contents. */
export const PROFILE_AUDIT_FIELDS=[
  ["name","Name"],["email","Email"],["phone","Mobile"],["whatsapp","WhatsApp"],
  ["city","City"],["state","State"],["postalCode","PIN code"],
  ["profileSummary","Profile note"],["preferredContact","Contact preference"],
] as const;
export type ProfileAuditField=(typeof PROFILE_AUDIT_FIELDS)[number][0];

export type AuditChange={field:ProfileAuditField;label:string;before:string|null;after:string|null};
export function profileChanges(before:object,after:object):AuditChange[]{
  const left=before as Record<string,unknown>;
  const right=after as Record<string,unknown>;
  return PROFILE_AUDIT_FIELDS.flatMap(([field,label])=>{
    const oldValue=left[field]==null?"":String(left[field]);
    const newValue=right[field]==null?"":String(right[field]);
    if(oldValue===newValue)return [];
    return [{field,label,before:oldValue||null,after:newValue||null}];
  });
}
export function formatAuditChange(change:AuditChange){
  const safe=(value:string|null)=>JSON.stringify(value??"(blank)");
  return `${change.label}: ${safe(change.before)} → ${safe(change.after)}`.slice(0,500);
}
