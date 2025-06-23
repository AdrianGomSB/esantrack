const pool = require("../models/db");

// Registrar auditoría (ya existente)
const registrarAuditoria = async ({
  usuario_id,
  tabla,
  registro_id,
  campo,
  valor_anterior,
  valor_nuevo,
}) => {
  try {
    await pool.query(
      `INSERT INTO auditoria (usuario_id, tabla, registro_id, campo, valor_anterior, valor_nuevo, fecha)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [usuario_id, tabla, registro_id, campo, valor_anterior, valor_nuevo]
    );
  } catch (error) {
    console.error("Error al registrar auditoría:", error);
  }
};

// Obtener todos los registros de auditoría
const obtenerAuditoria = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.nombre
      FROM auditoria a
      LEFT JOIN users u ON a.usuario_id = u.id
      ORDER BY a.fecha DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener auditoría:", error);
    res.status(500).json({ error: "Error al obtener registros de auditoría" });
  }
};

module.exports = {
  registrarAuditoria,
  obtenerAuditoria,
};
