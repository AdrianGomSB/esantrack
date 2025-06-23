const pool = require("../models/db");
const { registrarAuditoria } = require("./auditoriaController");

const crearEvento = async (req, res) => {
  const { titulo, fecha_inicio, fecha_fin } = req.body;

  try {
    // Crear evento
    const eventoRes = await pool.query(
      `INSERT INTO eventos (user_id, titulo, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [req.user.userId, titulo, fecha_inicio, fecha_fin]
    );

    const eventoId = eventoRes.rows[0].id;

    // Crear ruta asociada al evento
    const rutaRes = await pool.query(
      `INSERT INTO rutas (evento_id, titulo, fecha, estado, usuario_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [eventoId, `Ruta ${titulo}`, fecha_inicio, "Pendiente", req.user.userId]
    );

    const rutaId = rutaRes.rows[0].id;

    // 📝 Registrar en auditoría
    await registrarAuditoria({
      usuario_id: req.user.userId,
      tabla: "eventos",
      registro_id: eventoId,
      campo: "registro",
      valor_anterior: null,
      valor_nuevo: JSON.stringify({
        titulo,
        fecha_inicio,
        fecha_fin,
      }),
    });

    res.status(201).json({
      evento_id: eventoId,
      ruta_id: rutaId,
      message: "Evento y ruta creados correctamente",
    });
  } catch (err) {
    console.error("❌ Error detallado al crear evento:", err);
    res.status(500).json({ error: "Error al crear evento y ruta" });
  }
};

// Ver eventos del usuario
const getEventos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          e.id,
          e.titulo,
          e.fecha_inicio::date AS fecha_inicio,
          e.fecha_fin::date AS fecha_fin
       FROM eventos e
       WHERE e.user_id = $1
       ORDER BY e.fecha_inicio DESC`,
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener eventos" });
  }
};

// Editar evento
const editarEvento = async (req, res) => {
  const { id } = req.params;
  const { titulo, fecha_inicio, fecha_fin } = req.body;

  try {
    const original = await pool.query(
      "SELECT * FROM eventos WHERE id = $1 AND user_id = $2",
      [id, req.user.userId]
    );

    if (original.rows.length === 0) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    const eventoAnterior = original.rows[0];

    const update = await pool.query(
      `UPDATE eventos
       SET titulo = $1, fecha_inicio = $2, fecha_fin = $3
       WHERE id = $4 AND user_id = $5
       RETURNING id`,
      [titulo, fecha_inicio, fecha_fin, id, req.user.userId]
    );

    // Registrar auditoría si hubo cambios
    const cambios = [
      { campo: "titulo", anterior: eventoAnterior.titulo, nuevo: titulo },
      {
        campo: "fecha_inicio",
        anterior: eventoAnterior.fecha_inicio.toISOString(),
        nuevo: new Date(fecha_inicio).toISOString(),
      },
      {
        campo: "fecha_fin",
        anterior: eventoAnterior.fecha_fin.toISOString(),
        nuevo: new Date(fecha_fin).toISOString(),
      },
    ];

    for (const c of cambios) {
      if (c.anterior !== c.nuevo) {
        await registrarAuditoria({
          usuario_id: req.user.userId,
          tabla: "eventos",
          registro_id: parseInt(id),
          campo: c.campo,
          valor_anterior: c.anterior,
          valor_nuevo: c.nuevo,
        });
      }
    }

    const result = await pool.query(
      `SELECT id, titulo, fecha_inicio::date AS fecha_inicio, fecha_fin::date AS fecha_fin
       FROM eventos WHERE id = $1`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al editar el evento" });
  }
};

// Ver un solo evento por ID
const getEventoPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
          id,
          titulo,
          fecha_inicio::date AS fecha_inicio,
          fecha_fin::date AS fecha_fin
       FROM eventos
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el evento" });
  }
};

// Eliminar evento
const eliminarEvento = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM eventos WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.userId]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Evento no encontrado" });

    // 📝 Auditoría: registrar eliminación
    await registrarAuditoria({
      usuario_id: req.user.userId,
      tabla: "eventos",
      registro_id: parseInt(id),
      campo: "registro",
      valor_anterior: JSON.stringify({
        titulo: result.rows[0].titulo,
        fecha_inicio: result.rows[0].fecha_inicio,
        fecha_fin: result.rows[0].fecha_fin,
      }),
      valor_nuevo: "Eliminado",
    });

    res.json({ message: "Evento eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar evento" });
  }
};

module.exports = {
  crearEvento,
  getEventos,
  getEventoPorId,
  editarEvento,
  eliminarEvento,
};
