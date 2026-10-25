import { intakeFields, validateDetailedIntake, type DetailedIntake } from "@/lib/detailed-intake";
import { open, seal, vaultReady } from "@/lib/vault";
import { PublicError } from "@/lib/errors";

/** Protect the entire application questionnaire (not only Aadhaar/PAN). This reuses
 * the existing customer-record AES-GCM key; never put raw answers in notifications,
 * drafts or request metadata. No database migration is required. */
export function storeDetailedIntake(input: DetailedIntake) {
  const errors=validateDetailedIntake(input);
  if(Object.keys(errors).length) throw new PublicError("Please complete the application fields.",400,{fields:errors});
  if(!vaultReady()) throw new PublicError("Secure applicant storage is unavailable. Ask the owner to configure RECORDS_ENCRYPTION_KEY.",503);
  const allowed = new Set(intakeFields(input.kind,input.answers).map(f=>f.id));
  const answers=Object.fromEntries(Object.entries(input.answers).filter(([key])=>allowed.has(key)));
  return {
    kind: input.kind, sealed: seal({ answers, documents: input.documents }),
    ...(input.photoFileId?{photoAttached:true}:{}),
  };
}
type SealedInput = { kind: DetailedIntake["kind"]; sealed: string; photoAttached?: boolean };
/** Run only after user ownership or staff authorization has been checked. */
export function revealDetailedIntake(value: unknown): DetailedIntake | null {
  if(!value||typeof value!=="object")return null;
  const v=value as Partial<SealedInput>;
  if(!v.kind||!["passport","voter","pan","pan49a"].includes(v.kind)||typeof v.sealed!=="string")return null;
  try{
    const data=open<{answers:Record<string,string>;documents:string[]}>(v.sealed);
    return {kind:v.kind,answers:data.answers,documents:data.documents, ...(v.photoAttached?{photoFileId:"attached"}:{})};
  }catch(error){console.error("[intake] could not decrypt request",error);return null;}
}
export function revealRequestDetails(details: Record<string,unknown>): Record<string,unknown> {
  if(!details.intake) return details;
  return { ...details, intake: revealDetailedIntake(details.intake)??{error:"Saved application details cannot be decrypted; check the records encryption key."} };
}
