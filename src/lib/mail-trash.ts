import { and, inArray, ne } from 'drizzle-orm';
import { activityLog, mailTickets } from '@/db/schema';
import { db } from '@/lib/db';
import { PublicError } from '@/lib/errors';
import type { MailActor } from '@/lib/mail';

/** App-only trash retains import IDs, preventing old messages from being imported again. */
export async function trashMail(actor: MailActor, ids: string[]) {
  if (actor.user.role !== "admin") throw new PublicError("Only the owner can delete mail.", 403);
  return db.transaction(async tx => {
    const rows = await tx.update(mailTickets).set({ status: "deleted", staffUnread: false, customerUnread: false }).where(and(inArray(mailTickets.id, ids), ne(mailTickets.status, "deleted"))).returning({ id: mailTickets.id });
    await tx.insert(activityLog).values({ kind: "staff", permission: "team", title: `Owner deleted ${rows.length} mail conversations from the website inbox`, detail: "App-only trash; remote IMAP mail was not deleted.", actorId: actor.user.id });
    return { deleted: rows.length };
  });
}
