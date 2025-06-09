const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/legajo/:id", async (req, res) => {
  const legajo = req.params.id;
  const url = `http://proveedores.alsea.com.ar:48080/asignaciones-server/mobile/main/asignaciones/legajos/${legajo}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los datos" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});