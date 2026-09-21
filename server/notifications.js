import { query } from "./db.js";

export async function createNotification({ userId, orderId = null, title, body, channel = "in_app" }) {
  const { rows } = await query(
    `INSERT INTO notifications(user_id,order_id,channel,title,body,status)
     VALUES($1,$2,$3,$4,$5,'queued')
     RETURNING *`,
    [userId, orderId, channel, title, body]
  );
  return rows[0];
}

async function sendWhatsAppTemplate({ mobile, templateName, language, variables = [] }) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_API_VERSION || "v23.0";
  if (!phoneNumberId || !token || !templateName || !mobile) return null;

  const payload = {
    messaging_product: "whatsapp",
    to: mobile.replace(/^\+/, ""),
    type: "template",
    template: {
      name: templateName,
      language: { code: language || process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en" },
      components: variables.length ? [{
        type: "body",
        parameters: variables.map((value) => ({ type: "text", text: String(value) })),
      }] : undefined,
    },
  };

  const response = await fetch(
    `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp API failed: ${error}`);
  }
  return response.json();
}

export async function notifyOrderStatus({ order, user, friendlyStatus }) {
  const title = `Print order ${order.order_number}`;
  const body = `Status updated: ${friendlyStatus}`;
  await createNotification({ userId: user.id, orderId: order.id, title, body });

  if (!user.whatsapp_consent || !process.env.WHATSAPP_STATUS_TEMPLATE) return;
  try {
    const result = await sendWhatsAppTemplate({
      mobile: user.mobile,
      templateName: process.env.WHATSAPP_STATUS_TEMPLATE,
      variables: [user.name, order.order_number, friendlyStatus],
    });
    if (result) {
      await query(
        `INSERT INTO notifications(user_id,order_id,channel,title,body,status,provider_reference,sent_at)
         VALUES($1,$2,'whatsapp',$3,$4,'sent',$5,NOW())`,
        [user.id, order.id, title, body, result.messages?.[0]?.id || null]
      );
    }
  } catch (error) {
    await query(
      `INSERT INTO notifications(user_id,order_id,channel,title,body,status)
       VALUES($1,$2,'whatsapp',$3,$4,$5)`,
      [user.id, order.id, title, body, `failed: ${String(error.message).slice(0,120)}`]
    );
  }
}
