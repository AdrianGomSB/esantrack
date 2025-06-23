const pool = require("../models/db");
const { registrarAuditoria } = require("./auditoriaController");

// Crear punto en una ruta
const crearPunto = async (req, res) => {
  const {
    ruta_id,
    latitud,
    longitud,
    orden,
    estado = "Pendiente",
    tipo = "",
    nombre = "",
    direccion = null,
    justificacion = null,
    fecha,
    hora_inicio,
    hora_fin,
    metas_fichas,
    motivo_visita,
    fichas_logradas = null,
  } = req.body;

  const id_user = req.user.userId;

  try {
    const result = await pool.query(
      `INSERT INTO puntos_ruta 
        (ruta_id, latitud, longitud, orden, estado, tipo, nombre, direccion, justificacion, fecha, hora_inicio, hora_fin, user_id, metas_fichas, motivo_visita, fichas_logradas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        ruta_id,
        latitud,
        longitud,
        orden,
        estado,
        tipo,
        nombre,
        direccion,
        justificacion,
        fecha,
        hora_inicio,
        hora_fin,
        id_user,
        metas_fichas,
        motivo_visita,
        fichas_logradas,
      ]
    );

    await registrarAuditoria({
      usuario_id: id_user,
      tabla: "puntos_ruta",
      registro_id: result.rows[0].id,
      campo: "registro",
      valor_anterior: null,
      valor_nuevo: JSON.stringify(result.rows[0]),
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error en crearPunto:", err);
    res.status(500).json({ error: "Error al crear punto" });
  }
};

// Obtener todos los puntos de una ruta
const getPuntosPorRuta = async (req, res) => {
  const { ruta_id } = req.params;
  const id_user = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM puntos_ruta
       WHERE ruta_id = $1 AND user_id = $2
       ORDER BY orden ASC`,
      [ruta_id, id_user]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al guardar puntos:", error);
    res.status(500).json({ error: "Error al obtener los puntos" });
  }
};

// Obtener punto de ruta por ID
const getPuntoPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM puntos_ruta WHERE id = $1`, [
      id,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Punto no encontrado" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener punto por ID:", err);
    res.status(500).json({ error: "Error al obtener punto de ruta" });
  }
};

// Eliminar un punto
const eliminarPunto = async (req, res) => {
  const { id } = req.params;
  try {
    const punto = await pool.query(
      `SELECT ruta_id FROM puntos_ruta WHERE id = $1`,
      [id]
    );

    if (punto.rowCount === 0)
      return res.status(404).json({ error: "Punto no encontrado" });

    const ruta_id = punto.rows[0].ruta_id;

    await registrarAuditoria({
      usuario_id: req.user.userId,
      tabla: "puntos_ruta",
      registro_id: id,
      campo: "eliminación",
      valor_anterior: JSON.stringify(punto.rows[0]),
      valor_nuevo: null,
    });

    await pool.query("DELETE FROM puntos_ruta WHERE id = $1", [id]);
    await actualizarEstadoRuta(ruta_id);

    res.json({ message: "Punto eliminado y estado de ruta actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar punto" });
  }
};

const eliminarPuntosPorRuta = async (req, res) => {
  const { ruta_id } = req.params;
  try {
    await pool.query("DELETE FROM puntos_ruta WHERE ruta_id = $1", [ruta_id]);
    await actualizarEstadoRuta(ruta_id);
    res.json({ message: "Todos los puntos de la ruta fueron eliminados" });
  } catch (err) {
    console.error("Error al eliminar puntos por ruta:", err);
    res.status(500).json({ error: "Error al eliminar puntos de la ruta" });
  }
};

const actualizarEstadoRuta = async (ruta_id) => {
  try {
    const result = await pool.query(
      `SELECT estado FROM puntos_ruta WHERE ruta_id = $1`,
      [ruta_id]
    );

    const estados = result.rows.map(
      (r) => r.estado?.toLowerCase() || "pendiente"
    );
    let nuevoEstado = "Pendiente";

    if (estados.length === 0) {
      nuevoEstado = "Pendiente";
    } else if (estados.every((e) => e === "completado")) {
      nuevoEstado = "Completado";
    } else if (estados.some((e) => e === "completado")) {
      nuevoEstado = "En progreso";
    }

    await pool.query(`UPDATE rutas SET estado = $1 WHERE id = $2`, [
      nuevoEstado,
      ruta_id,
    ]);
  } catch (err) {
    console.error("Error actualizando estado de ruta:", err);
  }
};

const editarPunto = async (req, res) => {
  const { id } = req.params;
  const campos = req.body;

  try {
    const punto = await pool.query(`SELECT * FROM puntos_ruta WHERE id = $1`, [
      id,
    ]);

    if (punto.rowCount === 0) {
      return res.status(404).json({ error: "Punto no encontrado" });
    }

    const ruta_id = punto.rows[0].ruta_id;

    if (
      campos.estado?.toLowerCase() === "completado" &&
      (campos.fichas_logradas === undefined || campos.fichas_logradas === null)
    ) {
      return res.status(400).json({
        error: "Debe registrar las fichas logradas al completar el punto.",
      });
    }

    const keys = Object.keys(campos);
    const values = Object.values(campos);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");

    const result = await pool.query(
      `UPDATE puntos_ruta SET ${setClause} WHERE id = $${
        keys.length + 1
      } RETURNING *`,
      [...values, id]
    );

    await registrarAuditoria({
      usuario_id: req.user.userId,
      tabla: "puntos_ruta",
      registro_id: id,
      campo: "actualización",
      valor_anterior: JSON.stringify(punto.rows[0]),
      valor_nuevo: JSON.stringify(result.rows[0]),
    });

    await actualizarEstadoRuta(ruta_id);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error en editarPunto:", err);
    res.status(500).json({ error: "Error al editar punto de ruta" });
  }
};

const getTodosLosPuntos = async (req, res) => {
  const { userId, role, equipo } = req.user;

  try {
    let result;

    if (role === "admin") {
      result = await pool.query(`
        SELECT pr.*, u.equipo
        FROM puntos_ruta pr
        JOIN users u ON pr.user_id = u.id
        ORDER BY pr.updated_at DESC NULLS LAST
      `);
    } else if (role === "supervisor") {
      result = await pool.query(
        `
        SELECT pr.*, u.equipo
        FROM puntos_ruta pr
        JOIN users u ON pr.user_id = u.id
        WHERE u.equipo = $1
        ORDER BY pr.updated_at DESC NULLS LAST
      `,
        [equipo]
      );
    } else {
      result = await pool.query(
        `
        SELECT pr.*, u.equipo
        FROM puntos_ruta pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.user_id = $1
        ORDER BY pr.updated_at DESC NULLS LAST
      `,
        [userId]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener puntos:", err);
    res.status(500).json({ error: "Error al obtener puntos de ruta" });
  }
};

const getPuntosCompletados = async (req, res) => {
  const { userId, role, equipo } = req.user;

  try {
    let result;

    if (role === "admin") {
      result = await pool.query(`
        SELECT pr.id, pr.direccion, pr.orden, pr.tipo, pr.nombre, pr.estado,
               pr.metas_fichas, pr.fichas_logradas, pr.motivo_visita,
               r.titulo AS ruta_titulo
        FROM puntos_ruta pr
        JOIN rutas r ON pr.ruta_id = r.id
        JOIN users u ON pr.user_id = u.id
        WHERE LOWER(pr.estado) = 'completado'
        ORDER BY r.created_at DESC, pr.orden ASC
      `);
    } else if (role === "supervisor") {
      result = await pool.query(
        `
        SELECT pr.id, pr.direccion, pr.orden, pr.tipo, pr.nombre, pr.estado,
               pr.metas_fichas, pr.fichas_logradas, pr.motivo_visita,
               r.titulo AS ruta_titulo
        FROM puntos_ruta pr
        JOIN rutas r ON pr.ruta_id = r.id
        JOIN users u ON pr.user_id = u.id
        WHERE LOWER(pr.estado) = 'completado'
          AND u.equipo = $1
        ORDER BY r.created_at DESC, pr.orden ASC
      `,
        [equipo]
      );
    } else {
      result = await pool.query(
        `
        SELECT pr.id, pr.direccion, pr.orden, pr.tipo, pr.nombre, pr.estado,
               pr.metas_fichas, pr.fichas_logradas, pr.motivo_visita,
               r.titulo AS ruta_titulo
        FROM puntos_ruta pr
        JOIN rutas r ON pr.ruta_id = r.id
        WHERE LOWER(pr.estado) = 'completado'
          AND pr.user_id = $1
        ORDER BY r.created_at DESC, pr.orden ASC
      `,
        [userId]
      );
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error al obtener puntos completados:", err);
    res.status(500).json({ error: "Error al obtener los puntos completados" });
  }
};

module.exports = {
  crearPunto,
  getPuntosPorRuta,
  getPuntoPorId,
  eliminarPunto,
  editarPunto,
  getTodosLosPuntos,
  getPuntosCompletados,
  eliminarPuntosPorRuta,
};
