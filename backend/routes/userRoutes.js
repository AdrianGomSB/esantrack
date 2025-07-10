const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  actualizarUsuario,
  eliminarUsuario,
} = require("../controllers/userController");

const { verifyToken } = require("../middlewares/authMiddleware");
const verificarRol = require("../middlewares/verificarRol");

// Obtener todos los usuarios (admin y supervisor)
router.get(
  "/",
  verifyToken,
  verificarRol(["admin", "supervisor"]),
  getAllUsers
);

// Actualizar usuario (admin o el propio usuario)
router.patch(
  "/:id",
  verifyToken,
  (req, res, next) => {
    const usuarioIdToken = req.user.userId; // ← CORREGIDO
    const usuarioIdParam = parseInt(req.params.id, 10);

    // Si es admin, puede editar cualquiera
    if (req.user.role === "admin") {
      return next();
    }

    // Si es el propio usuario
    if (usuarioIdToken === usuarioIdParam) {
      if ("role" in req.body || "equipo" in req.body) {
        return res
          .status(403)
          .json({ message: "No está permitido modificar rol o equipo" });
      }
      return next();
    }

    return res
      .status(403)
      .json({ message: "No autorizado para actualizar este usuario" });
  },
  actualizarUsuario
);

// Eliminar usuario (solo admin)
router.delete("/:id", verifyToken, verificarRol(["admin"]), eliminarUsuario);

module.exports = router;
