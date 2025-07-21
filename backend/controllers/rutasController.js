const pool = require("../models/db");

const getRutas = async (req, res) => {
  try {
    const { role, userId, equipo } = req.user;

    let rutasRes;

    if (role === "admin") {
      rutasRes = await pool.query(
        `SELECT r.*, e.titulo AS evento_titulo
         FROM rutas r
         LEFT JOIN eventos e ON r.evento_id = e.id
         ORDER BY r.created_at DESC`
      );
    } else if (role === "supervisor") {
      rutasRes = await pool.query(
        `SELECT DISTINCT r.*, e.titulo AS evento_titulo
         FROM rutas r
         LEFT JOIN eventos e ON r.evento_id = e.id
         LEFT JOIN puntos_ruta pr ON pr.ruta_id = r.id
         LEFT JOIN users u ON pr.user_id = u.id
         WHERE u.equipo = $1
         ORDER BY r.created_at DESC`,
        [equipo]
      );
    } else {
      rutasRes = await pool.query(
        `SELECT r.*, e.titulo AS evento_titulo
         FROM rutas r
         LEFT JOIN eventos e ON r.evento_id = e.id
         WHERE r.usuario_id = $1
         ORDER BY r.created_at DESC`,
        [userId]
      );
    }

    const rutas = rutasRes.rows;

    for (let ruta of rutas) {
      const puntosRes = await pool.query(
        `SELECT pr.id, pr.latitud, pr.longitud, pr.estado, pr.orden, 
                pr.direccion, pr.justificacion, pr.tipo, pr.nombre,
                pr.user_id, u.equipo
         FROM puntos_ruta pr
         LEFT JOIN users u ON pr.user_id = u.id
         WHERE pr.ruta_id = $1 
         ORDER BY pr.orden ASC`,
        [ruta.id]
      );
      ruta.puntos = puntosRes.rows;
    }

    res.json(rutas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener rutas" });
  }
};

const getRutaPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM rutas WHERE id = $1 AND usuario_id = $2`,
      [id, req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener ruta" });
  }
};

const getRutaPorEvento = async (req, res) => {
  const { evento_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM rutas WHERE evento_id = $1 AND usuario_id = $2`,
      [evento_id, req.user.userId]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Ruta no encontrada para ese evento" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener ruta por evento" });
  }
};

// Crear ruta manualmente
const crearRuta = async (req, res) => {
  const { titulo, descripcion, fecha, estado, evento_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO rutas (usuario_id, titulo, descripcion, fecha, estado, evento_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.userId, titulo, descripcion, fecha, estado, evento_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear ruta" });
  }
};

// Editar ruta
const editarRuta = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, fecha, estado } = req.body;

  try {
    const result = await pool.query(
      `UPDATE rutas
       SET titulo = $1, descripcion = $2, fecha = $3, estado = $4
       WHERE id = $5 AND usuario_id = $6
       RETURNING *`,
      [titulo, descripcion, fecha, estado, id, req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al editar ruta" });
  }
};

// Eliminar ruta
const eliminarRuta = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM rutas WHERE id = $1 AND usuario_id = $2 RETURNING *`,
      [id, req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }

    res.json({ message: "Ruta eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar ruta" });
  }
};

module.exports = {
  getRutas,
  getRutaPorId,
  getRutaPorEvento,
  crearRuta,
  editarRuta,
  eliminarRuta,
};
