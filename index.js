const express = require("express");
const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "1258182910";

app.get("/", (req, res) => res.json({ ok: true, service: "PuntoBio Notifier" }));

app.post("/notificar", async (req, res) => {
  const { pedidoId, nombre, telefono, email, direccion, items, total, envio, metodoPago, tipoEntrega } = req.body;
  
  try {
    const itemsTexto = items.map(i => `• ${i.nombre} ${i.litros}L = $${(i.precioPorLitro * i.litros).toLocaleString("es-CL")}`).join("\n");
    const envioTexto = tipoEntrega === "retiro" ? "Retiro en tienda (GRATIS)" : envio > 0 ? `Envio: $${envio.toLocaleString("es-CL")}` : "Envio: GRATIS";
    
    const msg = `NUEVO PEDIDO PUNTOBIO\n\nFolio: ${pedidoId}\nCliente: ${nombre}\nTelefono: ${telefono}\n${email ? `Email: ${email}\n` : ""}Direccion: ${tipoEntrega === "retiro" ? "RETIRO EN TIENDA" : direccion}\n\n${itemsTexto}\n${envioTexto}\nTOTAL: $${total.toLocaleString("es-CL")}\n\nPago: ${metodoPago}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg }),
    });
    const tgData = await tgRes.json();
    console.log("Telegram:", JSON.stringify(tgData));
    res.json({ ok: tgData.ok });
  } catch (e) {
    console.error("Error:", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PuntoBio Notifier corriendo en puerto ${PORT}`));
