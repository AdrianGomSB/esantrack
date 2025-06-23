const express = require("express");
const router = express.Router();
const axios = require("axios");

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

router.get("/", async (req, res) => {
  const { direccion } = req.query;

  if (!direccion) {
    return res.status(400).json({ error: "Falta el parámetro 'direccion'" });
  }

  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: direccion,
          key: GOOGLE_API_KEY,
        },
      }
    );

    const { status, results, error_message } = response.data;

    if (status !== "OK") {
      return res.status(400).json({
        error: error_message || "No se pudo geocodificar la dirección",
      });
    }
    const { lat, lng } = results[0].geometry.location;
    res.json({ lat, lng });
  } catch (err) {
    console.error("Error en geocodificación:", err.message);
    res.status(500).json({ error: "Error interno al geocodificar" });
  }
});

module.exports = router;
