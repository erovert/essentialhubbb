const MAX_BODY_BYTES = 16 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function clean(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isEssentialHubUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "essentialhub.pk";
  } catch (error) {
    return false;
  }
}

function createOrderId() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const random = new Uint32Array(8);
  crypto.getRandomValues(random);

  let id = "EH";
  for (let index = 0; index < 4; index += 1) {
    id += digits[random[index] % digits.length];
  }
  for (let index = 4; index < 8; index += 1) {
    id += letters[random[index] % letters.length];
  }
  return id;
}

async function createUniqueOrderId(database) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderId = createOrderId();
    const existing = await database.prepare("SELECT id FROM orders WHERE id = ? LIMIT 1").bind(orderId).first();
    if (!existing) return orderId;
  }
  throw new Error("Could not generate a unique order reference.");
}

async function sendOrderEmail(order, orderId, createdAt, env) {
  if (!env.RESEND_API_KEY || !env.ADMIN_EMAIL || !env.ORDER_FROM_EMAIL) {
    console.error("ORDER_EMAIL_CONFIG_MISSING", {
      has_api_key: Boolean(env.RESEND_API_KEY),
      has_admin_email: Boolean(env.ADMIN_EMAIL),
      has_from_email: Boolean(env.ORDER_FROM_EMAIL)
    });
    return;
  }

  const price = `Rs ${Number(order.product_price).toLocaleString("en-PK")}`;
  const safe = Object.fromEntries(
    Object.entries(order).map(([key, value]) => [key, escapeHtml(value)])
  );
  const safeOrderId = escapeHtml(orderId);
  const safeCreatedAt = escapeHtml(createdAt);

  const html = `
    <div style="margin:0;padding:24px;background:#f5f7fa;font-family:Arial,sans-serif;color:#172033">
      <div style="max-width:680px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="padding:22px 26px;background:#2563eb;color:#ffffff">
          <h1 style="margin:0;font-size:24px">New Essential Hub Order</h1>
          <p style="margin:8px 0 0">Order reference: <strong>${safeOrderId}</strong></p>
        </div>
        <div style="padding:26px">
          <h2 style="margin:0 0 16px;font-size:19px">Product</h2>
          <table role="presentation" style="width:100%;border-collapse:collapse">
            <tr>
              <td style="width:120px;padding:0 18px 18px 0;vertical-align:top">
                <img src="${safe.product_image}" alt="" width="110" style="display:block;max-width:110px;height:auto;border:1px solid #e5e7eb;border-radius:8px">
              </td>
              <td style="padding:0 0 18px;vertical-align:top">
                <p style="margin:0 0 8px;font-size:17px;font-weight:bold">${safe.product_title}</p>
                <p style="margin:0 0 8px;font-size:17px;font-weight:bold">${escapeHtml(price)}</p>
                <a href="${safe.product_url}" style="color:#2563eb;word-break:break-all">Open product page</a>
              </td>
            </tr>
          </table>

          <h2 style="margin:8px 0 12px;font-size:19px">Customer and delivery details</h2>
          <table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px">
            <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Name</td><td style="padding:7px 0">${safe.customer_name}</td></tr>
            <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Mobile</td><td style="padding:7px 0">${safe.mobile}</td></tr>
            <tr><td style="padding:7px 12px 7px 0;font-weight:bold">WhatsApp</td><td style="padding:7px 0">${safe.whatsapp}</td></tr>
            <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Address</td><td style="padding:7px 0">${safe.address}</td></tr>
            <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Additional address</td><td style="padding:7px 0">${safe.address_2 || "—"}</td></tr>
            <tr><td style="padding:7px 12px 7px 0;font-weight:bold">City</td><td style="padding:7px 0">${safe.city}</td></tr>
            <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Postal code</td><td style="padding:7px 0">${safe.postal_code || "—"}</td></tr>
            <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Order notes</td><td style="padding:7px 0;white-space:pre-wrap">${safe.order_notes || "—"}</td></tr>
            <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Status</td><td style="padding:7px 0">New</td></tr>
            <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Created</td><td style="padding:7px 0">${safeCreatedAt}</td></tr>
          </table>
        </div>
      </div>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `essentialhub-order-${orderId}`
    },
    body: JSON.stringify({
      from: env.ORDER_FROM_EMAIL,
      to: [env.ADMIN_EMAIL],
      subject: `New Essential Hub Order — ${orderId}`,
      html
    })
  });

  if (!response.ok) {
    const errorText = (await response.text()).slice(0, 1000);
    throw new Error(`Resend rejected order email (${response.status}): ${errorText}`);
  }

  console.log("ORDER_EMAIL_SENT", { order_id: orderId });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.DB) return json({ error: "Database binding DB is not configured." }, 503);

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) return json({ error: "Request is too large." }, 413);

    const data = await request.json();
    if (clean(data.company, 100)) return json({ success: true, order_id: "received" });

    const order = {
      product_title: clean(data.product_title, 200),
      product_price: clean(data.product_price, 30).replace(/[^0-9.]/g, ""),
      product_url: clean(data.product_url, 500),
      product_image: clean(data.product_image, 500),
      customer_name: clean(data.customer_name, 160),
      mobile: clean(data.mobile, 30),
      whatsapp: clean(data.whatsapp, 30),
      address: clean(data.address, 300),
      address_2: clean(data.address_2, 200),
      city: clean(data.city, 100),
      postal_code: clean(data.postal_code, 30),
      order_notes: clean(data.order_notes, 1000)
    };

    if (!order.product_title || !order.product_price || Number(order.product_price) <= 0 ||
        !isEssentialHubUrl(order.product_url) || !isEssentialHubUrl(order.product_image) ||
        !order.customer_name || !order.mobile || !order.whatsapp || !order.address || !order.city) {
      return json({ error: "Invalid or incomplete order data." }, 400);
    }

    const orderId = await createUniqueOrderId(env.DB);
    const createdAt = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO orders (
        id, product_title, product_price, product_url, product_image,
        customer_name, mobile, whatsapp, address, address_2, city,
        postal_code, order_notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId, order.product_title, order.product_price, order.product_url, order.product_image,
      order.customer_name, order.mobile, order.whatsapp, order.address, order.address_2,
      order.city, order.postal_code, order.order_notes, "new", createdAt
    ).run();

    const emailTask = sendOrderEmail(order, orderId, createdAt, env).catch((error) => {
      console.error("ORDER_EMAIL_ERROR", { order_id: orderId, message: error.message });
    });

    context.waitUntil(emailTask);

    return json({ success: true, order_id: orderId }, 201);
  } catch (error) {
    console.error("ORDER_ERROR", error);
    return json({ error: "The order could not be saved." }, 500);
  }
}

export function onRequestGet() {
  return json({ error: "Method not allowed." }, 405);
}
