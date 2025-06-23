const pool = require("../models/db");

// Obtener informe de ventas por usuario
const getInformeVentas = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM ventas");
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Obtener usuarios
const getUsuarios = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios");
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { getInformeVentas, getUsuarios };
