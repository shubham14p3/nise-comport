import { pool, query, transaction } from "../db.js";
import { cleanupExpiredFiles } from "../storage.js";

async function expireAbandonedOrders() {
  const { rows } = await query(
    `SELECT * FROM print_orders
     WHERE status='AWAITING_PAYMENT' AND payment_status='pending'
       AND created_at < NOW() - INTERVAL '2 hours'`
  );

  for (const order of rows) {
    await transaction(async (client) => {
      const locked = await client.query("SELECT * FROM print_orders WHERE id=$1 FOR UPDATE", [order.id]);
      const current = locked.rows[0];
      if (!current || current.status !== "AWAITING_PAYMENT" || current.payment_status !== "pending") return;

      await client.query("UPDATE print_orders SET status='CANCELLED',updated_at=NOW() WHERE id=$1", [current.id]);
      if (current.pickup_slot_id) {
        await client.query("UPDATE pickup_slots SET booked_count=GREATEST(0,booked_count-1) WHERE id=$1", [current.pickup_slot_id]);
      }
      if (current.coupon_code) {
        await client.query("UPDATE coupons SET used_count=GREATEST(0,used_count-1) WHERE upper(code)=upper($1)", [current.coupon_code]);
      }
      if (current.wallet_redeemed_paise > 0) {
        const reversal = await client.query("SELECT 1 FROM wallet_ledger WHERE order_id=$1 AND entry_type='reversal'", [current.id]);
        if (!reversal.rows[0]) {
          await client.query(
            "INSERT INTO wallet_ledger(user_id,order_id,amount_paise,entry_type,reason) VALUES($1,$2,$3,'reversal',$4)",
            [current.customer_id, current.id, current.wallet_redeemed_paise, `Expired-order reversal for ${current.order_number}`]
          );
        }
      }
      await client.query(
        "INSERT INTO order_status_history(order_id,status,note) VALUES($1,'CANCELLED',$2)",
        [current.id, "Expired automatically after two hours without payment"]
      );
    });
  }
  return rows.length;
}

async function purgeExpiredDocuments() {
  const { rows } = await query(
    `SELECT id,storage_key,prepared_storage_key,prepared_bw_key,prepared_color_key
     FROM print_files WHERE delete_after < NOW() AND storage_key <> 'deleted'`
  );
  await cleanupExpiredFiles(rows.flatMap((row) => [
    { storage_key: row.storage_key, prepared_storage_key: row.prepared_storage_key },
    { storage_key: row.prepared_bw_key, prepared_storage_key: row.prepared_color_key },
  ]));
  if (rows.length) {
    await query(
      "UPDATE print_files SET storage_key='deleted',prepared_storage_key=NULL,prepared_bw_key=NULL,prepared_color_key=NULL WHERE delete_after < NOW()"
    );
  }
  return rows.length;
}

const expired = await expireAbandonedOrders();
const deleted = await purgeExpiredDocuments();
console.log(`[NISE] maintenance complete: ${expired} abandoned orders expired, ${deleted} document records cleaned`);
await pool.end();
