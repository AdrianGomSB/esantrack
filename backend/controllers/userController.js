const pool = require("../models/db");
const { registrarAuditoria } = require("./auditoriaController");
const bcrypt = require("bcryptjs");

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, role, equipo, activo, nombre FROM users ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// Actualizar usuario
const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { role, equipo, activo, password, nombre, username } = req.body;

  try {
    const resultOriginal = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );
    const original = resultOriginal.rows[0];
    if (!original) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const actualizaciones = [];
    const valores = [];
    let i = 1;

    if (role !== undefined) {
      actualizaciones.push(`role = $${i++}`);
      valores.push(role);
    }
    if (equipo !== undefined) {
      actualizaciones.push(`equipo = $${i++}`);
      valores.push(equipo);
    }
    if (activo !== undefined) {
      actualizaciones.push(`activo = $${i++}`);
      valores.push(activo);
    }
    if (nombre !== undefined) {
      actualizaciones.push(`nombre = $${i++}`);
      valores.push(nombre);
    }
    if (username !== undefined) {
      actualizaciones.push(`username = $${i++}`);
      valores.push(username);
    }
    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);
      actualizaciones.push(`password = $${i++}`);
      valores.push(hashed);
    }

    if (actualizaciones.length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    valores.push(id);
    const query = `UPDATE users SET ${actualizaciones.join(
      ", "
    )} WHERE id = $${i}`;
    await pool.query(query, valores);

    // Registrar auditoría para cada campo
    const cambios = [
      { campo: "role", anterior: original.role, nuevo: role },
      { campo: "equipo", anterior: original.equipo, nuevo: equipo },
      {
        campo: "activo",
        anterior: String(original.activo),
        nuevo: String(activo),
      },
      { campo: "nombre", anterior: original.nombre, nuevo: nombre },
      { campo: "username", anterior: original.username, nuevo: username },
    ];

    for (const cambio of cambios) {
      if (
        cambio.anterior !== undefined &&
        cambio.nuevo !== undefined &&
        cambio.anterior !== cambio.nuevo
      ) {
        await registrarAuditoria({
          usuario_id: req.user?.id || null,
          tabla: "users",
          registro_id: id,
          campo: cambio.campo,
          valor_anterior: cambio.anterior,
          valor_nuevo: cambio.nuevo,
        });
      }
    }

    if (password && password.trim() !== "") {
      await registrarAuditoria({
        usuario_id: req.user?.id || null,
        tabla: "users",
        registro_id: id,
        campo: "password",
        valor_anterior: "********",
        valor_nuevo: "******** (actualizada)",
      });
    }

    res.json({ message: "Usuario actualizado correctamente" });
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    res.status(500).json({ error: "Error interno al actualizar usuario" });
  }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    const usuario = result.rows[0];

    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    await registrarAuditoria({
      usuario_id: req.user?.id || null,
      tabla: "users",
      registro_id: id,
      campo: "registro",
      valor_anterior: JSON.stringify({
        username: usuario.username,
        role: usuario.role,
        equipo: usuario.equipo,
      }),
      valor_nuevo: "Eliminado",
    });

    res.json({ message: "Usuario eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

module.exports = {
  getAllUsers,
  actualizarUsuario,
  eliminarUsuario,
};
