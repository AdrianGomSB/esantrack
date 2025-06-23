const pool = require("../models/db");

// Obtener todas las visitas del usuario autenticado
const getVisitas = async (req, res) => {
  const { evento_id } = req.query;
  try {
    let result;

    if (evento_id) {
      result = await pool.query(
        `SELECT visitas.*, eventos.titulo AS evento_titulo
         FROM visitas
         JOIN eventos ON visitas.evento_id = eventos.id
         WHERE visitas.usuario_id = $1 AND visitas.evento_id = $2`,
        [req.user.userId, evento_id]
      );
    } else {
      result = await pool.query(
        `SELECT visitas.*, eventos.titulo AS evento_titulo
         FROM visitas
         JOIN eventos ON visitas.evento_id = eventos.id
         WHERE visitas.usuario_id = $1`,
        [req.user.userId, evento_id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener visitas" });
  }
};

// Obtener una sola visita por ID
const getVisitaPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM visitas WHERE id = $1 AND usuario_id = $2",
      [id, req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Visita no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener visita" });
  }
};

// Crear una nueva visita (sin ruta_id)
const crearVisita = async (req, res) => {
  const { documento, estado_visita, empresa, fecha_visita, evento_id } =
    req.body;

  try {
    const result = await pool.query(
      `INSERT INTO visitas 
        (usuario_id, documento, estado_visita, empresa, fecha_visita, evento_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        req.user.userId,
        documento,
        estado_visita,
        empresa,
        fecha_visita,
        evento_id,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear visita" });
  }
};

// Editar visita (sin ruta_id)
const editarVisita = async (req, res) => {
  const { id } = req.params;
  const { documento, estado_visita, empresa, fecha_visita, evento_id } =
    req.body;

  try {
    const result = await pool.query(
      `UPDATE visitas 
       SET documento = $1, estado_visita = $2, empresa = $3, fecha_visita = $4, evento_id = $5 
       WHERE id = $6 AND usuario_id = $7 RETURNING *`,
      [
        documento,
        estado_visita,
        empresa,
        fecha_visita,
        evento_id,
        id,
        req.user.userId,
      ]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Visita no encontrada" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al editar visita" });
  }
};

// Eliminar visita
const eliminarVisita = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM visitas WHERE id = $1 AND usuario_id = $2 RETURNING *",
      [id, req.user.userId]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Visita no encontrada" });
    res.json({ message: "Visita eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar visita" });
  }
};

const getVisitasAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT visitas.*, users.username
      FROM visitas
      JOIN users ON visitas.usuario_id = users.id
      ORDER BY fecha_visita DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener todas las visitas" });
  }
};

module.exports = {
  getVisitas,
  getVisitaPorId,
  crearVisita,
  editarVisita,
  eliminarVisita,
  getVisitasAdmin,
};
