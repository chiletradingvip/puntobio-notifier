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
    const itemsTexto = items.map(i => `${i.nombre} ${i.litros}L = $${(i.precioPorLitro * i.litros).toLocaleString("es-CL")}`).join("\n");
    const envioTexto = tipoEntrega === "retiro" ? "Retiro en tienda (GRATIS)" : envio > 0 ? `Envio: $${envio.toLocaleString("es-CL")}` : "Envio: GRATIS";
    const text = `NUEVO PEDIDO PUNTOBIO\n\nFolio: ${pedidoId}\nCliente: ${nombre}\nTelefono: ${telefono}\n${email ? `Email: ${email}\n` : ""}Direccion: ${tipoEntrega === "retiro" ? "RETIRO EN TIENDA" : direccion}\n\n${itemsTexto}\n${envioTexto}\nTOTAL: $${total.toLocaleString("es-CL")}\nPago: ${metodoPago}`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: "onboarding@resend.dev", to: [NOTIFY_EMAIL], subject: `Nuevo pedido ${pedidoId} - $${total.toLocaleString("es-CL")}`, text })
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