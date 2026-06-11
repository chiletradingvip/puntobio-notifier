const express = require("express");
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const NOTIFY_EMAIL = "dahumada1926@gmail.com";

async function notificar({ pedidoId, nombre, telefono, email, direccion, items, total, envio, metodoPago, tipoEntrega }) {
  try {
    const itemsRows = items.map(i => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e8f4fd;font-size:12px">${i.nombre} ${i.litros}L</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e8f4fd;font-size:12px;text-align:right;font-weight:700;color:#1a6dbf;white-space:nowrap">$${(i.precioPorLitro * i.litros).toLocaleString("es-CL")}</td>
      </tr>`).join("");

    const envioTexto = tipoEntrega === "retiro" ? "Retiro en tienda" : envio > 0 ? `$${envio.toLocaleString("es-CL")}` : "GRATIS";
    const metodoBadge = metodoPago === "Tarjeta (Mercado Pago)" ? "💳" : metodoPago === "Transferencia bancaria" ? "📲" : "💵";

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif">
  <div style="max-width:480px;margin:20px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
    
    <div style="background:linear-gradient(135deg,#0a3a6e,#1a6dbf);padding:24px;text-align:center">
      <div style="font-size:32px;margin-bottom:6px">🛒</div>
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:900">NUEVO PEDIDO</h1>
      <p style="color:#00d4ff;margin:4px 0 0;font-size:13px">PuntoBío — Productos de Limpieza</p>
    </div>

    <div style="background:#e8f4fd;padding:10px 16px;border-bottom:2px solid #00d4ff">
      <table width="100%"><tr>
        <td style="font-size:12px;color:#666">FOLIO</td>
        <td style="font-size:16px;font-weight:900;color:#1a6dbf;text-align:right">${pedidoId}</td>
      </tr></table>
    </div>

    <div style="padding:16px">

      <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:14px;border-left:3px solid #1a6dbf">
        <p style="margin:0 0 6px;font-size:11px;color:#1a6dbf;font-weight:700;text-transform:uppercase">👤 Cliente</p>
        <p style="margin:3px 0;font-size:13px"><strong>${nombre}</strong></p>
        <p style="margin:3px 0;font-size:12px;color:#555">📞 ${telefono}</p>
        ${email ? `<p style="margin:3px 0;font-size:12px;color:#555">📧 ${email}</p>` : ""}
        <p style="margin:3px 0;font-size:12px;color:#555">📍 ${tipoEntrega === "retiro" ? "<strong style='color:#2e7d32'>Retiro en tienda</strong>" : direccion}</p>
      </div>

      <p style="margin:0 0 8px;font-size:11px;color:#333;font-weight:700;text-transform:uppercase">🧴 Productos</p>
      <table width="100%" style="border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;margin-bottom:14px">
        <thead>
          <tr style="background:#1a6dbf">
            <th style="padding:8px 10px;color:#fff;text-align:left;font-size:11px">Producto</th>
            <th style="padding:8px 10px;color:#fff;text-align:right;font-size:11px;white-space:nowrap">Total</th>
          </tr>
        </thead>
        <tbody>${itemsRows}
          <tr style="background:#e8f4fd">
            <td style="padding:8px 10px;font-size:12px;color:#555">${tipoEntrega === "retiro" ? "🏪 Retiro en tienda" : envio === 0 ? "🚚 Envío gratis" : "📦 Envío"}</td>
            <td style="padding:8px 10px;text-align:right;font-size:12px;font-weight:700;color:#2e7d32;white-space:nowrap">${envioTexto}</td>
          </tr>
          <tr style="background:#0a3a6e">
            <td style="padding:12px 10px;color:#fff;font-weight:900;font-size:13px">TOTAL</td>
            <td style="padding:12px 10px;text-align:right;color:#00d4ff;font-weight:900;font-size:16px;white-space:nowrap">$${total.toLocaleString("es-CL")}</td>
          </tr>
        </tbody>
      </table>

      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:10px;text-align:center">
        <p style="margin:0;font-size:13px;font-weight:700;color:#856404">${metodoBadge} ${metodoPago}</p>
      </div>

    </div>

    <div style="background:#f0f4f8;padding:12px;text-align:center;border-top:1px solid #e0e0e0">
      <p style="margin:0;font-size:11px;color:#999">PuntoBío · Notificación automática de pedidos</p>
    </div>

  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [NOTIFY_EMAIL],
        subject: `🛒 Pedido ${pedidoId} — $${total.toLocaleString("es-CL")} — ${metodoPago}`,
        html
      })
    });
    const data = await res.json();
    console.log("Resend:", JSON.stringify(data));
  } catch (e) {
    console.error("Resend error:", e.message);
  }
}

app.get("/", (req, res) => res.json({ ok: true, service: "PuntoBio Backend v3" }));

app.post("/pagar", async (req, res) => {
  const { items, pedidoId, email, nombre, telefono, direccion, envio, tipoEntrega, metodoPago } = req.body;
  if (!items || !pedidoId || !nombre || !telefono) return res.status(400).json({ ok: false, error: "Faltan datos" });
  const total = items.reduce((s, i) => s + i.precioPorLitro * i.litros, 0) + (envio || 0);

  if (metodoPago === "Efectivo presencial" || metodoPago === "Transferencia bancaria") {
    notificar({ pedidoId, nombre, telefono, email, direccion, items, total, envio: envio || 0, metodoPago, tipoEntrega }).catch(console.error);
    return res.json({ ok: true, status: "confirmed" });
  }

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      body: JSON.stringify({
        items: items.map(i => ({ id: String(i.id), title: `${i.nombre} ${i.litros}L`, quantity: 1, unit_price: i.precioPorLitro * i.litros, currency_id: "CLP" }))
          .concat(envio > 0 ? [{ id: "envio", title: "Costo de envio", quantity: 1, unit_price: envio, currency_id: "CLP" }] : []),
        payer: { name: nombre, email: email || "dahumada1926@gmail.com", phone: { number: telefono } },
        external_reference: pedidoId,
        back_urls: {
          success: `https://puntobio-vending.vercel.app/?status=approved&pedido=${pedidoId}`,
          failure: `https://puntobio-vending.vercel.app/?status=rejected&pedido=${pedidoId}`,
          pending: `https://puntobio-vending.vercel.app/?status=pending&pedido=${pedidoId}`,
        },
        auto_return: "approved",
        statement_descriptor: "PUNTOBIO",
      }),
    });
    const data = await response.json();
    if (data.init_point) {
      notificar({ pedidoId, nombre, telefono, email, direccion, items, total, envio: envio || 0, metodoPago, tipoEntrega }).catch(console.error);
      return res.json({ ok: true, url: data.init_point });
    }
    return res.status(500).json({ ok: false, error: "No se pudo crear el pago" });
  } catch (error) {
    console.error("MP error:", error.message);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PuntoBio Backend v3 corriendo en puerto ${PORT}`));
