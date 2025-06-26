const pool = require("../models/db");

const getEmpresas = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM empresas ORDER BY id_empresa ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener empresas:", error);
    res.status(500).json({ error: "Error al obtener empresas" });
  }
};

// Crear una nueva empresa
const crearEmpresa = async (req, res) => {
  const { nombre, tipo } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO empresas (nombre, tipo) VALUES ($1, $2) RETURNING *",
      [nombre, tipo || "Empresa"]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear empresa:", error);
    res.status(500).json({ error: "Error al crear empresa" });
  }
};

const actualizarEmpresa = async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo } = req.body;
  try {
    const result = await pool.query(
      "UPDATE empresas SET nombre = $1, tipo = $2 WHERE id_empresa = $3 RETURNING *"[
        (nombre, tipo, id)
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar empresa:", error);
    res.status(500).json({ error: "Error al actualizar empresa" });
  }
};

// Eliminar una empresa
const eliminarEmpresa = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM empresas WHERE id_empresa = $1", [id]);
    res.json({ mensaje: "Empresa eliminada" });
  } catch (error) {
    console.error("Error al eliminar empresa:", error);
    res.status(500).json({ error: "Error al eliminar empresa" });
  }
};

const buscarEmpresasPorNombre = async (req, res) => {
  const { query, tipo } = req.query;

  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Falta el parámetro de búsqueda." });
  }

  try {
    let result;
    if (tipo) {
      result = await pool.query(
        `SELECT id_empresa, nombre
         FROM empresas
         WHERE nombre ILIKE $1 AND tipo = $2
         ORDER BY nombre
         LIMIT 10`,
        [`%${query}%`, tipo]
      );
    } else {
      result = await pool.query(
        `SELECT id_empresa, nombre
         FROM empresas
         WHERE nombre ILIKE $1
         ORDER BY nombre
         LIMIT 10`,
        [`%${query}%`]
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error buscando empresas:", error.message);
    res.status(500).json({ error: "Error al buscar empresas" });
  }
};

module.exports = {
  getEmpresas,
  crearEmpresa,
  actualizarEmpresa,
  eliminarEmpresa,
  buscarEmpresasPorNombre,
};
