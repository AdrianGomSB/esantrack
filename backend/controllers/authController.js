const pool = require("../models/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registrarAuditoria } = require("./auditoriaController");

// REGISTRO
const registerUser = async (req, res) => {
  const { username, password, role, nombre, equipo } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password, role, nombre, equipo) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, role, nombre, equipo",
      [username, hashedPassword, role || "user", nombre, equipo]
    );

    await registrarAuditoria({
      usuario_id: req.user?.id || null,
      tabla: "users",
      registro_id: result.rows[0].id,
      campo: "registro",
      valor_anterior: null,
      valor_nuevo: `Usuario ${username} creado con rol ${role || "user"}`,
    });

    res
      .status(201)
      .json({ message: "Usuario registrado", user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      res.status(400).json({ error: "El nombre de usuario ya existe" });
    } else {
      console.error(err);
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  }
};

// LOGIN
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        equipo: user.equipo,
        nombre: user.nombre,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      usuario: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        equipo: user.equipo,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
};

module.exports = { loginUser, registerUser };
