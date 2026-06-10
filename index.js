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
        <td style="padding:10px 14px;border-bottom:1px solid #e8f4fd">${i.nombre}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e8f4fd;text-align:center">${i.litros}L</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e8f4fd;text-align:right;font-weight:700;color:#1a6dbf">$${(i.precioPorLitro * i.litros).toLocaleString("es-CL")}</td>
      </tr>`).join("");

    const envioTexto = tipoEntrega === "retiro" ? "🏪 Retiro en tienda" : envio > 0 ? `$${envio.toLocaleString("es-CL")}` : "GRATIS";
    const envioColor = envio === 0 ? "#2e7d32" : "#333";

    const metodoBadge = metodoPago === "Tarjeta (Mercado Pago)" ? "💳" : metodoPago === "Transferencia bancaria" ? "📲" : "💵";

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif">
  <div style="max-width:520px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
    
    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#0a3a6e 0%,#1a6dbf 100%);padding:28px 24px;text-align:center">
      <div style="font-size:36px;margin-bottom:8px">🛒</div>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900;letter-spacing:1px">NUEVO PEDIDO</h1>
      <p style="color:#00d4ff;margin:6px 0 0;font-size:15px;font-weight:700">PuntoBío — Productos de Limpieza</p>
    </div>

    <!-- FOLIO -->
    <div style="background:#e8f4fd;padding:14px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #00d4ff">
      <span style="font-size:13px;color:#666;font-weight:600">FOLIO DE PEDIDO</span>
      <span style="font-size:18px;font-weight:900;color:#1a6dbf">${pedidoId}</span>
    </div>

    <div style="padding:24px">

      <!-- CLIENTE -->
      <div style="background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:18px;border-left:4px solid #1a6dbf">
        <h3 style="margin:0 0 10px;color:#1a6dbf;font-size:13px;text-transform:uppercase;letter-spacing:1px">👤 Datos del Cliente</h3>
        <p style="margin:4px 0;font-size:15px"><strong>${nombre}</strong></p>
        <p style="margin:4px 0;font-size:14px;color:#555">📞 ${telefono}</p>
        ${email ? `<p style="margin:4px 0;font-size:14px;color:#555">📧 ${email}</p>` : ""}
        <p style="margin:4px 0;font-size:14px;color:#555">📍 ${tipoEntrega === "retiro" ? "<strong style='color:#2e7d32'>RETIRO EN TIENDA 🏪</strong>" : direccion}</p>
      </div>

      <!-- PRODUCTOS -->
      <h3 style="margin:0 0 10px;color:#333;font-size:13px;text-transform:uppercase;letter-spacing:1px">🧴 Productos</h3>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;margin-bottom:18px">
        <thead>
          <tr style="background:#1a6dbf">
            <th style="padding:10px 14px;color:#fff;text-align:left;font-size:12px">Producto</th>
            <th style="padding:10px 14px;color:#fff;text-align:center;font-size:12px">Cant.</th>
            <th style="padding:10px 14px;color:#fff;text-align:right;font-size:12px">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
        <tr style="background:#e8f4fd">
          <td colspan="2" style="padding:10px 14px;font-size:13px;color:${envioColor}">${tipoEntrega === "retiro" ? "🏪 Retiro gratis" : envio === 0 ? "🚚 Envío gratis" : "📦 Envío"}</td>
          <td style="padding:10px 14px;text-align:right;font-weight:700;color:${envioColor}">${envioTexto}</td>
        </tr>
        <tr style="background:#0a3a6e">
          <td colspan="2" style="padding:14px;color:#fff;font-weight:900;font-size:15px">TOTAL A PAGAR</td>
          <td style="padding:14px;text-align:right;color:#00d4ff;font-weight:900;font-size:20px">$${total.toLocaleString("es-CL")}</td>
        </tr>
      </table>

      <!-- MÉTODO DE PAGO -->
      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:10px;padding:14px;text-align:center">
        <p style="margin:0;font-size:15px;font-weight:700;color:#856404">${metodoBadge} Método de pago: ${metodoPago}</p>
      </div>

    </div>

    <!-- FOOTER -->
    <div style="background:#f0f4f8;padding:16px;text-align:center;border-top:1px solid #e0e0e0">
      <p style="margin:0;font-size:12px;color:#999">PuntoBío — Importadora Lemarc SPA</p>
      <p style="margin:4px 0 0;font-size:11px;color:#bbb">Este es un correo automático de notificación de pedidos</p>
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
        subject: `🛒 Nuevo pedido ${pedidoId} — $${total.toLocaleString("es-CL")} — ${metodoPago}`,
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
        payer: { name: nombre, email: email || "cliente@puntobio.cl", phone: { number: telefono } },
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
