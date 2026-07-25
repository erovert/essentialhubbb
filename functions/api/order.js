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

function isEssentialHubUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "essentialhub.pk";
  } catch (error) {
    return false;
  }
}

export async function onRequestPost({ request, env }) {
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

    const orderId = crypto.randomUUID();
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

    return json({ success: true, order_id: orderId }, 201);
  } catch (error) {
    console.error("ORDER_ERROR", error);
    return json({ error: "The order could not be saved." }, 500);
  }
}

export function onRequestGet() {
  return json({ error: "Method not allowed." }, 405);
}
