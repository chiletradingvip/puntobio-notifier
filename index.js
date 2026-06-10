const express = require("express");
const app = express();
app.use(express.json());

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "Dahumada1926@gmail.com";

app.get("/", (req, res) => res.json({ ok: true, service: "PuntoBio Notifier v2" }));

app.post("/notificar", async (req, res) => {
  const { pedidoId, nombre, telefono, email, direccion, items, total, envio, metodoPago, tipoEntrega } = req.body;

  try {
    const itemsTexto = items.map(i =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.nombre} ${i.litros}L</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${(i.precioPorLitro * i.litros).toLocaleString("es-CL")}</td></tr>`
    ).join("");

    const html = `
<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:10px">
  <div style="background:linear-gradient(135deg,#0a3a6e,#1a6dbf);padding:20px;border-radius:8px;text-align:center;margin-bottom:20px">
    <h1 style="color:#fff;margin:0;font-size:24px">🛒 NUEVO PEDIDO</h1>
    <p style="color:#00d4ff;margin:5px 0 0;font-size:16px">PuntoBío</p>
  </div>
  <div style="background:#fff;padding:20px;border-radius:8px;margin-bottom:15px">
    <h3 style="color:#333;margin:0 0 15px">📋 Folio: <span style="color:#1a6dbf">${pedidoId}</span></h3>
    <p style="margin:5px 0">👤 <strong>${nombre}</strong></p>
    <p style="margin:5px 0">📞 ${telefono}</p>
    ${email ? `<p style="margin:5px 0">📧 ${email}</p>` : ""}
    <p style="margin:5px 0">📍 ${tipoEntrega === "retiro" ? "RETIRO EN TIENDA 🏪" : direccion}</p>
  </div>
  <div style="background:#fff;padding:20px;border-radius:8px;margin-bottom:15px">
    <table style="width:100%;border-collapse:collapse">
      ${itemsTexto}
      <tr style="background:#f0f8ff">
        <td style="padding:8px;font-weight:bold">${tipoEntrega === "retiro" ? "🏪 Retiro gratis" : envio > 0 ? "📦 Envío" : "🚚 Envío gratis"}</td>
        <td style="padding:8px;text-align:right;color:green;font-weight:bold">${envio > 0 ? "$" + envio.toLocaleString("es-CL") : "¡GRATIS!"}</td>
      </tr>
      <tr style="background:#0a3a6e">
        <td style="padding:12px;color:#fff;font-weight:bold;font-size:16px">TOTAL</td>
        <td style="padding:12px;color:#00d4ff;font-weight:bold;font-size:18px;text-align:right">$${total.toLocaleString("es-CL")}</td>
      </tr>
    </table>
  </div>
  <div style="background:#fff3cd;padding:15px;border-radius:8px;border-left:4px solid #ffc107">
    <p style="margin:0">💳 <strong>Método de pago:</strong> ${metodoPago}</p>
  </div>
</div>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "PuntoBío Pedidos <onboarding@resend.dev>",
        to: [NOTIFY_EMAIL],
        subject: `🛒 Nuevo pedido ${pedidoId} - $${total.toLocaleString("es-CL")}`,
        html: html
      })
    });

    const resendData = await resendRes.json();
    console.log("Resend respuesta:", JSON.stringify(resendData));
    res.json({ ok: !!resendData.id, data: resendData });
  } catch (e) {
    console.error("Error:", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PuntoBio Notifier v2 corriendo en puerto ${PORT}`));
