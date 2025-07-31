const pool = require("../models/db");
const { registrarAuditoria } = require("./auditoriaController");

const getOrganizaciones = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      "SELECT * FROM organizaciones WHERE user_id = $1 ORDER BY id ASC",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener organizaciones:", error);
    res.status(500).json({ error: "Error al obtener organizaciones" });
  }
};

const buscarOrganizacionesPorNombre = async (req, res) => {
  const { query } = req.query;
  const userId = req.user.userId;

  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Falta el parámetro de búsqueda." });
  }

  try {
    const result = await pool.query(
      `SELECT id, nombre, direccion
       FROM organizaciones
       WHERE user_id = $1 AND nombre ILIKE $2
       ORDER BY nombre
       LIMIT 10`,
      [userId, `%${query}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error buscando organizaciones:", error);
    res.status(500).json({ error: "Error al buscar organizaciones" });
  }
};

const crearOrganizacion = async (req, res) => {
  const userId = req.user.userId;
  const { nombre, tipo, direccion, sede } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO organizaciones (nombre, tipo, direccion, sede, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [nombre, tipo, direccion, sede, userId]
    );

    await registrarAuditoria({
      usuario_id: userId,
      tabla: "organizaciones",
      registro_id: result.rows[0].id,
      campo: "registro",
      valor_anterior: null,
      valor_nuevo: `Organización '${nombre}' creada con tipo '${tipo}'`,
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear organización:", error);
    res.status(500).json({ error: "Error al crear organización" });
  }
};

const actualizarOrganizacion = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { nombre, tipo, direccion, sede } = req.body;

  try {
    const original = await pool.query(
      "SELECT * FROM organizaciones WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (original.rows.length === 0) {
      return res.status(404).json({ error: "Organización no encontrada" });
    }

    const prev = original.rows[0];

    const result = await pool.query(
      `UPDATE organizaciones
   SET nombre = $1, tipo = $2, direccion = $3, sede = $4
   WHERE id = $5 AND user_id = $6
   RETURNING *`,
      [nombre, tipo, direccion, sede, id, userId]
    );

    const campos = [
      { campo: "nombre", anterior: prev.nombre, nuevo: nombre },
      { campo: "tipo", anterior: prev.tipo, nuevo: tipo },
      { campo: "direccion", anterior: prev.direccion, nuevo: direccion },
      { campo: "sede", anterior: prev.sede, nuevo: sede },
    ];

    for (const c of campos) {
      if (c.anterior !== c.nuevo) {
        await registrarAuditoria({
          usuario_id: userId,
          tabla: "organizaciones",
          registro_id: id,
          campo: c.campo,
          valor_anterior: c.anterior,
          valor_nuevo: c.nuevo,
        });
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar organización:", error);
    res.status(500).json({ error: "Error al actualizar organización" });
  }
};

const eliminarOrganizacion = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM organizaciones WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Organización no encontrada" });
    }

    const org = result.rows[0];

    await registrarAuditoria({
      usuario_id: userId,
      tabla: "organizaciones",
      registro_id: id,
      campo: "registro",
      valor_anterior: JSON.stringify({
        nombre: org.nombre,
        tipo: org.tipo,
        direccion: org.direccion,
        sede: org.sede,
      }),

      valor_nuevo: "Eliminado",
    });

    res.json({ mensaje: "Organización eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar organización:", error);
    res.status(500).json({ error: "Error al eliminar organización" });
  }
};

module.exports = {
  getOrganizaciones,
  crearOrganizacion,
  buscarOrganizacionesPorNombre,
  actualizarOrganizacion,
  eliminarOrganizacion,
};
